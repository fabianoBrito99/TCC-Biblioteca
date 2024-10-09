import LoginCriarForm from "@/componentes/login/login-criar-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crie sua conta",
  description: "Crie sua conta no site Dogs.",
};
export default async function CriarPage() {
  return (
    <main className="animeLeft">
      <h1 className="title">Cadastre-se</h1>
      <LoginCriarForm />
    </main>
  );
}
