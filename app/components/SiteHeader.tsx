import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="logo">
        S-Ex<span>-ducation</span>
      </Link>
    </header>
  );
}
