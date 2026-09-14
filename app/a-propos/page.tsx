import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";

export const metadata = {
  title: "À propos — S-Ex-ducation",
};

export default function AProposPage() {
  return (
    <>
      <SiteHeader />
      <main className="wrap page-texte">
        <h1>À propos</h1>

        <p>
          S-Ex-ducation est né d&apos;un constat simple : le sexe demeure,
          malgré tout, un sujet tabou. Les jeunes sont en danger, ni
          conscient·e·s ni préparé·e·s, et c&apos;est trop souvent dans la
          douleur de l&apos;expérience qu&apos;ils et elles apprennent ce
          qu&apos;on ne leur a jamais expliqué.
        </p>

        <p>
          Notre mission : conseiller, informer et préparer les jeunes à
          vivre une sexualité saine, respectueuse et sans détour.
        </p>

        <h2>Ce qu&apos;on fait</h2>
        <ul>
          <li>Du contenu éducatif, direct et sans jugement</li>
          <li>Des formations pour mieux se connaître et se protéger</li>
          <li>
            Une communauté où les jeunes concerné·e·s peuvent poser leurs
            questions sans honte
          </li>
        </ul>

        <p>
          S-Ex-ducation s&apos;adresse à toutes les jeunes personnes,
          quel·le que soit leur genre, leur orientation ou leur parcours.
        </p>
      </main>
      <Footer />
    </>
  );
}
