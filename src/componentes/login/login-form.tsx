"use client";
import login from "@/actions/login";
import { useFormState, useFormStatus } from "react-dom";
import Button from "@/componentes/forms/button";
import Input from "@/componentes/forms/input";
import ErrorMessage from "../helper/error-message";
import React from "react";
import Link from "next/link";
import styles from "./login-form.module.css";

function FormButton() {
  const { pending } = useFormStatus();
  return (
    <>
      {pending ? (
        <Button disabled>Enviando...</Button>
      ) : (
        <Button>Entrar</Button>
      )}
    </>
  );
}

type LoginFormProps = {
  onToggle: () => void;
};

export default function LoginForm({ onToggle }: LoginFormProps) {
  const [state, action] = useFormState(login, {
    ok: false,
    error: "",
    data: null,
  });

  React.useEffect(() => {
    if (state.ok) window.location.href = "/conta";
  }, [state.ok]);

  return (
    <div>
      <form action={action} className={styles.form}>
        <h1 className={styles.h1Login}>Informe os dados para Login</h1>
        <Input label="Usuário" name="username" type="text" />
        <Input label="Senha" name="password" type="password" />
        <ErrorMessage error={state.error} />
        <FormButton />
      </form>
      <Link className={styles.perdeu} href="/login/perdeu">
        Perdeu a senha?
      </Link>
      <div className={styles.cadastro}>
        <h2 className={styles.subtitle}>Cadastre-se</h2>
        <p>Ainda não possui conta? Cadastre-se no site.</p>
        <button className={styles.button2} onClick={onToggle}>
          Cadastre-se
        </button>
      </div>
    </div>
  );
}
