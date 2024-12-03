{/* 
import { NextRequest, NextResponse } from "next/server";

const permissoes = {
  administrador: ["/livros", "/cadastrarLivro", "/emprestimos", "/usuario"],
  voluntario: ["/homecards", "/doeumlivro", "/comunidade"],
  leitor: ["/homecards", "/doeumlivro", "/comunidade"],
};

// Middleware para proteger rotas
export function middleware(request: NextRequest) {
  const userType = request.headers.get("tipo-usuario"); // Tipo de usuário vindo do cabeçalho ou token
  const rota = request.nextUrl.pathname; // Rota atual

  if (!userType) {
    return NextResponse.redirect(new URL("/login", request.url)); // Redireciona ao login se não estiver autenticado
  }

  const permitido = permissoes[userType as keyof typeof permissoes]?.includes(rota);

  if (!permitido) {
    return NextResponse.redirect(new URL("/homecards", request.url)); // Redireciona para uma rota segura
  }

  return NextResponse.next(); // Permite o acesso
}

export const config = {
  matcher: [
    "/livros",
    "/cadastrarLivro",
    "/emprestimos",
    "/usuario",
    "/homecards",
    "/doeumlivro",
    "/comunidade",
  ], // Define as rotas que o middleware deve verificar
};
*/}