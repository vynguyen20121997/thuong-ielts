import type { Metadata } from "next";

import {
  classroomMedia,
  type ClassroomCategory,
} from "../../../components/ClassroomGallery";
import Reveal from "../../../components/Reveal";

export const metadata: Metadata = {
  title: "Hình Ảnh Lớp Học | Thương Hồ's Class",
  description: "Thư viện hình ảnh các lớp học tại Thương Hồ's Class.",
};

const gallerySections: {
  category: ClassroomCategory;
  title: string;
  description: string;
}[] = [
  {
    category: "offline",
    title: "Lớp Offline",
    description: "Không khí học tập, thảo luận và hoạt động trực tiếp tại lớp.",
  },
  {
    category: "online",
    title: "Lớp Online",
    description: "Những giờ học trực tuyến kết nối học viên ở mọi nơi.",
  },
  {
    category: "one-to-one",
    title: "Lớp 1-1",
    description:
      "Khoảnh khắc luyện tập và đồng hành cá nhân hoá cùng học viên.",
  },
];

export default function ClassroomGalleryPage() {
  return (
    <main className="min-h-screen bg-mist pb-20 pt-32 md:pb-28 md:pt-40">
      <section className="mx-auto max-w-7xl px-6 md:px-12">
        <Reveal className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
          <span className="text-sm font-bold uppercase tracking-[0.12em] text-brand">
            Thương Hồ&apos;s Class
          </span>
          <h1 className="mt-4 font-serif text-4xl font-bold leading-tight tracking-tight text-brand md:text-6xl">
            Hình Ảnh Lớp Học
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ink/65 md:text-lg">
            Những giờ học tập trung, những buổi thảo luận sôi nổi và các khoảnh
            khắc đáng nhớ của học viên.
          </p>
        </Reveal>

        <div className="space-y-16 md:space-y-20">
          {gallerySections.map((section) => {
            const mediaItems = classroomMedia.filter(
              (media) => media.category === section.category,
            );

            return (
              <section key={section.category}>
                <div className="mb-7 border-l-4 border-leaf pl-5 md:mb-9">
                  <h2 className="font-serif text-3xl font-bold text-brand md:text-4xl">
                    {section.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink/65 md:text-base">
                    {section.description}
                  </p>
                </div>

                <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
                  {mediaItems.map((media, index) => (
                    <Reveal
                      key={media.src}
                      delay={(index % 6) * 0.035}
                      y={18}
                      className="mb-5 break-inside-avoid"
                    >
                      <figure className="group overflow-hidden rounded-[22px] border border-black/5 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg">
                        {media.type === "video" ? (
                          <iframe
                            src={media.src}
                            title={media.alt}
                            loading="lazy"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                            className="aspect-video w-full border-0"
                          />
                        ) : (
                          <img
                            src={media.src}
                            alt={media.alt}
                            loading={index < 6 ? "eager" : "lazy"}
                            className="h-auto w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                          />
                        )}
                        {media.type === "image" && media.caption && (
                          <figcaption className="border-t border-black/5 bg-white px-4 py-3 text-sm font-medium leading-relaxed text-brand">
                            {media.caption}
                          </figcaption>
                        )}
                      </figure>
                    </Reveal>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}
