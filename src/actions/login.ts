// src/actions/login.ts
'use server';

import apiError from '@/functions/api-error';
import { cookies } from 'next/headers';

export default async function login(state: {}, formData: FormData) {
  const email = formData.get('username') as string | null;
  const password = formData.get('password') as string | null;

  try {
    if (!email || !password) throw new Error('Preencha os dados.');

    const response = await fetch('http://localhost:4000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, senha: password }),
    });

    if (!response.ok) throw new Error('Email ou senha inválidos.');
    const data = await response.json();

    // Se houver um token na resposta, você pode armazená-lo nos cookies
    // Caso seu backend retorne um token, ajusta o retorno aqui
    cookies().set('token', data.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    });

    return { data: null, ok: true, error: '' };
  } catch (error: unknown) {
    return apiError(error);
  }
}
