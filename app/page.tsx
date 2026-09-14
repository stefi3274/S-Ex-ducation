import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase-server";
import { ENTREPRISE } from "@/lib/config";
import SiteHeader from "./components/SiteHeader";

export const dynamic = "force-dynamic";

type PostAvecPremiereSlide = {
  id: string;
  titre: string;
  slug: string;
  created_at: string;
  slides: { image_url: string | null }[];
};

async function getPosts() {
  const supabase = getSupabaseServer();

  const { data } = await supabase
    .from("posts")
    .select("id, titre, slug, created_at, slides(image_url, position)")
    .eq("entreprise", ENTREPRISE)
    .eq("statut", "publie")
    .order("created_at", { ascending: false });

  return (data as PostAvecPremiereSlide[]) ?? [];
}

export default async function Home() {
  const posts = await getPosts();

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <h1>Derniers posts</h1>
        <p>Éducation sexuelle et relationnelle, sans détour.</p>

        {posts.length === 0 && (
          <p className="empty-state">Aucun post publié pour l&apos;instant.</p>
        )}

        <div className="posts-grid">
          {posts.map((post) => {
            const intro = post.slides?.[0];
            return (
              <Link
                key={post.id}
                href={`/post/${post.slug}`}
                className="post-card"
              >
                <div className="thumb">
                  {intro?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={intro.image_url} alt={post.titre} />
                  ) : (
                    <div className="thumb-fallback">{post.titre}</div>
                  )}
                </div>
                <div className="card-body">
                  <h3>{post.titre}</h3>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
