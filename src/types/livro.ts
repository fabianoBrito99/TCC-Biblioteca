export type Livro = {
  id_livro: string;
  nome_livro: string;
  foto_capa_url?: string | null;
  capa?: string | null;
  autor?: string | null;
  categoria_principal?: string | null;
  media_avaliacoes: number;
  categorias?: string[]; // se sua API já manda
  autores?: string[];
};
