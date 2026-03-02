// This root layout is required by Next.js but intentionally minimal.
// All real layout (fonts, providers, html/body) lives in app/[locale]/layout.tsx
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
