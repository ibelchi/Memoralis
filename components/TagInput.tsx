"use client";

import { useState, useEffect, useRef } from "react";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagInputProps {
  selectedTags: Tag[];
  onChange: (tags: Tag[]) => void;
}

export default function TagInput({ selectedTags, onChange }: TagInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Carrega tots els tags existents
  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then(setAllTags)
      .catch(console.error);
  }, []);

  // Filtra suggestions segons l'input
  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }
    const query = input.trim().toLowerCase();
    const filtered = allTags.filter(
      (t) =>
        t.name.includes(query) &&
        !selectedTags.find((s) => s.id === t.id)
    );
    setSuggestions(filtered);
    setShowSuggestions(true);
  }, [input, allTags, selectedTags]);

  // Tanca suggestions en clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = (tag: Tag) => {
    onChange([...selectedTags, tag]);
    setInput("");
    setShowSuggestions(false);
  };

  const createAndAddTag = async () => {
    const name = input.trim().toLowerCase();
    if (!name) return;
    // Evita duplicats ja seleccionats
    if (selectedTags.find((t) => t.name === name)) {
      setInput("");
      return;
    }
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const newTag = await res.json();
      setAllTags((prev) => [...prev, newTag]);
      addTag(newTag);
    } catch (error) {
      console.error("Error creating tag:", error);
    }
  };

  const removeTag = (id: string) => {
    onChange(selectedTags.filter((t) => t.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Si hi ha una suggestion exacta, l'afegeix; si no, crea tag nou
      const exact = suggestions.find((s) => s.name === input.trim().toLowerCase());
      if (exact) addTag(exact);
      else createAndAddTag();
    }
    if (e.key === "Escape") setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      {/* Tags seleccionats */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-sm text-white"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
            <button
              type="button"
              onClick={() => removeTag(tag.id)}
              className="hover:opacity-70 leading-none"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Input */}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => input && setShowSuggestions(true)}
        placeholder="Afegeix etiquetes..."
        className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />

      {/* Dropdown de suggestions */}
      {showSuggestions && (suggestions.length > 0 || input.trim()) && (
        <ul className="absolute z-10 w-full bg-white border rounded shadow mt-1 max-h-48 overflow-y-auto">
          {suggestions.map((tag) => (
            <li
              key={tag.id}
              onClick={() => addTag(tag)}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50 flex items-center gap-2"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
            </li>
          ))}
          {/* Opció de crear nou si no hi ha coincidència exacta */}
          {input.trim() &&
            !suggestions.find((s) => s.name === input.trim().toLowerCase()) && (
              <li
                onClick={createAndAddTag}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-green-50 text-green-700 border-t"
              >
                + Crea "{input.trim().toLowerCase()}"
              </li>
            )}
        </ul>
      )}
    </div>
  );
}
