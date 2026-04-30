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
  isSelectionMode?: boolean;
  onToggleSelectionMode?: () => void;
}

export default function GalleryFilters({ 
  authors, 
  tags, 
  onFilterChange,
  isSelectionMode = false,
  onToggleSelectionMode
}: GalleryFiltersProps) {
  const [q, setQ] = useState("");
  const [author, setAuthor] = useState("");
  const [tag, setTag] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showMore, setShowMore] = useState(false);

  // Notifiquem els canvis cap amunt (pare) cada vegada que un filtre s'actualitza
  useEffect(() => {
    onFilterChange({ q, author, tag, dateFrom, dateTo });
  }, [q, author, tag, dateFrom, dateTo, onFilterChange]);

  const activeSecondaryFiltersCount = (tag ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Fila principal: Cerca, Autores (Pills), Botó Més filtres */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Filtre per Autora (Pills) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide w-full md:w-auto">
          <button
            onClick={() => setAuthor("")}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              author === ""
                ? "bg-stone-800 text-white"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            Totes
          </button>
          {authors.map((a) => (
            <button
              key={a}
              onClick={() => setAuthor(a)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                author === a
                  ? "bg-[#D4752A] text-white"
                  : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
              }`}
            >
              {a}
            </button>
          ))}
        </div>

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
            className="w-full h-10 pl-9 pr-3 rounded-full border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4752A] focus:border-[#D4752A] transition-shadow bg-white"
          />
        </div>

        {/* Botó Seleccionar/Cancel·lar */}
        <button
          onClick={onToggleSelectionMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors whitespace-nowrap ${
            isSelectionMode
              ? "border-stone-800 bg-stone-800 text-white"
              : "border-stone-200 text-stone-600 bg-white hover:bg-stone-50"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {isSelectionMode ? "Cancel·lar" : "Seleccionar"}
        </button>

        {/* Botó Més filtres */}
        <button
          onClick={() => setShowMore(!showMore)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors whitespace-nowrap ${
            showMore || activeSecondaryFiltersCount > 0
              ? "border-[#D4752A] text-[#D4752A] bg-orange-50"
              : "border-stone-200 text-stone-600 bg-white hover:bg-stone-50"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          Més filtres
          {activeSecondaryFiltersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#D4752A] text-white flex items-center justify-center text-xs ml-1">
              {activeSecondaryFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Filtres Secundaris */}
      {showMore && (
        <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-stone-100 animate-in slide-in-from-top-2 fade-in duration-200">
          
          {/* Filtre per Etiqueta */}
          <div className="w-full md:w-1/3">
            <label className="block text-xs font-medium text-stone-500 mb-1">Etiqueta</label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4752A] focus:border-[#D4752A] bg-stone-50 focus:bg-white appearance-none cursor-pointer"
            >
              <option value="">Totes les etiquetes</option>
              {tags.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden md:block w-px h-10 bg-stone-100 mx-2"></div>

          {/* Filtres de dates */}
          <div className="w-full md:w-2/3">
            <label className="block text-xs font-medium text-stone-500 mb-1">Data de creació</label>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 h-10 px-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4752A] focus:border-[#D4752A] text-stone-600 bg-stone-50 focus:bg-white cursor-pointer"
              />
              <span className="text-stone-400 text-sm font-medium">-</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 h-10 px-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4752A] focus:border-[#D4752A] text-stone-600 bg-stone-50 focus:bg-white cursor-pointer"
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
