"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import styles from "./conta.module.css";
import HistoricoUsuario from "@/componentes/historico/historico-usuario";

interface User {
  id_usuario: string;
  foto_usuario: string | null; // base64 (sem prefixo) ou null
  nome_login: string;
  email: string;
  telefone: string;
  data_nascimento: string; // ISO string
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

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return "Erro desconhecido.";
  }
}

export default function ContaPage() {
  const params = useParams<{ id: string }>();
  // Se quiser tolerar arrays por segurança, remova o generic acima e use o bloco comentado:
  // const params = useParams();
  // const userId = useMemo(() => {
  //   const raw = params?.id as string | string[] | undefined;
  //   return Array.isArray(raw) ? raw[0] : raw;
  // }, [params]);

  const userId = useMemo<string | undefined>(() => params?.id, [params]);

  const [user, setUser] = useState<User | null>(null);
  const [endereco, setEndereco] = useState<Endereco | null>(null);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    async function fetchUserData(): Promise<void> {
      setLoading(true);
      setErro(null);

      try {
        const res = await fetch(`https://api.helenaramazzotte.online/api/usuario/${userId}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Falha ao buscar usuário: ${res.status}`);
        }

        const data: ApiResponse = (await res.json()) as ApiResponse;
        if (!isMounted) return;

        setUser(data.usuario);
        setEndereco(data.endereco);

        const foto = data.usuario?.foto_usuario;
        setFotoBase64(typeof foto === "string" && foto.length > 0 ? foto : null);
      } catch (err: unknown) {
        if (isMounted) {
          setErro(getErrorMessage(err));
          setUser(null);
          setEndereco(null);
          setFotoBase64(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void fetchUserData();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (!userId) {
    return <div className={styles.contaContainer}>ID do usuário inválido.</div>;
  }

  if (loading) {
    return <div className={styles.contaContainer}>Carregando dados do usuário...</div>;
  }

  if (erro) {
    return <div className={styles.contaContainer}>Erro: {erro}</div>;
  }

  if (!user) {
    return <div className={styles.contaContainer}>Usuário não encontrado.</div>;
  }

  const dataNascFmt = (() => {
    const d = new Date(user.data_nascimento);
    return Number.isNaN(d.getTime()) ? user.data_nascimento : d.toLocaleDateString();
  })();

  return (
    <div className={styles.contaContainer}>
      <div className={styles.grid}>
        <div className={styles.grid1}>
          {fotoBase64 ? (
            <Image
              src={`data:image/png;base64,${fotoBase64}`}
              alt="Foto de perfil"
              width={120}
              height={120}
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
              <strong>Data de Nascimento:</strong> {dataNascFmt}
            </p>
            <p>
              <strong>Igreja local:</strong> {user.igreja_local}
            </p>
            <p>
              <strong>Tipo de usuário:</strong> {user.tipo_usuario}
            </p>
          </div>

          {endereco && (
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
