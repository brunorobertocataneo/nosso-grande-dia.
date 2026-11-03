# Evolução planejada do projeto

## Etapa 1 — Interface (entregue)
- Homepage ilustrada, filtros, cotas, modal e simulação local.
- Dados fictícios. Nenhuma cobrança.

## Etapa 2 — Backend PHP + MySQL
- Configurar XAMPP ou servidor PHP com MySQL.
- Aplicar `database/schema.sql` e criar conexão PDO parametrizada.
- Criar endpoints de leitura de presentes e de reservas; proteger os de escrita com validação e limitação de requisições.
- No POST de reserva: abrir transação; expirar reservas; consultar e bloquear cotas disponíveis (SELECT ... FOR UPDATE); gravar reserva, associar cotas, COMMIT.
- Nunca usar contagem recebida do frontend como fonte de verdade. Usar valores do banco.
- Criar rotina segura de expiração/cancelamento, com logs de eventos e transações.
- Testar 2 navegadores reservando simultaneamente a última cota: apenas 1 deve conseguir.

## Etapa 3 — Pix real
- Escolher provedor de pagamento, checar tarifas, prazos de repasse e funcionamento do Pix.
- Reservar por 15 minutos; gerar pedido Pix único pelo backend.
- Aceitar confirmação só via webhook autenticado/assinado com conferência de valor, ID e idempotência. Não confiar em confirmação da interface.
- Definir política de pagamento fora do prazo (incluindo conciliação e eventual reembolso).
- Exibir "Pago" apenas após confirmação real; nunca mostrar valor de presente como recebido só porque foi reservado.

## Etapa 4 — Administração e produção
- Login de noivos com hash de senha forte, sessão segura, CSRF, HTTPS.
- CRUD de presentes, cotas e histórico de pagamentos com filtros.
- Política de privacidade (nome, contato e pagamento do convidado) e retenção mínima conforme LGPD.
- Testes de segurança e concorrência antes de divulgar o site.
- Personalizar nomes, data, histórias, contato e ilustrações.