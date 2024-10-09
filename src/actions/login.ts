'use server';

import { cookies } from 'next/headers';

export default async function login(state: {}, formData: FormData) {
  const username = formData.get('username') as string | null;
  const password = formData.get('password') as string | null;

  try {
    if (!username || !password) throw new Error('Preencha os dados.');
   
    return { data: null, ok: true, error: '' };
  } catch (error: unknown) {

  }
}
