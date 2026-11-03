# 💍 Nosso Grande Dia — Lista de casamento (esboço v1)

Protótipo de site responsivo para uma lista de casamento **com presentes simbólicos divididos em cotas**. 

## Como abrir

1. Descompacte o ZIP.
2. Abra a pasta no **VS Code**.
3. Abra `index.html` no navegador ou use a extensão **Live Server**.
4. Clique em **Ver lista de presentes** e, depois, em **Contribuir**.

Não é necessário instalar Node, XAMPP, PHP ou banco de dados para **este esboço visual**.

## O que já dá para testar

- Site estilo cartoon com ilustração dos noivos (WebP transparente).
- Layout adaptado para computador e celular.
- Filtros: Cozinha, Lavanderia, Sala e Quarto.
- 8 presentes fictícios com preço total, quantidade e valor unitário de cotas.
- Barras de progresso das cotas escolhidas.
- Seleção de 1 ou mais cotas dentro do limite disponível.
- Reserva temporária de 15 minutos **apenas no navegador atual**.
- Simulação de confirmação de contribuição e liberação de cotas.
- Botão para reiniciar a simulação.

## Muito importante: o que AINDA NÃO está pronto

- **Não há Pix real, cobrança, processamento de pagamento nem comprovante válido.**
- As reservas ficam somente no `localStorage` do próprio navegador. **Dois convidados em dispositivos diferentes podem reservar a mesma cota.**
- As cotas previamente preenchidas são dados fictícios para demonstrar a interface.
- Ainda não existe autenticação, painel administrativo, banco MySQL ou backend de produção.
- Portanto, **não publique esta versão como sistema real de recebimento de dinheiro**.

## Estrutura do projeto

```text
site_casamento_esboco_v1/
├── index.html               # Página e estrutura
├── css/
│   └── style.css            # Cores, layout e responsividade
├── js/
│   └── app.js               # Presentes e reservas simuladas
├── assets/
│   ├── noivos-cartoon.webp   # Arte personalizada transparente
│   └── illustrations/       # 8 ilustrações SVG editáveis
├── database/
│   └── schema.sql    # Modelagem proposta para próxima versão
└── docs/
    └── proximas-etapas.md
```

## Personalizar textos e cores

- Nome do site e textos: `index.html`.
- Cores: variáveis `:root` no começo de `css/style.css`.
- Presentes, valores, cotas e categorias: array `GIFT_ITEMS` no começo de `js/app.js`.
- Foto dos noivos: substitua `assets/noivos-cartoon.webp`.
- Ilustrações dos produtos: edite os arquivos SVG em `assets/illustrations/`.

**Valores em JavaScript estão expressos em centavos:** `value:300000` significa R$ 3.000,00. O valor por cota é `value / quotas`.

## Próxima etapa recomendada

Criar backend PHP + MySQL com transações, bloqueio concorrente e webhook do provedor de Pix. Veja `docs/proximas-etapas.md`.
