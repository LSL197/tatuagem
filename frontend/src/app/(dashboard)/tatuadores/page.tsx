"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { User } from "@/types";

export default function TatuadoresPage() {
  const [artists, setArtists] = useState<User[]>([]);

  useEffect(() => {
    api.get("/api/v1/users/?role=artist").then((r) => {
      const filtered = r.data.filter((u: User) => u.role === "artist");
      setArtists(filtered);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Tatuadores</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {artists.map((artist) => (
          <div key={artist.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700 space-y-3">
            <div className="flex items-center gap-3">
              {artist.avatar_url ? (
                <img src={artist.avatar_url} alt={artist.name} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                  {artist.name[0]}
                </div>
              )}
              <div>
                <p className="text-white font-semibold">{artist.name}</p>
                <p className="text-gray-400 text-sm">{artist.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {(artist.styles ?? []).map((s) => (
                <span key={s} className="px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 text-xs">{s}</span>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-0.5 rounded-full ${artist.is_active ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
                {artist.is_active ? "Ativo" : "Inativo"}
              </span>
              <Link href={`/tatuadores/${artist.id}`} className="text-indigo-400 text-sm hover:underline">
                Editar
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
