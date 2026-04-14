"""
fetch_seo.py
Busca dados de SEO via Google Search Console (GSC) e Google Analytics 4 (GA4)
e gera seo.csv para o mês corrente.

Formato de saída:
  Sessões Orgânicas,Impressões,Cliques,CTR,Posição Média,Keywords Top 10
  1632,49034,1269,2.59,17.1,46

Credenciais: Service Account JSON armazenado como GitHub Secret.
  - A Service Account precisa ter acesso ao GSC e à propriedade GA4.
  - No GSC: adicionar o e-mail da service account como usuário
  - No GA4: conceder acesso de Leitor à service account
"""

import os
import csv
import json
import tempfile
from datetime import date, timedelta

import google.auth
from googleapiclient.discovery import build
from google.oauth2 import service_account

# ── Credenciais via Secret ─────────────────────────────────────────────────
SA_JSON_STR = os.environ["GOOGLE_SERVICE_ACCOUNT_JSON"]  # JSON completo como string
GSC_SITE    = os.environ["GSC_SITE_URL"]                  # ex: "https://vmlcomp.com.br/"
GA4_PROP    = os.environ["GA4_PROPERTY_ID"]               # ex: "properties/123456789"

SCOPES = [
    "https://www.googleapis.com/auth/webmasters.readonly",
    "https://www.googleapis.com/auth/analytics.readonly",
]

# ── Período ────────────────────────────────────────────────────────────────
today  = date.today()
YEAR   = today.year
MONTH  = today.month
START  = f"{YEAR}-{MONTH:02d}-01"
END    = today.strftime("%Y-%m-%d")

# ── Credenciais ────────────────────────────────────────────────────────────
def get_credentials():
    sa_info = json.loads(SA_JSON_STR)
    return service_account.Credentials.from_service_account_info(
        sa_info, scopes=SCOPES
    )

# ═══════════════════════════════════════════════════════════════════════════
#  GOOGLE SEARCH CONSOLE
# ═══════════════════════════════════════════════════════════════════════════

def fetch_gsc(creds):
    print("[GSC] Buscando dados...")
    service = build("searchconsole", "v1", credentials=creds, cache_discovery=False)

    # ── Métricas agregadas do mês ──────────────────────────────────────────
    body_total = {
        "startDate": START,
        "endDate":   END,
        "type":      "web",
    }
    r = service.searchanalytics().query(siteUrl=GSC_SITE, body=body_total).execute()
    rows = r.get("rows", [])

    impressions = 0
    clicks      = 0
    ctr         = 0.0
    position    = 0.0

    if rows:
        agg = rows[0]
        impressions = int(agg.get("impressions", 0))
        clicks      = int(agg.get("clicks", 0))
        ctr         = round(agg.get("ctr", 0) * 100, 2)
        position    = round(agg.get("position", 0), 1)

    # ── Keywords no Top 10 ─────────────────────────────────────────────────
    body_kw = {
        "startDate":  START,
        "endDate":    END,
        "type":       "web",
        "dimensions": ["query"],
        "rowLimit":   1000,
    }
    r_kw = service.searchanalytics().query(siteUrl=GSC_SITE, body=body_kw).execute()
    kw_rows = r_kw.get("rows", [])
    keywords_top10 = sum(1 for row in kw_rows if row.get("position", 99) <= 10)

    print(f"  Impressões: {impressions:,} | Cliques: {clicks:,} | Pos. média: {position}")
    print(f"  Keywords Top 10: {keywords_top10}")

    return {
        "impressions":    impressions,
        "clicks":         clicks,
        "ctr":            ctr,
        "position":       position,
        "keywords_top10": keywords_top10,
    }

# ═══════════════════════════════════════════════════════════════════════════
#  GOOGLE ANALYTICS 4 — Sessões Orgânicas
# ═══════════════════════════════════════════════════════════════════════════

def fetch_ga4(creds):
    print("[GA4] Buscando sessões orgânicas...")
    service = build("analyticsdata", "v1beta", credentials=creds, cache_discovery=False)

    body = {
        "dateRanges": [{"startDate": START, "endDate": END}],
        "metrics":    [{"name": "sessions"}],
        "dimensionFilter": {
            "filter": {
                "fieldName": "sessionDefaultChannelGrouping",
                "stringFilter": {
                    "matchType": "EXACT",
                    "value": "Organic Search",
                },
            }
        },
    }

    r = service.properties().runReport(property=GA4_PROP, body=body).execute()
    rows = r.get("rows", [])
    sessions = int(rows[0]["metricValues"][0]["value"]) if rows else 0

    print(f"  Sessões orgânicas: {sessions:,}")
    return sessions

# ═══════════════════════════════════════════════════════════════════════════
#  ESCRITA DO CSV
# ═══════════════════════════════════════════════════════════════════════════

def write_csv(sessions, gsc):
    row = {
        "Sessões Orgânicas": sessions,
        "Impressões":        gsc["impressions"],
        "Cliques":           gsc["clicks"],
        "CTR":               gsc["ctr"],
        "Posição Média":     gsc["position"],
        "Keywords Top 10":   gsc["keywords_top10"],
    }

    path = f"assets/data/{YEAR}/{MONTH:02d}/seo.csv"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    fields = ["Sessões Orgânicas","Impressões","Cliques","CTR","Posição Média","Keywords Top 10"]
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerow(row)
    print(f"  ✓ Gravado em {path}")


if __name__ == "__main__":
    creds    = get_credentials()
    gsc_data = fetch_gsc(creds)
    sessions = fetch_ga4(creds)
    write_csv(sessions, gsc_data)
    print("[SEO] Concluído.")
