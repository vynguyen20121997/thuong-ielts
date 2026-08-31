"use client";

import { useEffect, useState } from "react";
import { BookOpen, Headphones, PenLine, Mic } from "lucide-react";

/**
 * Menu nhảy nhanh bốn kỹ năng, tách khỏi trang (server component) vì cần hai
 * thứ chỉ chạy được ở client:
 *
 * 1. **Tô đậm mục đang đọc.** Trước đây bốn nút trắng như nhau kể cả khi URL là
 *    `#listening`, nên menu không nói được người đọc đang ở đâu.
 * 2. **Nhảy tới mục khi mở link có sẵn hash.** Lenis nhận `anchors: true` nên lo
 *    được cú BẤM vào link neo, nhưng không lo cú tải trang đầu tiên: mở thẳng
 *    `/phuong-phap#listening` thì trang nằm nguyên ở đỉnh. Cuộn tay một nhịp sau
 *    khi mount là xong.
 *
 * Icon nằm trong đây chứ không nhận qua props: hàm component không truyền được
 * qua ranh giới server → client.
 */

const ICONS = { reading: BookOpen, listening: Headphones, writing: PenLine, speaking: Mic } as const;

type SkillId = keyof typeof ICONS;

export default function SkillJumpNav({ items }: { items: readonly { id: string; name: string }[] }) {
  const [active, setActive] = useState<string | null>(null);

  // Mở trang bằng link có hash: tự cuộn tới đúng mục (xem ghi chú đầu file)
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id || !items.some((s) => s.id === id)) return;
    const el = document.getElementById(id);
    if (!el) return;
    // requestAnimationFrame: chờ layout xong, nếu không offset đo ra còn sai
    requestAnimationFrame(() => el.scrollIntoView());
    setActive(id);
  }, [items]);

  /*
    Mục "đang đọc" là mục cắt qua dải 25%–45% chiều cao màn hình — không phải
    mục nào lọt vào viewport, vì một trang dài luôn có 2–3 mục cùng hiện.
  */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-25% 0px -55% 0px" },
    );
    for (const s of items) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  return (
    /*
      Dính dưới header (header cao 64px) để đọc tới đâu vẫn nhảy sang kỹ năng
      khác được — trang này dài hơn 6000px, menu nằm im ở đầu thì chỉ dùng
      được đúng một lần. `-mx` + `px` để dải nền trắng chạy hết bề ngang cột
      chữ, nếu không thì chữ bên dưới trồi lên hai bên mép menu.
    */
    <div className="sticky top-16 z-30 -mx-6 md:-mx-8 px-6 md:px-8 py-3 mb-12 bg-white/90 backdrop-blur-sm border-b border-black/5 flex flex-wrap gap-3">
      {items.map((s) => {
        const Icon = ICONS[s.id as SkillId] ?? BookOpen;
        const on = active === s.id;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-current={on ? "true" : undefined}
            className={`inline-flex items-center gap-2 px-5 py-2.5 border font-semibold text-sm rounded-full transition-colors ${
              on
                ? "bg-brand border-brand text-white"
                : "bg-white border-black/10 hover:border-brand text-brand"
            }`}
          >
            <Icon size={16} className={on ? "text-leaf" : "text-brand"} />
            {s.name}
          </a>
        );
      })}
    </div>
  );
}
