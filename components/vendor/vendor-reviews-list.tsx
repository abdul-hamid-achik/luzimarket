"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, ThumbsUp, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Image from "next/image";

interface Review {
    review: {
        id: string;
        rating: number;
        title: string | null;
        comment: string | null;
        images: string[] | null;
        createdAt: Date;
        isVerifiedPurchase: boolean;
    };
    user: {
        name: string | null;
        email: string;
    } | null;
    product: {
        id: string;
        name: string;
        images: string[] | null;
    } | null;
    vendorResponse: {
        id: string;
        responseText: string;
        createdAt: Date;
    } | null;
    helpfulVotes: number;
}

interface VendorReviewsListProps {
    vendorId: string;
}

export function VendorReviewsList({ vendorId }: VendorReviewsListProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [respondingTo, setRespondingTo] = useState<string | null>(null);
    const [responseText, setResponseText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const response = await fetch("/api/vendor/reviews");
            if (!response.ok) throw new Error("Failed to fetch reviews");

            const data = await response.json();
            setReviews(data.reviews || []);
        } catch (error) {
            console.error("Error fetching reviews:", error);
            toast.error("Error al cargar las reseñas");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitResponse = async (reviewId: string) => {
        if (!responseText.trim() || responseText.length < 10) {
            toast.error("La respuesta debe tener al menos 10 caracteres");
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`/api/vendor/reviews/${reviewId}/respond`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ responseText }),
            });

            if (!response.ok) throw new Error("Failed to submit response");

            toast.success("Respuesta enviada exitosamente");
            setRespondingTo(null);
            setResponseText("");
            fetchReviews();
        } catch (error) {
            console.error("Error submitting response:", error);
            toast.error("Error al enviar la respuesta");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredReviews = reviews.filter((r) => {
        if (activeTab === "all") return true;
        if (activeTab === "unresponded") return !r.vendorResponse;
        if (activeTab === "responded") return !!r.vendorResponse;
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filter Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="all">
                        Todas ({reviews.length})
                    </TabsTrigger>
                    <TabsTrigger value="unresponded">
                        Sin Responder ({reviews.filter(r => !r.vendorResponse).length})
                    </TabsTrigger>
                    <TabsTrigger value="responded">
                        Respondidas ({reviews.filter(r => r.vendorResponse).length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4 mt-6">
                    {filteredReviews.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">
                                {activeTab === "unresponded"
                                    ? "¡Excelente! Has respondido todas las reseñas"
                                    : "No hay reseñas aún"}
                            </p>
                        </div>
                    ) : (
                        filteredReviews.map((item) => (
                            <Card key={item.review.id}>
                                <CardContent className="pt-6">
                                    {/* Review Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                <span className="text-gray-600 font-medium">
                                                    {item.user?.name?.charAt(0).toUpperCase() || "?"}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-univers font-medium">
                                                    {item.user?.name || "Cliente"}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                key={star}
                                                                className={`h-4 w-4 ${star <= item.review.rating
                                                                    ? "fill-yellow-400 text-yellow-400"
                                                                    : "text-gray-300"
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                    {item.review.isVerifiedPurchase && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Compra Verificada
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {new Date(item.review.createdAt).toLocaleDateString("es-MX")}
                                        </span>
                                    </div>

                                    {/* Product Info */}
                                    {item.product && (
                                        <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded">
                                            {item.product.images && item.product.images[0] && (
                                                <div className="relative h-10 w-10 rounded overflow-hidden">
                                                    <Image
                                                        src={item.product.images[0]}
                                                        alt={item.product.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            )}
                                            <span className="text-sm text-gray-700">{item.product.name}</span>
                                        </div>
                                    )}

                                    {/* Review Content */}
                                    <div className="mb-4">
                                        {item.review.title && (
                                            <h4 className="font-univers font-medium mb-1">{item.review.title}</h4>
                                        )}
                                        {item.review.comment && (
                                            <p className="text-sm text-gray-700">{item.review.comment}</p>
                                        )}

                                        {/* Review Images */}
                                        {item.review.images && item.review.images.length > 0 && (
                                            <div className="flex gap-2 mt-3">
                                                {item.review.images.map((img, idx) => (
                                                    <div key={idx} className="relative h-20 w-20 rounded overflow-hidden">
                                                        <Image
                                                            src={img}
                                                            alt={`Review image ${idx + 1}`}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Helpful Votes */}
                                        <div className="flex items-center gap-2 mt-3">
                                            <ThumbsUp className="h-4 w-4 text-gray-400" />
                                            <span className="text-xs text-gray-600">
                                                {item.helpfulVotes} {item.helpfulVotes === 1 ? "persona" : "personas"} encontraron esto útil
                                            </span>
                                        </div>
                                    </div>

                                    {/* Vendor Response */}
                                    {item.vendorResponse ? (
                                        <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                                            <div className="flex items-start gap-2 mb-2">
                                                <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                                                <p className="text-sm font-medium text-blue-900">Respuesta del Vendedor</p>
                                            </div>
                                            <p className="text-sm text-gray-700 ml-6">{item.vendorResponse.responseText}</p>
                                            <p className="text-xs text-gray-500 ml-6 mt-2">
                                                {new Date(item.vendorResponse.createdAt).toLocaleDateString("es-MX")}
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            {respondingTo === item.review.id ? (
                                                <div className="space-y-3">
                                                    <Textarea
                                                        placeholder="Escribe tu respuesta a esta reseña..."
                                                        value={responseText}
                                                        onChange={(e) => setResponseText(e.target.value)}
                                                        rows={4}
                                                        className="resize-none"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleSubmitResponse(item.review.id)}
                                                            disabled={submitting}
                                                        >
                                                            {submitting ? (
                                                                <>
                                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                    Enviando...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Send className="h-4 w-4 mr-2" />
                                                                    Enviar Respuesta
                                                                </>
                                                            )}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setRespondingTo(null);
                                                                setResponseText("");
                                                            }}
                                                            disabled={submitting}
                                                        >
                                                            Cancelar
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setRespondingTo(item.review.id)}
                                                >
                                                    <MessageSquare className="h-4 w-4 mr-2" />
                                                    Responder
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

