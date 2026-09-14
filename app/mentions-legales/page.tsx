import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";

export const metadata = {
  title: "Mentions légales — S-Ex-ducation",
};

export default function MentionsLegalesPage() {
  return (
    <>
      <SiteHeader />
      <main className="wrap page-texte">
        <h1>Mentions légales</h1>

        <h2>Éditeur du site</h2>
        <p>
          S-Ex-ducation est un projet porté par Stevenson Mervil (SteFi
          Services), basé à Port-au-Prince, Haïti.
          <br />
          Contact : <a href="mailto:stefimerv@gmail.com">stefimerv@gmail.com</a>
          {" · "}
          <a href="tel:+50955108873">+509 5510-8873</a>
        </p>

        <h2>Hébergement</h2>
        <p>
          Ce site est hébergé par Vercel Inc. Les données (contenus,
          comptes admin) sont stockées via Supabase.
        </p>

        <h2>Nature du contenu</h2>
        <p>
          Le contenu publié sur S-Ex-ducation a une visée éducative et
          informative sur la sexualité et les relations. Il s&apos;adresse
          aux jeunes et jeunes adultes et ne contient pas d&apos;image ou de
          description à caractère explicite. Ce contenu ne remplace en
          aucun cas un avis médical, psychologique ou professionnel : pour
          toute question de santé, consulte un·e professionnel·le de
          santé.
        </p>

        <h2>Données personnelles</h2>
        <p>
          Les informations transmises via la page Contact (email,
          message) servent uniquement à répondre à la demande de la
          personne qui les envoie. Elles ne sont ni revendues, ni
          partagées avec des tiers.
        </p>

        <h2>Propriété</h2>
        <p>
          Les textes et visuels publiés sur ce site sont la propriété de
          S-Ex-ducation, sauf mention contraire (contenus sponsorisés,
          logos partenaires).
        </p>
      </main>
      <Footer />
    </>
  );
}
