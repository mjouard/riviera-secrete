"use client";
import { useState, useCallback } from "react";

interface Slide {
  src: string;
  alt: string;
}

interface Props {
  slides: Slide[];
  className?: string;
}

export default function HeroCarousel({ slides, className = "" }: Props) {
  const [index, setIndex] = useState(0);

  const prev = useCallback(() => setIndex((i) => (i - 1 + slides.length) % slides.length), [slides.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % slides.length), [slides.length]);

  if (slides.length === 0) return null;
  if (slides.length === 1) {
    return (
      <img src={slides[0].src} alt={slides[0].alt} className={`w-full h-full object-cover ${className}`} />
    );
  }

  return (
    <div className={`carousel-wrap ${className}`} style={{ height: "100%" }}>
      <div className="carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {slides.map((slide, i) => (
          <div key={i} className="carousel-slide">
            <img src={slide.src} alt={slide.alt} loading={i === 0 ? "eager" : "lazy"} />
          </div>
        ))}
      </div>

      <button className="carousel-btn carousel-prev" onClick={prev} aria-label="Image précédente">
        &#8249;
      </button>
      <button className="carousel-btn carousel-next" onClick={next} aria-label="Image suivante">
        &#8250;
      </button>

      <div className="carousel-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`carousel-dot${i === index ? " active" : ""}`}
            aria-label={`Image ${i + 1}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
