# dashboard analytics · vml company

dashboard de marketing analytics estático, hospedado no vercel com deploy automático via github actions.

---

## estrutura de dados

os arquivos são armazenados em `assets/data/YYYY/MM/` com nomenclatura exata. o sistema aceita `.csv` e `.xlsx`.

### nomenclatura obrigatória por área

| área | arquivo | fonte |
|---|---|---|
| redes sociais | `redes-sociais-postagens.xlsx` ou `.csv` | mLabs · Meta Business Suite |
| redes sociais | `redes-sociais-stories.xlsx` ou `.csv` | mLabs · Meta Business Suite |
| mídia paga | `midia-linkedin.csv` ou `.xlsx` | LinkedIn Campaign Manager |
| mídia paga | `midia-meta.csv` ou `.xlsx` | Meta Ads Manager |
| mídia paga | `midia-spotify.csv` ou `.xlsx` | Spotify Ad Studio |
| email marketing | `crm.xlsx` ou `.csv` | RD Station Marketing |

> **importante**: o nome do arquivo deve ser exatamente igual ao listado acima. o dashboard lê os arquivos pelo nome — qualquer variação impede a leitura.

---

## formato esperado por arquivo

### redes-sociais-postagens
- uma linha por publicação, com `Data = Total`
- colunas: `Visualizações`, `Alcance`, `Curtidas`, `Compartilhamentos`, `Seguimentos`, `Comentários`, `Salvamentos`, `Tipo de post`

### redes-sociais-stories
- uma linha por story, com `Data = Total`
- colunas: `Visualizações`, `Alcance`, `Cliques no link`, `Respostas`, `Visitas ao perfil`, `Seguimentos`

### midia-linkedin
- linhas de campanhas + linha de total (canal vazio, período = `TOTAL`)
- colunas: `Canal`, `Campanha`, `Investimento (R$)`, `Impressões`, `Cliques`, `CTR (%)`, `Leads (Form)`

### midia-meta
- uma linha por campanha (sem linha de total — o sistema soma)
- colunas: `Canal`, `Campanha`, `Investimento (R$)`, `Impressões`, `Alcance`, `Cliques no Link`, `Leads`, `CPL (R$)`

### midia-spotify
- arquivo com 6 linhas de metadado antes do cabeçalho real (`ID da campanha,...`)
- dados diários por anúncio
- colunas: `Gasto`, `Impressões com streams`, `Alcance`, `Cliques`

### crm
- linhas de segmento (ex: `LEADS FRIOS`, `BASE RD`, `CLIENTES VML`) intercaladas com linhas de campanhas
- linha de campanha: primeira coluna = data no formato `YYYY-MM-DD HH:MM:SS`
- colunas: `Data de envio (dd/mm/aaaa)`, `Nome do email`, `Assunto`, `Leads selecionados`, `Taxa de entrega`, `Taxa de abertura`, `Taxa de clique (CTR)`
- taxas podem estar em % (ex: `95.94`) ou fração (ex: `0.9713`) — o sistema normaliza automaticamente

---

## estrutura de arquivos

```
dashboard-vml-main/
├── index.html                          # home · visão geral
├── vercel.json                         # clean urls + rewrites
├── assets/
│   ├── css/styles.css
│   ├── img/logo.png, logo-escuro.png, favicon.png
│   ├── js/
│   │   ├── area.js                     # utilitários compartilhados
│   │   ├── redes-sociais.js            # instagram: posts + stories
│   │   ├── midia-paga.js               # linkedin + meta + spotify
│   │   └── crm.js                      # email marketing (rd station)
│   └── data/
│       └── YYYY/
│           └── MM/
│               ├── redes-sociais-postagens.xlsx
│               ├── redes-sociais-stories.xlsx
│               ├── midia-linkedin.csv
│               ├── midia-meta.csv
│               ├── midia-spotify.csv
│               └── crm.xlsx
├── pages/
│   ├── redes-sociais/index.html
│   ├── midia-paga/index.html
│   ├── crm/index.html
│   ├── seo/index.html
│   └── upload/index.html
└── scripts/
    └── fetch_rdstation.py              # automação via github actions
```

---

## upload de arquivos

acesse `/pages/upload` no dashboard para enviar arquivos via interface gráfica. o sistema:

1. valida a extensão (aceita `.csv` e `.xlsx`)
2. valida o nome exato do arquivo — rejeita qualquer variação
3. envia para o repositório github via api
4. o vercel faz deploy automático em instantes

para o envio funcionar, configure as variáveis de ambiente no vercel:
- `GITHUB_TOKEN` — token de acesso pessoal com permissão de escrita no repositório
- `GITHUB_REPO` — no formato `usuario/nome-do-repositorio`
- `GITHUB_BRANCH` — branch de destino (padrão: `main`)

---

## deploy

```bash
# clonar
git clone https://github.com/SEU_USUARIO/dashboard-vml.git
cd dashboard-vml

# não há dependências de build — é HTML/CSS/JS puro
# fazer deploy no vercel via git push
git add .
git commit -m "update data"
git push
```

---

## período suportado

o dashboard suporta dados de **2022 a 2030**. a sidebar de navegação detecta automaticamente quais meses têm dados disponíveis via requisições paralelas.

---

## automação (github actions)

o workflow `.github/workflows/fetch-data.yml` executa às **08h e 16h BRT** para buscar dados via api quando disponível. exportações manuais (linkedin, spotify) devem ser feitas via página de upload.

---

vml company · 2026
