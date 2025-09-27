"use client";
import React, { useState, useEffect } from "react";
import LoginForm from "./login-form";
import LoginCriarForm from "./login-criar-form";
import styles from "./livro-container.module.css";
import Image from "next/image";

export default function BookContainer() {
  const [isLogin, setIsLogin] = useState(true);
  const [animateText, setAnimateText] = useState(true);

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setAnimateText(false);
  };

  useEffect(() => {
    setAnimateText(true);
  }, [isLogin]);

  return (
    <div className={styles.bookContainer}>
      <div
        className={`${styles.book} ${
          isLogin ? styles.showLogin : styles.showRegister
        }`}
      >
        <div
          className={`${styles.staticSection} ${
            isLogin ? styles.leftPage : styles.rightPage
          }`}
        >
          <div className={styles.logo}>
            <div className={styles.text}>
              <p>
                <span className={styles.nome}>HELENA </span>
                <span className={styles.sobrenome}>RAMAZZOTTE</span>
                <span className={styles.biblioteca}>BIBLIOTECA</span>
              </p>
            </div>{" "}
            <Image
              className={styles.logoFogo}
              src="/img/logoFogo.png"
              alt="Logo"
              width={390}
              height={80}
            />
          </div>
          <h2
            className={`${styles.titleLogin} ${
              animateText
                ? isLogin
                  ? styles.animeLeft1
                  : styles.animeRight1
                : ""
            }`}
          >
            {isLogin ? "Login" : "Cadastre-se"}
          </h2>

          <p
            className={`${styles.subTitle} ${
              animateText
                ? isLogin
                  ? styles.animeLeft1
                  : styles.animeRight1
                : ""
            }`}
          >
            {isLogin ? "Bem-vindo de volta!" : "Junte-se a nós!"}
          </p>
        </div>

        <div
          className={`${styles.rotatingSection} ${
            isLogin ? styles.rightPage : styles.leftPage
          }`}
        >
          {isLogin ? (
            <LoginForm onToggle={handleToggle} />
          ) : (
            <LoginCriarForm onToggle={handleToggle} />
          )}
        </div>
      </div>
    </div>
  );
}
