import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase-server";
import { ENTREPRISE, couleurCategorie, nomCategorie } from "@/lib/config";
import SiteHeader from "./components/SiteHeader";
import Footer from "./components/Footer";
import NewsletterForm from "./components/NewsletterForm";

export const dynamic = "force-dynamic";

type Article = {
  id: string;
  titre: string;
  sous_titre: string | null;
  slug: string;
  extrait: string | null;
  image_couverture_url: string | null;
  categorie: string | null;
  auteur_nom: string | null;
  created_at: string;
};

async function getArticles() {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from("blogs")
    .select(
      "id, titre, sous_titre, slug, extrait, image_couverture_url, categorie, auteur_nom, created_at"
    )
    .eq("entreprise", ENTREPRISE)
    .eq("statut", "publie")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur chargement articles publiés :", error.message);
  }

  return (data as Article[]) ?? [];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function Home() {
  const articles = await getArticles();

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
        </div>
      </section>

      <main className="wrap" id="articles">
        <div className="section-titre-ligne">
          <h2>Derniers articles</h2>
          <Link href="/blog" className="btn btn-secondary">
            Voir tous les articles
          </Link>
        </div>

        {articles.length === 0 && (
          <p className="empty-state">Aucun article publié pour l&apos;instant.</p>
        )}

        <div className="blog-liste">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/blog/${article.slug}`}
              className="blog-carte"
            >
              <div
                className="blog-carte-image"
                style={{ background: couleurCategorie(article.categorie) }}
              >
                {article.image_couverture_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={article.image_couverture_url}
                    alt={article.titre}
                  />
                )}
              </div>
              <div className="blog-carte-texte">
                {nomCategorie(article.categorie) && (
                  <span
                    className="badge-categorie"
                    style={{ background: couleurCategorie(article.categorie) }}
                  >
                    {nomCategorie(article.categorie)}
                  </span>
                )}
                <h2>{article.titre}</h2>
                {article.sous_titre && (
                  <p className="blog-sous-titre">{article.sous_titre}</p>
                )}
                {article.extrait && <p>{article.extrait}</p>}
                <span className="blog-meta">
                  {article.auteur_nom && `${article.auteur_nom} · `}
                  {formatDate(article.created_at)}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <NewsletterForm />
      </main>
      <Footer />
    </>
  );
}
