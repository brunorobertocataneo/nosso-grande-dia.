-- NOSSO GRANDE DIA — MODELO DE DADOS PARA A PRÓXIMA ETAPA
-- MySQL 8.0+ — NÃO é utilizado pelo protótipo front-end.
-- OBS.: reservas reais exigem transações e confirmação por webhooks autenticados.
CREATE DATABASE IF NOT EXISTS casamento_lista
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE casamento_lista;

CREATE TABLE IF NOT EXISTS presentes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(80) NOT NULL UNIQUE,
    nome VARCHAR(120) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    descricao VARCHAR(500) NOT NULL,
    valor_cota_centavos INT UNSIGNED NOT NULL,
    total_cotas SMALLINT UNSIGNED NOT NULL,
    imagem VARCHAR(255) DEFAULT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (valor_cota_centavos > 0),
    CHECK (total_cotas > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reservas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo CHAR(36) NOT NULL UNIQUE,
    convidado_nome VARCHAR(120) NOT NULL,
    convidado_email VARCHAR(180) DEFAULT NULL,
    status ENUM('pendente','paga','expirada','cancelada') NOT NULL DEFAULT 'pendente',
    valor_total_centavos INT UNSIGNED NOT NULL,
    expira_em DATETIME NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_expiracao (status, expira_em)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cotas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    presente_id BIGINT UNSIGNED NOT NULL,
    numero SMALLINT UNSIGNED NOT NULL,
    status ENUM('disponivel','reservada','paga') NOT NULL DEFAULT 'disponivel',
    reserva_id BIGINT UNSIGNED DEFAULT NULL,
    UNIQUE KEY unico_numero_cota (presente_id, numero),
    INDEX idx_disponibilidade (presente_id, status),
    CONSTRAINT fk_cota_presente FOREIGN KEY(presente_id) REFERENCES presentes(id),
    CONSTRAINT fk_cota_reserva FOREIGN KEY(reserva_id) REFERENCES reservas(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pagamentos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reserva_id BIGINT UNSIGNED NOT NULL UNIQUE,
    provedor VARCHAR(60) NOT NULL,
    codigo_externo VARCHAR(150) UNIQUE DEFAULT NULL,
    status ENUM('aguardando','confirmado','falhou','estornado') NOT NULL DEFAULT 'aguardando',
    valor_centavos INT UNSIGNED NOT NULL,
    confirmado_em DATETIME DEFAULT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pagamento_reserva FOREIGN KEY (reserva_id) REFERENCES reservas(id)
) ENGINE=InnoDB;

INSERT INTO presentes (slug,nome,categoria,descricao,valor_cota_centavos,total_cotas,imagem)
VALUES
('geladeira','Geladeira','Cozinha','Para guardar nossos ingredientes favoritos.',25000,12,'assets/illustrations/geladeira.svg'),
('lavadora','Máquina de lavar','Lavanderia','Para deixar a rotina mais leve.',20000,12,'assets/illustrations/lavadora.svg'),
('sofa','Sofá','Sala','Para nossas sessões de filme.',20000,9,'assets/illustrations/sofa.svg'),
('microondas','Micro-ondas','Cozinha','Para os dias corridos.',20000,3,'assets/illustrations/microondas.svg'),
('cama','Cama de casal','Quarto','Nosso cantinho de descanso.',20000,9,'assets/illustrations/cama.svg'),
('fogao','Fogão','Cozinha','Para nossas receitas.',20000,10,'assets/illustrations/fogao.svg'),
('mesa','Mesa de jantar','Sala','Para receber quem amamos.',20000,8,'assets/illustrations/mesa.svg'),
('cafeteira','Cafeteira','Cozinha','Para cafés da manhã quentinhos.',10000,4,'assets/illustrations/cafeteira.svg')
ON DUPLICATE KEY UPDATE nome=VALUES(nome), categoria=VALUES(categoria), descricao=VALUES(descricao), valor_cota_centavos=VALUES(valor_cota_centavos), total_cotas=VALUES(total_cotas), imagem=VALUES(imagem);

-- Gera cotas individuais numeradas, sem reservas fictícias:
INSERT IGNORE INTO cotas (presente_id, numero)
SELECT p.id, n.numero
FROM presentes p
JOIN (
  SELECT 1 numero UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
  UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
  UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
) n ON n.numero <= p.total_cotas;

-- IMPORTANTE PARA EVITAR DUPLICIDADE NO BACKEND:
-- 1. START TRANSACTION;
-- 2. Expirar reservas vencidas da lista desejada dentro de transação/rotina consistente.
-- 3. SELECT id FROM cotas WHERE presente_id=? AND status='disponivel'
--    ORDER BY numero LIMIT ? FOR UPDATE;  -- bloquear as linhas escolhidas
-- 4. Checar que quantidade de linhas retornadas == quantidade desejada.
-- 5. INSERT reservas e UPDATE cotas SET status='reservada', reserva_id=? WHERE id IN (...).
-- 6. COMMIT; ROLLBACK se faltar cota.
-- 7. Confirmar como 'paga' SOMENTE depois do webhook autenticado do provedor Pix,
--    conferindo idempotência do evento, valor, pedido e identificador externo.
-- Nunca confiar no contador do JavaScript nem marcar a cota como paga pelo clique.