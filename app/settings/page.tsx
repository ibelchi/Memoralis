"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";
import AuthorAvatar from "@/components/AuthorAvatar";

interface Author {
  id: string;
  name: string;
  color: string;
  avatarPath: string | null;
}

interface Tag {
  id: string;
  name: string;
  color: string;
  _count: {
    artworks: number;
  };
}

export default function SettingsPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [stats, setStats] = useState({ total: 0, oldest: "" });
  const [loading, setLoading] = useState(true);
  const [galleryMode, setGalleryMode] = useState("galeria");
  const [isExporting, setIsExporting] = useState(false);
  const { addToast } = useToast();

  const [newAuthorName, setNewAuthorName] = useState("");
  const [newAuthorColor, setNewAuthorColor] = useState("#6366f1");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366f1");
  const [editingAuthorId, setEditingAuthorId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [selectedAvatars, setSelectedAvatars] = useState<{ [key: string]: { file: File, preview: string } | null }>({});

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    fetchData();
    const savedMode = localStorage.getItem("memoralis-default-mode") || "galeria";
    setGalleryMode(savedMode);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [authorsRes, artworksRes, tagsRes] = await Promise.all([
        fetch("/api/authors"),
        fetch("/api/artworks"),
        fetch("/api/tags"),
      ]);
      const authorsData = await authorsRes.json();
      const artworksData = await artworksRes.json();
      const tagsData = await tagsRes.json();

      setAuthors(Array.isArray(authorsData) ? authorsData : []);
      setTags(Array.isArray(tagsData) ? tagsData : []);

      if (Array.isArray(artworksData) && artworksData.length > 0) {
        const oldest = [...artworksData].sort((a, b) => new Date(a.artDate).getTime() - new Date(b.artDate).getTime())[0];
        const dateObj = new Date(oldest.artDate);
        const formattedDate = dateObj.toLocaleDateString("ca-ES", { month: "long", year: "numeric" });
        const cleanDate = formattedDate.replace(/\s+(de|del)\s+/g, " ");
        const displayDate = cleanDate.charAt(0).toUpperCase() + cleanDate.slice(1);
        
        setStats({
          total: artworksData.length,
          oldest: displayDate,
        });
      }
    } catch (error) {
      console.error("Error fetching settings data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateColor = async (name: string, color: string) => {
    try {
      const res = await fetch(`/api/authors/${encodeURIComponent(name)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color }),
      });
      if (res.ok) {
        setAuthors(prev => prev.map(a => a.name === name ? { ...a, color } : a));
        addToast({ title: "Color actualitzat", message: `S'ha canviat el color de ${name}`, type: "success" });
      }
    } catch (error) {
      console.error("Error updating color:", error);
    }
  };

  const handleRename = async (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || oldName === trimmed) {
      setEditingAuthorId(null);
      return;
    }
    try {
      const res = await fetch(`/api/authors/${encodeURIComponent(oldName)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName: trimmed }),
      });
      if (res.ok) {
        const updatedAuthor = await res.json();
        setAuthors(prev => prev.map(a => a.name === oldName ? updatedAuthor : a));
        setEditingAuthorId(null);
        addToast({ title: "Nom actualitzat", message: `S'ha canviat el nom a ${trimmed}`, type: "success" });
      } else if (res.status === 409) {
        addToast({ title: "Error", message: "Aquest nom ja existeix", type: "error" });
      }
    } catch (error) {
      console.error("Error renaming author:", error);
    }
  };

  const handleAvatarSelect = (authorId: string, file: File) => {
    const preview = URL.createObjectURL(file);
    setSelectedAvatars(prev => ({ ...prev, [authorId]: { file, preview } }));
  };

  const handleSaveAvatar = async (name: string, authorId: string) => {
    const data = selectedAvatars[authorId];
    if (!data) return;

    const formData = new FormData();
    formData.append("file", data.file);

    try {
      const res = await fetch(`/api/authors/${encodeURIComponent(name)}/avatar`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const { avatarPath } = await res.json();
        setAuthors(prev => prev.map(a => a.id === authorId ? { ...a, avatarPath } : a));
        setSelectedAvatars(prev => {
          const newState = { ...prev };
          delete newState[authorId];
          return newState;
        });
        addToast({ title: "Foto guardada", message: `S'ha actualitzat la foto de ${name}`, type: "success" });
      }
    } catch (error) {
      console.error("Error saving avatar:", error);
    }
  };

  const handleAddAuthor = async () => {
    if (!newAuthorName.trim()) return;
    try {
      const res = await fetch("/api/authors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAuthorName, color: newAuthorColor }),
      });
      if (res.ok) {
        const newAuthor = await res.json();
        setAuthors(prev => [...prev, newAuthor]);
        setNewAuthorName("");
        addToast({ title: "Autora afegida", message: `${newAuthorName} s'ha afegit correctament`, type: "success" });
      }
    } catch (error) {
      console.error("Error adding author:", error);
    }
  };

  const handleModeChange = (mode: string) => {
    setGalleryMode(mode);
    localStorage.setItem("memoralis-default-mode", mode);
  };

  const handleDeleteTag = async (id: string, name: string) => {
    if (!confirm(`Segur que vols esborrar l'etiqueta "${name}"?`)) return;
    try {
      const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTags(prev => prev.filter(t => t.id !== id));
        addToast({ title: "Etiqueta eliminada", message: `S'ha esborrat "${name}"`, type: "success" });
      }
    } catch (error) {
      console.error("Error deleting tag:", error);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName, color: newTagColor }),
      });
      if (res.ok) {
        const newTag = await res.json();
        // El GET /api/tags ens dóna el _count, així que simulem o refresquem
        fetchData(); 
        setNewTagName("");
        addToast({ title: "Etiqueta creada", message: `S'ha afegit "${newTagName}"`, type: "success" });
      }
    } catch (error) {
      console.error("Error creating tag:", error);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/backup");
      if (!response.ok) throw new Error("Backup failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStr = new Date().toISOString().split("T")[0];
      a.download = `memoralis-backup-${dateStr}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      addToast({ title: "Còpia completada", message: "La descàrrega ha començat", type: "success" });
    } catch (error) {
      console.error("Export error:", error);
      addToast({ title: "Error", message: "Error en generar la còpia. Torna-ho a intentar.", type: "error" });
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 p-12 flex justify-center items-center">
        <p className="text-stone-500 font-medium animate-pulse">Carregant configuració...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-800 font-sans py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-stone-400 hover:text-[#D4752A] transition-colors mb-6 font-medium text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Tornar
        </Link>

        <h1 className="text-4xl font-serif text-stone-900 mb-10">Configuració</h1>

        <div className="space-y-8">
          {/* FILA 1: Autores i Etiquetes (Grid 1:1) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* SECCIÓ: Autores */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
              <h2 className="text-xl font-semibold text-stone-900 mb-8 flex items-center">
                <span className="w-1.5 h-6 bg-[#D4752A] rounded-full mr-3"></span>
                Autores
              </h2>
              <div className="space-y-6">
                {authors.map((author) => (
                  <div key={author.id} className="flex items-center gap-3 p-3 rounded-2xl border border-stone-100 bg-stone-50/40">
                    <div className="relative flex-shrink-0">
                      {selectedAvatars[author.id] ? (
                        <img 
                          src={selectedAvatars[author.id]?.preview} 
                          className="w-10 h-10 rounded-full object-cover border-2 border-[#D4752A] shadow-sm"
                          alt="Previsualització"
                        />
                      ) : (
                        <AuthorAvatar name={author.name} size="w-10 h-10" className="text-sm shadow-sm" />
                      )}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        ref={el => { fileInputRefs.current[author.id] = el }}
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleAvatarSelect(author.id, e.target.files[0]);
                        }}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {editingAuthorId === author.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            className="border border-stone-200 rounded-xl px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#D4752A]/20 focus:border-[#D4752A] w-full"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRename(author.name, tempName);
                              if (e.key === 'Escape') setEditingAuthorId(null);
                            }}
                          />
                          <button 
                            onClick={() => handleRename(author.name, tempName)}
                            className="text-emerald-600 hover:bg-emerald-50 p-1 rounded-lg transition-colors flex-shrink-0"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 group">
                          <h3 className="text-sm font-medium text-stone-900 truncate">{author.name}</h3>
                          <button 
                            onClick={() => { setEditingAuthorId(author.id); setTempName(author.name); }}
                            className="p-0.5 text-stone-300 hover:text-[#D4752A] transition-colors"
                            title="Editar nom"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={author.color}
                        onChange={(e) => handleUpdateColor(author.name, e.target.value)}
                        className="w-6 h-6 rounded-full border border-stone-200 cursor-pointer overflow-hidden p-0 bg-transparent block"
                      />
                      
                      {selectedAvatars[author.id] ? (
                        <button
                          onClick={() => handleSaveAvatar(author.name, author.id)}
                          className="px-3 py-1 bg-[#D4752A] hover:bg-orange-700 text-white text-[10px] rounded-full font-bold transition-all shadow-sm"
                        >
                          Guardar
                        </button>
                      ) : (
                        <button
                          onClick={() => fileInputRefs.current[author.id]?.click()}
                          className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] rounded-full font-bold transition-all"
                        >
                          Foto
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="p-6 rounded-3xl border-2 border-dashed border-stone-100 bg-stone-50/20 flex flex-col gap-4">
                  <input
                    type="text"
                    placeholder="Nova autora..."
                    value={newAuthorName}
                    onChange={(e) => setNewAuthorName(e.target.value)}
                    className="w-full bg-transparent border-b border-stone-100 focus:border-[#D4752A] outline-none py-2 text-sm font-medium transition-colors"
                  />
                  <div className="flex items-center justify-between">
                    <input
                      type="color"
                      value={newAuthorColor}
                      onChange={(e) => setNewAuthorColor(e.target.value)}
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm cursor-pointer p-0 bg-transparent"
                    />
                    <button
                      onClick={handleAddAuthor}
                      disabled={!newAuthorName.trim()}
                      className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs rounded-full font-bold transition-all disabled:opacity-20 shadow-md shadow-stone-200 disabled:shadow-none"
                    >
                      Afegir
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* SECCIÓ: Etiquetes */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
              <h2 className="text-xl font-semibold text-stone-900 mb-8 flex items-center">
                <span className="w-1.5 h-6 bg-[#D4752A] rounded-full mr-3"></span>
                Etiquetes
              </h2>
              <div className="space-y-2 mb-8">
                {tags.length > 0 ? (
                  tags.map((tag) => (
                    <div key={tag.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full shadow-sm" 
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm font-medium text-stone-700 capitalize">{tag.name}</span>
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-400 text-[10px] font-bold rounded-full uppercase">
                          {tag._count.artworks} {tag._count.artworks === 1 ? 'obra' : 'obres'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteTag(tag.id, tag.name)}
                        className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Esborrar etiqueta"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-stone-400 text-sm italic">Encara no hi ha etiquetes</p>
                )}
              </div>
              <div className="pt-6 border-t border-stone-100">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Nova etiqueta..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="flex-1 bg-stone-50 border border-stone-100 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#D4752A] focus:ring-2 focus:ring-[#D4752A]/10 transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                  />
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-stone-100 cursor-pointer p-1 bg-white"
                  />
                  <button
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim()}
                    className="px-6 py-2 bg-stone-900 hover:bg-stone-800 text-white text-sm rounded-xl font-bold transition-all disabled:opacity-20 shadow-sm"
                  >
                    Afegir
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* FILA 2: Dades i Galeria (Grid 1:1) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* SECCIÓ: Dades */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
              <h2 className="text-xl font-semibold text-stone-900 mb-8 flex items-center">
                <span className="w-1.5 h-6 bg-[#D4752A] rounded-full mr-3"></span>
                Dades
              </h2>
              <div className="space-y-4 mb-6">
                <div className="p-5 rounded-2xl bg-stone-50/50 border border-stone-100 text-center">
                  <p className="text-stone-400 text-[9px] font-bold uppercase tracking-widest mb-1">Obres</p>
                  <p className="text-3xl font-serif text-stone-900">{stats.total}</p>
                </div>
                <div className="p-5 rounded-2xl bg-stone-50/50 border border-stone-100 text-center">
                  <p className="text-stone-400 text-[9px] font-bold uppercase tracking-widest mb-1">Més antiga</p>
                  <p className="text-2xl font-serif text-stone-900 truncate px-2">{stats.oldest || '—'}</p>
                </div>
              </div>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className={`w-full py-4 rounded-2xl border-2 border-dashed border-stone-200 text-stone-400 text-[11px] font-bold transition-all flex items-center justify-center gap-2 ${
                  isExporting ? "opacity-50 cursor-not-allowed" : "hover:bg-stone-50 hover:text-stone-600"
                }`}
              >
                {isExporting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-stone-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generant còpia...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003 3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Exportar còpia
                  </>
                )}
              </button>
            </section>

            {/* SECCIÓ: Galeria */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
              <h2 className="text-xl font-semibold text-stone-900 mb-8 flex items-center">
                <span className="w-1.5 h-6 bg-[#D4752A] rounded-full mr-3"></span>
                Galeria
              </h2>
              <div className="space-y-4">
                <p className="text-stone-500 text-[11px]">Mode per defecte:</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleModeChange("descoberta")}
                    className={`w-full py-3 rounded-2xl text-[11px] font-bold transition-all border ${
                      galleryMode === "descoberta"
                        ? "bg-white text-stone-900 border-[#D4752A] shadow-sm"
                        : "bg-stone-50 text-stone-400 border-stone-100 hover:text-stone-600"
                    }`}
                  >
                    Descoberta
                  </button>
                  <button
                    onClick={() => handleModeChange("galeria")}
                    className={`w-full py-3 rounded-2xl text-[11px] font-bold transition-all border ${
                      galleryMode === "galeria"
                        ? "bg-white text-stone-900 border-[#D4752A] shadow-sm"
                        : "bg-stone-50 text-stone-400 border-stone-100 hover:text-stone-600"
                    }`}
                  >
                    Galeria
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
