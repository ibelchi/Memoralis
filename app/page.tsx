import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  // 1. Obtenim les obres directament via Prisma (Server Component)
  const artworks = await prisma.artwork.findMany({
    orderBy: {
      artDate: "desc",
    },
    include: {
      images: {
        orderBy: { order: "asc" },
        take: 1, // Només necessitem la primera imatge per a la portada
      },
      _count: {
        select: { audios: true }, // Només volem saber si té àudios
      },
    },
  });

  return (
    <main className="min-h-screen bg-stone-50 text-stone-800 font-sans">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Capçalera i botó d'afegir */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-serif font-light text-stone-900 tracking-tight">
              Memoralis
            </h1>
            <p className="text-stone-500 mt-2 text-lg">
              L'arxiu dels nostres petits grans records.
            </p>
          </div>
          <Link
            href="/upload"
            className="inline-flex items-center justify-center px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-full font-medium transition-colors shadow-sm hover:shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Afegir obra
          </Link>
        </header>

        {/* Galeria Grid */}
        {artworks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-stone-100">
            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-stone-700">Encara no hi ha cap record</h3>
            <p className="text-stone-500 mt-2">Comença afegint la primera obra d'art.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {artworks.map((artwork) => {
              const firstImage = artwork.images[0];
              const hasAudio = artwork._count.audios > 0;

              // Format de data en català
              const formattedDate = new Date(artwork.artDate).toLocaleDateString("ca-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });

              return (
                <Link
                  key={artwork.id}
                  href={`/artwork/${artwork.id}`}
                  className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-100 hover:-translate-y-1"
                >
                  {/* Imatge de portada */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                    {firstImage ? (
                      <img
                        src={`/api/media/${firstImage.filePath}`}
                        alt={artwork.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Informació de la targeta */}
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-xl font-medium text-stone-800 line-clamp-1 group-hover:text-amber-700 transition-colors">
                        {artwork.title}
                      </h2>
                      {hasAudio && (
                        <div className="flex-shrink-0 ml-3 bg-amber-100 text-amber-700 p-1.5 rounded-full" title="Té àudio associat">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M19.364 4.364a1 1 0 0 1 1.414 0c1.758 1.758 2.75 4.14 2.75 6.636s-.992 4.878-2.75 6.636a1 1 0 0 1-1.414-1.414A7.472 7.472 0 0 0 21.5 11c0-2.071-.84-3.946-2.136-5.222a1 1 0 0 1 0-1.414Zm-3.535 3.535a1 1 0 0 1 1.414 0 4.484 4.484 0 0 1 1.257 3.101c0 1.236-.5 2.355-1.257 3.101a1 1 0 0 1-1.414-1.414 2.484 2.484 0 0 0 .757-1.687c0-.69-.28-1.315-.757-1.687a1 1 0 0 1 0-1.414Zm-4.887-4.141A1 1 0 0 1 12 4.5v15a1 1 0 0 1-1.555.832l-5.1-3.3A2.001 2.001 0 0 0 4.256 16H2.5A1.5 1.5 0 0 1 1 14.5v-5A1.5 1.5 0 0 1 2.5 8h1.756c.404 0 .8-.124 1.089-.332l5.1-3.3a1 1 0 0 1 1.011-.11Z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-auto pt-4 flex items-center justify-between text-sm text-stone-500 font-medium border-t border-stone-50">
                      <div className="flex items-center">
                        <span className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center text-xs text-stone-600 mr-2 uppercase">
                          {artwork.author.charAt(0)}
                        </span>
                        {artwork.author}
                      </div>
                      <time dateTime={artwork.artDate.toISOString()}>
                        {formattedDate}
                      </time>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
