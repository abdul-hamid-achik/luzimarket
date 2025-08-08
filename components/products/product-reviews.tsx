"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Star, ThumbsUp, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: Date;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  images?: string[] | null;
  user: {
    name: string;
  };
}

interface ProductReviewsProps {
  productId: string;
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { rating: number; count: number; percentage: number }[];
  canReview: boolean;
}

export function ProductReviews({
  productId,
  reviews,
  averageRating,
  totalReviews,
  ratingDistribution,
  canReview,
}: ProductReviewsProps) {
  const t = useTranslations("Products.reviews");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [helpfulReviews, setHelpfulReviews] = useState<Set<string>>(new Set());

  const handleHelpful = async (reviewId: string) => {
    if (helpfulReviews.has(reviewId)) return;

    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: "POST",
      });

      if (response.ok) {
        setHelpfulReviews(new Set([...helpfulReviews, reviewId]));
      }
    } catch (error) {
      console.error("Error marking review as helpful:", error);
    }
  };

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-times-now mb-8">{t("title")}</h2>

      {/* Rating Summary */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {/* Average Rating */}
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <span className="text-4xl font-univers">{averageRating.toFixed(1)}</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-600 font-univers">
            {totalReviews} {totalReviews === 1 ? t("review") : t("reviews")}
          </p>
        </div>

        {/* Rating Distribution */}
        <div className="col-span-2 space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const distribution = ratingDistribution.find((d) => d.rating === rating) || {
              count: 0,
              percentage: 0,
            };
            return (
              <div key={rating} className="flex items-center gap-2">
                <span className="text-sm font-univers w-4">{rating}</span>
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <Progress value={distribution.percentage} className="flex-1 h-2" />
                <span className="text-sm text-gray-600 font-univers w-12 text-right">
                  {distribution.percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Write Review Button */}
      {canReview && (
        <div className="mb-8">
          <Button
            onClick={() => setShowReviewForm(!showReviewForm)}
            variant="outline"
            className="w-full md:w-auto"
          >
            {showReviewForm ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                {t("cancel")}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                {t("writeReview")}
              </>
            )}
          </Button>

          {showReviewForm && (
            <div className="mt-4 p-6 bg-gray-50 rounded-lg">
              <ReviewForm productId={productId} onSuccess={() => setShowReviewForm(false)} />
            </div>
          )}
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <p className="text-center text-gray-500 font-univers py-8">
            {t("noReviews")}
          </p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b pb-6 last:border-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-univers font-medium">{review.user?.name || "Anonymous"}</span>
                    {review.isVerifiedPurchase && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-univers">
                        {t("verifiedPurchase")}
                      </span>
                    )}
                  </div>
                  {review.title && (
                    <h3 className="font-univers font-medium mb-1">{review.title}</h3>
                  )}
                </div>
                <span className="text-sm text-gray-500 font-univers">
                  {formatDistanceToNow(new Date(review.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </span>
              </div>

              {review.comment && (
                <p className="text-gray-700 font-univers mb-3">{review.comment}</p>
              )}

              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {review.images.map((image, index) => (
                    <div
                      key={index}
                      className="relative w-20 h-20 bg-gray-100 rounded overflow-hidden"
                    >
                      <Image src={image} alt={`Review ${index + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => handleHelpful(review.id)}
                disabled={helpfulReviews.has(review.id)}
                className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed font-univers"
              >
                <ThumbsUp className="h-4 w-4" />
                {review.helpfulCount + (helpfulReviews.has(review.id) ? 1 : 0)} personas encontraron esto útil
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Review Form Component
function ReviewForm({ productId, onSuccess }: { productId: string; onSuccess: () => void }) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("Products.reviews");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          title,
          comment,
        }),
      });

      if (response.ok) {
        onSuccess();
        // Refresh the page to show the new review
        window.location.reload();
      } else {
        throw new Error("Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert(t("submitError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Rating Selection */}
      <div>
        <label className="block text-sm font-univers mb-2">{t("yourRating")}</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="focus:outline-none"
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  star <= rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300 hover:text-yellow-400"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-univers mb-2">
          Título (opcional)
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border rounded-md font-univers"
          placeholder="Resume tu experiencia"
        />
      </div>

      {/* Comment */}
      <div>
        <label htmlFor="comment" className="block text-sm font-univers mb-2">
          {t("yourOpinion")}
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border rounded-md font-univers"
          placeholder="Cuéntanos qué te pareció este producto"
          required
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={rating === 0 || isSubmitting}
        className="w-full bg-black text-white hover:bg-gray-800"
      >
        {isSubmitting ? t("submitting") : t("submitReview")}
      </Button>
    </form>
  );
}