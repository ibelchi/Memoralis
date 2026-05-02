"use client";

import { useState } from "react";

interface AuthorAvatarProps {
  name: string;
  size?: string;
  className?: string;
}

export default function AuthorAvatar({ name, size = "w-8 h-8", className = "" }: AuthorAvatarProps) {
  const [error, setError] = useState(false);

  // Generar slug: minúscules, sense accents, sense espais
  const authorSlug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");

  const imageUrl = `/avatars/${authorSlug}.jpg`;

  // Lògica de colors de fons (fallback)
  const getAuthorColor = (name: string) => {
    const l = name.toLowerCase();
    if (l.includes("gala")) return "bg-rose-100 text-rose-700";
    if (l.includes("júlia") || l.includes("julia")) return "bg-sky-100 text-sky-700";
    return "bg-stone-200 text-stone-700";
  };

  // Determinar mida del text de la inicial segons el tamany de l'avatar
  const textClass = size.includes("w-10") ? "text-sm" : "text-[10px]";

  if (!error) {
    return (
      <img
        src={imageUrl}
        alt={name}
        onError={() => setError(true)}
        className={`${size} rounded-full object-cover border border-stone-100 shadow-sm ${className}`}
      />
    );
  }

  return (
    <span 
      className={`${size} rounded-full flex items-center justify-center ${textClass} uppercase font-bold ${getAuthorColor(name)} ${className}`}
      title={name}
    >
      {name.charAt(0)}
    </span>
  );
}
