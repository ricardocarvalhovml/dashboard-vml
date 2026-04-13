# dashboard analytics · vml company

desenvolvido por [temeron](https://temeron.com.br)

---

## visão geral

dashboard de marketing multi-área alimentado automaticamente via APIs externas (RD Station, Meta Ads, Google Ads, Google Search Console + GA4), com fallback para upload manual de arquivos. hospedado no vercel, código no github, sem custo.

**áreas disponíveis**
- redes sociais — instagram (mLabs / Meta Business Suite)
- seo — google search console + google analytics 4
- crm — rd station marketing
- mídia paga — meta ads + google ads

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
│   ├── crm/index.html                ← dashboard crm
│   ├── midia-paga/index.html         ← dashboard mídia paga
│   └── upload/index.html             ← upload sem login
│
├── assets/
│   ├── css/styles.css
│   ├── js/
│   │   ├── redes-sociais.js          ← lógica de redes sociais
│   │   └── area.js                   ← lógica genérica (seo, crm, mídia paga)
│   ├── img/
│   │   ├── logo.png
│   │   ├── logo-escuro.png
│   │   ├── favicon.png
│   │   ├── copyright-logo.png
│   │   └── posts/                    ← thumbnails dos posts (código do instagram)
│   └── data/
│       └── YYYY/
│           └── MM/
│               ├── YYYY-MM.csv       ← redes sociais (exportação mLabs)
│               ├── seo.csv           ← ou seo.xlsx
│               ├── crm.csv           ← ou crm.xlsx
│               ├── midia-paga.csv    ← ou midia-paga.xlsx
│               └── api-status.json   ← gerado automaticamente (badge de fonte)
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

## atualização automática via API

o github actions roda dois vezes por dia e alimenta o dashboard automaticamente:

| horário | o que acontece |
|---------|---------------|
| 08:00 BRT | busca dados de todas as APIs e grava os CSVs |
| 16:00 BRT | mesma operação, dados do dia atualizados |

após cada execução, um arquivo `api-status.json` é gravado no diretório do mês. o dashboard lê esse arquivo e exibe um badge no header de cada área indicando a fonte dos dados:

- `⚡ via api · 13/04/2026 às 08:00` — dados frescos da API
- `📄 via arquivo` — dados de upload manual

**fontes por área**

| área | fonte |
|------|-------|
| crm | rd station marketing api |
| mídia paga | meta ads api + google ads api (somados) |
| seo | google search console api + google analytics 4 api |
| redes sociais | exportação manual do mLabs (não tem api pública) |

---

## prioridade dos dados

```
GitHub Actions (API) → grava CSV → dashboard lê CSV   ← prioridade máxima
Upload manual        → grava CSV → dashboard lê CSV   ← fallback
Nenhum arquivo       → dashboard exibe —              ← layout nunca quebra
```

o dashboard tenta `.csv` primeiro, depois `.xlsx` como fallback. se nenhum existir, todos os campos mostram `—` sem quebrar o layout.

---

## formato dos arquivos

todos os arquivos aceitam `.csv` ou `.xlsx` com o mesmo nome de coluna.

### redes sociais — `YYYY-MM.csv`
exportação direta do mLabs ou do meta business suite.
cada linha de post deve ter `Data = Total`.

### seo — `seo.csv`
```
Sessões Orgânicas,Impressões,Cliques,CTR,Posição Média,Keywords Top 10
1500,45000,1200,2.67,18.3,42
```

### crm — `crm.csv`
```
Novos Leads,Leads Qualificados,Oportunidades,Negócios Fechados,Taxa de Conversão,Receita
80,45,20,8,10.0,28000
```

### mídia paga — `midia-paga.csv`
```
Investimento,Impressões,Cliques,CTR,CPC,Conversões,ROAS
5000,120000,3600,3.0,1.39,180,3.6
```

---

## configuração das APIs (github secrets)

todos os tokens ficam em **settings → secrets and variables → actions** do repositório. nenhum token vai para o código.

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

para o guia completo de onde obter cada credencial, consulte `GUIA-SETUP.md`.

---

## upload manual sem github

acesse `/upload` no browser. selecione a área, o mês, arraste o arquivo (`.csv` ou `.xlsx`) e clique enviar. o arquivo vai direto para `assets/data/YYYY/MM/` via github api.

**configuração única:**
1. github → settings → developer settings → personal access tokens → tokens (classic)
2. marcar permissão `repo` → gerar token
3. colar em `pages/upload/index.html` no campo `token: 'SEU_TOKEN_AQUI'`
4. confirmar `owner` e `repo` corretos no mesmo arquivo

---

## deploy (vercel)

1. push para o repositório github (branch `refactor-estrutura` ou `main`)
2. importar no vercel
3. sem configuração adicional — `vercel.json` já cuida das rotas

para visualizar uma branch antes de promover para produção: vercel → deployments → filtrar por branch.
