"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface PermissaoModalProps {
  showInitially?: boolean;
  mensagem?: string;
  duracaoMs?: number; // padrão 5000
}

export default function PermissaoModal({
  showInitially = false,
  mensagem = "Você não tem permissão para acessar essa rota.",
  duracaoMs = 5000,
}: PermissaoModalProps) {
  const [open, setOpen] = useState(showInitially);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      setOpen(false);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("error");
      const base = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
      router.replace(base);
    }, duracaoMs);

    return () => clearTimeout(timer);
  }, [open, duracaoMs, router, searchParams]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-permissao-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={() => setOpen(false)}
    >
      <div
        style={{
          background: "#fff",
          width: "min(92vw, 480px)",
          borderRadius: 12,
          boxShadow: "0 20px 40px rgba(0,0,0,.2)",
          padding: 20,
          border: "2px solid #5a3825", // borda marrom (consistente com o seu tema)
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-permissao-title" style={{ margin: "0 0 8px", fontSize: 18 }}>
          Acesso negado
        </h2>
        <p style={{ margin: "0 0 16px", lineHeight: 1.4 }}>{mensagem}</p>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={() => setOpen(false)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#f5f5f5",
              cursor: "pointer",
            }}
          >
            Fechar
          </button>
        </div>

        <div
          aria-hidden
          style={{
            height: 4,
            background: "#eee",
            borderRadius: 999,
            overflow: "hidden",
            marginTop: 16,
          }}
        >
          {/* Barra de progresso simples */}
          <div
            style={{
              height: "100%",
              width: "100%",
              transformOrigin: "left",
              animation: `permissao-progress ${duracaoMs}ms linear forwards`,
              background: "#f44336", // vermelho suave para aviso
            }}
          />
        </div>

        <style jsx>{`
          @keyframes permissao-progress {
            from {
              transform: scaleX(1);
            }
            to {
              transform: scaleX(0);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
