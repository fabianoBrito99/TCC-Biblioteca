"use client";
import Input from "@/componentes/forms/input";
import React from "react";
import styles from "@/componentes/login/login-form.module.css";


// function FormButton() {
//   const { pending } = useFormStatus();
//   return (
//     <>
//       {pending ? (
//         <Button disabled={pending}>Enviando...</Button>
//       ) : (
//         <Button>Enviar Email</Button>
//       )}
//     </>
//   );
// }

export default function LoginPerdeuForm() {

  return (
    <form className={styles.form}>
      <Input label="Email / Usuário" name="login" type="text" />
      <input
        type="hidden"
        name="url"

      />
    
    </form>
  );
}
