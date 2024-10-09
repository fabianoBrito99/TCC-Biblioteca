"use client";
import { useFormState, useFormStatus } from "react-dom";
import Button from "@/componentes/forms/button";
import Input from "@/componentes/forms/input";
import React from "react";
import styles from "@/componentes/login/login-form.module.css";

function FormButton() {
  const { pending } = useFormStatus();
  return (
    <>
      {pending ? (
        <Button disabled={pending}>Cadastrando...</Button>
      ) : (
        <Button>Cadastrar</Button>
      )}
    </>
  );
}

export default function LoginCriarForm() {

  return (
    <form className={styles.form}>
      <Input label="Usuário" name="username" type="text" />
      <Input label="Email" name="email" type="email" />
      <Input label="Senha" name="password" type="password" />

      <FormButton />
    </form>
  );
}
