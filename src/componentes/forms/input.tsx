import styles from './input.module.css'

type InputProps = React.ComponentProps<'input'> &{
  label: string;
  error?: string
};
export default function Input({label, error, ...props}: InputProps) {
  return (
    <div className={styles.wrapper}>
      <input
        className={styles.input}
        type="text"
        id={props.name}
        placeholder=" " // Espaço para o placeholder
        {...props}
      />
      <label className={styles.label} htmlFor={props.name}>
        {label}
      </label>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
