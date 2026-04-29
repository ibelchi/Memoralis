"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TagInput from "@/components/TagInput";

export default function EditArtworkPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { id } = params;

  // Estats de càrrega i error
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estats del formulari
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [artDate, setArtDate] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<{ id: string; name: string; color: string }[]>([]);

  // 1. Carregar dades inicials
  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        const res = await fetch(`/api/artworks/${id}`);
        if (!res.ok) {
          throw new Error("No s'ha pogut carregar l'obra");
        }
        const data = await res.json();
        
        setTitle(data.title || "");
        setAuthor(data.author || "");
        // Format ISO a YYYY-MM-DD per a l'input type="date"
        if (data.artDate) {
          const dateObj = new Date(data.artDate);
          const yyyy = dateObj.getFullYear();
          const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
          const dd = String(dateObj.getDate()).padStart(2, '0');
          setArtDate(`${yyyy}-${mm}-${dd}`);
        }
        setDescription(data.description || "");
        setSelectedTags(data.tags || []);
        
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtwork();
  }, [id]);

  // 3. Desar els canvis
  const handleUpdateArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/artworks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          author,
          artDate,
          description,
          tags: selectedTags.map((t) => t.name),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "S'ha produït un error en desar l'obra");
      }

      // 4. Redirigir a la vista de detall
      router.push(`/artwork/${id}`);
    } catch (err: any) {
      setError(err.message);
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-stone-50 text-stone-800 font-sans py-12 px-6 flex justify-center items-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-amber-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-stone-500 font-medium">Carregant dades...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-800 font-sans py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* 5. Botó de tornar / cancel·lar */}
        <Link
          href={`/artwork/${id}`}
          className="inline-flex items-center text-stone-500 hover:text-amber-700 transition-colors mb-8 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Tornar a l'obra
        </Link>

        <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-stone-100">
          <h1 className="text-3xl font-serif text-stone-900 mb-8">Editar l'obra</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          {/* 2. Formulari */}
          <form onSubmit={handleUpdateArtwork} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-stone-700 mb-1">Títol de l'obra</label>
              <input
                type="text"
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                placeholder="Ex: La casa del bosc"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="author" className="block text-sm font-medium text-stone-700 mb-1">Autora</label>
                <input
                  type="text"
                  id="author"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  placeholder="Ex: Martina"
                />
              </div>
              <div>
                <label htmlFor="artDate" className="block text-sm font-medium text-stone-700 mb-1">Data de creació</label>
                <input
                  type="date"
                  id="artDate"
                  required
                  value={artDate}
                  onChange={(e) => setArtDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-stone-700 mb-1">Descripció o context (opcional)</label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none"
                placeholder="Què estava fent o pensant quan ho va crear?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Etiquetes
              </label>
              <TagInput selectedTags={selectedTags} onChange={setSelectedTags} />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => router.push(`/artwork/${id}`)}
                className="w-full sm:w-1/3 py-4 text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl font-medium transition-colors flex justify-center items-center"
              >
                Cancel·lar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-2/3 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {isSaving ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : 'Desar canvis'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
