"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Tag {
  id: string;
  name: string;
  color: string;
  _count: { artworks: number };
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/tags");
      const data = await res.json();
      setTags(data);
    } catch {
      setError("Error carregant les etiquetes");
    } finally {
      setLoading(false);
    }
  };

  const createTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTagName.trim().toLowerCase();
    if (!name) return;
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const tag = await res.json();
      // Afegim i ordenem manualment
      setTags((prev) => {
        const _tags = [...prev];
        // Comprovem que no estigui ja (encara que l'API fa upsert)
        if (!_tags.find(t => t.id === tag.id)) {
           _tags.push({...tag, _count: { artworks: 0 }});
        }
        return _tags.sort((a, b) => a.name.localeCompare(b.name));
      });
      setNewTagName("");
    } catch {
      setError("Error creant l'etiqueta");
    }
  };

  const deleteTag = async (id: string, artworkCount: number) => {
    if (artworkCount > 0) {
      const ok = confirm(
        `Aquesta etiqueta té ${artworkCount} obra${artworkCount > 1 ? "es" : ""} associada${artworkCount > 1 ? "es" : ""}. Vols eliminar-la igualment?`
      );
      if (!ok) return;
    }
    try {
      await fetch(`/api/tags/${id}`, { method: "DELETE" });
      setTags((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError("Error eliminant l'etiqueta");
    }
  };

  if (loading) return (
    <main className="min-h-screen bg-stone-50 text-stone-800 font-sans py-12 px-6">
      <div className="max-w-lg mx-auto p-8 text-center text-stone-500">Carregant...</div>
    </main>
  );

  return (
    <main className="min-h-screen bg-stone-50 text-stone-800 font-sans py-12 px-6">
      <div className="max-w-lg mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-stone-500 hover:text-amber-700 transition-colors mb-8 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Tornar a la galeria
        </Link>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100">
          <h1 className="text-3xl font-serif text-stone-900 mb-6">Gestió d'etiquetes</h1>

          {error && (
            <p className="mb-6 text-sm text-red-700 bg-red-50 border border-red-100 px-4 py-3 rounded-xl font-medium">
              {error}
            </p>
          )}

          {/* Formulari nou tag */}
          <form onSubmit={createTag} className="flex gap-3 mb-8">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Nova etiqueta..."
              className="flex-1 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
            />
            <button
              type="submit"
              disabled={!newTagName.trim()}
              className="px-6 py-3 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Crear
            </button>
          </form>

          {/* Llista de tags */}
          {tags.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-stone-400 text-sm">Encara no hi ha etiquetes.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {tags.map((tag) => (
                <li
                  key={tag.id}
                  className="flex items-center justify-between px-5 py-4 bg-stone-50 hover:bg-stone-100 transition-colors border border-stone-100 rounded-2xl"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-sm font-semibold text-stone-800">{tag.name}</span>
                    <span className="text-xs font-medium text-stone-500 bg-stone-200 px-2 py-0.5 rounded-full">
                      {tag._count?.artworks || 0} obra{(tag._count?.artworks || 0) !== 1 ? "es" : ""}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteTag(tag.id, tag._count?.artworks || 0)}
                    className="text-xs font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors"
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
