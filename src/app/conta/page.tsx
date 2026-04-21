"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./[id]/conta.module.css";
import HistoricoUsuario from "@/componentes/historico/historico-usuario";
import AcessoNegado from "@/componentes/acesso-negado/AcessoNegado";

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
  numero: number | string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface ApiResponse {
  usuario: User;
  endereco: Endereco | null;
}

export default function ContaPageSemId() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userIdReady, setUserIdReady] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [endereco, setEndereco] = useState<Endereco | null>(null);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [forbidden, setForbidden] = useState<boolean>(false);

  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
    setUserIdReady(true);
  }, []);

  useEffect(() => {
    if (!userIdReady) {
      return;
    }

    if (!userId) {
      setForbidden(true);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setForbidden(false);
    setLoading(true);

    const fetchUserData = async (): Promise<void> => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`https://api.helenaramazzotte.online/api/usuario/${userId}`, {
          cache: "no-store",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.status === 401 || res.status === 403) {
          if (isMounted) setForbidden(true);
          return;
        }

        if (!res.ok) {
          throw new Error("Falha ao buscar usuário");
        }

        const data: ApiResponse = (await res.json()) as ApiResponse;
        if (!isMounted) return;

        setUser(data.usuario);
        setEndereco(data.endereco);
        setFotoBase64(data.usuario?.foto_usuario || null);
      } catch {
        if (isMounted) setForbidden(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchUserData();
    return () => {
      isMounted = false;
    };
  }, [userId, userIdReady]);

  if (loading) return <div className={styles.contaContainer}>Carregando dados do usuário...</div>;
  if (forbidden || !user || !userId) return <AcessoNegado />;

  const dataNascFmt = (() => {
    const d = new Date(user.data_nascimento);
    return Number.isNaN(d.getTime()) ? user.data_nascimento : d.toLocaleDateString();
  })();

  return (
    <div className={styles.contaContainer}>
      <div className={styles.grid}>
        <div className={styles.grid1}>
          {fotoBase64 ? (
            <Image src={`data:image/png;base64,${fotoBase64}`} alt="Foto de perfil" width={120} height={120} />
          ) : (
            <div>Sem foto de perfil</div>
          )}
        </div>

        <div className={styles.grid2}>
          <div className={styles.user}>
            <p><strong>Nome:</strong> {user.nome_login}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Telefone:</strong> {user.telefone}</p>
            <p><strong>Data de Nascimento:</strong> {dataNascFmt}</p>
            <p><strong>Igreja local:</strong> {user.igreja_local}</p>
            <p><strong>Tipo de usuário:</strong> {user.tipo_usuario}</p>
          </div>

          {endereco && (
            <div className={styles.endereco}>
              <h2>Endereço</h2>
              <p><strong>CEP:</strong> {endereco.cep}</p>
              <p><strong>Rua:</strong> {endereco.rua}</p>
              <p><strong>Número:</strong> {endereco.numero}</p>
              <p><strong>Bairro:</strong> {endereco.bairro}</p>
              <p><strong>Cidade:</strong> {endereco.cidade}</p>
              <p><strong>Estado:</strong> {endereco.estado}</p>
            </div>
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
