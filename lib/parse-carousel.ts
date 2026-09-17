function normaliser(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function parserDateHeure(texte: string): string | null {
  const m = texte.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  const date = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi)
  );
  return isNaN(date.getTime()) ? null : date.toISOString();
}

export type CarouselColle = {
  titre: string;
  categorieSlug: string | null;
  publierLe: string | null;
  blocsSlides: string[];
};

// Reconnaît un bloc de la forme :
// **Titre**
// ...
// **Catégorie**
// ...
// **Programmer le**
// AAAA-MM-JJ HH:MM
// **Slides**
// Titre slide 1
// Texte slide 1
// ---
// Titre slide 2
// Texte slide 2
export function parserCarouselColle(
  texteBrut: string,
  categories: { slug: string; nom: string }[]
): CarouselColle {
  const lignes = texteBrut.replace(/\r\n/g, "\n").split("\n");
  const sections: Record<string, string[]> = {};
  let cle: string | null = null;

  for (const ligne of lignes) {
    const trimmed = ligne.trim();
    const entete = trimmed.match(/^\*\*(.+?)\*\*$/);
    if (entete) {
      cle = normaliser(entete[1]);
      if (!sections[cle]) sections[cle] = [];
      continue;
    }
    if (cle) sections[cle].push(ligne);
  }

  function get(...cles: string[]) {
    for (const c of cles) {
      if (sections[c]) return sections[c].join("\n").trim();
    }
    return "";
  }

  const categorieTexte = get("categorie");
  const categorie = categories.find(
    (c) => normaliser(c.nom) === normaliser(categorieTexte)
  );

  const texteSlides = get("slides");
  const blocsSlides = texteSlides
    .split(/\n-{3,}\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .slice(0, 11);

  return {
    titre: get("titre"),
    categorieSlug: categorie?.slug ?? null,
    publierLe: parserDateHeure(get("programmer le", "programme le", "date")),
    blocsSlides,
  };
}

// Découpe un gros texte collé en plusieurs carousels, séparés par une
// ligne de ==== (au moins 4 signes égal).
export function parserLotCarousels(
  texteBrut: string,
  categories: { slug: string; nom: string }[]
): CarouselColle[] {
  return texteBrut
    .split(/\n={4,}\n/)
    .map((bloc) => bloc.trim())
    .filter(Boolean)
    .map((bloc) => parserCarouselColle(bloc, categories));
}
