import React from "react";
import styles from "./input.module.css";

type InputProps = React.ComponentProps<"input"> & {
  label: string;
  error?: string;
  className?: string; 
};

export default function Input({
  label,
  error,
  className = "", 
  ...props
}: InputProps) {
  return (
    <div className={styles.wrapper}>
      <input
        className={`${styles.input} ${className}`} 
        type="text"
        id={props.name}
        placeholder=" " 
        {...props}
      />
      <label className={styles.label} htmlFor={props.name}>
        {label}
      </label>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
