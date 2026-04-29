import Link from "next/link";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface ArtworkCardProps {
  id: string;
  title: string;
  author: string;
  artDate: Date | string;
  imageUrl?: string;
  hasAudio: boolean;
  tags: Tag[];
}

export default function ArtworkCard({
  id,
  title,
  author,
  artDate,
  imageUrl,
  hasAudio,
  tags,
}: ArtworkCardProps) {
  // Convertim a objecte Date si és un string (passa quan fem fetch des del client)
  const dateObj = typeof artDate === "string" ? new Date(artDate) : artDate;

  // Format de data en català
  const formattedDate = dateObj.toLocaleDateString("ca-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Link
      href={`/artwork/${id}`}
      className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-100 hover:-translate-y-1"
    >
      {/* Imatge de portada */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Informació de la targeta */}
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-xl font-medium text-stone-800 line-clamp-1 group-hover:text-amber-700 transition-colors">
            {title}
          </h2>
          {hasAudio && (
            <div
              className="flex-shrink-0 ml-3 bg-amber-100 text-amber-700 p-1.5 rounded-full"
              title="Té àudio associat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path
                  fillRule="evenodd"
                  d="M19.364 4.364a1 1 0 0 1 1.414 0c1.758 1.758 2.75 4.14 2.75 6.636s-.992 4.878-2.75 6.636a1 1 0 0 1-1.414-1.414A7.472 7.472 0 0 0 21.5 11c0-2.071-.84-3.946-2.136-5.222a1 1 0 0 1 0-1.414Zm-3.535 3.535a1 1 0 0 1 1.414 0 4.484 4.484 0 0 1 1.257 3.101c0 1.236-.5 2.355-1.257 3.101a1 1 0 0 1-1.414-1.414 2.484 2.484 0 0 0 .757-1.687c0-.69-.28-1.315-.757-1.687a1 1 0 0 1 0-1.414Zm-4.887-4.141A1 1 0 0 1 12 4.5v15a1 1 0 0 1-1.555.832l-5.1-3.3A2.001 2.001 0 0 0 4.256 16H2.5A1.5 1.5 0 0 1 1 14.5v-5A1.5 1.5 0 0 1 2.5 8h1.756c.404 0 .8-.124 1.089-.332l5.1-3.3a1 1 0 0 1 1.011-.11Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>


        <div className="mt-auto pt-4 flex items-center justify-between text-sm text-stone-500 font-medium border-t border-stone-50">
          <div className="flex items-center">
            <span className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center text-xs text-stone-600 mr-2 uppercase">
              {author.charAt(0)}
            </span>
            {author}
          </div>
          <time dateTime={dateObj.toISOString()}>{formattedDate}</time>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-0.5 rounded-full text-xs text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

