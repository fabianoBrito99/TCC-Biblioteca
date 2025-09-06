import BookContainer from "@/componentes/login/livro-container";
import { Metadata } from "next";
import styles from "./login.module.css";
import PermissaoModal from "@/componentes/login/PermissaoModal";

export const metadata: Metadata = {
  title: "Login",
  description: "Login no site.",
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};

  const from = sp.from;
  const errorParam = sp.error;

  // normaliza possíveis arrays vindos da URL
  const fromMw = (Array.isArray(from) ? from[0] : from) === "mw";
  const error = (Array.isArray(errorParam) ? errorParam[0] : errorParam) ?? "";

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
