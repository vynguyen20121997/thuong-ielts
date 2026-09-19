import Link from "next/link";
import { ArrowRight } from "lucide-react";

import Carousel from "./Carousel";
import NavigationButtonLabel from "./NavigationButtonLabel";
import Reveal from "./Reveal";

export const classroomImages = [
  {
    src: "/images/classroom/classroom-01.jpg",
    alt: "Học viên trao đổi bài tập theo nhóm trong lớp",
  },
  {
    src: "/images/classroom/classroom-02.jpg",
    alt: "Khoảnh khắc cả lớp cùng chụp ảnh",
  },
  {
    src: "/images/classroom/classroom-03.jpg",
    alt: "Lớp học cùng tham gia hoạt động",
  },
  {
    src: "/images/classroom/classroom-04.jpg",
    alt: "Học viên tập trung làm bài tại lớp",
  },
  {
    src: "/images/classroom/classroom-05.jpg",
    alt: "Học viên thảo luận cùng bạn học",
  },
  {
    src: "/images/classroom/classroom-06.jpg",
    alt: "Hoạt động tương tác trong giờ học",
  },
  {
    src: "/images/classroom/classroom-07.jpg",
    alt: "Các nhóm học viên cùng trao đổi",
  },
  {
    src: "/images/classroom/classroom-08.jpg",
    alt: "Lớp học cùng thực hành bài tập",
  },
  {
    src: "/images/classroom/classroom-09.jpg",
    alt: "Học viên làm việc nhóm trong lớp",
  },
  {
    src: "/images/classroom/classroom-10.jpg",
    alt: "Nhóm học viên cùng phân tích bài tập",
  },
  {
    src: "/images/classroom/classroom-11.jpg",
    alt: "Hoạt động học tập tại lớp",
  },
  {
    src: "/images/classroom/classroom-12.jpg",
    alt: "Học viên cùng làm bài tại The IELTS Workshop",
  },
  {
    src: "/images/classroom/classroom-13.jpg",
    alt: "Học viên tập trung luyện tập tại nhà",
  },
  {
    src: "/images/classroom/classroom-14.jpg",
    alt: "Lớp học cùng thảo luận bài tập",
  },
  {
    src: "/images/classroom/classroom-15.jpg",
    alt: "Khoảnh khắc kỷ niệm của lớp học",
  },
  {
    src: "/images/classroom/classroom-16.jpg",
    alt: "Học viên làm việc nhóm trong giờ học",
  },
  {
    src: "/images/classroom/classroom-17.jpg",
    alt: "Ảnh lưu niệm cùng cô Thương và học viên",
  },
  {
    src: "/images/classroom/classroom-18.jpg",
    alt: "Học viên tập trung làm bài trong lớp",
  },
  {
    src: "/images/classroom/classroom-19.jpg",
    alt: "Học viên cùng chụp ảnh sau giờ học",
  },
  {
    src: "/images/classroom/classroom-20.jpg",
    alt: "Khoảnh khắc cả lớp vui vẻ bên nhau",
  },
  {
    src: "/images/classroom/classroom-21.jpg",
    alt: "Học viên tham gia hoạt động tương tác",
  },
  {
    src: "/images/classroom/classroom-22.jpg",
    alt: "Hoạt động nhóm trong không gian lớp học",
  },
  {
    src: "/images/classroom/classroom-23.jpg",
    alt: "Học viên cùng hoàn thành bài tập",
  },
  {
    src: "/images/classroom/classroom-24.jpg",
    alt: "Thảo luận và hỗ trợ nhau trong lớp",
  },
  {
    src: "/images/classroom/classroom-25.jpg",
    alt: "Cả lớp cùng học tập tập trung",
  },
  {
    src: "/images/classroom/classroom-26.jpg",
    alt: "Học viên luyện tập tại lớp",
  },
  {
    src: "/images/classroom/classroom-27.jpg",
    alt: "Buổi học trực tuyến của lớp",
  },
  {
    src: "/images/classroom/classroom-28.jpg",
    alt: "Học viên cùng trao đổi bài tập",
  },
  {
    src: "/images/classroom/classroom-29.jpg",
    alt: "Học viên chăm chú làm bài trong lớp",
  },
  {
    src: "/images/classroom/classroom-30.jpg",
    alt: "Buổi học trực tuyến cùng học viên",
  },
  {
    src: "/images/classroom/classroom-31.jpg",
    alt: "Học viên cùng phân tích bài tập",
  },
  {
    src: "/images/classroom/classroom-32.jpg",
    alt: "Khoảnh khắc học viên luyện tập tại lớp",
  },
  { src: "/images/classroom/classroom-33.jpg", alt: "Cả lớp cùng học tập" },
  {
    src: "/images/classroom/classroom-34.jpg",
    alt: "Học viên tập trung hoàn thành bài tập",
  },
  {
    src: "/images/classroom/classroom-drive-01.jpg",
    alt: "Học viên cùng tham gia hoạt động tại lớp",
  },
  {
    src: "/images/classroom/classroom-drive-02.jpg",
    alt: "Không khí lớp học trực tiếp",
  },
  {
    src: "/images/classroom/classroom-drive-03.jpg",
    alt: "Học viên nam luyện tập cá nhân tại nhà",
  },
  {
    src: "/images/classroom/classroom-drive-04.jpg",
    alt: "Học viên nam học 1-1 tại lớp",
  },
  {
    src: "/images/classroom/classroom-drive-05.jpg",
    alt: "Buổi học trực tuyến cùng học viên",
  },
  {
    src: "/images/classroom/classroom-drive-06.jpg",
    alt: "Lớp học Online qua Zoom",
  },
  {
    src: "/images/classroom/classroom-drive-07.jpg",
    alt: "Buổi học Online và tương tác trực tuyến",
  },
  {
    src: "/images/classroom/jr1153-01.jpg",
    alt: "Học viên lớp JR1153 làm bài tại Quận 10",
    caption: "Lớp JR1153 (đầu ra 4.5) Quận 10 - Tháng 9/2026",
  },
  {
    src: "/images/classroom/jr1153-02.jpg",
    alt: "Học viên lớp JR1153 trao đổi bài tập tại Quận 10",
    caption: "Lớp JR1153 (đầu ra 4.5) Quận 10 - Tháng 9/2026",
  },
  {
    src: "/images/classroom/jr1153-03.jpg",
    alt: "Không khí học tập của lớp JR1153 tại Quận 10",
    caption: "Lớp JR1153 (đầu ra 4.5) Quận 10 - Tháng 9/2026",
  },
];

export type ClassroomCategory = "offline" | "online" | "one-to-one";

export const classroomVideos = [
  {
    src: "https://drive.google.com/file/d/1ANMlzXbuAN1ugRBQdaXjn3TO26cXY9ue/preview",
    alt: "Video hoạt động lớp học trực tiếp",
    category: "offline" as const,
  },
  {
    src: "https://drive.google.com/file/d/1Mdv3V2WWkfU7e9Nzv0uk0cs5ItSkAUWc/preview",
    alt: "Video khoảnh khắc học tập tại lớp",
    category: "offline" as const,
  },
  {
    src: "https://drive.google.com/file/d/1sbHLKqQ0-lqSIqvtHu9t2QpLzkka0ibe/preview",
    alt: "Video hoạt động trao đổi của học viên",
    category: "offline" as const,
  },
  {
    src: "https://drive.google.com/file/d/1fafov2P5wCXm7dDK5aDuYGk-R9uDWbNw/preview",
    alt: "Video không khí lớp học trực tiếp",
    category: "offline" as const,
  },
  {
    src: "https://drive.google.com/file/d/1oj-8fh_dMiUbdM_ZEb8WDJb8LkNi7DLk/preview",
    alt: "Video buổi học Online cùng học viên",
    category: "online" as const,
  },
];

const onlineImageSources = new Set([
  "/images/classroom/classroom-27.jpg",
  "/images/classroom/classroom-30.jpg",
  "/images/classroom/classroom-drive-05.jpg",
  "/images/classroom/classroom-drive-06.jpg",
  "/images/classroom/classroom-drive-07.jpg",
]);

const oneToOneImageSources = new Set([
  "/images/classroom/classroom-13.jpg",
  "/images/classroom/classroom-drive-03.jpg",
  "/images/classroom/classroom-drive-04.jpg",
]);

export const classroomMedia = [
  ...classroomImages.map((image) => ({
    ...image,
    type: "image" as const,
    category: (onlineImageSources.has(image.src)
      ? "online"
      : oneToOneImageSources.has(image.src)
        ? "one-to-one"
        : "offline") as ClassroomCategory,
  })),
  ...classroomVideos.map((video) => ({ ...video, type: "video" as const })),
];

const featuredImageSources = new Set([
  "/images/classroom/classroom-01.jpg",
  "/images/classroom/classroom-02.jpg",
  "/images/classroom/classroom-12.jpg",
  "/images/classroom/classroom-15.jpg",
  "/images/classroom/classroom-17.jpg",
  "/images/classroom/classroom-27.jpg",
  "/images/classroom/classroom-34.jpg",
]);

const featuredImages = classroomImages.filter((image) =>
  featuredImageSources.has(image.src),
);
const featuredMedia = [
  ...featuredImages.map((image) => ({ ...image, type: "image" as const })),
  ...classroomVideos
    .slice(2, 4)
    .map((video) => ({ ...video, type: "video" as const })),
];

export default function ClassroomGallery() {
  return (
    <section
      id="classroom-gallery"
      className="border-b border-black/5 bg-mist py-16 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <Reveal className="mx-auto mb-10 max-w-3xl text-center">
          <span className="text-sm font-bold uppercase tracking-[0.12em] text-brand">
            HÌNH ẢNH LỚP HỌC
          </span>
          <h2 className="mt-4 text-3xl font-bold leading-[1.12] tracking-tight text-brand md:text-[46px]">
            Không khí học tập vui vẻ, thoải mái
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink/70">
            Tại{" "}
            <strong className="font-semibold text-brand">
              Thương Hồ&apos;s Class
            </strong>
            , các{" "}
            <strong className="font-semibold text-brand">
              hoạt động tương tác đa dạng
            </strong>{" "}
            giúp học viên thực hành tự nhiên trong một không khí{" "}
            <strong className="font-semibold text-brand">
              thoải mái và hứng khởi
            </strong>
            .
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <Carousel
            ariaLabel="Slideshow hình ảnh lớp học"
            autoPlayInterval={4800}
          >
            {featuredMedia.map((media) => (
              <figure
                key={media.src}
                className="group basis-[88%] shrink-0 snap-center overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-sm sm:basis-[calc(50%-12px)] lg:basis-[calc(33.333%-16px)]"
              >
                {media.type === "video" ? (
                  <iframe
                    src={media.src}
                    title={media.alt}
                    loading="lazy"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    className="aspect-[4/3] w-full border-0"
                  />
                ) : (
                  <img
                    src={media.src}
                    alt={media.alt}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                  />
                )}
              </figure>
            ))}
          </Carousel>
        </Reveal>

        <Reveal delay={0.14} className="mt-10 text-center">
          <Link
            href="/hinh-anh-lop-hoc"
            className="group inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-colors duration-300 hover:bg-brand-deep"
          >
            <NavigationButtonLabel>Xem thêm hình ảnh</NavigationButtonLabel>
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
