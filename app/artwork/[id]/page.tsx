import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ArtworkPage({
  params,
}: {
  params: { id: string };
}) {
  const artwork = await prisma.artwork.findUnique({
    where: { id: params.id },
    include: {
      images: {
        orderBy: { order: "asc" },
      },
      audios: true,
      tags: true,
    },
  });

  if (!artwork) {
    notFound();
  }

  const formattedDate = new Date(artwork.artDate).toLocaleDateString("ca-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const mainImage = artwork.images[0];

  return (
    <main className="min-h-screen bg-stone-50 text-stone-800 font-sans pb-20">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Botó Tornar */}
        <Link
          href="/"
          className="inline-flex items-center text-stone-500 hover:text-amber-700 transition-colors mb-8 font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Tornar a la galeria
        </Link>

        <article className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
          {/* Imatge Principal */}
          <div className="w-full bg-stone-100 flex items-center justify-center overflow-hidden">
            {mainImage ? (
              <img
                src={`/api/media/${mainImage.filePath}`}
                alt={artwork.title}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            ) : (
              <div className="py-32 flex flex-col items-center justify-center text-stone-400">
                <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>Aquesta obra no té imatge principal</p>
              </div>
            )}
          </div>

          <div className="p-8 md:p-12">
            {/* Capçalera: Títol, Autora i Data */}
            <header className="mb-8 border-b border-stone-100 pb-8">
              <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-4">
                <h1 className="text-4xl font-serif text-stone-900 leading-tight">
                  {artwork.title}
                </h1>
                <time
                  dateTime={artwork.artDate.toISOString()}
                  className="text-stone-500 font-medium whitespace-nowrap"
                >
                  {formattedDate}
                </time>
              </div>

              <div className="flex items-center text-lg text-stone-600">
                <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold mr-3 uppercase">
                  {artwork.author.charAt(0)}
                </span>
                <span>Obra de <span className="font-semibold text-stone-800">{artwork.author}</span></span>
              </div>
            </header>

            {/* Descripció (si en té) */}
            {artwork.description && (
              <section className="mb-10">
                <h2 className="text-sm uppercase tracking-widest text-stone-400 font-semibold mb-3">La història</h2>
                <p className="text-lg text-stone-700 leading-relaxed whitespace-pre-wrap">
                  {artwork.description}
                </p>
              </section>
            )}

            {/* Tags (si en té) */}
            {artwork.tags.length > 0 && (
              <section className="mb-10">
                <h2 className="text-sm uppercase tracking-widest text-stone-400 font-semibold mb-3">Etiquetes</h2>
                <div className="flex flex-wrap gap-2">
                  {artwork.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: `${tag.color}20`, // Afegim opacitat al color de fons
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Àudios (La veu dels nens) */}
            {artwork.audios.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M19.364 4.364a1 1 0 0 1 1.414 0c1.758 1.758 2.75 4.14 2.75 6.636s-.992 4.878-2.75 6.636a1 1 0 0 1-1.414-1.414A7.472 7.472 0 0 0 21.5 11c0-2.071-.84-3.946-2.136-5.222a1 1 0 0 1 0-1.414Zm-3.535 3.535a1 1 0 0 1 1.414 0 4.484 4.484 0 0 1 1.257 3.101c0 1.236-.5 2.355-1.257 3.101a1 1 0 0 1-1.414-1.414 2.484 2.484 0 0 0 .757-1.687c0-.69-.28-1.315-.757-1.687a1 1 0 0 1 0-1.414Zm-4.887-4.141A1 1 0 0 1 12 4.5v15a1 1 0 0 1-1.555.832l-5.1-3.3A2.001 2.001 0 0 0 4.256 16H2.5A1.5 1.5 0 0 1 1 14.5v-5A1.5 1.5 0 0 1 2.5 8h1.756c.404 0 .8-.124 1.089-.332l5.1-3.3a1 1 0 0 1 1.011-.11Z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-medium text-stone-800">La seva explicació</h2>
                </div>
                
                <div className="space-y-6">
                  {artwork.audios.map((audio, index) => (
                    <div key={audio.id} className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                      <audio
                        controls
                        className="w-full mb-3"
                        src={`/api/media/${audio.filePath}`}
                        preload="metadata"
                      >
                        El teu navegador no suporta l'element d'àudio.
                      </audio>
                      {audio.description && (
                        <p className="text-stone-600 text-sm italic">
                          "{audio.description}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}
