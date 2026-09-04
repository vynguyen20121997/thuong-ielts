import type { Metadata } from "next";
import TeachingTools from "../../../components/TeachingTools";

export const metadata: Metadata = {
  title: "Hệ thống & Công cụ giảng dạy | Thương Hồ's Class",
};

export default function TeachingToolsPage() {
  return (
    <main className="relative z-10">
      <TeachingTools variant="full" />
    </main>
  );
}
