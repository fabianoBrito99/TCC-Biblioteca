import BookContainer from "@/componentes/login/livro-container";
import { Metadata } from "next";
import styles from "./login.module.css";
import PermissaoModal from "@/componentes/login/PermissaoModal";

export const metadata: Metadata = {
  title: "Login",
  description: "Login no site.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const fromMw = searchParams?.from === "mw";
  const error = (searchParams?.error as string) || "";

  const showModal = fromMw && (error === "permissao" || error === "auth");
  const mensagem =
    error === "permissao"
      ? "Você não tem permissão para acessar essa rota."
      : "Você não tem permissão para acessar essa rota, Faça login para continuar.";

  return (
    <section className={`${styles.containerLogin} animeLeft`}>
      {showModal && <PermissaoModal showInitially mensagem={mensagem} />}
      <BookContainer />
    </section>
  );
}
