import AdminMobileThemeLock from "./AdminMobileThemeLock";

const adminMobileShellStyles = `
  body:has([data-admin-mobile-root]) {
    background:
      radial-gradient(circle at top left, rgba(13, 148, 136, 0.18), transparent 28rem),
      linear-gradient(180deg, #eef4f2 0%, #f7f8fb 42%, #eef2f7 100%);
  }

  body:has([data-admin-mobile-root]) .route-progress-indicator,
  body:has([data-admin-mobile-root]) .site-grid > header,
  body:has([data-admin-mobile-root]) .site-grid > footer,
  body:has([data-admin-mobile-root]) .site-grid > .site-glow {
    display: none !important;
  }

  body:has([data-admin-mobile-root]) .site-grid {
    min-height: 100dvh;
  }

  body:has([data-admin-mobile-root]) .site-grid > main {
    width: 100%;
    max-width: none;
    padding: 0;
    margin: 0;
  }
`;

export default function AdminMobileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AdminMobileThemeLock />
      <style dangerouslySetInnerHTML={{ __html: adminMobileShellStyles }} />
      {children}
    </>
  );
}
