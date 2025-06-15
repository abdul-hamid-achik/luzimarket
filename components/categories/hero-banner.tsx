import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface HeroBannerProps {
  title: string;
  description: string;
  categoryName: string;
  categorySlug: string;
  imageUrl?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

export function HeroBanner({
  title,
  description,
  categoryName,
  categorySlug,
  imageUrl,
  gradientFrom = "from-pink-400",
  gradientTo = "to-yellow-300",
}: HeroBannerProps) {
  return (
    <div className="relative h-[400px] overflow-hidden">
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-r ${gradientFrom} ${gradientTo}`} />
      
      {/* Content Grid */}
      <div className="relative h-full container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full items-center gap-8">
          {/* Left Content */}
          <div className="space-y-6 z-10">
            <h1 className="text-5xl lg:text-7xl font-times-now text-black relative">
              {title}
              <svg 
                className="absolute -bottom-2 left-0 w-full h-8" 
                viewBox="0 0 300 20" 
                preserveAspectRatio="none"
              >
                <path 
                  d="M0,10 Q150,20 300,10" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  fill="none"
                  className="text-black/30"
                />
              </svg>
            </h1>
            
            <p className="text-lg font-univers text-black/80 max-w-md">
              {description}
            </p>
            
            <Link href={`/category/${categorySlug}`}>
              <Button 
                variant="secondary"
                className="bg-white text-black hover:bg-gray-100 font-univers rounded-full px-6"
              >
                {categoryName}
              </Button>
            </Link>
          </div>
          
          {/* Right Image */}
          {imageUrl && (
            <div className="relative h-full hidden lg:flex items-center justify-center">
              <Image
                src={imageUrl}
                alt={title}
                width={300}
                height={300}
                className="object-contain opacity-80"
                priority
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
}