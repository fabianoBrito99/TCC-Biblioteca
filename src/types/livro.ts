export type Livro = {
  id_livro: string;
  nome_livro: string;
  foto_capa_url?: string | null;
  capa?: string | null;
  autor?: string | null;
  categoria_principal?: string | null;
  media_avaliacoes: number;
  preco?: string | null;
  descricao?: string | null;
  descricao_sem_preco?: string | null;
  categorias?: string[]; // se sua API já manda
  autores?: string[];
};
