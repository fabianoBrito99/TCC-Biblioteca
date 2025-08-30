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
       <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#007bff" />
        <link rel="manifest" href="/manifest.json" />
        <title>Biblioteca Helena Ramazzotte</title>
      </head>
      <body >
        
        <Navbar />
        {children}
      </body>
    </html>
  );
}
