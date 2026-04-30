'use client';

import Link from 'next/link';
import BatchUploadGrid from '@/components/BatchUploadGrid';

export default function BatchUploadPage() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-800 font-sans py-12 px-6">
      <div className="max-w-6xl mx-auto">
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
          <h1 className="text-3xl font-serif text-stone-900 mb-2">Pujada massiva</h1>
          <p className="text-stone-500 mb-8">
            Selecciona diverses imatges per pujar-les de cop i optimitzar el procés de digitalització.
          </p>

          <BatchUploadGrid />
        </div>
      </div>
    </main>
  );
}
