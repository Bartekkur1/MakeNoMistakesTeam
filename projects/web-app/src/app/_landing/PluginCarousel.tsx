"use client";

import Image from "next/image";
import { useState } from "react";
import type { PluginScreenshot } from "./content";

const arrowButton =
  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-titanium-border bg-white text-xl text-navy-slate shadow-sm transition-colors hover:bg-shark-blue hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shark-blue";

export function PluginCarousel({ slides }: { slides: PluginScreenshot[] }) {
  const [current, setCurrent] = useState(0);
  const go = (index: number) => setCurrent((index + slides.length) % slides.length);
  const slide = slides[current];

  return (
    <figure
      className="mt-12"
      role="region"
      aria-roledescription="karuzela"
      aria-label="Zrzuty ekranu pomocnika Scamerino"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") go(current - 1);
        if (event.key === "ArrowRight") go(current + 1);
      }}
    >
      <div className="overflow-hidden rounded-xl border border-titanium-border bg-black shadow-lg">
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {slides.map((item, index) => (
            <div
              key={item.src}
              className="w-full shrink-0"
              role="group"
              aria-roledescription="slajd"
              aria-label={`${index + 1} z ${slides.length}`}
              aria-hidden={index !== current}
            >
              <Image
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                sizes="(min-width: 1152px) 1152px, 100vw"
                priority={index === 0}
                className="h-auto w-full"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <figcaption className="max-w-2xl text-sm text-muted-slate" aria-live="polite">
          {slide.caption}
        </figcaption>
        <div className="flex shrink-0 items-center gap-3">
          <button type="button" className={arrowButton} onClick={() => go(current - 1)} aria-label="Poprzedni zrzut">
            <span aria-hidden="true">‹</span>
          </button>
          <div className="flex gap-2">
            {slides.map((item, index) => (
              <button
                key={item.src}
                type="button"
                onClick={() => go(index)}
                aria-label={`Zrzut ${index + 1}`}
                aria-current={index === current}
                className={`h-2.5 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shark-blue ${
                  index === current ? "w-6 bg-shark-blue" : "w-2.5 bg-titanium-border hover:bg-muted-slate"
                }`}
              />
            ))}
          </div>
          <button type="button" className={arrowButton} onClick={() => go(current + 1)} aria-label="Następny zrzut">
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>
    </figure>
  );
}
