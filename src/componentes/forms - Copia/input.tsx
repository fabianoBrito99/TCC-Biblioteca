import React from "react";
import styles from "./input.module.css";

type InputProps = React.ComponentProps<"input"> & {
  label: string;
  error?: string;
  className?: string; // Propriedade opcional para classes adicionais
};

export default function Input({
  label,
  error,
  className = "", // Valor padrão vazio
  ...props
}: InputProps) {
  return (
    <div className={styles.wrapper}>
      <input
        className={`${styles.input} ${className}`} // Combina as classes padrão e adicionais
        type="text"
        id={props.name}
        placeholder=" " // Espaço para o efeito do placeholder flutuante
        {...props}
      />
      <label className={styles.label} htmlFor={props.name}>
        {label}
      </label>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
