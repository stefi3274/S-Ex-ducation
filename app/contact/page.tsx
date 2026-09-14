import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";

export const metadata = {
  title: "Contact — S-Ex-ducation",
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="wrap page-texte">
        <h1>Contact</h1>
        <p>
          Une question, une idée, envie de devenir partenaire ou
          sponsor ? Écris-nous.
        </p>

        <div className="contact-block">
          <p>
            <strong>Email</strong>
            <br />
            <a href="mailto:stefimerv@gmail.com">stefimerv@gmail.com</a>
          </p>
          <p>
            <strong>Téléphone</strong>
            <br />
            <a href="tel:+50955108873">+509 5510-8873</a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
