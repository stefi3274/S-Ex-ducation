import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase-server";
import { ENTREPRISE, couleurCategorie, nomCategorie } from "@/lib/config";
import SiteHeader from "./components/SiteHeader";
import Footer from "./components/Footer";
import NewsletterForm from "./components/NewsletterForm";

export const dynamic = "force-dynamic";

type PostAvecPremiereSlide = {
  id: string;
  titre: string;
  slug: string;
  created_at: string;
  categorie: string | null;
  slides: { image_url: string | null }[];
};

async function getPosts() {
  const supabase = getSupabaseServer();

  const { data } = await supabase
    .from("posts")
    .select(
      "id, titre, slug, created_at, categorie, slides(image_url, position)"
    )
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

      <section className="hero">
        <div className="hero-blob hero-blob-rose" aria-hidden="true" />
        <div className="hero-blob hero-blob-turquoise" aria-hidden="true" />
        <span className="hero-dot hero-dot-1" aria-hidden="true" />
        <span className="hero-dot hero-dot-2" aria-hidden="true" />
        <span className="hero-dot hero-dot-3" aria-hidden="true" />

        <div className="wrap hero-content">
          <h1>
            Bienvenue,
            <br />
            <em>sans tabou.</em>
          </h1>
          <p>
            Des réponses claires sur le sexe et les relations, pour les
            jeunes qui n&apos;osent pas demander.
          </p>
          <a href="#posts" className="btn btn-primary">
            Voir les derniers posts
          </a>
        </div>
      </section>

      <div className="wrap">
        <NewsletterForm />
      </div>

      <main className="wrap" id="posts">
        <h2>Derniers posts</h2>

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
                <div
                  className="thumb"
                  style={{ background: couleurCategorie(post.categorie) }}
                >
                  {intro?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={intro.image_url} alt={post.titre} />
                  ) : (
                    <div className="thumb-fallback">{post.titre}</div>
                  )}
                </div>
                <div className="card-body">
                  {nomCategorie(post.categorie) && (
                    <span
                      className="badge-categorie"
                      style={{ background: couleurCategorie(post.categorie) }}
                    >
                      {nomCategorie(post.categorie)}
                    </span>
                  )}
                  <h3>{post.titre}</h3>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
