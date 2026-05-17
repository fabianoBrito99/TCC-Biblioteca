"use client";

import Link from "next/link";
import {  usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  FaUser,
  FaBook,
  FaPlus,
  FaHome,
  FaUsers,
  FaBars,
  FaBible,
  FaBookReader,
  FaBookOpen,
  FaSignInAlt,
  FaTable,
  FaClipboardList,
} from "react-icons/fa"; // Importa ícones do react-icons
import styles from "@/componentes/navbar/navbar.module.css";
import Notificacoes from "../notificacoes/notificacoes";
import ComunidadesUsuario from "../comunidade/listar-comunidade-do-usuario";
import Image from "next/image";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "https://api.helenaramazzotte.online";

type User = {
  id: string;
  foto_usuario: string | null;
  tipo_usuario: string;
};

function AnimatedNavbarLogo() {
  return (
    <div className={styles.logoStage} aria-label="Helena Lamazzotte">
      <svg
        className={styles.logoSvg}
        viewBox="0 0 320 120"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="logo-h-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#eef2ff" />
            <stop offset="100%" stopColor="#d7e0ff" />
          </linearGradient>

          <linearGradient
            id="logo-book-fill"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#fffef8" />
            <stop offset="48%" stopColor="#ffeaa5" />
            <stop offset="100%" stopColor="#f7c044" />
          </linearGradient>

          <linearGradient
            id="logo-book-flip-fill"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#fff4bd" />
            <stop offset="100%" stopColor="#f7ca55" />
          </linearGradient>
        </defs>

        <g className={styles.logoLetterGroup}>
          <path
            className={styles.logoLetterMain}
            d="M24 15h28v30h31V15h28v90H83V71H52v34H24V15Z"
          />
          <path
            className={styles.logoLetterInset}
            d="M37 27h10v65H37V27Zm51 0h10v65H88V27Zm-36 28h31v9H52v-9Z"
          />
        </g>

        <g className={styles.logoNameGroup}>
          <text x="118" y="60" className={styles.logoNameTop}>
            ELENA
          </text>
          <text x="120" y="102" className={styles.logoNameBottom}>
            RAMAZZOTTE
          </text>
        </g>

        <g className={styles.logoBookGroup}>
          <g className={styles.logoBookPlacement}>
            <ellipse
              className={styles.logoBookShadow}
              cx="41"
              cy="82"
              rx="40"
              ry="7"
            />

            <g className={styles.logoBookPages}>
              <path
                className={`${styles.logoBookPage} ${styles.logoBookLeftPage}`}
                d="M239 36 C229 30 216 30 204 37 L204 72 C216 66 229 66 239 73 Z"
              />
              <path
                className={`${styles.logoBookPage} ${styles.logoBookRightPage}`}
                d="M239 36 C251 30 265 31 278 39 L278 74 C265 66 251 66 239 73 Z"
              />

              <path
                className={styles.logoPageLine}
                d="M212 45 C221 42 230 43 236 47"
              />
              <path
                className={styles.logoPageLine}
                d="M212 55 C222 52 230 53 236 57"
              />
              <path
                className={styles.logoPageLine}
                d="M247 47 C257 43 267 45 274 50"
              />
              <path
                className={styles.logoPageLine}
                d="M247 58 C258 54 267 56 274 61"
              />

              <path
                className={styles.logoBookFlipPage}
                d="M239 36 C251 30 265 31 278 39 L278 74 C265 66 251 66 239 73 Z"
              >
                <animate
                  attributeName="d"
                  dur="6s"
                  begin="2.4s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keyTimes="0;0.12;0.38;0.68;0.9;1"
                  keySplines="0.22 1 0.36 1; 0.22 1 0.36 1; 0.22 1 0.36 1; 0.22 1 0.36 1; 0.22 1 0.36 1"
                  values="
                    M239 36 C239 36 239 36 239 36 L239 73 C239 73 239 73 239 73 Z;
                    M239 36 C251 30 265 31 278 39 L278 74 C265 66 251 66 239 73 Z;
                    M239 36 C246 31 252 32 257 37 L257 72 C251 68 245 68 239 73 Z;
                    M239 36 C236 33 233 33 230 36 L230 72 C233 69 236 69 239 73 Z;
                    M239 36 C229 30 216 30 204 37 L204 72 C216 66 229 66 239 73 Z;
                    M239 36 C239 36 239 36 239 36 L239 73 C239 73 239 73 239 73 Z
                  "
                />
                <animate
                  attributeName="opacity"
                  dur="4s"
                  begin="2.4s"
                  repeatCount="indefinite"
                  keyTimes="0;0.12;0.38;0.68;0.9;1"
                  values="0;1;1;0.95;0.82;0"
                />
              </path>

              <path className={styles.logoBookSpine} d="M239 35 V75" />
            </g>

            <g className={styles.logoCrossGroup}>
              <path className={styles.logoCrossVertical} d="M243 13v21" />
              <path className={styles.logoCrossHorizontal} d="M236 22h14" />
            </g>

            <path className={styles.logoBookWave} d="M204 82 C221 74 258 74 278 82" />
          </g>
        </g>
      </svg>
    </div>
  );
}


export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();

  // Rotas e permissões
  const rotas = [
    { path: "/livros", label: "Livros", icon: <FaBook /> },
    { path: "/indicacoes", label: "Indicações", icon: <FaClipboardList /> },
    { path: "/cadastrarLivro", label: "Cadastrar Livro", icon: <FaPlus /> },
    { path: "/emprestimos", label: "Empréstimos", icon: <FaBook /> },
    {
      path: "/emprestimos/aprovar",
      label: "Aprovar Empréstimos",
      icon: <FaBookOpen />,
    },
    { path: "/usuario", label: "Usuários", icon: <FaUsers /> },
    { path: "/homecards", label: "Home", icon: <FaHome /> },
    { path: "/doeumlivro", label: "Sugire/Doe um Livro", icon: <FaBible /> },
    { path: "/comunidade", label: "Comunidade", icon: <FaBookReader /> },
    { path: "/relatorios", label: "Relatorios", icon: <FaTable /> },
    { path: "/login", label: "Sair", icon: <FaSignInAlt /> },
  ];

  const permissoes = {
    admin: [
      "/livros",
      "/cadastrarLivro",
      "/emprestimos",
      "/emprestimos/aprovar",
      "/usuario",
      "/usuario/[id]",
      "/homecards",
      "/doeumlivro",
      "/comunidade",
      "/relatorios",
      "/login",
      "/indicacoes",
    ],
    voluntario: [
      "/homecards",
      "/doeumlivro",
      "/comunidade",
      "/emprestimos",
      "/emprestimos/aprovar",
      "/login",
    ],
    leitor: ["/homecards", "/doeumlivro", "/comunidade", "/login"],
  };

  // Buscar o usuário logado
  useEffect(() => {
    const getAuthHeaders = (): HeadersInit => {
      const token = localStorage.getItem("token");
      return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const fetchUserData = async () => {
      const userId = localStorage.getItem("userId");
      if (userId) {
        try {
          const res = await fetch(
            `${API_BASE}/api/usuario/${userId}`,
            {
              headers: getAuthHeaders(),
            }
          );
          if (res.ok) {
            const data = await res.json();
            setUser({
              id: userId,
              foto_usuario: data.usuario.foto_usuario,
              tipo_usuario: data.usuario.tipo_usuario,
            });
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
        }
      }
    };

    fetchUserData();
  }, []);

  // Verificar acesso com base no tipo de usuário
  const verificarAcesso = (rota: string): boolean => {
    if (!user) return false;
    return permissoes[user.tipo_usuario as keyof typeof permissoes]?.includes(
      rota
    );
  };

  {
    /* 
  // Protege o acesso às rotas diretamente pela URL
  useEffect(() => {
    if (!verificarAcesso(pathname)) {
      router.push("/homecards"); // Redireciona para uma página permitida
    }
  }, [pathname, user]);
*/
  }
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const fecharMenu = () => setMenuOpen(false);

  if (pathname === "/login") return null; // Não exibe a Navbar na página de login

  return (
    <nav className={`${styles.navMenu} ${menuOpen ? styles.navOpen : ""}`}>
      <div className={styles.nav100}>
        <div className={styles.navRiver} aria-hidden="true">
          <span className={`${styles.riverLane} ${styles.riverLeft}`}>
            <span className={styles.riverTexture}></span>
          </span>
          <span className={`${styles.riverLane} ${styles.riverRight}`}>
            <span className={styles.riverTexture}></span>
          </span>
        </div>
        {/* Avatar do usuário */}
        {user ? (
          <Link href="/conta">
            <Image
              className={styles.perfil}
              src={`data:image/jpeg;base64,${user.foto_usuario}`}
              alt="Perfil"
              width={40}
              height={40}
            />
          </Link>
        ) : (
          <div className={styles.iconContainer}>
            <FaUser size={40} /> {/* Ícone de fallback */}
          </div>
        )}
        <div className={styles.notificacoes}>
          <Notificacoes usuarioId={user?.id} />
        </div>
        <div className={styles.comunidadeUser}>
          <ComunidadesUsuario usuarioId={user?.id} />
        </div>

        <AnimatedNavbarLogo />

        {/* Menu Toggle */}
        <div className={styles.menuIconContainer}>
          <FaBars
            size={45}
            color="#fff"
            onClick={toggleMenu}
            className={styles.menuIcon}
          />
        </div>
      </div>

      {/* Itens do menu com base nas permissões */}
      <ul
        className={styles.navHover}
        style={{ display: menuOpen ? "block" : "none" }} // Exibe ou oculta o menu
      >
        <div className={styles.menuContent}>
          {rotas
            .filter((rota) => verificarAcesso(rota.path))
            .map((rota) => (
              <li key={rota.path} className={styles.navItem}>
                <Link href={rota.path} onClick={fecharMenu}>
                  {rota.icon}
                  {rota.label}
                </Link>
              </li>
            ))}
        </div>
      </ul>
    </nav>
  );
}
