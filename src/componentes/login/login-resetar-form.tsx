"use client";
import login from "@/actions/login";
import { useFormState, useFormStatus } from "react-dom";
import Button from "@/componentes/forms/button";
import Input from "@/componentes/forms/input";
import React from "react";
import styles from "@/components/login/login-form.module.css";


function FormButton() {
  const { pending } = useFormStatus();
  return (
    <>
      {pending ? (
        <Button disabled={pending}>Resetando...</Button>
      ) : (
        <Button>Resetar senha</Button>
      )}
    </>
  );
}

export default function LoginResetarForm(){

  return (
    <form className={styles.form}>
      <Input label="Nova senha" name="passwword" type="password" />
      <input type="hidden" name = 'login' />
      <input type="hidden" name = 'key' />

      <FormButton />
    </form>
  );
}
