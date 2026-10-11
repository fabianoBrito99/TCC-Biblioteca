import styles from "./error-message.module.css";

export default function ErrorMessage({ error }: { error: string }) {
  if (!error) return null;
  return (
    <div className={styles.message} role="alert" aria-live="polite">
      <span className={styles.icon} aria-hidden="true">
        !
      </span>
      <span>{error}</span>
    </div>
  );
}
