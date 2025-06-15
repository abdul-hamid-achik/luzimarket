"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useDebounce } from "@/lib/hooks/use-debounce";

interface SearchResult {
  id: string;
  name: string;
  slug?: string;
  price?: string;
  image?: string;
  type: "product" | "category" | "vendor";
}

export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const debouncedQuery = useDebounce(query, 300);

  // Fetch search results
  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
        const data = await response.json();
        setResults(data.results || []);
        setIsOpen(true);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleResultClick = () => {
    setIsOpen(false);
    setQuery("");
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className="relative flex-1">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
            placeholder="Buscar productos, categorías o tiendas..."
            className="pl-10 pr-10 w-full border-gray-300 rounded-none font-univers"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500 font-univers">
              Buscando...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {/* Products */}
              {results.filter(r => r.type === "product").length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-univers text-gray-500 uppercase">
                    Productos
                  </div>
                  {results
                    .filter(r => r.type === "product")
                    .map((result) => (
                      <Link
                        key={result.id}
                        href={`/products/${result.id}`}
                        onClick={handleResultClick}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                      >
                        {result.image && (
                          <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            <Image
                              src={result.image}
                              alt={result.name}
                              width={48}
                              height={48}
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-univers truncate">{result.name}</p>
                          {result.price && (
                            <p className="text-sm font-univers text-gray-600">${result.price}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                </div>
              )}

              {/* Categories */}
              {results.filter(r => r.type === "category").length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-univers text-gray-500 uppercase border-t">
                    Categorías
                  </div>
                  {results
                    .filter(r => r.type === "category")
                    .map((result) => (
                      <Link
                        key={result.id}
                        href={`/category/${result.slug}`}
                        onClick={handleResultClick}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-univers">{result.name.charAt(0)}</span>
                        </div>
                        <p className="text-sm font-univers">{result.name}</p>
                      </Link>
                    ))}
                </div>
              )}

              {/* Vendors */}
              {results.filter(r => r.type === "vendor").length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-univers text-gray-500 uppercase border-t">
                    Tiendas
                  </div>
                  {results
                    .filter(r => r.type === "vendor")
                    .map((result) => (
                      <Link
                        key={result.id}
                        href={`/vendors/${result.id}`}
                        onClick={handleResultClick}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-univers">{result.name.charAt(0)}</span>
                        </div>
                        <p className="text-sm font-univers">{result.name}</p>
                      </Link>
                    ))}
                </div>
              )}

              <div className="border-t">
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  onClick={handleResultClick}
                  className="block px-4 py-3 text-sm font-univers text-center text-gray-600 hover:bg-gray-50"
                >
                  Ver todos los resultados para "{query}"
                </Link>
              </div>
            </div>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-sm text-gray-500 font-univers">
              No se encontraron resultados para "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}