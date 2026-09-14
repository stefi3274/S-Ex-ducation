"use client";

import { useEffect, useState } from "react";

export default function ShareButtons({ titre }: { titre: string }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  if (!url) return null;

  const texte = encodeURIComponent(titre);
  const lien = encodeURIComponent(url);

  return (
    <div className="share-buttons">
      <a
        href={`https://wa.me/?text=${texte}%20${lien}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-secondary"
      >
        Partager sur WhatsApp
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${lien}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-noir"
      >
        Partager sur Facebook
      </a>
    </div>
  );
}
