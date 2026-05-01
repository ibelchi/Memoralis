'use client';

import { useState, useRef, useEffect } from 'react';

type UploadItem = {
  id: string;
  file: File;
  preview: string;
  title: string;
  author: string;
  artDate: string;
  status: 'idle' | 'uploading' | 'success' | 'error';
  errorMsg?: string;
};

export default function BatchUploadGrid() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [globalAuthor, setGlobalAuthor] = useState('');
  const [globalDate, setGlobalDate] = useState(new Date().toISOString().split('T')[0]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar autores úniques des de l'API
  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const res = await fetch('/api/artworks');
        if (res.ok) {
          const data = await res.json();
          const uniqueAuthors = Array.from(new Set(data.map((a: any) => a.author))).filter(Boolean) as string[];
          setAuthors(uniqueAuthors);
          if (uniqueAuthors.length > 0) {
            setGlobalAuthor(uniqueAuthors[0]);
          }
        }
      } catch (err) {
        console.error("Error carregant autores:", err);
      }
    };
    fetchAuthors();
  }, []);

  // Alliberar memòria de les URLs creades per previsualització
  useEffect(() => {
    return () => {
      items.forEach(item => URL.revokeObjectURL(item.preview));
    };
  }, [items]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const newFiles = Array.from(e.target.files);
    const newItems: UploadItem[] = newFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      title: '', // Títol opcional
      author: globalAuthor,
      artDate: globalDate,
      status: 'idle'
    }));

    setItems(prev => [...prev, ...newItems]);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleApplyToAll = () => {
    setItems(prev => prev.map(item => ({
      ...item,
      author: globalAuthor,
      artDate: globalDate
    })));
  };

  const updateItem = (id: string, field: keyof UploadItem, value: any) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(prev => {
      const filtered = prev.filter(item => item.id !== id);
      const itemToRemove = prev.find(item => item.id === id);
      if (itemToRemove) URL.revokeObjectURL(itemToRemove.preview);
      return filtered;
    });
  };

  const handleUploadAll = async () => {
    setIsUploading(true);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.status === 'success') continue;

      updateItem(item.id, 'status', 'uploading');

      try {
        // 1. Crear l'obra (POST /api/artworks)
        const artRes = await fetch('/api/artworks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title: item.title, 
            author: item.author, 
            artDate: item.artDate, 
            description: '',
            tags: [] 
          }),
        });
        
        const artData = await artRes.json();
        if (!artRes.ok) throw new Error(artData.error || 'Error al crear obra');
        
        const artworkId = artData.id;

        // 2. Pujar la imatge (POST /api/upload/image)
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('artworkId', artworkId);

        const imgRes = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
          headers: {
            // FormData s'encarrega dels headers correctament
          }
        });
        
        const imgData = await imgRes.json();
        if (!imgRes.ok) throw new Error(imgData.error || 'Error al pujar imatge');

        updateItem(item.id, 'status', 'success');
      } catch (err: any) {
        updateItem(item.id, 'status', 'error');
        updateItem(item.id, 'errorMsg', err.message);
      }
    }

    setIsUploading(false);
  };

  return (
    <div className="space-y-8">
      {/* Controls globals */}
      <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-stone-700 mb-1">Afegir fitxers imatge</label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
          />
        </div>
        
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-stone-700 mb-1">Autora</label>
          {authors.length > 0 ? (
            <select 
              value={globalAuthor} 
              onChange={(e) => setGlobalAuthor(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none"
            >
              {authors.map(a => <option key={a} value={a}>{a}</option>)}
              <option value="">Nova autora...</option>
            </select>
          ) : (
            <input 
              type="text"
              value={globalAuthor}
              onChange={(e) => setGlobalAuthor(e.target.value)}
              placeholder="Nom de l'autora"
              className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          )}
        </div>

        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-stone-700 mb-1">Data</label>
          <input 
            type="date" 
            value={globalDate} 
            onChange={(e) => setGlobalDate(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>

        <button 
          onClick={handleApplyToAll}
          className="w-full md:w-auto px-6 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl font-medium transition-colors"
        >
          Aplicar a totes
        </button>
      </div>

      {/* Graella d'imatges */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div key={item.id} className="border border-stone-200 rounded-xl p-4 bg-white relative shadow-sm">
              <button 
                onClick={() => removeItem(item.id)}
                className="absolute top-2 right-2 bg-white/80 hover:bg-red-50 text-red-500 rounded-full p-1 z-10"
                disabled={item.status === 'uploading' || item.status === 'success'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              <div className="aspect-square mb-4 bg-stone-100 rounded-lg overflow-hidden relative">
                <img src={item.preview} alt="preview" className="object-cover w-full h-full" />
                
                {/* Overlays d'estat */}
                {item.status === 'uploading' && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <svg className="animate-spin h-8 w-8 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  </div>
                )}
                {item.status === 'success' && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <div className="bg-white rounded-full p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">Títol <span className="text-stone-400 font-normal">(opcional)</span></label>
                  <input 
                    type="text" 
                    value={item.title}
                    onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                    disabled={item.status === 'success' || item.status === 'uploading'}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none disabled:bg-stone-50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1">Autora</label>
                    {authors.length > 0 ? (
                      <select 
                        value={item.author}
                        onChange={(e) => updateItem(item.id, 'author', e.target.value)}
                        disabled={item.status === 'success' || item.status === 'uploading'}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none disabled:bg-stone-50"
                      >
                        {authors.map(a => <option key={a} value={a}>{a}</option>)}
                        <option value="">Altra...</option>
                      </select>
                    ) : (
                      <input 
                        type="text"
                        value={item.author}
                        onChange={(e) => updateItem(item.id, 'author', e.target.value)}
                        disabled={item.status === 'success' || item.status === 'uploading'}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none disabled:bg-stone-50"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1">Data</label>
                    <input 
                      type="date" 
                      value={item.artDate}
                      onChange={(e) => updateItem(item.id, 'artDate', e.target.value)}
                      disabled={item.status === 'success' || item.status === 'uploading'}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none disabled:bg-stone-50"
                    />
                  </div>
                </div>
                {item.status === 'error' && (
                  <p className="text-xs text-red-500 mt-1">{item.errorMsg}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botó final d'enviament */}
      {items.length > 0 && (
        <div className="flex justify-end pt-6 border-t border-stone-200">
          <button
            onClick={handleUploadAll}
            disabled={isUploading || items.every(i => i.status === 'success')}
            className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center"
          >
            {isUploading ? 'Pujant obres...' : 'Pujar totes les imatges'}
          </button>
        </div>
      )}
    </div>
  );
}
