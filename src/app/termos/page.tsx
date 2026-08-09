import Link from "next/link";
import styles from "./termos.module.css";

export default function TermosPage() {
  return (
    <main className={styles.page}>
      <article className={styles.content}>
        <Link className={styles.backLink} href="/login">
          Voltar para o cadastro
        </Link>

        <h1>Termos de uso e responsabilidade</h1>
        <p>
          Ao criar uma conta na Biblioteca Helena Ramazzotte, o usuario declara
          que leu, compreendeu e concorda com estes termos.
        </p>

        <section>
          <h2>Dados e comunicacoes</h2>
          <p>
            O usuario autoriza o uso dos dados cadastrados para identificacao,
            organizacao da biblioteca, contato, envio de notificacoes e
            comunicados relacionados a emprestimos, devolucoes, avisos e
            atividades da biblioteca.
          </p>
        </section>

        <section>
          <h2>Relatorios, apresentacoes e premiacoes</h2>
          <p>
            O usuario esta ciente de que seus dados de leitura, como livros
            lidos, quantidade de leituras, participacao em metas, ranking,
            historico de emprestimos e resultados de atividades, podem ser
            usados em relatorios internos e publicos, apresentacoes,
            divulgacoes institucionais e premiacoes.
          </p>
          <p>
            Exemplos: se uma pessoa leu determinada quantidade de livros, seu
            nome e seus resultados podem aparecer em relatorios, demonstracoes
            para a comunidade, apresentacoes administrativas ou eventos de
            reconhecimento.
          </p>
        </section>

        <section>
          <h2>Responsabilidade pelos livros</h2>
          <p>
            O usuario se compromete a cuidar dos livros emprestados e a
            devolve-los no prazo e nas condicoes combinadas. Em caso de perda,
            dano grave ou nao devolucao, o usuario podera ser responsavel pela
            reposicao do exemplar ou pela compra de outro livro equivalente,
            conforme orientacao da administracao da biblioteca.
          </p>
        </section>

        <section>
          <h2>Uso correto da conta</h2>
          <p>
            A conta deve ser usada de forma verdadeira e responsavel. O usuario
            deve manter seus dados atualizados, nao compartilhar acesso de forma
            indevida e respeitar as regras de convivencia, seguranca e bom uso
            do aplicativo.
          </p>
        </section>

        <section>
          <h2>Administracao do sistema</h2>
          <p>
            Os administradores podem consultar, organizar, corrigir e utilizar
            informacoes necessarias para o funcionamento da biblioteca,
            incluindo cadastro, endereco, contato, registros de emprestimos,
            progresso de leitura e participacao em atividades.
          </p>
        </section>

        <section>
          <h2>Aceite obrigatorio</h2>
          <p>
            O aceite destes termos e obrigatorio para concluir o cadastro e usar
            os recursos da biblioteca. Caso nao concorde, o usuario nao deve
            finalizar a criacao da conta.
          </p>
        </section>
      </article>
    </main>
  );
}
