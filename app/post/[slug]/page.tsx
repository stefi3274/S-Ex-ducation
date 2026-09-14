import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { ENTREPRISE } from "@/lib/config";
import SiteHeader from "../../components/SiteHeader";
import Footer from "../../components/Footer";

export const dynamic = "force-dynamic";

type Slide = {
  id: string;
  position: number;
  titre: string | null;
  texte: string | null;
  image_url: string | null;
};

async function getPost(slug: string) {
  const supabase = getSupabaseServer();

  const { data: post } = await supabase
    .from("posts")
    .select(
      "id, titre, slug, statut, sponsor_nom, sponsor_logo_url, sponsor_lien"
    )
    .eq("entreprise", ENTREPRISE)
    .eq("slug", slug)
    .eq("statut", "publie")
    .maybeSingle();

  if (!post) return null;

  const { data: slides } = await supabase
    .from("slides")
    .select("id, position, titre, texte, image_url")
    .eq("post_id", post.id)
    .order("position", { ascending: true });

  return { post, slides: (slides as Slide[]) ?? [] };
}

function slideClass(position: number) {
  if (position === 0) return "slide";
  if (position === 5) return "slide noir";
  return position % 2 === 0 ? "slide turquoise" : "slide";
}

export default async function PostPage({
  params,
}: {
  params: { slug: string };
}) {
  const data = await getPost(params.slug);

  if (!data) notFound();

  const { post, slides } = data;

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <a href="/" className="back-link">
          ← Retour
        </a>
        <h1>{post.titre}</h1>

        <div className="carousel">
          {slides.map((slide) => (
            <div key={slide.id} className={slideClass(slide.position)}>
              {slide.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={slide.image_url}
                  alt={slide.titre ?? post.titre}
                  className="slide-bg"
                />
              )}
              <div className="slide-overlay">
                {slide.titre && <h2>{slide.titre}</h2>}
                {slide.texte && <p>{slide.texte}</p>}
                {slide.position === 5 && (
                  <p style={{ marginTop: 16, fontWeight: 600 }}>
                    Suis S-Ex-ducation pour plus de contenu comme celui-ci.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="carousel-dots">
          {slides.map((slide) => (
            <span key={slide.id} />
          ))}
        </div>

        {post.sponsor_nom && (
          <a
            className="sponsor-block"
            href={post.sponsor_lien || undefined}
            target={post.sponsor_lien ? "_blank" : undefined}
            rel={post.sponsor_lien ? "noopener noreferrer" : undefined}
          >
            <span className="sponsor-label">Sponsorisé par</span>
            {post.sponsor_logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.sponsor_logo_url}
                alt={post.sponsor_nom}
                className="sponsor-logo"
              />
            )}
            <span className="sponsor-nom">{post.sponsor_nom}</span>
          </a>
        )}
      </main>
      <Footer />
    </>
  );
}
