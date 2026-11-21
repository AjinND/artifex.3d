import Link from "next/link";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="staff-shell">
      <header className="staff-topbar">
        <Link href="/staff" className="studio-brand">
          Artifex3D <small>Studio workspace</small>
        </Link>
        <div>
          <Link className="text-link" href="/profile">
            My account
          </Link>
          <Link className="text-link" href="/">
            Back to storefront ↗
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
