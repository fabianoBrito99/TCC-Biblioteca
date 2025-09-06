import { NextResponse, type NextRequest } from "next/server";

const permissoes = {
  administrador: [
    "/livros",
    "/cadastrarLivro",
    "/emprestimos",
    "/usuario",
    "/homecards",
    "/doeumlivro",
    "/comunidade",
  ],
  voluntario: ["/homecards", "/doeumlivro", "/comunidade"],
  leitor: ["/homecards", "/doeumlivro", "/comunidade"],
} as const;

type Role = keyof typeof permissoes;

const roleAlias: Record<string, Role> = {
  administrador: "administrador",
  admin: "administrador",
  bibliotecario: "administrador",
  voluntario: "voluntario",
  leitor: "leitor",
  user: "leitor",
};

const isPathAllowed = (pathname: string, allowed: readonly string[]) =>
  allowed.some((p) => pathname === p || pathname.startsWith(p + "/"));

const normalizePath = (p: string) => (p !== "/" && p.endsWith("/") ? p.slice(0, -1) : p);

// Constrói a origem correta para redirecionar (usa headers do proxy)
// Se ainda vier localhost, usa APP_BASE_URL ou NEXT_PUBLIC_SITE_URL como fallback.
function getOrigin(req: NextRequest): string {
  const xfProto = req.headers.get("x-forwarded-proto") ?? "https";
  const xfHost =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    req.nextUrl.host;

  const host = xfHost;
  const originFromProxy = `${xfProto}://${host}`;

  const fallback =
    process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "";

  const isLocal =
    /^localhost(:\d+)?$/i.test(host) || /^127\.0\.0\.1(:\d+)?$/i.test(host);

  // Se host veio certo do proxy, usa ele. Se for localhost, tenta fallback de env.
  if (!isLocal) return originFromProxy;
  if (fallback) return fallback;

  // Último recurso: usa o que o Next viu (pode ser localhost).
  return req.nextUrl.origin;
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = normalizePath(url.pathname);
  const search = url.search;

  // 1) Autenticação
  const token = req.cookies.get("token")?.value ?? "";
  if (!token) {
    const origin = getOrigin(req);
    const to = new URL("/login", origin);
    to.searchParams.set("next", pathname + search);
    to.searchParams.set("from", "mw");
    to.searchParams.set("error", "auth");
    return NextResponse.redirect(to);
  }

  // 2) Autorização (se houver papel)
  const rawRole = (req.cookies.get("tipo_usuario")?.value ??
    req.headers.get("tipo-usuario") ??
    "")
    .trim()
    .toLowerCase();

  const role: Role | undefined = roleAlias[rawRole];

  if (role) {
    const allowed = permissoes[role];
    if (!isPathAllowed(pathname, allowed)) {
      const origin = getOrigin(req);
      const to = new URL("/login", origin);
      to.searchParams.set("next", pathname + search);
      to.searchParams.set("from", "mw");
      to.searchParams.set("error", "permissao");
      return NextResponse.redirect(to);
    }
  }

  return NextResponse.next();
}

// Só nas rotas protegidas
export const config = {
  matcher: [
    "/livros/:path*",
    "/cadastrarLivro",
    "/emprestimos/:path*",
    "/usuario/:path*",
    "/homecards",
    "/doeumlivro",
    "/comunidade/:path*",
  ],
};
