"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import AuthorAvatar from "@/components/AuthorAvatar";

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
  const [showVisualizer, setShowVisualizer] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const saved = localStorage.getItem("memoralis-audio-visualizer");
    if (saved === "true") setShowVisualizer(true);
  }, []);

  const toggleVisualizer = () => {
    const newVal = !showVisualizer;
    setShowVisualizer(newVal);
    localStorage.setItem("memoralis-audio-visualizer", String(newVal));
  };

  const initAudioContext = () => {
    if (!audioContextRef.current && audioRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const analyser = ctx.createAnalyser();
      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      analyser.fftSize = 256;
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    }
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const draw = () => {
    if (!canvasRef.current || !analyserRef.current || !showVisualizer) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const renderFrame = () => {
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      analyser.getByteFrequencyData(dataArray);
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);
      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      ctx.fillStyle = 'rgba(212, 117, 42, 0.4)';
      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    renderFrame();
  };

  useEffect(() => {
    if (isPlaying && showVisualizer) {
      draw();
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, showVisualizer]);

  const togglePlay = () => {
    if (audioRef.current) {
      initAudioContext();
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
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
    if (audioRef.current) setDuration(audioRef.current.duration);
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
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 flex items-center gap-4 relative overflow-hidden">
        {showVisualizer && (
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" width={400} height={80} />
        )}
        <audio
          ref={audioRef}
          src={`/api/media/${audio.filePath}`}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          crossOrigin="anonymous"
        />
        <button
          onClick={togglePlay}
          className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-[#D4752A] text-white flex items-center justify-center hover:bg-orange-700 transition-colors shadow-sm"
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
        <div className="relative z-10 flex-1 flex flex-col gap-1">
          <input
            type="range"
            min="0"
            max="100"
            value={isNaN(progress) ? 0 : progress}
            onChange={handleSeek}
            className="w-full h-1.5 bg-stone-200/50 rounded-lg appearance-none cursor-pointer accent-[#D4752A]"
          />
          <div className="flex justify-between text-xs text-stone-500 font-medium font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        <button
          onClick={toggleVisualizer}
          className={`relative z-10 p-2 rounded-lg transition-colors ${showVisualizer ? 'text-[#D4752A] bg-orange-50' : 'text-stone-300 hover:text-stone-500 hover:bg-stone-100'}`}
          title={showVisualizer ? "Amagar visualitzador" : "Mostrar visualitzador"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M2 10v3" /><path d="M6 6v11" /><path d="M10 3v18" /><path d="M14 8v7" /><path d="M18 5v13" /><path d="M22 10v3" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function ArtworkPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [artwork, setArtwork] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (lightboxIndex === null || !artwork?.images?.length) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") setLightboxIndex((prev) => (prev !== null && prev < artwork.images.length - 1 ? prev + 1 : prev));
      if (e.key === "ArrowLeft") setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchArtwork();
  }, [params.id, router]);

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
      const res = await fetch(`/api/artworks/${artwork.id}`, { method: "DELETE" });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-stone-200 border-t-[#D4752A] rounded-full"></div>
      </div>
    );
  }

  if (!artwork) return null;

  const dateObj = new Date(artwork.artDate);
  const displayDate = dateObj.toLocaleDateString("ca-ES", { month: "long", year: "numeric" })
    .replace(/\s+(de|del)\s+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());

  return (
    <main className="min-h-screen bg-stone-50 font-sans p-4 md:p-12 flex flex-col items-center justify-center">
      {/* Contenidor central amb max-width controlat */}
      <div className="w-full max-w-[900px] flex flex-col gap-6">
        
        {/* BARRA SUPERIOR: Alineada amb la targeta */}
        <div className="flex justify-between items-center px-2">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-stone-500 font-medium hover:text-stone-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Tornar
          </Link>

          <div className="flex items-center gap-2">
            <Link href={`/artwork/${artwork.id}/edit`} className="px-4 py-2 bg-white border border-stone-200 text-stone-600 hover:text-[#D4752A] hover:border-amber-200 hover:bg-amber-50 rounded-full font-medium transition-all shadow-sm text-sm">
              Editar
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 bg-white border border-stone-200 text-red-500 hover:bg-red-50 hover:border-red-100 rounded-full transition-all shadow-sm disabled:opacity-50"
              aria-label="Esborrar obra"
            >
              {isDeleting ? (
                <div className="animate-spin h-4 w-4 border-2 border-red-100 border-t-red-500 rounded-full"></div>
              ) : (
                <Trash2 size={18} />
              )}
            </button>
          </div>
        </div>

        {/* TARGETA PRINCIPAL */}
        <div className="w-full bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden flex flex-col md:flex-row items-start">
          
          {/* Columna esquerra: Imatges */}
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
                <img src="/images/empty-state.png" alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-white/60" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Link href={`/artwork/${artwork.id}/edit`} className="px-5 py-2 bg-white/90 border border-stone-200 rounded-full text-sm font-semibold text-stone-600 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 transition-colors shadow-sm relative z-10">
                    Afegir imatge
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Columna dreta: Contingut */}
          <div className="w-full md:w-2/5 p-7 md:p-10 flex flex-col bg-white sticky top-0">
            
            {/* Títol */}
            {artwork.title && (
              <h1 className="text-2xl md:text-3xl font-serif text-stone-900 mb-4 leading-tight">
                {artwork.title}
              </h1>
            )}

            {/* Metadades: [★ favorit] [avatar] "Obra de X" [data] */}
            <div className="flex items-center flex-wrap gap-x-4 gap-y-3 text-sm font-medium text-stone-600 mb-6">
              <button 
                onClick={toggleFavorite}
                className="transition-transform hover:scale-110 flex-shrink-0"
                aria-label={isFavorite ? "Treure de preferits" : "Afegir a preferits"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFavorite ? "#D4752A" : "none"} stroke={isFavorite ? "#D4752A" : "currentColor"} className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isFavorite ? 0 : 2} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                <AuthorAvatar name={artwork.author} size="w-8 h-8" avatarPath={artwork.authorAvatarPath} />
                <span>Obra de <span className="font-semibold text-stone-800">{artwork.author}</span></span>
              </div>

              <time className="text-stone-400 font-medium">{displayDate}</time>
            </div>

            {/* Etiquetes */}
            {artwork.tags && artwork.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-8">
                {artwork.tags.map((tag: any) => (
                  <span key={tag.id} className="px-2.5 py-1 rounded-full text-xs font-semibold text-white tracking-wide" style={{ backgroundColor: tag.color }}>
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Àudio */}
            {artwork.audios && artwork.audios.length > 0 && (
              <div className="mb-8 space-y-4">
                {artwork.audios.map((audio: any) => (
                  <CustomAudioPlayer key={audio.id} audio={audio} />
                ))}
              </div>
            )}

            {/* Descripció */}
            {artwork.description && (
              <div className="mb-6">
                <h2 className="text-xs uppercase tracking-widest text-stone-400 font-semibold mb-3">La història</h2>
                <p className="text-stone-700 leading-relaxed whitespace-pre-wrap text-[15px]">{artwork.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && artwork.images && artwork.images[lightboxIndex] && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/95 backdrop-blur-md p-4 md:p-12 animate-in fade-in duration-200"
          role="dialog" aria-modal="true" onClick={() => setLightboxIndex(null)}
        >
          <button 
            className="absolute top-6 right-6 z-[110] p-2 text-stone-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {lightboxIndex > 0 && (
            <button
              className="absolute left-4 md:left-8 z-[110] p-3 md:p-4 text-stone-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}

          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <img
              src={`/api/media/${artwork.images[lightboxIndex].filePath}`}
              alt="Imatge ampliada"
              className="max-w-full max-h-[90vh] md:max-h-[95vh] w-auto h-auto object-contain shadow-2xl rounded-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {lightboxIndex < artwork.images.length - 1 && (
            <button
              className="absolute right-4 md:right-8 z-[110] p-3 md:p-4 text-stone-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}
          
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
