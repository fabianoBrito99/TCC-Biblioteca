import type { Metadata } from "next";
import "./globals.css";
import Navbar from '@/componentes/navbar/navbar';


export const metadata: Metadata = {
  title: "Biblioteca",
  description: "site da biblioteca",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
