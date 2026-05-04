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
  const [uploadedPdfPages, setUploadedPdfPages] = useState<number | null>(null);
  const [uploadedAudio, setUploadedAudio] = useState(false);

  // Refs per als inputs ocults
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Estats de progrés individuals
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

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
          tags: selectedTags.map(t => t.name)
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !artworkId) return;

    setImageFile(file);
    setIsUploadingImage(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('artworkId', artworkId);

      const isPdfFile = file.type === 'application/pdf';
      const endpoint = isPdfFile ? '/api/upload/pdf' : '/api/upload/image';

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al pujar el fitxer');

      if (isPdfFile) {
        setUploadedPdfPages(data.pages as number);
      } else {
        setUploadedImageUrl(`/api/media/${data.filePath}`);
      }
    } catch (err: any) {
      setError(err.message);
      setImageFile(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAudioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !artworkId) return;

    setAudioFile(file);
    setIsUploadingAudio(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('artworkId', artworkId);
      if (title) {
        formData.append('description', title);
      }

      const res = await fetch('/api/upload/audio', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al pujar l\'àudio');
      
      setUploadedAudio(true);
    } catch (err: any) {
      setError(err.message);
      setAudioFile(null);
    } finally {
      setIsUploadingAudio(false);
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-serif text-stone-900 mb-2">Afegir nova obra</h1>
              <p className="text-stone-500">
                {step === 1 ? 'Pas 1 de 2: Informació bàsica' : 'Pas 2 de 2: Fitxers multimèdia'}
              </p>
            </div>
            {step === 1 && (
              <Link
                href="/upload/batch"
                className="inline-flex items-center justify-center px-6 py-3 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-2xl font-semibold transition-all border border-amber-100 shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Afegir múltiples obres
              </Link>
            )}
          </div>

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
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  placeholder="Ex: La casa del bosc (opcional)"
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
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Secció Imatge / PDF */}
              <div className="bg-stone-50 p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm">
                <h2 className="text-xl font-medium text-stone-800 mb-6 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-sm mr-3 font-bold">1</span>
                  Puja l'obra (Imatge o PDF)
                </h2>

                <div className="flex flex-col gap-4">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    capture="environment"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isUploadingImage || !!uploadedImageUrl || uploadedPdfPages !== null}
                      className="px-6 py-3 bg-stone-800 hover:bg-stone-900 text-white rounded-2xl font-medium transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Seleccionar arxiu
                    </button>

                    <div className="flex-1 text-sm">
                      {isUploadingImage ? (
                        <span className="text-amber-600 font-medium flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Pujant...
                        </span>
                      ) : (uploadedImageUrl || uploadedPdfPages !== null) ? (
                        <span className="text-green-600 font-semibold flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          ✓ {imageFile?.name || 'Arxiu pujat'}
                        </span>
                      ) : imageFile ? (
                        <span className="text-stone-600">{imageFile.name}</span>
                      ) : (
                        <span className="text-stone-400 italic">Cap arxiu seleccionat</span>
                      )}
                    </div>
                  </div>

                  {uploadedImageUrl && (
                    <div className="mt-2 animate-in zoom-in-95 duration-300">
                      <img src={uploadedImageUrl} alt="Previsualització" className="w-full max-h-48 object-contain rounded-2xl border border-stone-200 bg-white p-1 shadow-inner" />
                    </div>
                  )}
                  {uploadedPdfPages !== null && (
                    <div className="mt-2 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-xs font-medium">
                      PDF processat: {uploadedPdfPages} pàgines convertides a imatges.
                    </div>
                  )}
                </div>
              </div>

              {/* Secció Àudio */}
              <div className="bg-stone-50 p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm">
                <h2 className="text-xl font-medium text-stone-800 mb-6 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-sm mr-3 font-bold">2</span>
                  Puja l'àudio (explicació)
                </h2>
                
                <div className="flex flex-col gap-4">
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*"
                    capture="microphone"
                    onChange={handleAudioChange}
                    className="hidden"
                  />

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => audioInputRef.current?.click()}
                      disabled={isUploadingAudio || uploadedAudio}
                      className="px-6 py-3 bg-[#D4752A] hover:bg-orange-700 text-white rounded-2xl font-medium transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      Seleccionar arxiu
                    </button>

                    <div className="flex-1 text-sm">
                      {isUploadingAudio ? (
                        <span className="text-orange-600 font-medium flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Pujant...
                        </span>
                      ) : uploadedAudio ? (
                        <span className="text-green-600 font-semibold flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          ✓ {audioFile?.name || 'Àudio pujat'}
                        </span>
                      ) : audioFile ? (
                        <span className="text-stone-600">{audioFile.name}</span>
                      ) : (
                        <span className="text-stone-400 italic">Cap arxiu seleccionat</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botó final */}
              <button
                onClick={() => router.push(`/artwork/${artworkId}`)}
                className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold text-lg transition-all shadow-lg active:scale-[0.98] mt-8"
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
