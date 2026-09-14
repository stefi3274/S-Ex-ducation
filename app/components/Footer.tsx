import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-inner">
        <div>
          <strong>S-Ex-ducation</strong>
          <p>
            <a href="mailto:stefimerv@gmail.com">stefimerv@gmail.com</a>
            {" · "}
            <a href="tel:+50955108873">+509 5510-8873</a>
          </p>
        </div>
        <nav className="footer-nav">
          <Link href="/a-propos">À propos</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/mentions-legales">Mentions légales</Link>
          <span className="credit">Créé par SteFi Services</span>
        </nav>
      </div>
    </footer>
  );
}
