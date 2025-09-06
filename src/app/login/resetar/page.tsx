import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resetar Senha",
  description: "Resete sua Senha.",
};

type ResetarParams = {
  key?: string;
  login?: string;
};

export default async function ResetarPage({
  searchParams,
}: {
  searchParams?: Promise<ResetarParams>;
}) {
  const sp = (await searchParams) ?? {};
  const token = sp.key ?? "";
  const login = sp.login ?? "";

  const hasParams = token.length > 0 && login.length > 0;

  return (
    <div className="animeLeft">
      <h1 className="title">Resete sua senha</h1>

      {!hasParams ? (
        <p>Link inválido ou incompleto. Verifique se o endereço contém <code>?key=…&amp;login=…</code>.</p>
      ) : (
        <form className="formReset" action="/api/resetar" method="post">
          {/* Campos ocultos para enviar o token e o login */}
          <input type="hidden" name="key" value={token} />
          <input type="hidden" name="login" value={login} />

          <div className="field">
            <label htmlFor="senha">Nova senha</label>
            <input id="senha" name="senha" type="password" required minLength={8} />
          </div>

          <div className="field">
            <label htmlFor="senha2">Confirmar nova senha</label>
            <input id="senha2" name="senha2" type="password" required minLength={8} />
          </div>

          <button type="submit">Alterar senha</button>
        </form>
      )}
    </div>
  );
}
