import ClientShell from "../../components/ClientShell";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <ClientShell>{children}</ClientShell>;
}
