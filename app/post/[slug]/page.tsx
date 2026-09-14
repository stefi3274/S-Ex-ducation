import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase-server";
import { ENTREPRISE, couleurCategorie, nomCategorie } from "@/lib/config";
import { texteAvecAccents } from "@/lib/texte";
import SiteHeader from "../../components/SiteHeader";
import Footer from "../../components/Footer";
import ShareButtons from "../../components/ShareButtons";
import NewsletterForm from "../../components/NewsletterForm";

export const dynamic = "force-dynamic";

type Slide = {
  id: string;
  position: number;
  titre: string | null;
  texte: string | null;
  image_url: string | null;
};

type Article = {
  titre: string;
  slug: string;
};

async function getPost(slug: string) {
  const supabase = getSupabaseServer();

  const { data: post } = await supabase
    .from("posts")
    .select(
      "id, titre, slug, statut, categorie, article_id, sponsor_nom, sponsor_logo_url, sponsor_lien"
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

  let article: Article | null = null;
  if (post.article_id) {
    const { data: articleData } = await supabase
      .from("blogs")
      .select("titre, slug")
      .eq("id", post.article_id)
      .eq("statut", "publie")
      .maybeSingle();
    article = (articleData as Article) ?? null;
  }

  return { post, slides: (slides as Slide[]) ?? [], article };
}

export default async function PostPage({
  params,
}: {
  params: { slug: string };
}) {
  const data = await getPost(params.slug);

  if (!data) notFound();

  const { post, slides, article } = data;
  const couleur = couleurCategorie(post.categorie);
  const categorie = nomCategorie(post.categorie);
  const derniereePosition = slides.length - 1;

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <a href="/" className="back-link">
          ← Retour
        </a>
        {categorie && (
          <span
            className="badge-categorie"
            style={{ background: couleur }}
          >
            {categorie}
          </span>
        )}
        <h1>{post.titre}</h1>

        <div className="carousel">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="slide"
              style={{ background: couleur }}
            >
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
                {slide.texte && <p>{texteAvecAccents(slide.texte)}</p>}
                {index === derniereePosition && slides.length > 1 && (
                  <p style={{ marginTop: 16, fontWeight: 600 }}>
                    {article
                      ? "Lis l'article complet sur le site. Lien en bio."
                      : "Suis S-Ex-ducation pour plus de contenu comme celui-ci."}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {slides.length > 1 && (
          <div className="carousel-dots">
            {slides.map((slide) => (
              <span key={slide.id} />
            ))}
          </div>
        )}

        <ShareButtons titre={post.titre} />

        {article && (
          <Link href={`/blog/${article.slug}`} className="sponsor-block">
            <span className="sponsor-label">Article complet</span>
            <span className="sponsor-nom">{article.titre}</span>
          </Link>
        )}

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

        <NewsletterForm />
      </main>
      <Footer />
    </>
  );
}
