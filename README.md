# dashboard analytics · vml company

desenvolvido por vml company · temeron

---

## visão geral

dashboard de marketing multi-área alimentado automaticamente via APIs externas (RD Station, Meta Ads, Google Ads, Google Search Console + GA4), com fallback para upload manual de arquivos. hospedado no vercel, código no github, sem custo.

**áreas disponíveis**
- redes sociais — instagram (mLabs / Meta Business Suite)
- seo — google search console + google analytics 4
- crm — e-mail marketing · taxas consolidadas · campanhas (rd station)
- mídia paga — funil crm · meta ads anúncios · campanha × fonte

---

## estrutura do projeto

```
/
├── index.html                        ← home (visão geral)
├── vercel.json                       ← rotas e rewrites
├── README.md
│
├── pages/
│   ├── redes-sociais/index.html      ← dashboard instagram
│   ├── seo/index.html                ← dashboard seo
│   ├── crm/index.html                ← dashboard crm (redesenhado abr/2026)
│   ├── midia-paga/index.html         ← dashboard mídia paga (redesenhado abr/2026)
│   └── upload/index.html             ← upload sem login
│
├── assets/
│   ├── css/styles.css
│   ├── js/
│   │   ├── redes-sociais.js          ← lógica de redes sociais
│   │   └── area.js                   ← lógica genérica (seo)
│   ├── img/
│   │   ├── logo.png
│   │   ├── logo-escuro.png
│   │   ├── favicon.png
│   │   ├── copyright-logo.png
│   │   └── posts/                    ← thumbnails dos posts (código do instagram)
│   └── data/
│       ├── manifest.json             ← OBRIGATÓRIO: lista de meses disponíveis por área
│       └── YYYY/
│           └── MM/
│               ├── YYYY-MM.csv               ← redes sociais (exportação mLabs)
│               ├── seo.csv
│               ├── crm.csv                   ← taxas consolidadas por segmento
│               ├── crm-emails.csv            ← detalhamento e-mails por campanha
│               ├── midia-paga.csv            ← kpis do funil crm
│               ├── midia-paga-anuncios.csv   ← top anúncios meta ads
│               ├── midia-paga-campanhas.csv  ← campanha × fonte de origem
│               └── api-status.json           ← gerado automaticamente (badge de fonte)
│
├── scripts/                          ← scripts de fetch das APIs
│   ├── fetch_rdstation.py
│   ├── fetch_midia_paga.py
│   ├── fetch_seo.py
│   ├── write_status.py
│   └── requirements.txt
│
└── .github/
    └── workflows/
        └── fetch-data.yml            ← GitHub Actions (08h e 16h BRT)
```

---

## manifest.json — obrigatório

o dashboard não faz probing de pastas para descobrir quais meses existem. ele lê um único arquivo `assets/data/manifest.json` que declara os períodos disponíveis por área.

**sempre que subir dados de um novo mês, atualizar o manifest:**

```json
{
  "2026/01": ["crm", "midia-paga", "seo"],
  "2026/02": ["crm", "midia-paga", "seo"],
  "2026/03": ["crm", "midia-paga", "seo"],
  "2026/04": ["crm", "midia-paga"]
}
```

cada chave é `"YYYY/MM"` e o valor é a lista de áreas disponíveis naquele mês. sem atualizar o manifest, o período não aparece na sidebar.

> por que? a abordagem anterior fazia ~100 requisições HEAD (uma por mês × ano) e gerava uma cascata de erros 404 no console, travando o render da página.

---

## formato dos arquivos por área

### redes sociais — `YYYY-MM.csv`
exportação direta do mLabs ou meta business suite. cada linha de post deve ter `Data = Total`.

### seo — `seo.csv`
```
Sessões Orgânicas,Impressões,Cliques,CTR,Posição Média,Keywords Top 10
1500,45000,1200,2.67,18.3,42
```

### crm — múltiplos arquivos (a partir de abr/2026)

**`crm.csv`** — taxas consolidadas por segmento (uma linha por segmento):
```
Segmento,Taxa_Entrega,Taxa_Abertura,Taxa_Clique
Leads frios,90.77,18.59,5.25
Base de clientes,95.70,20.54,1.04
```

**`crm-emails.csv`** — todos os disparos de e-mail do mês:
```
Data,Campanha,Segmento,Nome_Email,Assunto,Leads,Taxa_Entrega,Taxa_Abertura,Taxa_Clique
2026-03-18,Expo Cotrijal,Leads frios,[Expo Cotrijal] ...,Assunto,763,95.94,12.84,0.00
```

valores de `Campanha` com cor automática: `Expo Cotrijal`, `Intermodal`, `Webinar`, `Auditoria de Folha`.

### mídia paga — múltiplos arquivos (a partir de abr/2026)

**`midia-paga.csv`** — kpis do funil e agregado meta (uma linha):
```
Leads,MQL,SQL,Lead_Recebido,Qualificacao_Inicial,Oportunidade,Reuniao_Agendada,Semana_Atual,Semana_Anterior,Investimento,Impressoes,Alcance,Conversoes
169,90,79,3,37,16,10,64,52,2679.12,88200,43020,459
```

**`midia-paga-anuncios.csv`** — top anúncios meta ads (ordenável, com filtros):
```
Anuncio,Formato,Campanha,Gasto,Impressoes,Alcance,Frequencia,Taxa_Cliques,Conversoes,CPA
Imagem 1 - Intermodal,Imagem,Intermodal,1284.70,67600,30000,2.26,1.15,359,3.58
```
campo `Formato`: `Imagem` ou `Vídeo`.

**`midia-paga-campanhas.csv`** — campanha × fonte de origem com barras de distribuição:
```
Campanha,Fonte,Leads,Percentual_Campanha,Percentual_Fonte
Formulário meta ads - voucher Intermodal,Busca Paga | Facebook Ads,112,66.9,99
```

---

## atualização automática via API

o github actions roda duas vezes por dia:

| horário | o que acontece |
|---------|----------------|
| 08:00 BRT | busca dados de todas as APIs e grava os CSVs |
| 16:00 BRT | mesma operação, dados do dia atualizados |

após cada execução que cria um novo mês, atualizar o `manifest.json`.

| área | fonte |
|------|-------|
| crm | rd station marketing api + exportação manual de e-mail |
| mídia paga | meta ads api (funil rd station + anúncios meta) |
| seo | google search console api + google analytics 4 api |
| redes sociais | exportação manual do mLabs (não tem api pública) |

---

## configuração das APIs (github secrets)

| secret | descrição |
|--------|-----------|
| `GH_PAT` | personal access token do github (permissão `repo`) |
| `RD_TOKEN` | token de acesso da rd station marketing |
| `META_ACCESS_TOKEN` | token do usuário do sistema meta |
| `META_AD_ACCOUNT_ID` | id da conta de anúncios (ex: `act_123456789`) |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | developer token do google ads |
| `GOOGLE_ADS_CLIENT_ID` | client id oauth do google |
| `GOOGLE_ADS_CLIENT_SECRET` | client secret oauth do google |
| `GOOGLE_ADS_REFRESH_TOKEN` | refresh token oauth do google |
| `GOOGLE_ADS_CUSTOMER_ID` | id do cliente google ads (sem hífens) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | json completo da service account google |
| `GSC_SITE_URL` | url exata do site no search console (ex: `https://vmlcomp.com.br/`) |
| `GA4_PROPERTY_ID` | id da propriedade ga4 (ex: `properties/123456789`) |

---

## upload manual sem github

acesse `/upload` no browser. selecione a área, o mês, arraste o arquivo e clique enviar. após o upload, atualizar `manifest.json` manualmente.

**configuração única:**
1. github → settings → developer settings → personal access tokens → tokens (classic)
2. marcar permissão `repo` → gerar token
3. colar em `pages/upload/index.html` no campo `token: 'SEU_TOKEN_AQUI'`
4. confirmar `owner` e `repo` corretos no mesmo arquivo

---

## deploy (vercel)

1. push para o repositório github
2. importar no vercel
3. sem configuração adicional — `vercel.json` já cuida das rotas

---

## histórico de alterações

| data | o que mudou |
|------|-------------|
| abr/2026 | redesign completo das páginas crm e mídia paga com múltiplos CSVs por área |
| abr/2026 | criado `manifest.json` — elimina probing de 404s no console do browser |
| abr/2026 | adicionado mês `2026/04` com dados reais de crm e mídia paga |
