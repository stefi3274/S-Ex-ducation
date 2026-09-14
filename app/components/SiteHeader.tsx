import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" width={36} height={36} />
        S-Ex<span>-ducation</span>
      </Link>
      <nav className="site-nav">
        <Link href="/a-propos">À propos</Link>
        <Link href="/contact">Contact</Link>
      </nav>
    </header>
  );
}
