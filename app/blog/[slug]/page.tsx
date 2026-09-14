import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { ENTREPRISE, couleurCategorie, nomCategorie } from "@/lib/config";
import SiteHeader from "../../components/SiteHeader";
import Footer from "../../components/Footer";
import ShareButtons from "../../components/ShareButtons";
import NewsletterForm from "../../components/NewsletterForm";

export const dynamic = "force-dynamic";

type Article = {
  id: string;
  titre: string;
  sous_titre: string | null;
  slug: string;
  extrait: string | null;
  contenu: string;
  image_couverture_url: string | null;
  categorie: string | null;
  auteur_nom: string | null;
  created_at: string;
};

async function getArticle(slug: string) {
  const supabase = getSupabaseServer();

  const { data } = await supabase
    .from("blogs")
    .select(
      "id, titre, sous_titre, slug, extrait, contenu, image_couverture_url, categorie, auteur_nom, created_at"
    )
    .eq("entreprise", ENTREPRISE)
    .eq("slug", slug)
    .eq("statut", "publie")
    .maybeSingle();

  return data as Article | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getArticle(params.slug);

  if (!article) notFound();

  const paragraphes = article.contenu
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      <SiteHeader />
      <main className="wrap page-texte article-page">
        <a href="/blog" className="back-link">
          ← Retour au blog
        </a>

        {nomCategorie(article.categorie) && (
          <span
            className="badge-categorie"
            style={{ background: couleurCategorie(article.categorie) }}
          >
            {nomCategorie(article.categorie)}
          </span>
        )}

        <h1>{article.titre}</h1>
        {article.sous_titre && (
          <p className="blog-sous-titre">{article.sous_titre}</p>
        )}
        <p className="blog-meta">
          {article.auteur_nom && `${article.auteur_nom} · `}
          {formatDate(article.created_at)}
        </p>

        {article.image_couverture_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.image_couverture_url}
            alt={article.titre}
            className="article-cover"
          />
        )}

        <div className="article-corps">
          {paragraphes.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <ShareButtons titre={article.titre} />
        <NewsletterForm />
      </main>
      <Footer />
    </>
  );
}
