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
    <div className={styles.logoStage} aria-label="Helena Ramazzotte">
      <svg
        className={styles.logoSvg}
        viewBox="0 0 640 180"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="logo-h-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#031b35" />
            <stop offset="100%" stopColor="#27210c" />
          </linearGradient>

          <linearGradient
            id="logo-book-fill"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="54%" stopColor="#fffaf0" />
            <stop offset="100%" stopColor="#ead8b8" />
          </linearGradient>

          <linearGradient
            id="logo-book-flip-fill"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="62%" stopColor="#fff8e8" />
            <stop offset="100%" stopColor="#e7d2ad" />
          </linearGradient>
        </defs>

        <g className={styles.logoLetterGroup}>
          <path
            className={styles.logoLetterMain}
            d="M18 28 C18 22 22 18 28 18 H53 C59 18 63 22 63 28 V72 H98 V28 C98 22 102 18 108 18 H133 C139 18 143 22 143 28 V148 C143 154 139 158 133 158 H108 C102 158 98 154 98 148 V101 H63 V148 C63 154 59 158 53 158 H28 C22 158 18 154 18 148 Z"
          />
          <path
            className={styles.logoLetterInset}
            d="M36 36 H47 V141 H36 Z M114 36 H125 V141 H114 Z M59 82 H103 V93 H59 Z"
          />
        </g>

        <g className={styles.logoBookGroup}>
          <g className={styles.logoBookPlacement}>
            <ellipse
              className={styles.logoBookShadow}
              cx="81"
              cy="140"
              rx="58"
              ry="8"
            />

            <g className={styles.logoBookPages}>
              <path
                className={`${styles.logoBookPage} ${styles.logoBookLeftPage}`}
                d="M81 49 C68 40 50 40 32 51 L32 122 C50 113 68 114 81 128 Z"
              />
              <path
                className={`${styles.logoBookPage} ${styles.logoBookRightPage}`}
                d="M81 49 C95 40 114 40 132 52 L132 123 C114 114 95 114 81 128 Z"
              />

              <path
                className={styles.logoPageLine}
                d="M44 65 C55 60 67 61 76 68"
              />
              <path
                className={styles.logoPageLine}
                d="M44 80 C56 75 68 76 76 83"
              />
              <path
                className={styles.logoPageLine}
                d="M44 95 C56 90 68 91 76 98"
              />
              <path
                className={styles.logoPageLine}
                d="M92 68 C103 61 116 62 126 69"
              />
              <path
                className={styles.logoPageLine}
                d="M92 84 C104 77 117 78 126 85"
              />
              <path
                className={styles.logoPageLine}
                d="M92 99 C104 92 117 93 126 100"
              />

              <path
                className={styles.logoBookFlipPage}
                d="M81 49 C95 40 114 40 132 52 L132 123 C114 114 95 114 81 128 Z"
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
                    M81 49 C81 49 81 49 81 49 L81 128 C81 128 81 128 81 128 Z;
                    M81 49 C95 40 114 40 132 52 L132 123 C114 114 95 114 81 128 Z;
                    M81 49 C92 43 102 43 112 50 L112 123 C102 117 92 117 81 128 Z;
                    M81 49 C76 45 70 45 65 50 L65 123 C70 118 76 118 81 128 Z;
                    M81 49 C68 40 50 40 32 51 L32 122 C50 113 68 114 81 128 Z;
                    M81 49 C81 49 81 49 81 49 L81 128 C81 128 81 128 81 128 Z
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

              <path className={styles.logoBookSpine} d="M81 47 V130" />
            </g>

            <g className={styles.logoCrossGroup}>
              <path className={styles.logoCrossVertical} d="M81 22 V42" />
              <path className={styles.logoCrossHorizontal} d="M74 32 H88" />
            </g>

            <path className={styles.logoBookWave} d="M31 134 C53 125 109 125 133 134" />
          </g>
        </g>

        <g className={styles.logoNameGroup}>
          <text x="160" y="80" className={styles.logoNameTop}>
            elena
          </text>
          <text x="156" y="150" className={styles.logoNameBottom}>
            Ramazzotte
          </text>
        </g>

        {/* Pomba baseada no SVG de referência.
            O pouso/saída/retorno fica em navbar.module.css:
            procure por "TEMPOS DA POMBA" para ajustar os tempos. */}
        {/* TAMANHO/POSICAO DA POMBA:
            - O tamanho e os 3 pontos do voo ficam em navbar.module.css.
            - Procure por "POMBA: VOO PELA NAVBAR".
            - Ponto de pouso atual: translate(359px, 3px).
        */}
        <g className={styles.logoDoveFlight}>
          <g className={styles.logoDoveGroup}>
            <g className={styles.logoDoveBranchFall}>
              <g
                className={styles.logoDoveBranch}
                transform="matrix(0.728562 0.728559 -0.628711 0.628709 7.540937 -34.214481)"
              >
                <path d="M122.064 146.316 C97.064 152.316 60 160 40 162" />
                <path d="M124.992 146.002 C137.78 143.01 154.99 143.002 154.99 143.002" />
                <path
                  className={styles.logoDoveBranchBase}
                  d="M122.91 151.517 C135.263 141.974 156.107 113.215 150.071 106.589 L123.333 149.351 L122.91 151.517 Z"
                />
                <path
                  className={styles.logoDoveLeaf}
                  d="M40 162 C25 155 10 160 2 165 C12 175 30 172 40 162 Z"
                />
                <path
                  className={styles.logoDoveLeaf}
                  d="M75 157 C65 140 55 125 48 115 C45 130 58 150 75 157 Z"
                />
                <path
                  className={styles.logoDoveLeaf}
                  d="M65 160 C50 170 40 185 42 198 C54 190 62 175 65 160 Z"
                />
                <path
                  className={styles.logoDoveLeaf}
                  d="M99.699 152.581 C95.699 132.581 89.699 118.581 85.699 108.581 C79.699 122.581 87.699 142.581 99.699 152.581 Z"
                />
                <path
                  className={styles.logoDoveLeaf}
                  d="M95 154 C85 168 80 185 84 195 C94 185 98 170 95 154 Z"
                />
              </g>
            </g>

            <g className={styles.logoDoveTail}>
              <path d="M520 400 C600 450 700 490 750 490 C750 460 680 400 560 360 Z" />
              <path d="M500 370 C580 400 680 440 730 445 C730 430 650 370 540 345 Z" />
            </g>

            <path
              className={styles.logoDoveChest}
              d="M193.121 217.869 C153.121 267.869 159.728 379.971 219.728 429.971 C279.728 469.971 359.728 469.971 419.728 449.971 C479.728 429.971 559.728 409.971 619.728 409.971 C549.728 369.971 517.761 308.712 467.761 308.712 C387.761 308.712 410.597 247.702 193.121 217.869 Z"
            />

            <g className={styles.logoDoveWingMain}>
              <path
                className={styles.logoDoveWingMainShape}
                d="M280.061 220.218 C345.061 208.218 577.99 286.329 657.99 336.329 C677.99 351.329 560.262 351.52 500.262 371.52 C420.262 391.52 310 380 260 300 C240 260 265.061 233.218 280.061 220.218 Z"
              />
              <path
                className={styles.logoDoveWingInner}
                d="M290 230 Q310 250 330 235 Q350 255 370 240 Q390 260 410 245 M280 260 Q305 280 330 265 Q355 285 380 270 Q405 290 430 275 M285 295 Q310 315 340 300 Q370 320 400 305 Q430 325 460 310"
              />
              <path
                className={styles.logoDoveWingShadow}
                d="M292 233 Q312 253 332 238 M282 263 Q307 283 332 268"
              />
            </g>

            <g className={styles.logoDoveBody}>
              <path
                className={styles.logoDoveHead}
                d="M190 220 C180 180 150 150 170 100 C190 60 260 55 300 90 C330 115 398.637 199.718 438.637 249.718 C388.637 279.718 250 250 190 220 Z"
              />
            </g>

            <g className={styles.logoDoveBeak}>
              <path d="M160 115 C140 120 96.56 138.61 96.1 155.559 C105.234 144.295 140 145 165 140 L160 115 Z" />
              <path
                className={styles.logoDoveBeakDetail}
                d="M152 119 C142 122 130 132 135 142 C145 140 155 132 160 124 Z"
              />
              <ellipse
                className={styles.logoDoveNostril}
                cx="142"
                cy="134"
                rx="2"
                ry="1"
                transform="rotate(-15 142 134)"
              />
            </g>

            <g className={styles.logoDoveEye}>
              <circle className={styles.logoDoveEyeRing} cx="206" cy="118" r="24" />
              <circle className={styles.logoDoveEyeIrisOuter} cx="206" cy="118" r="20" />
              <circle className={styles.logoDoveEyeIrisInner} cx="206" cy="118" r="13" />
              <g className={styles.logoDoveEyeBlink}>
                <circle className={styles.logoDovePupil} cx="206" cy="118" r="9" />
                <circle className={styles.logoDoveEyeHighlight} cx="202" cy="114" r="2.5" />
              </g>
            </g>

            <g className={styles.logoDoveFeet}>
              <path d="M310.326 445.275 C319.186 446.115 316.776 455.871 315.438 461.209 C311.964 475.073 299.559 487.598 289.728 494.971" />
              <path d="M290 495 Q260 495 240 490" />
              <path d="M290 495 Q265 510 250 515" />
              <path d="M290 495 C306.683 500.509 319.196 504.641 327.538 507.395" />
              <path d="M365.597 441.243 C381.633 455.383 365.389 492.726 351.503 505.247" />
              <path d="M360 505 Q330 505 305 498" />
              <path d="M360 505 Q335 525 315 535" />
              <path d="M360 505 C366.667 521.667 407.775 506.744 414.442 513.411" />
            </g>
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
