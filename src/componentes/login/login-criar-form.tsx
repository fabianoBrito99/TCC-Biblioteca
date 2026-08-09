"use client";

import React, { useEffect, useMemo, useState } from "react";
import Input from "@/componentes/forms/input";
import styles from "./login-form.module.css";
import Image from "next/image";
import Link from "next/link";
import { FaEye, FaEyeSlash } from "react-icons/fa";

type LoginCriarFormProps = {
  onToggle: () => void;
};

type CadastroAba = "usuario" | "endereco" | "demais";

function avaliarSenha(pwd: string) {
  const regras = {
    tamanho: pwd.length >= 8 && pwd.length <= 64,
    minuscula: /[a-z]/.test(pwd),
    maiuscula: /[A-Z]/.test(pwd),
    numero: /[0-9]/.test(pwd),
    especial: /[^A-Za-z0-9]/.test(pwd),
  };
  const forte = Object.values(regras).every(Boolean);
  return { forte, regras };
}

const FOTO_MAX_BYTES = 350 * 1024;
const FOTO_MAX_DIM = 1024;
const LIMITE_FOTO_UPLOAD_BYTES = 10 * 1024 * 1024;

const loadImageFromFile = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Nao foi possivel carregar a imagem."));
    };
    img.src = url;
  });

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Falha ao converter imagem."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality
    );
  });

async function compressFotoPerfilToDataUrl(file: File): Promise<string> {
  const img = await loadImageFromFile(file);
  const scale = Math.min(
    1,
    FOTO_MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight)
  );
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Falha ao preparar compressao da imagem.");

  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.82;
  let bestBlob = await canvasToBlob(canvas, quality);

  while (bestBlob.size > FOTO_MAX_BYTES && quality >= 0.45) {
    quality -= 0.08;
    bestBlob = await canvasToBlob(canvas, quality);
  }

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Falha ao gerar base64 da imagem."));
    reader.readAsDataURL(bestBlob);
  });
}

function PasswordField({
  label,
  name,
  value,
  visible,
  onToggle,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  visible: boolean;
  onToggle: () => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className={styles.passwordContainer}>
      <Input
        label={label}
        name={name}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        onClick={onToggle}
        className={`${styles.eyeIcon} ${visible ? styles.highlight : ""}`}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
      >
        {visible ? <FaEyeSlash /> : <FaEye />}
      </button>
      <div
        className={`${styles.markerIcon} ${
          visible ? styles.animateMarker : ""
        }`}
      >
        <Image src="/img/marcatexto.png" alt="" width={140} height={940} />
      </div>
      <div
        className={`${styles.highlightEffect} ${
          visible ? styles.visible : ""
        }`}
      />
    </div>
  );
}

export default function LoginCriarForm({ onToggle }: LoginCriarFormProps) {
  const [activeTab, setActiveTab] = useState<CadastroAba>("usuario");
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [bairro, setBairro] = useState("");
  const [numero, setNumero] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [sexo, setSexo] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState<File | null>(null);
  const [capaPreview, setCapaPreview] = useState<string | null>(null);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [processandoFoto, setProcessandoFoto] = useState(false);
  const [erroFotoLimite, setErroFotoLimite] = useState<string | null>(null);
  const [igrejaLocal, setIgrejaLocal] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { forte, regras } = useMemo(() => avaliarSenha(password), [password]);
  const senhasBatem = useMemo(
    () => confirmPassword.length > 0 && confirmPassword === password,
    [password, confirmPassword]
  );
  const emailValido = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);

  const usuarioValido = useMemo(
    () =>
      nome.trim().length > 0 &&
      sobrenome.trim().length > 0 &&
      emailValido &&
      forte &&
      senhasBatem,
    [emailValido, forte, nome, senhasBatem, sobrenome]
  );

  const enderecoValido = useMemo(
    () =>
      cep.trim().length > 0 &&
      rua.trim().length > 0 &&
      bairro.trim().length > 0 &&
      cidade.trim().length > 0 &&
      estado.trim().length > 0 &&
      numero.trim().length > 0,
    [bairro, cep, cidade, estado, numero, rua]
  );

  const demaisDadosValidos = useMemo(
    () =>
      dataNascimento.trim().length > 0 &&
      telefone.trim().length > 0 &&
      sexo.trim().length > 0 &&
      !!fotoBase64 &&
      !processandoFoto &&
      !erroFotoLimite &&
      aceitouTermos,
    [
      aceitouTermos,
      dataNascimento,
      erroFotoLimite,
      fotoBase64,
      processandoFoto,
      sexo,
      telefone,
    ]
  );

  useEffect(() => {
    if (fotoPerfil) {
      const objectUrl = URL.createObjectURL(fotoPerfil);
      setCapaPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setCapaPreview(null);
  }, [fotoPerfil]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > LIMITE_FOTO_UPLOAD_BYTES) {
      setErroFotoLimite("Troque a foto: essa e maior que o limite de 10MB.");
      setFotoPerfil(null);
      setCapaPreview(null);
      setFotoBase64(null);
      setProcessandoFoto(false);
      return;
    }

    setErroFotoLimite(null);
    setFotoPerfil(file);
    setProcessandoFoto(true);

    try {
      const compressed = await compressFotoPerfilToDataUrl(file);
      setFotoBase64(compressed);
    } catch (error) {
      console.error("Erro ao processar foto de perfil:", error);
      setFotoBase64(null);
      alert("Nao foi possivel processar a foto. Tente outra imagem.");
    } finally {
      setProcessandoFoto(false);
    }
  };

  const handleCepBlur = () => {
    const cleanedCep = cep.replace(/\D/g, "");
    if (!cleanedCep) return;

    if (cleanedCep.length === 8) {
      fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`)
        .then((response) => response.json())
        .then((data) => {
          if (!data.erro) {
            setRua(data.logradouro || "");
            setBairro(data.bairro || "");
            setCidade(data.localidade || "");
            setEstado(data.uf || "");
          } else {
            alert("CEP nao encontrado.");
          }
        })
        .catch((error) => console.error("Erro ao buscar o CEP:", error));
    } else {
      alert("CEP invalido.");
    }
  };

  const goToTab = (tab: CadastroAba) => {
    if (tab === "usuario") {
      setActiveTab(tab);
      return;
    }
    if (tab === "endereco" && usuarioValido) {
      setActiveTab(tab);
      return;
    }
    if (tab === "demais" && usuarioValido && enderecoValido) {
      setActiveTab(tab);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === "usuario") {
      if (usuarioValido) setActiveTab("endereco");
      return;
    }

    if (activeTab === "endereco") {
      if (enderecoValido) setActiveTab("demais");
      return;
    }

    if (!demaisDadosValidos) {
      alert("Preencha os demais dados e confirme que esta ciente dos termos.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("https://api.helenaramazzotte.online/api/usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_login: nomeLogin,
          email,
          senha: password,
          telefone,
          data_nascimento: dataNascimento,
          foto_usuario: fotoBase64,
          igreja_local: igrejaLocal,
          sexo,
          cep,
          rua,
          numero,
          bairro,
          cidade,
          estado,
        }),
      });

      const data = await response.json();

      if (data?.erro) {
        alert(data.erro);
        return;
      }

      if (data?.token) {
        localStorage.setItem("token", data.token);
        if (data?.usuario?.id_usuario) {
          localStorage.setItem("userId", String(data.usuario.id_usuario));
        }
        document.cookie = `token=${data.token}; path=/; max-age=86400; samesite=lax`;
        if (data?.usuario?.tipo_usuario) {
          document.cookie = `tipo_usuario=${data.usuario.tipo_usuario}; path=/; max-age=86400; samesite=lax`;
        }
      }

      alert("Usuario cadastrado com sucesso!");
      window.location.assign("/homecards");
    } catch (error) {
      console.error("Erro ao cadastrar usuario:", error);
      alert("Erro ao cadastrar usuario. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const senhaMensagem = forte
    ? "Senha forte"
    : "Use 8 a 64 caracteres com minuscula, maiuscula, numero e especial.";

  const buttonDisabled =
    isSubmitting ||
    (activeTab === "usuario" && !usuarioValido) ||
    (activeTab === "endereco" && !enderecoValido) ||
    (activeTab === "demais" && !demaisDadosValidos);

  const buttonLabel =
    activeTab === "demais"
      ? isSubmitting
        ? "Cadastrando..."
        : "Cadastrar"
      : "Continuar";

  const nomeLogin = [nome, sobrenome]
    .map((parte) => parte.trim())
    .filter(Boolean)
    .join(" ");

  const tabClassName = (tab: CadastroAba, valid: boolean) =>
    `${styles.tabButton} ${activeTab === tab ? styles.activeTab : ""} ${
      valid ? styles.completedTab : ""
    }`;

  return (
    <div className={styles.cadastroWrapper}>
      <h1 className={styles.h1Login}>Informe os dados</h1>

      <div className={styles.tabNavigation} aria-label="Etapas do cadastro">
        <button
          type="button"
          className={tabClassName("usuario", usuarioValido)}
          onClick={() => goToTab("usuario")}
        >
          Usuario
        </button>
        <button
          type="button"
          className={tabClassName("endereco", enderecoValido)}
          onClick={() => goToTab("endereco")}
          disabled={!usuarioValido}
        >
          Endereco
        </button>
        <button
          type="button"
          className={tabClassName("demais", demaisDadosValidos)}
          onClick={() => goToTab("demais")}
          disabled={!usuarioValido || !enderecoValido}
        >
          Demais dados
        </button>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        {activeTab === "usuario" && (
          <div className={styles.formGrid}>
            <Input
              label="Nome"
              name="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <Input
              label="Sobrenome"
              name="sobrenome"
              type="text"
              value={sobrenome}
              onChange={(e) => setSobrenome(e.target.value)}
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <PasswordField
              label="Senha"
              name="password"
              value={password}
              visible={showPassword}
              onToggle={() => setShowPassword((prev) => !prev)}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className={styles.senhaFeedback}>
              <p style={{ color: forte ? "#2e7d32" : "#c62828" }}>
                {senhaMensagem}
              </p>
              <ul className={styles.senhasul}>
                <li style={{ color: regras.tamanho ? "#2e7d32" : "#c62828" }}>
                  Entre 8 e 64 caracteres
                </li>
                <li style={{ color: regras.minuscula ? "#2e7d32" : "#c62828" }}>
                  Pelo menos 1 letra minuscula
                </li>
                <li style={{ color: regras.maiuscula ? "#2e7d32" : "#c62828" }}>
                  Pelo menos 1 letra maiuscula
                </li>
                <li style={{ color: regras.numero ? "#2e7d32" : "#c62828" }}>
                  Pelo menos 1 numero
                </li>
                <li style={{ color: regras.especial ? "#2e7d32" : "#c62828" }}>
                  Pelo menos 1 caractere especial
                </li>
              </ul>
            </div>

            <PasswordField
              label="Confirma senha"
              name="confirm-password"
              value={confirmPassword}
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((prev) => !prev)}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {confirmPassword.length > 0 && (
              <p
                className={styles.senhasp}
                style={{ color: senhasBatem ? "#2e7d32" : "#c62828" }}
              >
                {senhasBatem ? "As senhas coincidem" : "As senhas nao coincidem"}
              </p>
            )}
          </div>
        )}

        {activeTab === "endereco" && (
          <div className={styles.formGrid}>
            <Input
              label="CEP"
              name="cep"
              type="text"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              onBlur={handleCepBlur}
            />
            <Input
              label="Rua"
              name="rua"
              type="text"
              value={rua}
              onChange={(e) => setRua(e.target.value)}
            />
            <Input
              label="Bairro"
              name="bairro"
              type="text"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
            />
            <Input
              label="Cidade"
              name="cidade"
              type="text"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
            />
            <Input
              label="Estado"
              name="estado"
              type="text"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            />
            <Input
              label="Numero"
              name="numero"
              type="text"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
            />
          </div>
        )}

        {activeTab === "demais" && (
          <div className={styles.formGrid}>
            <Input
              label="Data nasc."
              name="data_nascimento"
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
            />
            <Input
              label="Telefone"
              name="telefone"
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />

            <div className={styles.selectField}>
              <label htmlFor="sexo">Sexo</label>
              <select
                id="sexo"
                name="sexo"
                value={sexo}
                onChange={(e) => setSexo(e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
              </select>
            </div>

            <div className={styles.fileField}>
              <Input
                label="Foto"
                name="fotoPerfil"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              <p style={{ color: erroFotoLimite ? "#c62828" : "#2e7d32" }}>
                {erroFotoLimite ||
                  (processandoFoto
                    ? "Processando foto..."
                    : "Tamanho maximo permitido: 10MB.")}
              </p>
              {capaPreview && (
                <div className={styles.capaContainerLivro}>
                  <Image
                    src={capaPreview}
                    alt="Preview foto de perfil"
                    className={styles.capaPreview}
                    width={120}
                    height={120}
                  />
                </div>
              )}
            </div>

            <label className={styles.checkField}>
              <input
                type="checkbox"
                checked={igrejaLocal}
                onChange={() => setIgrejaLocal((prev) => !prev)}
              />
              Membro IMUB?
            </label>

            <label className={`${styles.checkField} ${styles.termosField}`}>
              <input
                type="checkbox"
                checked={aceitouTermos}
                onChange={() => setAceitouTermos((prev) => !prev)}
                required
              />
              <span>
                Confirmo que estou ciente e aceito os{" "}
                <Link href="/termos" target="_blank">
                  termos de uso
                </Link>
                .
              </span>
            </label>
          </div>
        )}

        <div className={styles.cadastroActions}>
          {activeTab !== "usuario" && (
            <button
              type="button"
              className={styles.buttonBack}
              onClick={() =>
                setActiveTab(activeTab === "demais" ? "endereco" : "usuario")
              }
            >
              Voltar
            </button>
          )}
          <button
            type="submit"
            className={styles.cadastroSubmit}
            disabled={buttonDisabled}
          >
            {buttonLabel}
          </button>
        </div>
      </form>

      <div className={styles.ptBaixo}>
        <h2 className={styles.subtitle}>Faca Login</h2>
        <h6 className={styles.conta}>Ja possui conta? Faca Login.</h6>
        <button className={styles.button2} onClick={onToggle}>
          Login
        </button>
      </div>
    </div>
  );
}
