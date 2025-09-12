"use client";

import { useState } from "react";
import { Share2, Facebook, Twitter, Instagram, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface SocialShareProps {
  title: string;
  description?: string;
  url: string;
  image?: string;
  price?: string;
  className?: string;
}

export function SocialShare({ 
  title, 
  description = "", 
  url, 
  image,
  price,
  className = "" 
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareText = `${title}${price ? ` - ${price}` : ""} | LuziMarket`;
  const shareUrl = typeof window !== 'undefined' ? window.location.origin + url : url;

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(shareText)}${image ? `&media=${encodeURIComponent(image)}` : ''}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Product link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          text: description,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    }
  };

  const openShareWindow = (url: string) => {
    const width = 600;
    const height = 400;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    window.open(
      url,
      'share',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
  };

  // If native sharing is available on mobile devices
  if (typeof window !== 'undefined' && navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleNativeShare}
        className={className}
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => openShareWindow(shareLinks.facebook)}>
          <Facebook className="h-4 w-4 mr-2 text-blue-600" />
          Facebook
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => openShareWindow(shareLinks.twitter)}>
          <Twitter className="h-4 w-4 mr-2 text-blue-400" />
          Twitter
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => openShareWindow(shareLinks.whatsapp)}>
          <div className="h-4 w-4 mr-2 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
            W
          </div>
          WhatsApp
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => openShareWindow(shareLinks.telegram)}>
          <div className="h-4 w-4 mr-2 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
            T
          </div>
          Telegram
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => openShareWindow(shareLinks.pinterest)}>
          <div className="h-4 w-4 mr-2 bg-red-600 rounded-full flex items-center justify-center text-white text-xs">
            P
          </div>
          Pinterest
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={copyToClipboard}>
          {copied ? (
            <Check className="h-4 w-4 mr-2 text-green-600" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          {copied ? "Copied!" : "Copy Link"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact version for product cards
export function SocialShareButton({ 
  title, 
  url, 
  price,
  className = "" 
}: Pick<SocialShareProps, 'title' | 'url' | 'price' | 'className'>) {
  const shareUrl = typeof window !== 'undefined' ? window.location.origin + url : url;
  const shareText = `${title}${price ? ` - ${price}` : ""} | LuziMarket`;

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          // Fallback to copy
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      // You might want to show a toast here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${className}`}
      title="Share product"
      aria-label="Share product"
    >
      <Share2 className="h-4 w-4 text-gray-600" />
    </button>
  );
}