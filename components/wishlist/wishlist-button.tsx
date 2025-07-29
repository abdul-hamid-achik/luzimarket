"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/contexts/wishlist-context";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

interface WishlistButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    vendor: string;
  };
  variant?: "default" | "icon";
  className?: string;
}

export function WishlistButton({ 
  product, 
  variant = "icon", 
  className 
}: WishlistButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Common");
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);

  const handleToggle = () => {
    // Check if user is authenticated
    if (!session?.user) {
      // Redirect to login page
      router.push(`/${locale}/iniciar-sesion`);
      return;
    }

    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        vendorId: '',
        vendorName: product.vendor,
      });
    }
  };

  if (variant === "icon") {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={handleToggle}
        className={cn(
          "border-gray-300 hover:border-red-400",
          inWishlist && "border-red-400 bg-red-50",
          className
        )}
      >
        <Heart 
          className={cn(
            "h-4 w-4",
            inWishlist ? "fill-red-500 text-red-500" : "text-gray-600"
          )} 
        />
      </Button>
    );
  }

  return (
    <Button
      variant={inWishlist ? "default" : "outline"}
      onClick={handleToggle}
      className={cn(
        "flex items-center gap-2",
        inWishlist && "bg-red-500 hover:bg-red-600",
        className
      )}
    >
      <Heart 
        className={cn(
          "h-4 w-4",
          inWishlist ? "fill-white text-white" : "text-gray-600"
        )} 
      />
      {inWishlist ? t("inWishlist") : t("addToWishlist")}
    </Button>
  );
}