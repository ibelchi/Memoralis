'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BasicInfoStep from '@/components/upload/BasicInfoStep';
import MediaUploadStep from '@/components/upload/MediaUploadStep';

export default function UploadPage() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [artworkId, setArtworkId] = useState<string | null>(null);
  const [artworkTitle, setArtworkTitle] = useState('');

  const handleBasicInfoSuccess = (id: string, title: string) => {
    setArtworkId(id);
    setArtworkTitle(title);
    setStep(2);
  };

  const handleMediaComplete = () => {
    if (artworkId) {
      router.push(`/artwork/${artworkId}`);
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Afegir múltiples obres
              </Link>
            )}
          </div>

          {step === 1 && <BasicInfoStep onSuccess={handleBasicInfoSuccess} />}
          
          {step === 2 && artworkId && (
            <MediaUploadStep 
              artworkId={artworkId} 
              artworkTitle={artworkTitle} 
              onComplete={handleMediaComplete} 
            />
          )}
        </div>
      </div>
    </main>
  );
}
