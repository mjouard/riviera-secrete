"use client";
import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import Photo from "@/components/Photo";

interface Slide {
  src: string;
  alt: string;
}

interface Props {
  slides: Slide[];
  className?: string;
}

export default function HeroCarousel({ slides, className = "" }: Props) {
  const t = useTranslations("common");
  const [index, setIndex] = useState(0);

  const prev = useCallback(() => setIndex((i) => (i - 1 + slides.length) % slides.length), [slides.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % slides.length), [slides.length]);

  if (slides.length === 0) return null;
  if (slides.length === 1) {
    return (
      <Photo src={slides[0].src} alt={slides[0].alt} priority sizes="100vw" className={`w-full h-full object-cover ${className}`} />
    );
  }

  return (
    <div className={`carousel-wrap ${className}`} style={{ height: "100%" }}>
      <div className="carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {slides.map((slide, i) => (
          <div key={i} className="carousel-slide">
            <Photo src={slide.src} alt={slide.alt} priority={i === 0} sizes="100vw" />
          </div>
        ))}
      </div>

      <button className="carousel-btn carousel-prev" onClick={prev} aria-label={t("imagePrecedente")}>
        &#8249;
      </button>
      <button className="carousel-btn carousel-next" onClick={next} aria-label={t("imageSuivante")}>
        &#8250;
      </button>

      <div className="carousel-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`carousel-dot${i === index ? " active" : ""}`}
            aria-label={t("imageN", { n: i + 1 })}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>

      {/* Compteur de slides (refonte UI Lot 4a, § 5 du spec) — affiché dès qu'il y a plus
          d'une image, comme les flèches et les pastilles au-dessus. */}
      <span className="carousel-counter" aria-hidden="true">
        {index + 1} / {slides.length}
      </span>
    </div>
  );
}
