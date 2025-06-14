import Image from "next/image";
import Link from "next/link";

const categories = [
  {
    id: 1,
    name: "Flowershop",
    slug: "flowershop",
    image: "/images/links/pia-riverola.webp",
  },
  {
    id: 2,
    name: "Sweet",
    slug: "sweet",
    image: "/images/links/game-wwe-19-1507733870-150-911.jpg",
  },
  {
    id: 3,
    name: "Events + Dinners",
    slug: "events-dinners",
    image: "/images/links/pia-riverola.webp",
  },
  {
    id: 4,
    name: "Giftshop",
    slug: "giftshop",
    image: "/images/links/game-wwe-19-1507733870-150-911.jpg",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto py-16 text-center">
        <h1 className="text-5xl font-times-now mb-4 leading-tight">
          Regalos handpicked extraordinarios
        </h1>
        <p className="text-lg font-univers text-gray-600 max-w-2xl mx-auto">
          Experiencias y productos seleccionados a mano para momentos especiales.
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </p>
      </section>

      {/* Categories Grid */}
      <section className="container mx-auto pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Link 
              key={category.id} 
              href={`/category/${category.slug}`}
              className="group relative overflow-hidden aspect-square"
            >
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                <h3 className="text-white text-xl font-univers">{category.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}