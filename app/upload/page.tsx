'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TagInput from '@/components/TagInput';

export default function UploadPage() {
  const router = useRouter();
  
  // Estats generals
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [artworkId, setArtworkId] = useState<string | null>(null);

  // Estats del formulari (Pas 1)
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [artDate, setArtDate] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<{ id: string; name: string; color: string }[]>([]);

  // Estats de fitxers (Pas 2)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedAudio, setUploadedAudio] = useState(false);

  const handleCreateArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/artworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          author, 
          artDate, 
          description,
          tags: selectedTags.map(t => t.name) // Enviem només els noms
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'S\'ha produït un error al crear l\'obra');
      
      setArtworkId(data.id);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };


  const handleUploadImage = async () => {
    if (!imageFile || !artworkId) return;
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('artworkId', artworkId);

      const res = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al pujar la imatge');
      
      setUploadedImageUrl(`/api/media/${data.filePath}`);
      setImageFile(null); // Netegem l'input
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadAudio = async () => {
    if (!audioFile || !artworkId) return;
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('artworkId', artworkId);

      const res = await fetch('/api/upload/audio', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al pujar l\'àudio');
      
      setUploadedAudio(true);
      setAudioFile(null); // Netegem l'input
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 text-stone-800 font-sans py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-stone-500 hover:text-amber-700 transition-colors mb-8 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Tornar a la galeria
        </Link>

        <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-stone-100">
          <h1 className="text-3xl font-serif text-stone-900 mb-2">Afegir nova obra</h1>
          <p className="text-stone-500 mb-8">
            {step === 1 ? 'Pas 1 de 2: Informació bàsica' : 'Pas 2 de 2: Fitxers multimèdia'}
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleCreateArtwork} className="space-y-6">
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : 'Continuar'}
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-8">
              {/* Secció Imatge */}
              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                <h2 className="text-lg font-medium text-stone-800 mb-4">1. Puja una imatge (foto o escàner)</h2>
                
                {uploadedImageUrl ? (
                  <div className="space-y-3">
                    <p className="text-sm text-green-600 font-medium flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      Imatge pujada correctament
                    </p>
                    <img src={uploadedImageUrl} alt="Previsualització" className="w-full max-h-64 object-contain rounded-xl border border-stone-200 bg-white" />
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                    />
                    <button
                      onClick={handleUploadImage}
                      disabled={!imageFile || isLoading}
                      className="px-6 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-full font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      Pujar imatge
                    </button>
                  </div>
                )}
              </div>

              {/* Secció Àudio */}
              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                <h2 className="text-lg font-medium text-stone-800 mb-4">2. Puja un àudio (la seva explicació)</h2>
                
                {uploadedAudio ? (
                  <p className="text-sm text-green-600 font-medium flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Àudio pujat correctament
                  </p>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                    />
                    <button
                      onClick={handleUploadAudio}
                      disabled={!audioFile || isLoading}
                      className="px-6 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-full font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      Pujar àudio
                    </button>
                  </div>
                )}
              </div>

              {/* Botó final */}
              <button
                onClick={() => router.push(`/artwork/${artworkId}`)}
                className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-colors shadow-sm flex justify-center items-center mt-4"
              >
                Veure l'obra finalitzada
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
