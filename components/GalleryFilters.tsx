"use client";

import { useState, useEffect } from "react";

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Filters {
  q: string;
  author: string;
  tag: string;
  dateFrom: string;
  dateTo: string;
}

interface GalleryFiltersProps {
  authors: string[];
  tags: Tag[];
  onFilterChange: (filters: Filters) => void;
}

export default function GalleryFilters({ authors, tags, onFilterChange }: GalleryFiltersProps) {
  const [q, setQ] = useState("");
  const [author, setAuthor] = useState("");
  const [tag, setTag] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Notifiquem els canvis cap amunt (pare) cada vegada que un filtre s'actualitza
  useEffect(() => {
    onFilterChange({ q, author, tag, dateFrom, dateTo });
  }, [q, author, tag, dateFrom, dateTo, onFilterChange]);

  return (
    <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-stone-100 w-full">
      {/* Cerca lliure */}
      <div className="w-full md:flex-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-stone-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca obres, etiquetes..."
          className="w-full h-10 pl-9 pr-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow bg-stone-50 focus:bg-white"
        />
      </div>

      {/* Filtre per Autora */}
      <div className="w-full md:w-auto min-w-[140px]">
        <select
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="w-full h-10 px-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-stone-50 focus:bg-white appearance-none cursor-pointer"
        >
          <option value="">Totes les autores</option>
          {authors.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {/* Filtre per Etiqueta */}
      <div className="w-full md:w-auto min-w-[150px]">
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="w-full h-10 px-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-stone-50 focus:bg-white appearance-none cursor-pointer"
        >
          <option value="">Totes les etiquetes</option>
          {tags.map((t) => (
            <option key={t.id} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Separador visual opcional (només per escriptori) */}
      <div className="hidden md:block w-px h-6 bg-stone-200 mx-1"></div>

      {/* Filtres de dates */}
      <div className="flex w-full md:w-auto gap-2 items-center">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          title="Data d'inici"
          className="w-full md:w-32 h-10 px-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-stone-600 bg-stone-50 focus:bg-white cursor-pointer"
        />
        <span className="text-stone-400 text-sm font-medium">-</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          title="Data de fi"
          className="w-full md:w-32 h-10 px-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-stone-600 bg-stone-50 focus:bg-white cursor-pointer"
        />
      </div>
    </div>
  );
}
