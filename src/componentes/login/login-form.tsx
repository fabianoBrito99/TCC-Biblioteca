"use client";
import login from "@/actions/login";
import { useFormState, useFormStatus } from "react-dom";
import Button from "@/componentes/forms/button";
import Input from "@/componentes/forms/input";
import ErrorMessage from "../helper/error-message";
import React from "react";
import Link from "next/link";
import styles from '@/componentes/login/login-form.module.css'

function FormButton() {
  const { pending } = useFormStatus();
  return (
    <>
      {pending ? (
        <Button disabled={pending}>Enviando...</Button>
      ) : (
        <Button>Entrar</Button>
      )}
    </>
  );
}

export default function LoginForm() {


  return (
    <>
      <form  className= {styles.form}>
        <Input label="Usuário" name="username" type="text"/>
        <Input label="Senha" name="password" type="password"/>
        <FormButton />
      </form>
      <Link className= {styles.perdeu} href="/login/perdeu" >Esqueceu a senha?</Link>
      <div className={styles.cadastro}>
        <h2 className={styles.subtitle}>Cadastre-se</h2>
        <p>Ainda não possui conta? Cadastre-se no site.</p>
        <Link className="button" href="/login/criar">
          Cadastro
        </Link>
      </div>
    </>
  );
}
