import BookContainer from "@/componentes/login/livro-container";
import { Metadata } from "next";
import styles from './login.module.css'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login no site.',
};

export default async function LoginPage() {
  return (
    <section className={`${styles.containerLogin} animeLeft`}>
      <BookContainer />
    </section>
  );
}
