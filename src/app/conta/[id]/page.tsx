"use client";

import { useEffect, useState } from "react";
import styles from "./conta.module.css";
import HistoricoUsuario from "@/componentes/historico/historico-usuario";
import Image from "next/image";

interface User {
  id_usuario: string;
  foto_usuario: string | null;
  nome_login: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  igreja_local: string;
  tipo_usuario: string;
}

interface Endereco {
  cep: string;
  rua: string;
  numero: number;
  bairro: string;
  cidade: string;
  estado: string;
}

export default function ContaPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [endereco, setEndereco] = useState<Endereco | null>(null);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null); // Correção aqui
  const userId = params.id;

  // Função para converter Blob para Base64
  const convertBlobToBase64 = (blob: Blob) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  useEffect(() => {
    async function fetchUserData() {
      try {
        const res = await fetch(`http://localhost:4000/api/usuario/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data.usuario);
          setEndereco(data.endereco);

          // Verificar se a foto é uma string base64 ou Blob
          if (data.usuario.foto_usuario) {
            if (typeof data.usuario.foto_usuario === "string") {
              setFotoBase64(data.usuario.foto_usuario);
            } else if (data.usuario.foto_usuario instanceof Blob) {
              const base64Foto = await convertBlobToBase64(
                data.usuario.foto_usuario
              );
              setFotoBase64(base64Foto);
            }
          }
        } else {
          console.error("Erro ao buscar dados do usuário");
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      }
    }

    fetchUserData();
  }, [userId]);

  if (!user) {
    return <div>Carregando dados do usuário...</div>;
  }

  return (
    <div className={styles.contaContainer}>
      <div className={styles.grid}>
        <div className={styles.grid1}>
          {fotoBase64 ? (
            <Image
              src={`data:image/png;base64,${fotoBase64}`}
              alt="Foto de perfil"
              width={100}
              height={100}
            />
          ) : (
            <div>Sem foto de perfil</div>
          )}
        </div>
        <div className={styles.grid2}>
          <div className={styles.user}>
            <p>
              <strong>Nome:</strong> {user.nome_login}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Telefone:</strong> {user.telefone}
            </p>
            <p>
              <strong>Data de Nascimento:</strong>{" "}
              {new Date(user.data_nascimento).toLocaleDateString()}
            </p>
          </div>

          {endereco && (
            <>
              <div className={styles.endereco}>
                <h2>Endereço</h2>
                <p>
                  <strong>CEP:</strong> {endereco.cep}
                </p>
                <p>
                  <strong>Rua:</strong> {endereco.rua}
                </p>
                <p>
                  <strong>Número:</strong> {endereco.numero}
                </p>
                <p>
                  <strong>Bairro:</strong> {endereco.bairro}
                </p>
                <p>
                  <strong>Cidade:</strong> {endereco.cidade}
                </p>
                <p>
                  <strong>Estado:</strong> {endereco.estado}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      <h2 className={styles.historico}>Histórico</h2>

      <div className={styles.historicoContainer}>
        <HistoricoUsuario userId={userId} />
      </div>
    </div>
  );
}
