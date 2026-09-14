// Convention légère pour le texte des slides : tout ce qui est entre
// astérisques *comme ça* ressort en italique et dans la couleur
// d'accent — utilisé pour les exemples, les noms de personnalités,
// ou tout mot qu'on veut faire ressortir.
export function texteAvecAccents(texte: string) {
  const parts = texte.split(/(\*[^*]+\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith("*") && part.endsWith("*") && part.length > 1) {
      return (
        <em key={i} className="accent-texte">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
