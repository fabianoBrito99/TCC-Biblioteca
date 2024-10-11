"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import styles from "@/componentes/navbar/navbar.module.css";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev); // Alterna o estado do menu
  };

  return (
    <nav className={`${styles.navMenu} ${menuOpen ? styles.navOpen : ""}`}>
      <div className={styles.nav100}>
        <Image
          className={styles.perfil}
          src="/img/perfil.jpg"
          alt="Perfil"
          width={40}
          height={40}
        />
        <div className={styles.inputContainer1}>
          <svg className={styles.icon} aria-hidden="true" viewBox="0 0 24 24">
            <g>
              <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z" />
            </g>
          </svg>
          <input
            placeholder="Pesquisar.."
            id="pesquisar"
            className={styles.input}
            name="text"
            type="text"
          />
        </div>
        <div id="sugestoes" className={styles.sugestoesContainer}></div>
        <div className={styles.menuIconContainer}>
          <Image
            className={`${styles.menu3Pontinhos} ${menuOpen ? styles.rotated : ""}`}
            id="home-icon"
            src="/img/3pontinhos.png"
            alt="Abrir Menu"
            width={40}
            height={35}
            onClick={toggleMenu}
          />
        </div>
      </div>
      <ul className={styles.navHover}>
        <div className={styles.menuContent}>
          <li className={styles.navItem}>
            <Link href="/livros">
              <Image
                src="/img/livros.png"
                alt="Livros"
                width={20}
                height={20}
              />
              Livros
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link href="/cadastrar-livro">
              <Image
                src="/img/livro.png"
                alt="Cadastrar Livro"
                width={20}
                height={20}
              />
              Cadastrar Livro
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link href="/emprestimos">
              <Image
                src="/img/empr-livro.png"
                alt="Empréstimos"
                width={20}
                height={20}
              />
              Empréstimos
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link href="/usuarios">
              <Image
                src="/img/users.png"
                alt="Usuários"
                width={20}
                height={20}
              />
              Usuários
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link href="/">
              <Image src="/img/home.png" alt="Home" width={20} height={20} />
              Home
            </Link>
          </li>
          <li className={`${styles.navItem} ${styles.sair}`}>
            <Link href="/login">
              <Image src="/img/sair.png" alt="Sair" width={20} height={20} />
              Sair
            </Link>
          </li>
        </div>
      </ul>
    </nav>
  );
}
