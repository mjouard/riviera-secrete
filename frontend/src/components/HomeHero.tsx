"use client";

import { useEffect, useState } from "react";
import Photo from "@/components/Photo";

const SLIDES = Array.from({ length: 8 }, (_, i) => `/assets/images/accueil/hero-${i + 1}.jpg`);

export default function HomeHero() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {SLIDES.map((src, i) => (
        <Photo
          key={src}
          src={src}
          alt=""
          sizes="100vw"
          priority={i === 0}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: i === active ? 1 : 0,
            transition: "opacity 1.5s ease",
          }}
        />
      ))}
    </div>
  );
}
