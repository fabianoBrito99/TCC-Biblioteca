"use server";

import apiError from "@/functions/api-error";
import { cookies } from "next/headers";

export interface LoginResponse {
  data: { id_usuario: string; tipo_usuario?: string } | null;
  ok: boolean;
  error: string;
}

interface ApiLoginResponse {
  token: string;
  usuario: { id_usuario: string; tipo_usuario?: string };
}

export default async function login(
  _state: unknown,
  formData: FormData
): Promise<LoginResponse> {
  const email = formData.get("username");
  const password = formData.get("password");
  const cookieStore = await cookies();

  try {
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      throw new Error("Os campos não podem ser vazios");
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.helenaramazzotte.online";
    const appOrigin = process.env.APP_ORIGIN || "https://app.helenaramazzotte.online";
    const response = await fetch(`${apiBaseUrl}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: appOrigin,
      },
      body: JSON.stringify({ email, senha: password }),
      // credenciais não são necessárias aqui porque o cookie será setado no servidor via cookies()
    });

    if (!response.ok) {
      throw new Error("Usuário ou senha inválidos.");
    }

    const data: ApiLoginResponse = (await response.json()) as ApiLoginResponse;

    cookieStore.set("token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 dia
      path: "/",
    });

    cookieStore.delete("tipo_usuario");

    return {
      data: {
        id_usuario: data.usuario.id_usuario,
        tipo_usuario: data.usuario.tipo_usuario,
      },
      ok: true,
      error: "",
    };
  } catch (error: unknown) {
    cookieStore.delete("token");
    cookieStore.delete("tipo_usuario");
    return apiError(error);
  }
}
