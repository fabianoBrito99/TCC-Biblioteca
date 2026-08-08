"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Button from "@/componentes/forms/button";
import Input from "@/componentes/forms/input";
import styles from "./login-form.module.css";
import Image from "next/image";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function FormButton({
  disabled,
  label,
  onContinue,
  isContinue,
}: {
  disabled: boolean;
  label: string;
  onContinue: () => void;
  isContinue: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <>
      {pending ? (
        <Button disabled>Cadastrando...</Button>
      ) : (
        <Button
          type={isContinue ? "button" : "submit"}
          disabled={disabled}
          onClick={isContinue ? onContinue : undefined}
        >
          {label}
        </Button>
      )}
    </>
  );
}

type LoginCriarFormProps = {
  onToggle: () => void;
};

// Regras de senha: 8–64, minúscula, MAIÚSCULA, número e caractere especial
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

const FOTO_MAX_BYTES = 350 * 1024; // 350 KB (sem base64)
const FOTO_MAX_DIM = 1024;
const LIMITE_FOTO_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

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
      reject(new Error("Não foi possível carregar a imagem."));
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

  const scale = Math.min(1, FOTO_MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Falha ao preparar compressão da imagem.");

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

export default function LoginCriarForm({ onToggle }: LoginCriarFormProps) {
  const [activeTab, setActiveTab] = useState<"usuario" | "endereco">("usuario");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [telefone, setTelefone] = useState("");
  const [sexo, setSexo] = useState("");
  const [data_nascimento, setDataNascimento] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState<File | null>(null);
  const [capaPreview, setCapaPreview] = useState<string | null>(null);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [processandoFoto, setProcessandoFoto] = useState(false);
  const [erroFotoLimite, setErroFotoLimite] = useState<string | null>(null);
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [bairro, setBairro] = useState("");
  const [numero, setNumero] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [igrejaLocal, setIgrejaLocal] = useState(false);

  // Avaliação da senha em tempo real
  const { forte, regras } = useMemo(() => avaliarSenha(password), [password]);
  const senhasBatem = useMemo(
    () => confirmPassword.length > 0 && confirmPassword === password,
    [password, confirmPassword]
  );
  const emailValido = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);
  const usuarioValido = useMemo(
    () =>
      username.trim().length > 0 &&
      emailValido &&
      forte &&
      senhasBatem &&
      sexo.trim().length > 0,
    [emailValido, forte, senhasBatem, sexo, username]
  );
  const enderecoValido = useMemo(
    () =>
      cep.trim().length > 0 &&
      rua.trim().length > 0 &&
      bairro.trim().length > 0 &&
      numero.trim().length > 0 &&
      cidade.trim().length > 0 &&
      estado.trim().length > 0 &&
      data_nascimento.trim().length > 0 &&
      telefone.trim().length > 0 &&
      !!fotoBase64 &&
      !processandoFoto &&
      !erroFotoLimite,
    [
      bairro,
      cep,
      cidade,
      data_nascimento,
      erroFotoLimite,
      estado,
      fotoBase64,
      numero,
      processandoFoto,
      rua,
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
      setErroFotoLimite(
        "Troque a foto: essa é maior que o limite de 10MB."
      );
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
      alert("Não foi possível processar a foto. Tente outra imagem.");
    } finally {
      setProcessandoFoto(false);
    }
  };

  const handleCepBlur = () => {
    const cleanedCep = cep.replace(/\D/g, "");
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
            alert("CEP não encontrado.");
          }
        })
        .catch((error) => console.error("Erro ao buscar o CEP:", error));
    } else {
      alert("CEP inválido.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === "usuario") {
      if (usuarioValido) setActiveTab("endereco");
      return;
    }

    if (!forte) {
      alert("A senha ainda não é forte. Atenda a todos os requisitos.");
      return;
    }
    if (!senhasBatem) {
      alert("As senhas não coincidem.");
      return;
    }
    if (!fotoBase64) {
      alert("Por favor, selecione uma foto de perfil.");
      return;
    }
    if (erroFotoLimite) {
      alert("Troque a foto: essa é maior que o limite de 10MB.");
      return;
    }
    if (processandoFoto) {
      alert("Aguarde o processamento da foto terminar.");
      return;
    }
    if (!enderecoValido) {
      alert("Preencha todos os dados de endereco e demais informacoes.");
      return;
    }

    fetch("https://api.helenaramazzotte.online/api/usuario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome_login: username,
        email,
        senha: password,
        telefone,
        data_nascimento,
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
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.erro) {
          alert(data.erro);
          return;
        }
        // Backend atualizado retorna token após create (conforme combinamos no BE).
        if (data?.token) {
          // 1) guarda no localStorage (útil para fetch no client)
          localStorage.setItem("token", data.token);
          if (data?.usuario?.id_usuario) {
            localStorage.setItem("userId", String(data.usuario.id_usuario));
          }
          // 2) grava cookie (para o middleware do Next.js conseguir ler)
          // max-age: 1 dia (ajuste se quiser, deve bater com JWT_EXPIRES)
          document.cookie = `token=${data.token}; path=/; max-age=86400; samesite=lax`;
          if (data?.usuario?.tipo_usuario) {
            document.cookie = `tipo_usuario=${data.usuario.tipo_usuario}; path=/; max-age=86400; samesite=lax`;
          }
        }
        alert("Usuário cadastrado com sucesso!");
        // Opcional: já alternar para a aba de login
        window.location.assign("/homecards");
      })
      .catch((error) => console.error("Erro ao cadastrar usuário:", error));
  };

  // Mensagem de força (vermelha/verde) logo abaixo do input de senha:
  const corMsg = forte ? "#2e7d32" : "#c62828"; // verde / vermelho
  const mensagemSenha = forte
    ? "Senha forte ✅"
    : "A senha deve ter 8–64 caracteres, com minúsculas, MAIÚSCULAS, números e caractere especial.";

  const botaoDesabilitado =
    activeTab === "usuario" ? !usuarioValido : !enderecoValido;

  return (
    <div className={styles.viewport}>
      <div className={styles.screenMobile}>
        <div className={styles.tabNavigationFixo}>
          <h1 className={styles.h1Login}>Informe os dados</h1>

          <div className={styles.tabNavigation}>
            <button
              type="button"
              className={`${styles.tabButton} ${
                activeTab === "usuario" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("usuario")}
            >
              Usuário
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${
                activeTab === "endereco" ? styles.activeTab : ""
              }`}
              onClick={() => {
                if (usuarioValido) setActiveTab("endereco");
              }}
              disabled={!usuarioValido}
            >
              Endereço
            </button>
          </div>

          <div className={styles.formFixo}>
            <form className={styles.form} onSubmit={handleSubmit}>
              {activeTab === "usuario" ? (
                <>
                  <Input
                    label="Usuário"
                    name="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />

                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <div className={styles.senhas}>
                    <div className={styles.passwordContainer}>
                      <Input
                        label="Senha"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className={`${styles.eyeIcon} ${
                          showPassword ? styles.highlight : ""
                        }`}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                      <div
                        className={`${styles.markerIcon} ${
                          showPassword ? styles.animateMarker : ""
                        }`}
                      >
                        <Image src="/img/marcatexto.png" alt="" width={140} height={940} />
                      </div>
                      <div
                        className={`${styles.highlightEffect} ${
                          showPassword ? styles.visible : ""
                        }`}
                      ></div>
                    </div>
                    <h6
                      className={styles.senhash6}
                      style={{
                        color: corMsg,
                      }}
                    >
                      {mensagemSenha}
                    </h6>

                    {/* (Opcional) Lista de requisitos, tique a tique */}
                    <ul className={styles.senhasul}>
                      <li
                        style={{
                          color: regras.tamanho ? "#2e7d32" : "#c62828",
                        }}
                      >
                        Entre 8 e 64 caracteres
                      </li>
                      <li
                        style={{
                          color: regras.minuscula ? "#2e7d32" : "#c62828",
                        }}
                      >
                        Pelo menos 1 letra minúscula
                      </li>
                      <li
                        style={{
                          color: regras.maiuscula ? "#2e7d32" : "#c62828",
                        }}
                      >
                        Pelo menos 1 letra maiúscula
                      </li>
                      <li
                        style={{ color: regras.numero ? "#2e7d32" : "#c62828" }}
                      >
                        Pelo menos 1 número
                      </li>
                      <li
                        style={{
                          color: regras.especial ? "#2e7d32" : "#c62828",
                        }}
                      >
                        Pelo menos 1 caractere especial (ex: !@#$%&)
                      </li>
                    </ul>
                  </div>

                  <div className={styles.passwordContainer}>
                    <Input
                      label="Confirma a Senha"
                      name="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className={`${styles.eyeIcon} ${
                        showConfirmPassword ? styles.highlight : ""
                      }`}
                      aria-label={
                        showConfirmPassword
                          ? "Ocultar confirmacao da senha"
                          : "Mostrar confirmacao da senha"
                      }
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    <div
                      className={`${styles.markerIcon} ${
                        showConfirmPassword ? styles.animateMarker : ""
                      }`}
                    >
                      <Image src="/img/marcatexto.png" alt="" width={140} height={940} />
                    </div>
                    <div
                      className={`${styles.highlightEffect} ${
                        showConfirmPassword ? styles.visible : ""
                      }`}
                    ></div>
                    {/* feedback da confirmação */}
                    {confirmPassword.length > 0 && (
                      <p
                        className={styles.senhasp}
                        style={{
                          color: senhasBatem ? "#2e7d32" : "#c62828",
                        }}
                      >
                        {senhasBatem
                          ? "As senhas coincidem ✅"
                          : "As senhas não coincidem"}
                      </p>
                    )}
                  </div>

                  <div className={styles.sexo}>
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

                  <div className={styles.igrejaLocal}>
                    <label>
                      <input
                        type="checkbox"
                        checked={igrejaLocal}
                        onChange={() => setIgrejaLocal(!igrejaLocal)}
                      />
                      Membro IMUB?
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.cep}>
                    <Input
                      label="CEP"
                      name="cep"
                      type="text"
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      onBlur={handleCepBlur}
                    />
                  </div>
                  <div className={styles.rua}>
                    <Input
                      label="Rua"
                      name="rua"
                      type="text"
                      value={rua}
                      onChange={(e) => setRua(e.target.value)}
                    />
                  </div>
                  <div className={styles.bairro}>
                    <Input
                      label="Bairro"
                      name="bairro"
                      type="text"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                    />
                  </div>
                  <div className={styles.num}>
                    <Input
                      label="Número"
                      name="numero"
                      type="text"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                    />
                  </div>
                  <div className={styles.cidade}>
                    <Input
                      label="Cidade"
                      name="cidade"
                      type="text"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                    />
                  </div>
                  <div className={styles.estado_data}>
                    <div className={styles.estado}>
                      <Input
                        label="Estado"
                        name="estado"
                        type="text"
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                      />
                    </div>
                    <div className={styles.dataNasc}>
                      <Input
                        label="Data Nasc"
                        name="data_nascimento"
                        type="date"
                        value={data_nascimento}
                        onChange={(e) => setDataNascimento(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className={styles.telefone}>
                    <Input
                      label="Telefone"
                      name="telefone"
                      type="phone"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                    />
                  </div>

                  <div className={styles.foto}>
                    <Input
                      label="Foto Perfil"
                      name="fotoPerfil"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <p
                      className={styles.senhasp}
                      style={{
                        color: erroFotoLimite ? "#c62828" : "#2e7d32",
                      }}
                    >
                      {erroFotoLimite
                        ? erroFotoLimite
                        : "Tamanho máximo permitido: 10MB."}
                    </p>
                    {capaPreview && (
                      <div className={styles.capaContainerLivro}>
                        <Image
                          src={capaPreview}
                          alt="Preview foto de perfil"
                          className={styles.capaPreview}
                          width={1000}
                          height={1000}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className={styles.btCad}>
                <FormButton
                  disabled={botaoDesabilitado}
                  label={activeTab === "usuario" ? "Continuar" : "Cadastrar"}
                  isContinue={activeTab === "usuario"}
                  onContinue={() => setActiveTab("endereco")}
                />
              </div>
            </form>
          </div>

          <div className={styles.ptBaixo}>
            <h2 className={styles.subtitle}>Faça Login</h2>
            <h6 className={styles.conta}>Já possui conta? Faça Login.</h6>
            <button className={styles.button2} onClick={onToggle}>
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
