import { User } from "@/types";
import Link from "next/link";

async function getArtists(): Promise<User[]> {
  try {
    const base = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
    const res = await fetch(`${base}/api/v1/artists/`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function BookPage() {
  const artists = await getArtists();

  return (
    <main className="min-h-screen bg-gray-950">
      <header className="px-4 py-6 text-center border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">Nossos Tatuadores</h1>
        <p className="text-gray-400 text-sm mt-1">Escolha seu artista e agende sua sessão</p>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {artists.map((artist) => (
          <Link key={artist.id} href={`/book/${artist.slug}`} className="block">
            <div className="bg-gray-900 rounded-2xl p-4 flex items-center gap-4 border border-gray-800 hover:border-indigo-500 transition">
              {artist.avatar_url ? (
                <img
                  src={artist.avatar_url}
                  alt={artist.name}
                  className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-indigo-700 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {artist.name[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{artist.name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(artist.styles ?? []).slice(0, 3).map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-xs">{s}</span>
                  ))}
                </div>
              </div>
              <span className="text-indigo-400 text-sm flex-shrink-0">Ver →</span>
            </div>
          </Link>
        ))}

        {artists.length === 0 && (
          <p className="text-center text-gray-400 py-12">Nenhum tatuador disponível no momento</p>
        )}
      </div>
    </main>
  );
}
