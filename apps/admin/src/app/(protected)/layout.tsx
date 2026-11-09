import AdminShell from "../../components/AdminNav";
import { teacherHienTai } from "../../lib/phien";
import { tenGiaoVien } from "../../lib/teachers";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const name = await tenGiaoVien(await teacherHienTai());
  return <AdminShell teacherName={name}>{children}</AdminShell>;
}
