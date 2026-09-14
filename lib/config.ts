// Slug de cette marque dans le compte Supabase partagé.
// Toutes les requêtes posts/slides filtrent sur cette valeur.
export const ENTREPRISE = "sexed";

export const SLIDE_LABELS: Record<number, string> = {
  0: "Intro",
  1: "Sujet 1",
  2: "Sujet 2",
  3: "Sujet 3",
  4: "Sujet 4",
  5: "Conclusion",
};

export const SLIDE_POSITIONS = [0, 1, 2, 3, 4, 5];

export const TAILLES_CAROUSEL = [6, 8, 10, 12];

export function positionsPourTaille(nbSlides: number): number[] {
  return Array.from({ length: nbSlides }, (_, i) => i);
}

export function labelSlide(position: number, nbSlides: number): string {
  if (position === 0) return "Intro";
  if (position === nbSlides - 1) return "Outro (invitation)";
  return `Sujet ${position}`;
}

export const BLOG_STATUTS: Record<string, string> = {
  soumis: "Soumis",
  a_revoir: "À revoir",
  rejete: "Rejeté",
  publie: "Publié",
};

export type Categorie = {
  slug: string;
  nom: string;
  couleur: string;
};

export const CATEGORIES: Categorie[] = [
  { slug: "je-minforme", nom: "Je m'informe", couleur: "#14b8a6" },
  { slug: "mythe-realite", nom: "Mythe et réalité", couleur: "#c2185b" },
  { slug: "societe", nom: "Société", couleur: "#111111" },
];

export function couleurCategorie(slug: string | null | undefined): string {
  return CATEGORIES.find((c) => c.slug === slug)?.couleur ?? "#c2185b";
}

export function nomCategorie(slug: string | null | undefined): string | null {
  return CATEGORIES.find((c) => c.slug === slug)?.nom ?? null;
}
