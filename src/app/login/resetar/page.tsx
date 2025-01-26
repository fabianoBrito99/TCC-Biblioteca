import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resetar Senha",
  description: "Resete sua Senha.",
};
type ResetarSeachParams = {
  searchParams: {
    key: string;
    login: string;
  };
};
export default async function ResetarPage({
  //searchParams,
}: ResetarSeachParams) {
  return (
    <div className="animeLeft">
      <h1 className="title">Resete sua senha</h1>
    </div>
  );
}
