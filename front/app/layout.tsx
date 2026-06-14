import type { Metadata } from "next";
import { Inter, Pacifico } from "next/font/google";
import { HeaderGate } from "@/components/layout/headerGate";
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
  title: "HangWat",
  description: "HangWat frontend",
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
        <AuthProvider>
          <HeaderGate />
          <AuthGuard>{children}</AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
