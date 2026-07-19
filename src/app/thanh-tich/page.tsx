import type { Metadata } from "next";
import Stats from "../../components/Stats";

export const metadata: Metadata = {
  title: "Thành tích | HNT.IELTS - Hồ Ngọc Thương",
};

export default function StatsPage() {
  return (
    <main className="relative z-10 pt-20">
      <Stats />
    </main>
  );
}
