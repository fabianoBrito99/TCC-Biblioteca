"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./listaUsuario.module.css";
import Image from "next/image";

interface Usuario {
  id_usuario: number;
  nome_login: string;
  email: string;
  tipo_usuario: string;
  foto_usuario: string;
}

const UsuariosList: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/usuario");
        if (!response.ok) {
          throw new Error("Erro ao buscar usuários");
        }
        const data = await response.json();
        setUsuarios(data.dados || []);
      } catch {
        setError("Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, []);

  if (loading) return <div>Carregando usuários...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div className={styles.container}>
      <h1>Lista de Usuários</h1>
      <div className={styles.usuariosGrid}>
        {usuarios.map((usuario) => (
          <div
            key={usuario.id_usuario}
            className={styles.usuarioCard}
            onClick={() => router.push(`/usuario/${usuario.id_usuario}`)}
          >
            <Image
             src={`data:image/png;base64,${usuario.foto_usuario}`}
              alt={usuario.nome_login}
              className={styles.usuarioFoto}
              width={1000}
              height={1000}
            />
            <div className={styles.usuarioInfo}>
              <h3>{usuario.nome_login}</h3>
              <p>{usuario.email}</p>
              <small>{usuario.tipo_usuario}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsuariosList;
