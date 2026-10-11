"use server";

import { cookies, headers } from "next/headers";

export interface LoginResponse {
  data: { id_usuario: string; tipo_usuario?: string } | null;
  ok: boolean;
  error: string;
}

interface ApiLoginResponse {
  token?: unknown;
  usuario?: { id_usuario?: unknown; tipo_usuario?: unknown };
}

const API_BASE =
  process.env.API_BASE_URL ||
  (process.env.NODE_ENV === "production"
    ? "http://127.0.0.1:4000"
    : process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://127.0.0.1:4000");

const LOGIN_UNAVAILABLE =
  "Não foi possível entrar agora. Tente novamente em instantes.";

export default async function login(
  _state: unknown,
  formData: FormData
): Promise<LoginResponse> {
  const email = formData.get("username");
  const password = formData.get("password");
  const cookieStore = await cookies();
  const requestHeaders = await headers();

  const fail = (error: string): LoginResponse => {
    cookieStore.delete("token");
    cookieStore.delete("tipo_usuario");
    return { data: null, ok: false, error };
  };

  try {
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return fail("Informe seu usuário/e-mail e sua senha.");
    }

    const appOrigin =
      process.env.APP_ORIGIN || "https://app.helenaramazzotte.online";
    const clientIp = requestHeaders.get("x-real-ip");
    const apiHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Origin: appOrigin,
    };
    if (clientIp) apiHeaders["X-Forwarded-For"] = clientIp;

    const response = await fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({ email: email.trim(), senha: password }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    const data = (await response.json().catch(() => null)) as
      | ApiLoginResponse
      | null;

    if (!response.ok) {
      if (response.status === 400) {
        return fail("Informe seu usuário/e-mail e sua senha.");
      }
      if (response.status === 401) {
        return fail("Usuário/e-mail ou senha incorretos.");
      }
      if (response.status === 429) {
        return fail(
          "Muitas tentativas de acesso. Aguarde um minuto e tente novamente."
        );
      }
      console.error("[login] API respondeu com status", response.status);
      return fail(LOGIN_UNAVAILABLE);
    }

    const userId = data?.usuario?.id_usuario;
    if (
      typeof data?.token !== "string" ||
      (typeof userId !== "string" && typeof userId !== "number")
    ) {
      console.error("[login] Resposta inválida da API de autenticação");
      return fail(LOGIN_UNAVAILABLE);
    }

    cookieStore.set("token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    cookieStore.delete("tipo_usuario");

    return {
      data: {
        id_usuario: String(userId),
        tipo_usuario:
          typeof data.usuario?.tipo_usuario === "string"
            ? data.usuario.tipo_usuario
            : undefined,
      },
      ok: true,
      error: "",
    };
  } catch (error: unknown) {
    console.error("[login] Falha ao acessar a API:", error);
    return fail(LOGIN_UNAVAILABLE);
  }
}
