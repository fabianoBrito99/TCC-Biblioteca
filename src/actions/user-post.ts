"use server";

import login from "./login";

export default async function userPost(state: {}, formData: FormData) {
  const username = formData.get("username") as string | null;
  const email = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;

  try {
    if (!username || !email || !password) throw new Error("Preencha os dados.");
    if(password.length < 6) throw new Error('A senha deve ter mais de 6 caracteres')
  
    return { data: null, ok: true, error: "" };
  } catch (error: unknown) {

  }
}
