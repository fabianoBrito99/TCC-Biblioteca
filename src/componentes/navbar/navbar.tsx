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
} from "react-icons/fa"; // Importa ícones do react-icons
import styles from "@/componentes/navbar/navbar.module.css";
import Notificacoes from "../notificacoes/notificacoes";
import ComunidadesUsuario from "../comunidade/listar-comunidade-do-usuario";
import Image from "next/image";

type User = {
  id: string;
  foto_usuario: string | null;
  tipo_usuario: string;
};

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();

  // Rotas e permissões
  const rotas = [
    { path: "/livros", label: "Livros", icon: <FaBook /> },
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
    const fetchUserData = async () => {
      const userId = localStorage.getItem("userId");
      if (userId) {
        try {
          const res = await fetch(
            `http://localhost:4000/api/usuario/${userId}`
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
        {/* Avatar do usuário */}
        {user ? (
          <Link href={`/conta/${user.id}`}>
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

        <div>
          <Image className={styles.logo} src="/img/Frame8.png" alt="" width={300} height={100}/>
        </div>

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
