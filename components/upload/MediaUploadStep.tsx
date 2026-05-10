'use client';

import { useState, useRef } from 'react';
import ImageEditor from '@/components/ImageEditor';

interface MediaUploadStepProps {
  artworkId: string;
  artworkTitle: string;
  onComplete: () => void;
}

export default function MediaUploadStep({ artworkId, artworkTitle, onComplete }: MediaUploadStepProps) {
  const [error, setError] = useState<string | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [uploadedPdfPages, setUploadedPdfPages] = useState<number | null>(null);
  const [uploadedAudio, setUploadedAudio] = useState(false);
  const [editingImage, setEditingImage] = useState<{ id: string; filePath: string; file: File } | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !artworkId) return;

    setImageFile(file);
    performUpload(file);
  };

  const performUpload = async (file: File) => {
    setIsUploadingImage(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('artworkId', artworkId as string);

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
        setUploadedImages(data.images || []);
      } else {
        setUploadedImages([data]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleEditUploadedImage = async (img: any) => {
    try {
      const response = await fetch(`/api/media/${img.filePath}`);
      const blob = await response.blob();
      const filename = img.filePath.split('/').pop() || 'image.jpg';
      const file = new File([blob], filename, { type: 'image/jpeg' });
      setEditingImage({ ...img, file });
    } catch (err) {
      console.error("Error carregant la imatge per editar", err);
    }
  };

  const handleEditorConfirm = async (processedFile: File) => {
    if (!editingImage || !artworkId) return;
    
    const oldId = editingImage.id;
    setEditingImage(null);
    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', processedFile);
      formData.append('artworkId', artworkId);

      const res = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al pujar la imatge editada');
      
      await fetch(`/api/images/${oldId}`, { method: 'DELETE' });
      
      setUploadedImages(prev => prev.map(img => img.id === oldId ? data : img));
    } catch (err: any) {
      setError(err.message);
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
      if (artworkTitle) {
        formData.append('description', artworkTitle);
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

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
              disabled={isUploadingImage || uploadedImages.length > 0 || uploadedPdfPages !== null}
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
              ) : (uploadedImages.length > 0 || uploadedPdfPages !== null) ? (
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

          {uploadedImages.length > 0 && (
            <div className={`mt-4 grid gap-4 ${uploadedImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {uploadedImages.map((img) => (
                <div key={img.id} className="animate-in zoom-in-95 duration-300 flex flex-col gap-2">
                  <div className="relative group">
                    <img 
                      src={`/api/media/${img.filePath}`} 
                      alt="Previsualització" 
                      className="w-full h-40 object-contain rounded-2xl border border-stone-200 bg-white p-1 shadow-inner" 
                    />
                    <button
                      onClick={() => handleEditUploadedImage(img)}
                      className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl gap-2 font-medium"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {uploadedPdfPages !== null && (
            <div className="mt-2 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-xs font-medium">
              PDF processat: {uploadedPdfPages} pàgines convertides a imatges.
            </div>
          )}
        </div>
      </div>

      <div className="bg-stone-50 p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm">
        <h2 className="text-xl font-medium text-stone-800 mb-6 flex items-center">
          <span className="w-8 h-8 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-sm mr-3 font-bold">2</span>
          Puja l'àudio (explicació)
        </h2>
        
        <div className="flex flex-col gap-4">
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*,video/mp4,.m4a,.amr,.ogg,.opus,.3gpp,.mp3,.wav"
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

      <button
        onClick={onComplete}
        className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold text-lg transition-all shadow-lg active:scale-[0.98] mt-8"
      >
        Veure l'obra finalitzada
      </button>

      {editingImage && (
        <ImageEditor
          file={editingImage.file}
          onConfirm={handleEditorConfirm}
          onCancel={() => setEditingImage(null)}
        />
      )}
    </div>
  );
}
