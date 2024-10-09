import LoginPerdeuForm from "@/componentes/login/login-perdeu-forms";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Esqueceu sua senha",
  description: "Recupere sua senha",
};

// export const dynamic = "force-dynamic";

export default async function PerdeuPage() {
  return (
    <div className="animeLeft">
      <h1 className="title">Perdeu a senha?</h1>
      <LoginPerdeuForm />
    </div>
  );
}
