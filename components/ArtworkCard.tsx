"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Star } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface ArtworkCardProps {
  id: string;
  title: string | null;
  author: string;
  artDate: Date | string;
  imageUrl?: string;
  hasAudio: boolean;
  tags: Tag[];
  isFavorite?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

let cachedAuthorsPromise: Promise<any[]> | null = null;

export default function ArtworkCard({
  id,
  title,
  author,
  artDate,
  imageUrl,
  hasAudio,
  tags,
  isFavorite = false,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
}: ArtworkCardProps) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(isFavorite);
  const [isUpdating, setIsUpdating] = useState(false);
  const [authorAvatar, setAuthorAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (!cachedAuthorsPromise) {
      cachedAuthorsPromise = fetch("/api/authors").then(res => res.json());
    }
    cachedAuthorsPromise.then(authors => {
      const match = authors.find((a: any) => a.name === author);
      if (match?.avatarPath) {
        setAuthorAvatar(match.avatarPath);
      }
    }).catch(console.error);
  }, [author]);

  // Convertim a objecte Date si és un string
  const dateObj = typeof artDate === "string" ? new Date(artDate) : artDate;

  // Format de data en català: "Abril 2026" (mes sencer i any, sense conjuncions)
  const formattedDate = dateObj.toLocaleDateString("ca-ES", {
    month: "long",
    year: "numeric",
  });
  // Netegem possibles conjuncions com "de" o "del" i capitalitzem
  const cleanDate = formattedDate.replace(/\s+(de|del)\s+/g, " ");
  const displayDate = cleanDate.charAt(0).toUpperCase() + cleanDate.slice(1);

  // Avatar colors
  const getAuthorColor = (name: string) => {
    const l = name.toLowerCase();
    if (l.includes("gala")) return "bg-rose-100 text-rose-700";
    if (l.includes("júlia") || l.includes("julia")) return "bg-sky-100 text-sky-700";
    return "bg-stone-200 text-stone-700";
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      e.preventDefault();
      onToggleSelect?.(id);
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUpdating || isSelectionMode) return;
    
    setIsUpdating(true);
    const newFav = !favorite;
    setFavorite(newFav);
    
    try {
      await fetch(`/api/artworks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: newFav })
      });
    } catch (err) {
      console.error("Error toggling favorite", err);
      setFavorite(!newFav); // rollback
    } finally {
      setIsUpdating(false);
    }
  };

  // Limitem a 3 tags
  const visibleTags = tags.slice(0, 3);
  const remainingTagsCount = tags.length > 3 ? tags.length - 3 : 0;

  return (
    <>
      <div className="relative h-full">
        <Link
          href={isSelectionMode ? "#" : `/artwork/${id}`}
          onClick={handleCardClick}
          className={`group flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border hover:-translate-y-1 relative ${
            isSelected ? "border-[#D4752A] ring-2 ring-[#D4752A] ring-opacity-50" : "border-stone-100"
          }`}
        >
          {/* Botó de favorit (només si no estem seleccionant) */}
          {!isSelectionMode && (
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <button 
                onClick={handleFavoriteClick}
                className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform"
                aria-label={favorite ? "Treure de preferits" : "Afegir a preferits"}
              >
                <Star 
                  className={`w-4 h-4 ${favorite ? "fill-[#D4752A] text-[#D4752A]" : "text-stone-400"}`}
                />
              </button>
            </div>
          )}

          {/* Checkbox Overlay (Mode Selecció) */}
          {isSelectionMode && (
            <div className="absolute top-4 left-4 z-20">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                isSelected ? "bg-[#D4752A] border-[#D4752A]" : "bg-white/80 border-stone-300"
              }`}>
                {isSelected && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          )}

          {/* Imatge de portada */}
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-white border-b border-stone-100">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title ?? 'Obra sense títol'}
                className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="relative w-full h-full overflow-hidden">
                <img
                  src="/images/empty-state.png"
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-white/70" />
              </div>
            )}
            
            {/* Overlay subtil al hover (mode selecció) */}
            {isSelectionMode && !isSelected && (
              <div className="absolute inset-0 bg-stone-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}

            {/* Badge d'àudio */}
            {hasAudio && (
              <div className="absolute bottom-3 right-3 bg-stone-900/40 backdrop-blur-sm text-white p-1.5 rounded-full shadow-sm z-10" title="Té àudio associat">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M7 4a3 3 0 0 1 6 0v6a3 3 0 1 1-6 0V4Z" />
                  <path d="M10 18a7 7 0 0 0 7-7h-1.5a5.5 5.5 0 0 1-11 0H3a7 7 0 0 0 7 7Z" />
                </svg>
              </div>
            )}
          </div>

          {/* Informació de la targeta */}
          <div className="p-6 flex flex-col flex-grow">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-medium text-stone-800 line-clamp-1 group-hover:text-[#D4752A] transition-colors">
                {title || <span className="text-stone-300 italic">Sense títol</span>}
              </h2>
            </div>

            {/* Footer de tags (alçada fixa) */}
            <div className="mt-auto">
              <div className="pt-4 flex items-center justify-between text-sm text-stone-500 font-medium border-t border-stone-50 mb-3">
                <div className="flex items-center">
                  {authorAvatar ? (
                    <img 
                      src={`/api/media/${authorAvatar}`} 
                      alt={author}
                      className="w-8 h-8 rounded-full object-cover mr-2 border border-stone-100 shadow-sm"
                    />
                  ) : (
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs mr-2 uppercase font-bold ${getAuthorColor(author)}`}>
                      {author.charAt(0)}
                    </span>
                  )}
                  {author}
                </div>
                <time dateTime={dateObj.toISOString()}>{displayDate}</time>
              </div>

              <div className="flex flex-wrap gap-1 min-h-[24px]">
                {visibleTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold text-white opacity-80 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
                {remainingTagsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold text-stone-400 bg-stone-100 border border-stone-200">
                    +{remainingTagsCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </div>
    </>
  );
}
