// // /middleware.ts
// import type { NextRequest } from "next/server";
// import { NextResponse } from "next/server";

// const permissoes = {
//   administrador: [
//     "/livros",
//     "/cadastrarLivro",
//     "/emprestimos",
//     "/usuario",
//     "/homecards",
//     "/doeumlivro",
//     "/comunidade",
//   ],
//   voluntario: ["/homecards", "/doeumlivro", "/comunidade"],
//   leitor: ["/homecards", "/doeumlivro", "/comunidade"],
// } as const;

// function isPathAllowed(pathname: string, allowedPrefixes: readonly string[]) {
//   return allowedPrefixes.some(
//     (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
//   );
// }
// function normalizePath(p: string) {
//   return p !== "/" && p.endsWith("/") ? p.slice(0, -1) : p;
// }

// export function middleware(request: NextRequest) {
//   const url = request.nextUrl;
//   const pathname = normalizePath(url.pathname);
//   const search = url.search;

//   if (
//     pathname.startsWith("/login") ||
//     pathname.startsWith("/api/") ||
//     pathname.startsWith("/_next/") ||
//     pathname.startsWith("/favicon") ||
//     /\.\w+$/.test(pathname)
//   ) {
//     return NextResponse.next();
//   }

//   const cookieRole = request.cookies.get("tipo_usuario")?.value;
//   const headerRole = request.headers.get("tipo-usuario");
//   const userType = (cookieRole || headerRole || "").toLowerCase();

//   // Sem login: manda pro login com flag de origem e motivo = auth
//   if (!userType) {
//     const loginUrl = new URL("/login", request.url);
//     loginUrl.searchParams.set("next", pathname + search);
//     loginUrl.searchParams.set("from", "mw");
//     loginUrl.searchParams.set("error", "auth"); // <-- novo
//     return NextResponse.redirect(loginUrl);
//   }

//   const allowed = permissoes[userType as keyof typeof permissoes];

//   if (!allowed || !isPathAllowed(pathname, allowed)) {
//     const loginUrl = new URL("/login", request.url);
//     loginUrl.searchParams.set("next", pathname + search);
//     loginUrl.searchParams.set("from", "mw");
//     loginUrl.searchParams.set("error", "permissao"); // <-- já existia
//     return NextResponse.redirect(loginUrl);
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     "/livros/:path*",
//     "/cadastrarLivro/:path*",
//     "/emprestimos/:path*",
//     "/usuario/:path*",
//     "/homecards/:path*",
//     "/doeumlivro/:path*",
//     "/comunidade/:path*",
//   ],
// };
