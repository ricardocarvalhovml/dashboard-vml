# Dashboard VML Company

Dashboard estático para visualização de métricas de Instagram, alimentado por exportações do Meta Business Suite e hospedado via GitHub + Vercel.

---

## Estrutura de arquivos

```
dashboard-vml/
├── index.html                  ← dashboard principal (não editar)
├── logo.png                    ← logotipo VML Company (barra lateral)
├── favicon.png                 ← ícone da aba
├── temeron-logo.png            ← logotipo do rodapé
├── data/
│   ├── dados_gerais.xlsx       ← planilha consolidada de seguidores e conta
│   └── 2026/                   ← pasta do ano
│       ├── 2026-01-03.csv      ← opcional: multi-mês (Jan a Mar de 2026)
│       └── 03/                 ← pasta do mês
│           ├── 2026-03.csv     ← exportação de publicações do Meta
│           ├── Alcance.csv
│           ├── Seguidores.csv
│           ├── Visualizações.csv
│           ├── Interações.csv
│           ├── Visitas.csv
│           ├── Cliques_no_link.csv
│           └── Público.csv
```

> A pasta `posts/` não é necessária. As imagens das publicações são carregadas via embed do Instagram.

---

## O que o dashboard exibe

**Home** — visão geral de todos os períodos com boxes clicáveis por ano (views, alcance, curtidas, sparkline mensal), gráfico comparativo entre anos (quando há mais de um) e evolução de seguidores.

**Visão mensal — 3 abas:**
- *Visão Geral:* KPIs, dados de conta, gráficos diários (se disponíveis), views por publicação, melhor publicação do mês, engajamento total e desempenho por dia da semana com mini gráficos semanais
- *Posts:* melhores e piores publicações em grade de 3 colunas (embed navegável com carrossel + métricas), agrupamento por formato em galeria, tabela completa
- *Público:* faixa etária por gênero, top países e top cidades (só disponível para meses com `Público.csv`)

**Visão anual:**
- KPIs do ano, gráfico de views e alcance com 12 meses, crescimento de seguidores com tendência
- Melhor mês do ano (card com embed do post mais visto)
- Top 3 e 3 menores do ano em grade de 3 colunas
- Desempenho por dia da semana consolidado do ano
- Grid de todos os 12 meses clicáveis

---

## Fluxo mensal

### 1. Publicações

1. Acesse **Meta Business Suite → Insights → Publicações**
2. Selecione o período do mês (ex: março)
3. **Exportar → CSV**
4. Renomeie para `2026-03.csv`
5. Suba em `data/2026/03/`

> **Opção multi-mês:** nomeie como `2026-01-03.csv` (janeiro a março) e suba em `data/2026/`. O dashboard separa automaticamente por mês.

### 2. Métricas diárias (opcional)

Suba todos em `data/2026/03/` **sem renomear**:

| Arquivo | Onde exportar no Meta |
|---|---|
| `Visualizações.csv` | Insights → Visão Geral → Visualizações |
| `Alcance.csv` | Insights → Visão Geral → Alcance |
| `Seguidores.csv` | Público → Tendências → Seguidores |
| `Interações.csv` | Insights → Visão Geral → Interações |
| `Visitas.csv` | Insights → Visão Geral → Visitas ao perfil |
| `Cliques_no_link.csv` | Insights → Visão Geral → Cliques no link |
| `Público.csv` | Público → Dados demográficos → Exportar |

> Meses sem esses arquivos simplesmente não exibem as seções correspondentes.

### 3. Dados da conta (planilha)

1. Baixe `dados_gerais.xlsx` do repositório
2. Na aba do ano correspondente, adicione uma linha:

| Coluna | Onde encontrar no Meta |
|---|---|
| Ano | Preencha manualmente |
| Mês | Preencha manualmente (ex: Março) |
| Total seguidores | Público → Tendências → Seguidores (total ao final do mês) |
| Seguidores ganhos | Público → Tendências → Seguidores (novos) |
| Deixaram de seguir | Público → Tendências → Deixaram de seguir |
| Conversas | Desempenho → Conversas iniciadas |
| Novos contatos | Desempenho → Novos contatos |
| Taxa de resposta | Desempenho → Taxa de resposta (só o número, sem %) |

3. Salve e suba em `data/` (substitui o anterior)

---

## Publicar atualização

A Vercel republica automaticamente em ~30 segundos após qualquer commit no repositório.

---

## Observações técnicas

- **Anos e meses:** apenas períodos com dados aparecem no menu e na home. Sem arquivo → sem entrada.
- **Fuso horário:** o Meta exporta horários em UTC-8 (Pacífico). O dashboard aplica +5h automaticamente para converter para BRT (UTC-3).
- **Imagens:** todos os posts são exibidos via embed do Instagram. Os carrosseis são navegáveis diretamente no card. Há um link discreto "↗ Abrir no Instagram" em cada card.
- **Gráficos diários e público:** ficam ocultos automaticamente em meses sem os arquivos correspondentes.
- **Eixo Y dos gráficos:** sempre 40% acima do valor máximo do período.
- **Sidebar:** bolinha azul-violeta = mês atual. Bolinha roxa = melhor mês. Cinza = demais meses.
