"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TagInput from "@/components/TagInput";
import ImageEditor from "@/components/ImageEditor";

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

  // Estats de multimèdia
  const [images, setImages] = useState<any[]>([]);
  const [audios, setAudios] = useState<any[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [editingImage, setEditingImage] = useState<{ id: string; filePath: string; file: File } | null>(null);

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
        setImages(data.images || []);
        setAudios(data.audios || []);
        
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtwork();
  }, [id]);

  // 2. Gestionar multimèdia
  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Vols eliminar aquesta imatge?")) return;
    try {
      const res = await fetch(`/api/images/${imageId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Error en eliminar la imatge");
      setImages(images.filter((img) => img.id !== imageId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAudio = async (audioId: string) => {
    if (!confirm("Vols eliminar aquest àudio?")) return;
    try {
      const res = await fetch(`/api/audios/${audioId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Error en eliminar l'àudio");
      setAudios(audios.filter((audio) => audio.id !== audioId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUploadImage = async (fileToUpload?: File) => {
    const file = fileToUpload || imageFile;
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('artworkId', id);

      const res = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al pujar la imatge');
      
      setImages([...images, data]);
      if (!fileToUpload) setImageFile(null);
      return data;
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleEditExistingImage = async (img: any) => {
    try {
      const response = await fetch(`/api/media/${img.filePath}`);
      const blob = await response.blob();
      const filename = img.filePath.split('/').pop() || 'image.jpg';
      const file = new File([blob], filename, { type: 'image/jpeg' });
      setEditingImage({ ...img, file });
    } catch (err) {
      console.error("Error carregant la imatge per editar", err);
      alert("No s'ha pogut carregar la imatge per editar.");
    }
  };

  const handleEditorConfirm = async (processedFile: File) => {
    if (!editingImage) return;
    
    const oldId = editingImage.id;
    setEditingImage(null);
    setIsUploadingImage(true);

    try {
      // 1. Pujar la nova
      const newData = await handleUploadImage(processedFile);
      
      // 2. Si la nova ha pujat bé, esborrar la vella
      if (newData) {
        await fetch(`/api/images/${oldId}`, { method: 'DELETE' });
        setImages(prev => prev.filter(img => img.id !== oldId));
      }
    } catch (err) {
      console.error("Error substituint imatge", err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUploadAudio = async () => {
    if (!audioFile) return;
    setIsUploadingAudio(true);
    try {
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('artworkId', id);
      if (title) formData.append('description', title);

      const res = await fetch('/api/upload/audio', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al pujar l\'àudio');
      
      setAudios([...audios, data]);
      setAudioFile(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUploadingAudio(false);
    }
  };

  // 3. Desar els canvis principals
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

            {/* Secció Imatges */}
            <div className="pt-6 border-t border-stone-100">
              <h2 className="text-xl font-serif text-stone-900 mb-4">Imatges</h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {images.map((img) => (
                  <div key={img.id} className="relative group rounded-xl overflow-hidden border border-stone-200">
                    <img src={`/api/media/${img.filePath}`} alt="Obra" className="w-full h-32 object-cover" />
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleEditExistingImage(img)}
                        className="bg-amber-500 text-white p-1.5 rounded-full hover:bg-amber-600"
                        title="Editar imatge"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img.id)}
                        className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                        title="Eliminar imatge"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                />
                <button
                  type="button"
                  onClick={handleUploadImage}
                  disabled={!imageFile || isUploadingImage}
                  className="px-6 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-full font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {isUploadingImage ? 'Pujant...' : 'Afegir imatge'}
                </button>
              </div>
            </div>

            {/* Secció Àudios */}
            <div className="pt-6 border-t border-stone-100">
              <h2 className="text-xl font-serif text-stone-900 mb-4">Àudios</h2>
              
              <div className="space-y-3 mb-4">
                {audios.map((audio) => (
                  <div key={audio.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" /></svg>
                      </div>
                      <span className="text-sm font-medium text-stone-700">{audio.description || 'Àudio'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAudio(audio.id)}
                      className="text-red-500 hover:text-red-700 p-2 transition-colors"
                      title="Eliminar àudio"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-[#D4752A] hover:file:bg-orange-100"
                />
                <button
                  type="button"
                  onClick={handleUploadAudio}
                  disabled={!audioFile || isUploadingAudio}
                  className="px-6 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-full font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {isUploadingAudio ? 'Pujant...' : 'Afegir àudio'}
                </button>
              </div>
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

      {editingImage && (
        <ImageEditor
          file={editingImage.file}
          onConfirm={handleEditorConfirm}
          onCancel={() => setEditingImage(null)}
        />
      )}
    </main>
  );
}
