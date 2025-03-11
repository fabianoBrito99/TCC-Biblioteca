// src/actions/login.ts
'use server';

import apiError from '@/functions/api-error';
import { cookies } from 'next/headers';

export interface LoginResponse {
  data: { id_usuario: string } | null;
  ok: boolean;
  error: string;
}

export default async function login(state: object, formData: FormData): Promise<LoginResponse> {
  const email = formData.get('username') as string | null;
  const password = formData.get('password') as string | null;

  try {
    if (!email || !password) throw new Error(`Os campos não podem ser vazios`);

    const response = await fetch('http://localhost:4000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, senha: password }),
    });

    if (!response.ok) throw new Error('Usuário ou senha inválidos.');
    const data = await response.json();

    cookies().set('token', data.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    });

    return { data: { id_usuario: data.usuario.id_usuario }, ok: true, error: '' };
  } catch (error: unknown) {
    return apiError(error);
  }
}
