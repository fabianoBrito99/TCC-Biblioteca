import LoginForm from "@/componentes/login/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login no site.',
};

export default async function LoginPage() {
  return (
    <section className="animeLeft">
      <h1 className="title">Login</h1>
      <LoginForm />
      
    </section>
  );
}
