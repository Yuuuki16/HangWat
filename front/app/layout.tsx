import type { Metadata, Viewport } from "next";
import { Inter, Pacifico } from "next/font/google";
import { HeaderGate } from "@/components/layout/headerGate";
import { ServiceWorkerRegistration } from "@/components/pwa/serviceWorkerRegistration";
import { AuthGuard } from "@/features/auth/components/authGuard";
import { AuthProvider } from "@/features/auth/context/authContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const pacifico = Pacifico({
  subsets: ["latin"],
  variable: "--font-pacifico",
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "HangWat",
    template: "%s | HangWat",
  },
  description: "みんなの予定と行き先をまとめるアプリ",
  applicationName: "HangWat",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HangWat",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#e3bd49",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${inter.variable} ${pacifico.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistration />
        <AuthProvider>
          <HeaderGate />
          <AuthGuard>{children}</AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
