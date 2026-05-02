"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

function formatTime(seconds: number) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function CustomAudioPlayer({ audio }: { audio: any }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current || !duration || isNaN(duration)) return;
    
    const seekValue = Number(e.target.value);
    const seekTime = (seekValue / 100) * duration;
    
    if (!isNaN(seekTime)) {
      audioRef.current.currentTime = seekTime;
      setProgress(seekValue);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 flex items-center gap-4">
      <audio
        ref={audioRef}
        src={`/api/media/${audio.filePath}`}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      <button
        onClick={togglePlay}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-[#D4752A] text-white flex items-center justify-center hover:bg-orange-700 transition-colors shadow-sm"
      >
        {isPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
            <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        <input
          type="range"
          min="0"
          max="100"
          value={isNaN(progress) ? 0 : progress}
          onChange={handleSeek}
          className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#D4752A]"
        />
        <div className="flex justify-between text-xs text-stone-400 font-medium font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}

export default function ArtworkPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { addToast } = useToast();
  const [artwork, setArtwork] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [authorAvatar, setAuthorAvatar] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (lightboxIndex === null || !artwork?.images?.length) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev !== null && prev < artwork.images.length - 1 ? prev + 1 : prev));
      }
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [lightboxIndex, artwork]);

  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        const res = await fetch(`/api/artworks/${params.id}`);
        if (!res.ok) {
          if (res.status === 404) {
            router.push("/404");
            return;
          }
          throw new Error("Failed to fetch");
        }
        const data = await res.json();
        setArtwork(data);
        setIsFavorite(data.isFavorite);
        
        // Fetch authors to find avatar
        fetch("/api/authors")
          .then(r => r.json())
          .then(authors => {
            const match = authors.find((a: any) => a.name === data.author);
            if (match?.avatarPath) {
              setAuthorAvatar(match.avatarPath);
            }
          })
          .catch(console.error);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchArtwork();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-[#D4752A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!artwork) return null;

  const dateObj = new Date(artwork.artDate);
  const formattedDate = dateObj.toLocaleDateString("ca-ES", {
    month: "long",
    year: "numeric",
  });
  const cleanDate = formattedDate.replace(/\s+(de|del)\s+/g, " ");
  const displayDate = cleanDate.charAt(0).toUpperCase() + cleanDate.slice(1);

  const mainImage = artwork.images?.[0];

  const getAuthorColor = (name: string) => {
    const l = name.toLowerCase();
    if (l.includes("gala")) return "bg-rose-100 text-rose-700";
    if (l.includes("júlia") || l.includes("julia")) return "bg-sky-100 text-sky-700";
    return "bg-stone-200 text-stone-700";
  };

  const toggleFavorite = async () => {
    const newVal = !isFavorite;
    setIsFavorite(newVal);
    try {
      await fetch(`/api/artworks/${artwork.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: newVal })
      });
    } catch (err) {
      console.error(err);
      setIsFavorite(!newVal);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/artworks/${artwork.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        addToast({
          id: artwork.id,
          title: artwork.title || "L'obra",
          message: `${artwork.title || "L'obra"} eliminada`,
          type: "delete"
        });
        window.dispatchEvent(new Event('artworks-updated'));
        router.push("/");
      }
    } catch (err) {
      console.error("Error deleting artwork", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 font-sans p-4 md:p-8 relative">
      {/* Back Button (Standalone, top-left of the page) */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-stone-500 font-medium hover:text-stone-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Tornar
        </Link>
      </div>

      <div className="w-full max-w-[1100px] bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden flex flex-col md:flex-row mt-12 md:mt-0 items-start">
        
        {/* Left Column - Image(s) Container */}
        <div className="w-full md:w-3/5 bg-stone-50 border-b md:border-b-0 md:border-r border-stone-100 self-stretch overflow-y-auto max-h-[85vh] md:max-h-none">
          {artwork.images && artwork.images.length > 0 ? (
            <div className="flex flex-col gap-6 p-2 md:p-6 bg-stone-100/50">
              {artwork.images.map((img: any, index: number) => (
                <div 
                  key={img.id} 
                  className="w-full bg-white rounded-2xl shadow-sm overflow-hidden border border-stone-200/50 flex justify-center items-center p-2 md:p-4 cursor-zoom-in"
                  onClick={() => setLightboxIndex(index)}
                >
                  <img
                    src={`/api/media/${img.filePath}`}
                    alt={artwork.title ? `${artwork.title} - Imatge` : 'Imatge de l\'obra'}
                    className="max-w-full max-h-[80vh] md:max-h-[85vh] w-auto h-auto block mx-auto object-contain hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="relative min-h-[40vh] h-full overflow-hidden">
              <img
                src="/images/empty-state.png"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-white/60" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Link
                  href={`/artwork/${artwork.id}/edit`}
                  className="px-5 py-2 bg-white/90 border border-stone-200 rounded-full text-sm font-semibold text-stone-600 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 transition-colors shadow-sm relative z-10"
                >
                  Afegir imatge
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Content */}
        <div className="w-full md:w-2/5 p-7 md:p-10 flex flex-col bg-white sticky top-0">
          
          {/* Action Buttons Row (Top) */}
          <div className="flex items-center justify-between gap-3 mb-8 pb-6 border-b border-stone-50">
            <Link
              href={`/artwork/${artwork.id}/edit`}
              className="px-6 py-2 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-full font-medium transition-colors text-sm"
            >
              Editar obra
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-red-500 hover:text-red-700 transition-colors flex-shrink-0 disabled:opacity-50"
              aria-label="Esborrar obra"
            >
              {isDeleting ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <Trash2 size={18} />
              )}
            </button>
          </div>
          
          {/* Header Info */}
          <div className="mb-8">
            <div className="flex justify-between items-start gap-4 mb-5">
              <div className="flex items-center gap-3">
                {artwork.title && (
                  <h1 className="text-[22px] font-medium text-stone-900 leading-tight">
                    {artwork.title}
                  </h1>
                )}
                <button 
                  onClick={toggleFavorite}
                  className="transition-transform hover:scale-110 flex-shrink-0"
                  aria-label={isFavorite ? "Treure de preferits" : "Afegir a preferits"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFavorite ? "#D4752A" : "none"} stroke={isFavorite ? "#D4752A" : "currentColor"} className="w-6 h-6 text-stone-400">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isFavorite ? 0 : 2} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </button>
              </div>
              <time className="text-stone-400 text-sm font-medium whitespace-nowrap pt-1">
                {displayDate}
              </time>
            </div>

            <div className="flex items-center text-sm font-medium text-stone-600">
              {authorAvatar ? (
                <img 
                  src={`/api/media/${authorAvatar}`} 
                  alt={artwork.author}
                  className="w-10 h-10 rounded-full object-cover mr-3 border-2 border-stone-100 shadow-sm"
                />
              ) : (
                <span className={`w-10 h-10 rounded-full flex items-center justify-center text-sm mr-3 uppercase font-bold ${getAuthorColor(artwork.author)}`}>
                  {artwork.author.charAt(0)}
                </span>
              )}
              <span>Obra de <span className="font-semibold text-stone-800 text-base">{artwork.author}</span></span>
            </div>
          </div>

          {/* Tags */}
          {artwork.tags && artwork.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-8">
              {artwork.tags.map((tag: any) => (
                <span
                  key={tag.id}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold text-white tracking-wide"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {artwork.description && (
            <div className="mb-10">
              <h2 className="text-xs uppercase tracking-widest text-stone-400 font-semibold mb-3">La història</h2>
              <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">
                {artwork.description}
              </p>
            </div>
          )}

          {/* Audios */}
          {artwork.audios && artwork.audios.length > 0 && (
            <div className="mb-10 space-y-4">
              {artwork.audios.map((audio: any) => (
                <div key={audio.id} className="flex flex-col gap-3">
                  <CustomAudioPlayer audio={audio} />
                </div>
              ))}
            </div>
          )}

          {/* Spacer to push buttons to bottom if needed, though top-aligned is fine */}
          <div className="flex-grow"></div>

          {/* Spacer to push content up if needed */}
          <div className="flex-grow"></div>
        </div>
      </div>      {/* Lightbox */}
      {lightboxIndex !== null && artwork.images && artwork.images[lightboxIndex] && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/95 backdrop-blur-md p-4 md:p-12 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button 
            className="absolute top-6 right-6 z-[110] p-2 text-stone-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
            aria-label="Tancar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Prev Arrow */}
          {lightboxIndex > 0 && (
            <button
              className="absolute left-4 md:left-8 z-[110] p-3 md:p-4 text-stone-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
              aria-label="Imatge anterior"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <img
              src={`/api/media/${artwork.images[lightboxIndex].filePath}`}
              alt="Imatge ampliada"
              className="max-w-full max-h-[90vh] md:max-h-[95vh] w-auto h-auto object-contain select-none shadow-2xl rounded-sm animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Next Arrow */}
          {lightboxIndex < artwork.images.length - 1 && (
            <button
              className="absolute right-4 md:right-8 z-[110] p-3 md:p-4 text-stone-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
              aria-label="Imatge següent"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}
          
          {/* Image counter */}
          {artwork.images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-stone-400 text-sm font-medium bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-sm">
              {lightboxIndex + 1} / {artwork.images.length}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
