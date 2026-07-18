import { useEffect } from "react";
import Stats from "../components/Stats";

export default function StatsPage() {
  useEffect(() => {
    document.title = "Thành tích | HNT.IELTS - Hồ Ngọc Thương";
  }, []);

  return (
    <main className="relative z-10 pt-20">
      <Stats />
    </main>
  );
}
