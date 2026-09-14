import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import ContactForm from "../components/ContactForm";

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

        <a
          href="https://wa.me/50955108873"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-whatsapp"
        >
          Écrire sur WhatsApp
        </a>

        <ContactForm />

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
