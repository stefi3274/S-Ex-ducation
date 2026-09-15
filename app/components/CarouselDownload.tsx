"use client";

import { useState } from "react";
import { texteAvecAccents } from "@/lib/texte";

type SlideExport = {
  id: string;
  position: number;
  titre: string | null;
  texte: string | null;
  image_url: string | null;
};

export default function CarouselDownload({
  slides,
  slug,
  aUnArticle,
}: {
  slides: SlideExport[];
  slug: string;
  aUnArticle: boolean;
}) {
  const [enCours, setEnCours] = useState(false);
  const [progres, setProgres] = useState(0);

  const derniereePosition = slides.length - 1;

  async function telechargerTout() {
    setEnCours(true);
    setProgres(0);

    try {
      const html2canvas = (await import("html2canvas")).default;

      for (let i = 0; i < slides.length; i++) {
        const node = document.getElementById(`export-slide-${slides[i].id}`);
        if (!node) continue;

        const canvas = await html2canvas(node, {
          width: 1080,
          height: 1080,
          scale: 1,
          useCORS: true,
          backgroundColor: null,
        });

        await new Promise<void>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${slug}-slide-${i + 1}.png`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            }
            resolve();
          }, "image/png");
        });

        setProgres(i + 1);
        // petite pause pour laisser le navigateur déclencher chaque téléchargement
        await new Promise((r) => setTimeout(r, 300));
      }
    } catch (err) {
      console.error("Erreur export carousel :", err);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={telechargerTout}
        disabled={enCours}
      >
        {enCours
          ? `Téléchargement... (${progres}/${slides.length})`
          : `Télécharger le carousel (${slides.length} images)`}
      </button>

      {/* Rendu caché en 1080x1080, utilisé uniquement pour la capture */}
      <div className="export-conteneur" aria-hidden="true">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            id={`export-slide-${slide.id}`}
            className="export-slide"
          >
            {slide.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={slide.image_url}
                alt=""
                className="export-slide-bg"
                crossOrigin="anonymous"
              />
            )}
            <div className="export-slide-overlay">
              {slide.titre && <h2>{slide.titre}</h2>}
              {slide.texte && <p>{texteAvecAccents(slide.texte)}</p>}
              {index === derniereePosition && slides.length > 1 && (
                <p className="export-cta">
                  {aUnArticle
                    ? "Lis l'article complet sur le site. Lien en bio."
                    : "Suis S-Ex-ducation pour plus de contenu comme celui-ci."}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
