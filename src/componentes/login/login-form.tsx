// src/pages/login/page.tsx
"use client";

import login from "@/actions/login";
import { useState, FormEvent } from "react";
import Button from "@/componentes/forms/button";
import Input from "@/componentes/forms/input";
import ErrorMessage from "../helper/error-message";
import Link from "next/link";
import styles from "./login-form.module.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Image from "next/image";


function FormButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <Button disabled={isSubmitting}>
      {isSubmitting ? "Enviando..." : "Entrar"}
    </Button>
  );
}

type LoginFormProps = {
  onToggle: () => void;
};

const LOGIN_ERROR_FALLBACK =
  "Não foi possível entrar agora. Tente novamente em instantes.";
const LOGIN_ERRORS = new Set([
  "Informe seu usuário/e-mail e sua senha.",
  "Usuário/e-mail ou senha incorretos.",
  "Muitas tentativas de acesso. Aguarde um minuto e tente novamente.",
  LOGIN_ERROR_FALLBACK,
]);

function getLoginErrorMessage(error: unknown) {
  return typeof error === "string" && LOGIN_ERRORS.has(error)
    ? error
    : LOGIN_ERROR_FALLBACK;
}

export default function LoginForm({ onToggle }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  //ver a senha
  const toggleShowPassword = () => setShowPassword((prev) => !prev);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await login(
        {},
        new FormData(e.currentTarget as HTMLFormElement)
      );


      if (response.ok && response.data) {
        const userId = response.data.id_usuario;
        const next = new URLSearchParams(window.location.search).get("next");
        const redirectTo = next?.startsWith("/") ? next : "/homecards";

        localStorage.setItem("userId", userId); // Salva o ID do usuário no localStorage
        localStorage.removeItem("token");
        window.location.assign(redirectTo);
      } else {

        setError(getLoginErrorMessage(response.error));
      }
    } catch {
      setError(LOGIN_ERROR_FALLBACK);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h1 className={styles.h1Login}>Informe os dados para Login</h1>
        <Input
          label="Usuário"
          name="username"
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError(null);
          }}
          autoComplete="username"
          maxLength={254}
          required
        />
        <div className={styles.passwordContainer}>
          {/* Campo de senha */}
          <Input
            label="Senha"
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            autoComplete="current-password"
            maxLength={128}
            required
          />

          {/* Ícone para exibir/ocultar a senha */}
          <button
            type="button"
            onClick={toggleShowPassword}
            className={`${styles.eyeIcon} ${
              showPassword ? styles.highlight : ""
            }`}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>

          {/* Ícone do marca-texto */}
          <div
            className={`${styles.markerIcon} ${
              showPassword ? styles.animateMarker : ""
            }`}
          >
            <Image src="/img/marcatexto.png" alt="Perfil" width={140} height={940} />
          </div>

          {/* Animação de marca-texto */}
          <div
            className={`${styles.highlightEffect} ${
              showPassword ? styles.visible : ""
            }`}
          ></div>
        </div>
        {error && <ErrorMessage error={error} />}
        <FormButton isSubmitting={isSubmitting} />
      </form>
      <Link className={styles.perdeu} href="/login/perdeu">
        Perdeu a senha?
      </Link>
      <div className={styles.cadastro}>
        <h2 className={styles.subtitle2}>Cadastre-se</h2>
        <p>Ainda não possui conta? Cadastre-se no site.</p>
        <button className={styles.button3} onClick={onToggle}>
          Cadastre-se
        </button>
      </div>
    </div>
  );
}
