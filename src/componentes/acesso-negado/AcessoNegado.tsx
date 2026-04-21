"use client";

import Link from "next/link";
import styles from "./acesso-negado.module.css";

export default function AcessoNegado() {
  return (
    <div className={styles.wrap}>
      <h1>404</h1>
      <p>Essa rota não existe ou você não tem acesso para acessar essa página.</p>
      <p>Solicite para algum dos administradores ou volte e faça login com um perfil diferente.</p>
      <div className={styles.actions}>
        <Link href="/homecards" className={styles.btn}>
          Voltar para Home
        </Link>
        <Link href="/login" className={styles.btnSecondary}>
          Ir para Login
        </Link>
      </div>
    </div>
  );
}
