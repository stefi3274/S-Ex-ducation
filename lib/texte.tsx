// Convention légère pour le texte des slides :
// - *comme ça* (astérisques) : pour un exemple, un nom de
//   personnalité, ou tout mot qu'on veut faire ressortir manuellement.
// - « comme ça » ou "comme ça" (guillemets) : détectés automatiquement,
//   pas besoin d'astérisques.
// Les deux ressortent en italique et dans la couleur d'accent.
export function texteAvecAccents(texte: string) {
  const regex = /(\*[^*]+\*|«[^»]+»|"[^"]+")/g;
  const parts = texte.split(regex);

  return parts.map((part, i) => {
    if (part.startsWith("*") && part.endsWith("*") && part.length > 1) {
      return (
        <em key={i} className="accent-texte">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (
      (part.startsWith("«") && part.endsWith("»") && part.length > 1) ||
      (part.startsWith('"') && part.endsWith('"') && part.length > 2)
    ) {
      return (
        <em key={i} className="accent-texte">
          {part}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
