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
            <stop offset="58%" stopColor="#ffe288" />
            <stop offset="100%" stopColor="#f4b63d" />
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
          <text x="118" y="46" className={styles.logoNameTop}>
            ELENA
          </text>
          <text x="118" y="82" className={styles.logoNameBottom}>
            RAMAZZOTTE
          </text>
        </g>

        <g className={styles.logoBookGroup}>
          <g className={styles.logoBookPlacement}>
            <path
              className={styles.logoBookBase}
              d="M229 69c10-5 22-5 32 0 5 2 8 4 9 6h-50c2-2 5-4 9-6Z"
            />
            <g className={styles.logoBookLeftPage}>
              <path
                className={styles.logoBookPage}
                d="M239 33c-10 0-18 4-25 9v24c7-4 15-6 25-6V33Z"
              />
            </g>
            <g className={styles.logoBookRightPage}>
              <path
                className={styles.logoBookPage}
                d="M239 33c10 0 18 4 25 9v24c-7-4-15-6-25-6V33Z"
              />
            </g>
            <path className={styles.logoBookSpine} d="M239 33v34" />
            <g className={styles.logoCrossGroup}>
              <path className={styles.logoCrossVertical} d="M243 14v20" />
              <path className={styles.logoCrossHorizontal} d="M236 22h14" />
            </g>
            <path className={styles.logoBookWave} d="M218 75c13-8 31-8 43 0" />
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
