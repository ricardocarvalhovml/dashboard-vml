# dashboard analytics · vml company

desenvolvido por temeron

---

## estrutura do projeto

```
/
├── index.html                  ← home (visão geral + filtro de áreas)
├── vercel.json
├── README.md
│
├── redes-sociais/
│   └── index.html              ← dashboard instagram
├── seo/
│   └── index.html              ← dashboard seo
├── crm/
│   └── index.html              ← dashboard crm
├── midia-paga/
│   └── index.html              ← dashboard mídia paga
├── upload/
│   └── index.html              ← página de upload sem login
│
└── assets/
    ├── css/
    │   └── styles.css
    ├── js/
    │   ├── app.js              ← lógica de redes sociais
    │   └── area.js             ← lógica genérica (seo, crm, mídia paga)
    ├── img/
    │   ├── logo.png
    │   ├── logo-escuro.png
    │   ├── favicon.png
    │   └── copyright-logo.png
    ├── data/
    │   └── YYYY/
    │       └── MM/
    │           ├── YYYY-MM.csv         ← redes sociais (posts instagram)
    │           ├── seo.csv
    │           ├── crm.csv
    │           └── midia-paga.csv
    └── posts/
        └── *.png               ← thumbnails dos posts (código do instagram)
```

---

## formato dos arquivos csv

### redes sociais — `YYYY-MM.csv`
exportação direta do meta business suite (posts com linha "Total")

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

## upload sem github

acesse `/upload` no browser. selecione a área, o mês, arraste o csv e clique enviar.
o arquivo vai direto para `assets/data/YYYY/MM/` no repositório via github api.

**configuração única (você faz uma vez):**
1. github → settings → developer settings → personal access tokens → tokens (classic)
2. marcar permissão `repo` → gerar token
3. colar em `upload/index.html` no campo `token: 'SEU_TOKEN_AQUI'`
4. confirmar `owner` e `repo` corretos

---

## deploy (vercel)

1. push para o repositório github
2. importar no vercel
3. sem configuração adicional — `cleanUrls: true` já cuida das rotas
