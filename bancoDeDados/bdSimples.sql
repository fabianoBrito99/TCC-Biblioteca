-- bd simples apanes para teste iniciais
CREATE DATABASE bibliota_web;
use bibliota_web;

CREATE TABLE usuarios(
id_user INT PRIMARY KEY AUTO_INCREMENT,
nome_login VARCHAR(100) UNIQUE,
email VARCHAR(255) UNIQUE,
senha VARCHAR(50),
telefone VARCHAR(30),
igrejaLocal VARCHAR(100),
cep VARCHAR(20),
rua VARCHAR(200),
numero VARCHAR(10),
bairro VARCHAR(100)
);
UPDATE livros
SET categoria = 'nova3'
WHERE id = 12;


INSERT INTO usuarios(nome_login, email, senha)
VALUES('fabiano', NULL, 12345678),
(NULL, 'fabiano@gmail.com', 12345678);

SELECT *FROM usuarios;

drop table livros;

CREATE TABLE livros(
id INT PRIMARY KEY AUTO_INCREMENT,
nome_livro VARCHAR(255) NOT NULL,
autor VARCHAR(255) NOT NULL,
foto_capa LONGBLOB NOT NULL,
categoria VARCHAR(255),
descricao TEXT,
quantidade INT
);

SELECT id, nome_livro FROM livros WHERE nome_livro LIKE '%caf%' LIMIT 10;



INSERT INTO livros (nome_livro, autor, foto_capa, categoria, descricao, status1) 
VALUES ('O Peregrino', 'John Bunyan', './capas-livro/O-peregrino-2.jpg', 'devocional', 'DEPOIS DA BÍBLIA, ESTE É O LIVRO MAIS LIDO EM TODO O MUNDO HÁ MAIS DE TRÊS SÉCULOS. O PEREGRINO, DO INGLÊS JOHN BUNYAN, MANTÉM-SE ATUAL PORQUE TRATA DA ESSÊNCIA DA VIDA HUMANA: A BUSCA DA FELICIDADE Como o leitor perceberá nesta história alegórica, o que o personagem Cristão enfrenta em sua caminhada da Cidade da Destruição para a Cidade Celestial não é diferente do que sempre aconteceu e ainda está presente na trajetória da humanidade: perigos, maldades, traições, mas também boa vontade, sabedoria e esperança. Traduzido em mais de 200 idiomas, O Peregrino cativa ainda pela beleza e simplicidade do texto. Nesta versão atualizada, Claudio Blanc usa a linguagem de hoje, sem deixar escapar nada da riqueza do original. Ele recria nomes de personagens, bons e maus, bem fiéis ao que se vê hoje no Brasil e pelo mundo afora, como Amor-ao-Dinheiro, Bajulação, Caridade, Duas Caras, Glória Mundana, Hipocrisia, Ignorância, Legalidade, Ócio, Piedade, Pretensioso e Vira-Casaca.', 'emprestado'),
('Mere Christianity', 'C.S. Lewis', './capas-livro/mere.jpg', 'devocional', ' a', 'emprestado'),
('O Evangelho Maltrapilho', 'Brennan Manning', './capas-livro/O-evangelho-maltrapilho.png', 'devocional', '"O evangelho maltrapilho" foi escrito para pessoas aniquiladas, derrotadas e exauridas. Pessoas que se acham indignas de receber o amor de Deus. Quem sabe, ignoradas pela comunidade de cristãos por não se encaixarem no perfil de super-homem ou de supermulher que lhes é constantemente exigido. Pessoas cansadas da espiritualidade superficial e consumista. Pessoas que travam inúmeras batalhas interiores por não se sentirem parte de uma comunidade afetiva e acolhedora. É um livro que escrevi para mim mesmo e para quem quer que tenha ficado cansado e desencorajado ao longo do Caminho, confessa o autor. Franco e provocador, o aclamado filósofo e teólogo cristão Brennan Manning estréia em língua portuguesa com sua principal obra, que nos convida a depositar nossa esperança na amplitude da graça, capaz de alcançar pecadores e pobres em espírito, e de resgatar nossa dignidade original. No mínimo, você não ficará indiferente a ela.', 'emprestado'),
('A Cabana', 'William P. Young', './capas-livro/a-cabana.webp', 'devocional', ' a', 'emprestado'),
('Em Busca de Deus', 'A.W. Tozer', './capas-livro/em-busca-de-deus.jpg', 'devocional', ' a', 'emprestado'),
('O Poder da Mulher que Ora', 'Stormie Omartian', './capas-livro/o-poder-da-mulher.jpg', 'devocional', ' a', 'emprestado'),
('A Prática do Poder da Presença de Deus', 'Brother Lawrence', './capas-livro/download-a-pratica-da-presenca-de-deus-.jpg', 'devocional', ' a', 'emprestado'),
('O Homem Eterno', 'G.K. Chesterton', './capas-livro/homem-eterno.jpg', 'devocional', ' a', 'emprestado'),
('O Peregrino da Alvorada', 'C.S. Lewis', './capas-livro/Peregrino-da-Alvorada.png', 'devocional', ' a', 'emprestado'),
('o Deus que destroi sonhos', 'rodrigo bibo', './capas-livro/o-deus-que-destroi-sonhos.jpg', 'devocional', ' a', 'emprestado' ),
('o Deus in(visivel)', 'philip yancey', './capas-livro/deus-in(visivel).jpg', 'devocional', ' a', 'emprestado'),
('senhor ensina-me a orar', 'andrew murray', './capas-livro/Ensina-me-a-orar.jpg', 'devocional', ' a', 'emprestado'),
('comprados com sangue', 'derek prince', './capas-livro/comprados-com-sangue.jpg', 'reflexivo', ' a', 'emprestado'),
('Bible','teste', 'https://openlibrary.org/works/OL17732W', 'reflexivo', ' a', 'emprestado');

CREATE TABLE emprestimos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  livro_id INT,
  usuario_id INT,
  data_emprestimo DATE,
  data_prevista_devolucao DATE,
  devolucao DATE,
  FOREIGN KEY (livro_id) REFERENCES livros(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id_user)
);
SELECT *FROM emprestimos;

     
INSERT INTO emprestimos( data_emprestimo, data_prevista_devolucao,  livro_id,   usuario_id)
VALUES
('2024-08-01', '2024-08-25', 3, 4);  -- Devolução em 10 dias, borda amarela



drop table emprestimos;
