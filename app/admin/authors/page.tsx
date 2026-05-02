"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Author {
  id: string;
  name: string;
  avatarPath: string | null;
}

export default function AuthorsAdminPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    try {
      const res = await fetch("/api/authors");
      const data = await res.json();
      setAuthors(data);
    } catch (error) {
      console.error("Error fetching authors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAvatar = async (authorName: string, file: File) => {
    setUploading(authorName);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("authorName", authorName);

      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Error uploading avatar");
      
      await fetchAuthors();
    } catch (error) {
      console.error(error);
      alert("Error pujant l'avatar");
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 p-12 flex justify-center">
        <p className="text-stone-500 font-medium">Carregant autores...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-800 font-sans py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-stone-500 hover:text-[#D4752A] transition-colors mb-8 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Tornar a la galeria
        </Link>

        <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-stone-100">
          <h1 className="text-3xl font-serif text-stone-900 mb-8">Gestió d'Autores i Avatars</h1>
          
          <div className="space-y-6">
            {authors.map((author) => (
              <div key={author.id} className="flex items-center justify-between p-6 rounded-2xl border border-stone-100 bg-stone-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-stone-200 border-2 border-white shadow-sm flex items-center justify-center flex-shrink-0">
                    {author.avatarPath ? (
                      <img src={`/api/media/${author.avatarPath}`} alt={author.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-stone-500 uppercase">{author.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-stone-900">{author.name}</h3>
                    <p className="text-sm text-stone-500 mt-1">
                      {author.avatarPath ? 'Té avatar personalitzat' : 'Sense avatar (mostra inicial)'}
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleUploadAvatar(author.name, e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading === author.name}
                  />
                  <button
                    type="button"
                    disabled={uploading === author.name}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white text-sm rounded-full font-medium transition-colors disabled:opacity-50"
                  >
                    {uploading === author.name ? 'Pujant...' : (author.avatarPath ? 'Canviar avatar' : 'Pujar avatar')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
