"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import ArtworkCard from "@/components/ArtworkCard";
import GalleryFilters, { Filters, Tag } from "@/components/GalleryFilters";
import { useToast } from "@/components/ToastProvider";

type GalleryMode = "descoberta" | "galeria";

export default function HomePage() {
  const [artworks, setArtworks] = useState<any[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<GalleryMode>("galeria");
  const [onThisDayArtworks, setOnThisDayArtworks] = useState<any[]>([]);

  useEffect(() => {
    const savedMode = localStorage.getItem("memoralis-default-mode");
    if (savedMode === "descoberta" || savedMode === "galeria") {
      setMode(savedMode as GalleryMode);
    }
  }, []);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    q: "",
    author: "",
    tag: "",
    dateFrom: "",
    dateTo: "",
  });

  const fetchFilteredArtworks = useCallback(async (isInitial = false) => {
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
      setArtworks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error carregant obres:", error);
      setArtworks([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [artworksRes, tagsRes, onThisDayRes] = await Promise.all([
          fetch("/api/artworks"),
          fetch("/api/tags"),
          fetch("/api/artworks/on-this-day"),
        ]);
        
        const allArtworks = await artworksRes.json();
        const allTags = await tagsRes.json();
        const onThisDay = await onThisDayRes.json();
        
        setTags(Array.isArray(allTags) ? allTags : []);
        setOnThisDayArtworks(Array.isArray(onThisDay) ? onThisDay : []);
        
        if (Array.isArray(allArtworks)) {
          const uniqueAuthors = Array.from(
            new Set(allArtworks.map((a: any) => a.author))
          ) as string[];
          setAuthors(uniqueAuthors.sort());
        }
      } catch (error) {
        console.error("Error carregant dades inicials:", error);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchFilteredArtworks();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [fetchFilteredArtworks]);

  useEffect(() => {
    const handleUpdate = () => fetchFilteredArtworks();
    window.addEventListener('artworks-updated', handleUpdate);
    return () => window.removeEventListener('artworks-updated', handleUpdate);
  }, [fetchFilteredArtworks]);

  const handleFilterChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
    if (newFilters.q || newFilters.author || newFilters.tag || newFilters.dateFrom || newFilters.dateTo) {
      setMode("galeria");
    }
  }, []);

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set());
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const { addToast } = useToast();

  const handleBatchDelete = async () => {
    setIsDeleting(true);
    try {
      const idsArray = Array.from(selectedIds);
      for (const id of idsArray) {
        await fetch(`/api/artworks/${id}`, { method: "DELETE" });
      }
      
      addToast({
        id: idsArray.join(','),
        title: `${idsArray.length} ${idsArray.length === 1 ? 'obra' : 'obres'}`,
        message: `${idsArray.length} ${idsArray.length === 1 ? 'obra eliminada' : 'obres eliminades'}`,
        type: 'delete',
      });

      await fetchFilteredArtworks();
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Error deleting artworks", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const displayedArtworks = useMemo(() => {
    const list = Array.isArray(artworks) ? artworks : [];
    if (mode === "galeria") {
      return list;
    }
    // Mode Descoberta: shuffle amb avantatge pels favorits
    return [...list].sort((a, b) => {
      const scoreA = Math.random() + (a.isFavorite ? 0.4 : 0);
      const scoreB = Math.random() + (b.isFavorite ? 0.4 : 0);
      return scoreB - scoreA;
    });
  }, [artworks, mode]);

  const maxYearsAgo = useMemo(() => {
    if (onThisDayArtworks.length === 0) return 0;
    const currentYear = new Date().getFullYear();
    const years = onThisDayArtworks.map(a => currentYear - new Date(a.artDate).getFullYear());
    return Math.max(...years);
  }, [onThisDayArtworks]);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-800 font-sans relative pb-32">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-serif font-light text-stone-900 tracking-tight">
              Memoralis
            </h1>
            <a 
              href="https://ibelchi.github.io" 
              target="_blank" 
              rel="noopener" 
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              belchi
            </a>
          </div>

          {onThisDayArtworks.length > 0 && (
            <Link
              href="/on-this-day"
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-sm font-medium hover:bg-amber-100 transition-all shadow-sm group"
            >
              <span>Avui fa {maxYearsAgo} {maxYearsAgo === 1 ? 'any' : 'anys'}</span>
            </Link>
          )}
          
          <div className="flex items-center gap-4">
            <div className="flex bg-stone-200/60 p-1 rounded-full">
              <button
                onClick={() => setMode("descoberta")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  mode === "descoberta"
                    ? "bg-white text-stone-800 shadow-sm"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                Descoberta
              </button>
              <button
                onClick={() => setMode("galeria")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  mode === "galeria"
                    ? "bg-white text-stone-800 shadow-sm"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                Galeria
              </button>
            </div>

            <Link
              href="/upload"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-[#D4752A] hover:bg-orange-700 text-white rounded-full font-medium transition-colors shadow-sm hover:shadow-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Afegir
            </Link>
            
            <Link 
              href="/settings"
              className="text-stone-400 hover:text-[#D4752A] transition-colors p-1"
              aria-label="Configuració"
            >
              <Settings size={20} />
            </Link>
          </div>
        </header>

        <div className="mb-8">
          <GalleryFilters 
            authors={authors} 
            tags={tags} 
            onFilterChange={handleFilterChange}
            isSelectionMode={isSelectionMode}
            onToggleSelectionMode={handleToggleSelectionMode}
          />
        </div>

        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-stone-100">
            <svg className="animate-spin h-10 w-10 text-[#D4752A] mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-stone-500 font-medium">Carregant la galeria...</p>
          </div>
        ) : displayedArtworks.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl shadow-sm border border-stone-100 min-h-[420px] flex items-center justify-center">
            <img
              src="/images/empty-state.png"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-white/60" />
            <div className="relative z-10 text-center px-8 py-16">
              <h3 className="text-2xl font-serif font-light text-stone-700 mb-3">
                {Object.values(filters).some(Boolean)
                  ? "Cap obra coincideix amb la cerca"
                  : "Encara no hi ha cap obra"}
              </h3>
              <p className="text-stone-500 mb-8">
                {Object.values(filters).some(Boolean)
                  ? "Prova a canviar o netejar els filtres."
                  : "Afegeix el primer dibuix o fotografia."}
              </p>
              {!Object.values(filters).some(Boolean) && (
                <Link
                  href="/upload"
                  className="inline-flex items-center px-6 py-3 bg-[#D4752A] hover:bg-orange-700 text-white rounded-full font-medium transition-colors shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Afegir obra
                </Link>
              )}
            </div>
          </div>

        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-8">
            {displayedArtworks.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                id={artwork.id}
                title={artwork.title}
                author={artwork.author}
                artDate={artwork.artDate}
                imageUrl={artwork.images?.[0] ? `/api/media/${artwork.images[0].filePath}` : undefined}
                hasAudio={artwork._count ? artwork._count.audios > 0 : (artwork.audios && artwork.audios.length > 0)}
                tags={artwork.tags || []}
                isFavorite={artwork.isFavorite}
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds.has(artwork.id)}
                onToggleSelect={handleToggleSelect}
                authorAvatarPath={artwork.authorAvatarPath}
              />
            ))}
          </div>
        )}
      </div>

      {isSelectionMode && selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-stone-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-stone-400 hover:text-white text-sm font-medium transition-colors"
          >
            Deseleccionar tot
          </button>
          <div className="w-px h-6 bg-stone-700"></div>
          <span className="font-medium">
            {selectedIds.size} {selectedIds.size === 1 ? 'obra seleccionada' : 'obres seleccionades'}
          </span>
          <div className="w-px h-6 bg-stone-700"></div>
          <button
            onClick={handleBatchDelete}
            disabled={isDeleting}
            className="text-rose-400 hover:text-rose-300 font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
            Esborrar selecció
          </button>
        </div>
      )}
    </main>
  );
}
