import AdminNav from "../../components/AdminNav";

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminNav />
      <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
    </>
  );
}
