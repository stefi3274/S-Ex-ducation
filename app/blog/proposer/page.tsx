import SiteHeader from "../../components/SiteHeader";
import Footer from "../../components/Footer";
import BlogSubmitForm from "../../components/BlogSubmitForm";

export const metadata = {
  title: "Proposer un article — S-Ex-ducation",
};

export default function ProposerArticlePage() {
  return (
    <>
      <SiteHeader />
      <main className="wrap page-texte">
        <h1>Proposer un article</h1>
        <p>
          Tu as quelque chose à dire sur le sexe, les relations ou la
          société ? Envoie ton texte, on le relit avant publication et on te
          répond, que ce soit accepté, à revoir ou refusé.
        </p>
        <BlogSubmitForm />
      </main>
      <Footer />
    </>
  );
}
