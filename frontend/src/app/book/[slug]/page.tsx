import { User } from "@/types";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getArtist(slug: string): Promise<User | null> {
  try {
    const base = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
    const res = await fetch(`${base}/api/v1/artists/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ArtistProfilePage({ params }: { params: { slug: string } }) {
  const artist = await getArtist(params.slug);
  if (!artist) notFound();

  const theme = (artist.theme_json ?? {}) as Record<string, string>;
  const primaryColor = theme.primary ?? "#6366f1";
  const bgColor = theme.bg ?? "#030712";
  const fontFamily = theme.font ?? "Inter, sans-serif";

  const cssVars = `
    :root {
      --theme-primary: ${primaryColor};
      --theme-bg: ${bgColor};
      --theme-font: ${fontFamily};
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      <main className="min-h-screen" style={{ backgroundColor: bgColor, fontFamily }}>
        {artist.banner_url && (
          <div className="relative h-48 md:h-64 overflow-hidden">
            <img src={artist.banner_url} alt="banner" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        )}

        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center gap-4">
            {artist.avatar_url ? (
              <img src={artist.avatar_url} alt={artist.name} className="w-20 h-20 rounded-full object-cover border-2 border-white" />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold border-2 border-white" style={{ backgroundColor: primaryColor }}>
                {artist.name[0]}
              </div>
            )}
            <div>
              <h1 className="text-white text-2xl font-bold">{artist.name}</h1>
              <div className="flex flex-wrap gap-1 mt-1">
                {(artist.styles ?? []).map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded-full text-xs text-white/80" style={{ backgroundColor: primaryColor + "40", border: `1px solid ${primaryColor}` }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {artist.bio && (
            <p className="text-gray-300 text-sm leading-relaxed">{artist.bio}</p>
          )}

          {artist.portfolio_items.length > 0 && (
            <div>
              <h2 className="text-white font-semibold mb-3">Portfólio</h2>
              <div className="grid grid-cols-3 gap-2">
                {artist.portfolio_items.sort((a, b) => a.order_index - b.order_index).map((item) => (
                  <img
                    key={item.id}
                    src={item.image_url}
                    alt={item.category ?? ""}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}

          {artist.social_links && Object.keys(artist.social_links).length > 0 && (
            <div className="flex gap-3">
              {Object.entries(artist.social_links).map(([platform, url]) => url && (
                <a key={platform} href={String(url)} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-white capitalize transition">
                  {platform}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <Link
            href={`/book/${artist.slug}/schedule`}
            className="block w-full max-w-lg mx-auto py-4 rounded-2xl text-center text-white font-bold text-lg transition hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            Agendar Sessão
          </Link>
        </div>
        <div className="h-24" />
      </main>
    </>
  );
}
