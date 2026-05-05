"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ArtworkCard from "@/components/ArtworkCard";

export default function OnThisDayPage() {
  const [artworks, setArtworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        const res = await fetch("/api/artworks/on-this-day");
        const data = await res.json();
        setArtworks(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching artworks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArtworks();
  }, []);

  const groupedArtworks = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const groups: { [key: number]: any[] } = {};
    
    artworks.forEach(artwork => {
      const year = new Date(artwork.artDate).getFullYear();
      const diff = currentYear - year;
      if (!groups[diff]) groups[diff] = [];
      groups[diff].push(artwork);
    });
    
    return Object.entries(groups)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([yearsAgo, items]) => ({
        yearsAgo: parseInt(yearsAgo),
        items
      }));
  }, [artworks]);

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString("ca-ES", {
      day: "numeric",
      month: "long",
    });
  }, []);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-800 font-sans pb-32">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <header className="mb-12">
          <Link 
            href="/"
            className="inline-flex items-center text-stone-500 hover:text-stone-800 transition-colors mb-6 group"
          >
            <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Tornar a la galeria
          </Link>
          <h1 className="text-4xl font-serif font-light text-stone-900 tracking-tight">
            Avui fa... ({todayLabel})
          </h1>
          <p className="text-stone-500 mt-2 italic">
            Te'n recordes?
          </p>
        </header>

        {loading ? (
           <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-stone-100">
             <div className="animate-spin h-10 w-10 text-amber-500 mx-auto mb-4 border-4 border-stone-200 border-t-amber-500 rounded-full"></div>
             <p className="text-stone-500 font-medium">Buscant records...</p>
           </div>
        ) : artworks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-stone-100 flex flex-col items-center">
            <h3 className="text-2xl font-serif font-light text-stone-700 mb-3">
              No s'han trobat records per avui
            </h3>
            <p className="text-stone-500 mb-8">
              No hi ha cap obra guardada d'aquest mateix dia en anys anteriors.
            </p>
            <Link 
              href="/" 
              className="inline-flex items-center px-6 py-3 bg-[#D4752A] hover:bg-orange-700 text-white rounded-full font-medium transition-colors shadow-sm"
            >
              Tornar a la galeria
            </Link>
          </div>
        ) : (
          <div className="space-y-16">
            {groupedArtworks.map(({ yearsAgo, items }) => (
              <section key={yearsAgo}>
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-2xl font-serif font-medium text-stone-700 whitespace-nowrap">
                    Fa {yearsAgo} {yearsAgo === 1 ? 'any' : 'anys'}
                  </h2>
                  <div className="h-px bg-stone-200 w-full"></div>
                  <span className="text-stone-400 font-medium whitespace-nowrap">
                    {new Date(items[0].artDate).getFullYear()}
                  </span>
                </div>
                
                <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-8">
                  {items.map((artwork) => (
                    <ArtworkCard
                      key={artwork.id}
                      id={artwork.id}
                      title={artwork.title}
                      author={artwork.author}
                      artDate={artwork.artDate}
                      imageUrl={artwork.images?.[0] ? `/api/media/${artwork.images[0].filePath}` : undefined}
                      hasAudio={artwork.audios && artwork.audios.length > 0}
                      tags={artwork.tags || []}
                      isFavorite={artwork.isFavorite}
                      authorAvatarPath={artwork.authorAvatarPath}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
