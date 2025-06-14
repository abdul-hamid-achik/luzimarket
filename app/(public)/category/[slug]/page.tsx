import Image from "next/image";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const products = [
  {
    id: 1,
    name: "Sunkissed Box",
    vendor: "BOTANICA",
    price: "$1,000",
    image: "/images/links/pia-riverola.webp",
  },
  {
    id: 2,
    name: "Mango Lamp",
    vendor: "NAP",
    price: "$2,000",
    image: "/images/links/game-wwe-19-1507733870-150-911.jpg",
  },
  {
    id: 3,
    name: "Coffee Cake",
    vendor: "LA VITRINA",
    price: "$100",
    image: "/images/links/pia-riverola.webp",
  },
  {
    id: 4,
    name: "BFF Protonic Cleanser",
    vendor: "BFF",
    price: "$440",
    image: "/images/links/game-wwe-19-1507733870-150-911.jpg",
  },
];

export default function CategoryPage({ params }: { params: { slug: string } }) {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-96 flex items-center">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-200 via-yellow-200 to-pink-100" />
        <Image
          src="/images/links/pia-riverola.webp"
          alt="Flores & Amores"
          fill
          className="object-cover object-right mix-blend-multiply"
        />
        <div className="relative container mx-auto px-4 max-w-2xl">
          <h1 className="text-6xl font-times-now mb-4">Flores & Amores</h1>
          <p className="text-lg font-univers text-gray-700 max-w-lg">
            Praesent commodo cursus magna, vel scelerisque nisl consectetur et. 
            Nulla vitae elit libero, a pharetra augue. Sed posuere consectetur est at lobortis.
          </p>
          <Button className="mt-6 rounded-none bg-white text-black hover:bg-gray-100">
            Flowershop
          </Button>
        </div>
      </section>

      {/* Filters & Sort */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-univers">Handpicked</h2>
          <button className="text-sm font-univers hover:underline">
            Ver todos
          </button>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="group">
              <div className="relative aspect-square mb-4 overflow-hidden bg-gray-100">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <h3 className="font-univers text-sm">{product.name}</h3>
                <p className="text-xs text-gray-600 font-univers uppercase">+ {product.vendor}</p>
                <p className="font-univers">{product.price}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}