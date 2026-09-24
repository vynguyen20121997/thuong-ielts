"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import ZoomableImage from "./ZoomableImage";

type TeachingCertificate = {
  title: string;
  image: string;
  description: string;
};

export default function TeachingCertificateCarousel({ certificates }: { certificates: readonly TeachingCertificate[] }) {
  const [index, setIndex] = useState(0);
  const certificate = certificates[index];

  if (!certificate) return null;

  const move = (direction: -1 | 1) => {
    setIndex((current) => (current + direction + certificates.length) % certificates.length);
  };

  return (
    <div className="mt-8">
      <article className="grid overflow-hidden rounded-[28px] border border-brand/10 bg-mist p-5 sm:grid-cols-[minmax(260px,0.75fr)_1.25fr] sm:items-center sm:gap-7">
        <div className="relative rounded-2xl bg-[#e9f4f8] p-3">
          <div key={certificate.image}>
            <ZoomableImage
              src={certificate.image}
              alt={`Chứng chỉ ${certificate.title}`}
              className="aspect-[3/4] w-full rounded-xl bg-white object-contain shadow-sm"
            />
          </div>

          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Xem chứng chỉ trước"
            className="absolute left-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-brand/10 bg-white text-brand shadow-md transition-colors hover:bg-brand hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:-left-3"
          >
            <ChevronLeft size={21} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Xem chứng chỉ tiếp theo"
            className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-brand/10 bg-white text-brand shadow-md transition-colors hover:bg-brand hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:-right-3"
          >
            <ChevronRight size={21} aria-hidden="true" />
          </button>
        </div>

        <div key={certificate.title} className="px-1 pb-1 pt-6 sm:p-0" aria-live="polite">
          <h3 className="text-xl font-bold text-brand md:text-2xl">{certificate.title}</h3>
          <p className="mt-4 text-sm leading-relaxed text-brand/80 md:text-base">{certificate.description}</p>
        </div>
      </article>

      {certificates.length > 1 && (
        <div className="mt-4 flex justify-center gap-2" aria-label="Chọn chứng chỉ">
          {certificates.map((item, itemIndex) => (
            <button
              key={item.image}
              type="button"
              onClick={() => setIndex(itemIndex)}
              aria-label={`Xem ${item.title}`}
              aria-current={itemIndex === index ? "true" : undefined}
              className={`h-2 rounded-full transition-all ${itemIndex === index ? "w-7 bg-brand" : "w-2 bg-brand/25 hover:bg-brand/45"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
