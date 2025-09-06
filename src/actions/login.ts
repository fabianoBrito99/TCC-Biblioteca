"use server";

import apiError from "@/functions/api-error";
import { cookies } from "next/headers";

export interface LoginResponse {
  data: { id_usuario: string } | null;
  ok: boolean;
  error: string;
}

interface ApiLoginResponse {
  token: string;
  usuario: { id_usuario: string };
}

export default async function login(
  _state: unknown,
  formData: FormData
): Promise<LoginResponse> {
  const email = formData.get("username");
  const password = formData.get("password");

  try {
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      throw new Error("Os campos não podem ser vazios");
    }

    const response = await fetch("https://api.helenaramazzotte.online/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha: password }),
      // credenciais não são necessárias aqui porque o cookie será setado no servidor via cookies()
    });

    if (!response.ok) {
      throw new Error("Usuário ou senha inválidos.");
    }

    const data: ApiLoginResponse = (await response.json()) as ApiLoginResponse;

    const cookieStore = await cookies(); // <<-- Next 15: cookies() é async
    cookieStore.set("token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 dia
      path: "/",
    });

    return { data: { id_usuario: data.usuario.id_usuario }, ok: true, error: "" };
  } catch (error: unknown) {
    return apiError(error);
  }
}
