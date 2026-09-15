function normaliser(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export type ArticleColle = {
  titre: string;
  sousTitre: string;
  extrait: string;
  categorieSlug: string | null;
  auteurNom: string;
  contenu: string;
};

// Reconnaît un texte de la forme :
// **Titre**
// ...
// **Sous-titre**
// ...
// **Résumé court**
// ...
// **Catégorie**
// ...
// **Signer avec**
// ...
// **Contenu**
// ...
export function parserArticleColle(
  texteBrut: string,
  categories: { slug: string; nom: string }[]
): ArticleColle {
  const lignes = texteBrut.replace(/\r\n/g, "\n").split("\n");
  const sections: Record<string, string[]> = {};
  let cle: string | null = null;

  for (const ligne of lignes) {
    const trimmed = ligne.trim();

    if (trimmed === "---") continue;

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

  return {
    titre: get("titre"),
    sousTitre: get("sous-titre", "sous titre"),
    extrait: get("resume court", "resume"),
    categorieSlug: categorie?.slug ?? null,
    auteurNom: get("signer avec", "signature", "auteur"),
    contenu: get("contenu"),
  };
}
