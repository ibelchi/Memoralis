"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ArtworkCard from "@/components/ArtworkCard";
import GalleryFilters, { Filters, Tag } from "@/components/GalleryFilters";

export default function HomePage() {
  const [artworks, setArtworks] = useState<any[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<Filters>({
    q: "",
    author: "",
    tag: "",
    dateFrom: "",
    dateTo: "",
  });

  // 1. Càrrega inicial d'autores (de totes les obres) i tags
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [artworksRes, tagsRes] = await Promise.all([
          fetch("/api/artworks"), // Sense filtres per treure totes les autores
          fetch("/api/tags"),
        ]);
        
        const allArtworks = await artworksRes.json();
        const allTags = await tagsRes.json();
        
        setTags(allTags);
        
        // Extreure autores úniques
        const uniqueAuthors = Array.from(
          new Set(allArtworks.map((a: any) => a.author))
        ) as string[];
        setAuthors(uniqueAuthors.sort());
        
      } catch (error) {
        console.error("Error carregant dades inicials:", error);
      }
    };

    fetchInitialData();
  }, []);

  // 2. Fetch d'obres quan canvien els filtres
  useEffect(() => {
    const fetchFilteredArtworks = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.q) params.append("q", filters.q);
        if (filters.author) params.append("author", filters.author);
        if (filters.tag) params.append("tag", filters.tag);
        if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
        if (filters.dateTo) params.append("dateTo", filters.dateTo);

        const res = await fetch(`/api/artworks?${params.toString()}`);
        const data = await res.json();
        setArtworks(data);
      } catch (error) {
        console.error("Error carregant obres:", error);
      } finally {
        setLoading(false);
      }
    };

    // Fem servir un debounce demanat implícitament si fos necessari, però 
    // per ara amb un simple useEffect n'hi ha prou com a MVP.
    // Un petit timeout per evitar crides en cada lletra teclejada a 'q'
    const timeoutId = setTimeout(() => {
      fetchFilteredArtworks();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  const handleFilterChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
  }, []);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-800 font-sans">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Capçalera i botó d'afegir */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-serif font-light text-stone-900 tracking-tight">
              Memoralis
            </h1>
            <p className="text-stone-500 mt-2 text-lg">
              L'arxiu dels nostres petits grans records.
            </p>
          </div>
          <Link
            href="/upload"
            className="inline-flex items-center justify-center px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-full font-medium transition-colors shadow-sm hover:shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Afegir obra
          </Link>
        </header>

        {/* Filtres */}
        <div className="mb-10">
          <GalleryFilters 
            authors={authors} 
            tags={tags} 
            onFilterChange={handleFilterChange} 
          />
        </div>

        {/* Estat de càrrega o resultats */}
        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-stone-100">
            <svg className="animate-spin h-10 w-10 text-amber-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-stone-500 font-medium">Carregant la galeria...</p>
          </div>
        ) : artworks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-stone-100">
            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-stone-700">Cap record coincideix amb la cerca</h3>
            <p className="text-stone-500 mt-2">Prova a canviar o netejar els filtres.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {artworks.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                id={artwork.id}
                title={artwork.title}
                author={artwork.author}
                artDate={artwork.artDate}
                imageUrl={artwork.images?.[0] ? `/api/media/${artwork.images[0].filePath}` : undefined}
                hasAudio={artwork._count ? artwork._count.audios > 0 : (artwork.audios && artwork.audios.length > 0)}
                tags={artwork.tags || []}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
