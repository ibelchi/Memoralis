"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

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

  return (
    <div className="relative">
      <Link
        href={isSelectionMode ? "#" : `/artwork/${id}`}
        onClick={handleCardClick}
        className={`group flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border hover:-translate-y-1 relative ${
          isSelected ? "border-[#D4752A] ring-2 ring-[#D4752A] ring-opacity-50" : "border-stone-100"
        }`}
      >
        {/* Botó de favorit (només si no estem seleccionant) */}
        {!isSelectionMode && (
          <button 
            onClick={handleFavoriteClick}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform"
            aria-label={favorite ? "Treure de preferits" : "Afegir a preferits"}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill={favorite ? "#D4752A" : "none"} 
              stroke={favorite ? "#D4752A" : "currentColor"} 
              className="w-5 h-5 text-stone-400"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={favorite ? 0 : 2} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </button>
        )}

        {/* Checkbox Overlay (Mode Selecció) */}
        {isSelectionMode && (
          <div className="absolute top-4 right-4 z-20">
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
            {title && (
              <h2 className="text-xl font-medium text-stone-800 line-clamp-1 group-hover:text-[#D4752A] transition-colors">
                {title}
              </h2>
            )}
          </div>

          <div className="mt-auto pt-4 flex items-center justify-between text-sm text-stone-500 font-medium border-t border-stone-50">
            <div className="flex items-center">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2 uppercase font-bold ${getAuthorColor(author)}`}>
                {author.charAt(0)}
              </span>
              {author}
            </div>
            <time dateTime={dateObj.toISOString()}>{displayDate}</time>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold text-white opacity-80 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

