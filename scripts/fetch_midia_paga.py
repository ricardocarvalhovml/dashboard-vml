"""
fetch_midia_paga.py
Combina dados do Meta Ads e Google Ads e gera midia-paga.csv
para o mês corrente.

Formato de saída:
  Investimento,Impressões,Cliques,CTR,CPC,Conversões,ROAS
  6075,120152,3872,3.22,1.57,194,1.08
"""

import os
import csv
import requests
from datetime import date

# ── Período ────────────────────────────────────────────────────────────────
today  = date.today()
YEAR   = today.year
MONTH  = today.month
START  = f"{YEAR}-{MONTH:02d}-01"
END    = today.strftime("%Y-%m-%d")

# ═══════════════════════════════════════════════════════════════════════════
#  META ADS
# ═══════════════════════════════════════════════════════════════════════════

META_TOKEN      = os.environ["META_ACCESS_TOKEN"]    # Secret: META_ACCESS_TOKEN
META_ACCOUNT_ID = os.environ["META_AD_ACCOUNT_ID"]   # Secret: META_AD_ACCOUNT_ID  ex: "act_123456789"

def fetch_meta():
    print("[Meta Ads] Buscando dados...")
    url = f"https://graph.facebook.com/v19.0/{META_ACCOUNT_ID}/insights"
    params = {
        "access_token": META_TOKEN,
        "time_range":   f'{{"since":"{START}","until":"{END}"}}',
        "fields":       "spend,impressions,clicks,ctr,cpc,actions,action_values",
        "level":        "account",
    }
    r = requests.get(url, params=params, timeout=30)
    r.raise_for_status()
    data = r.json().get("data", [])

    if not data:
        print("  Sem dados Meta para o período.")
        return {"spend": 0, "impressions": 0, "clicks": 0, "conversions": 0, "revenue": 0}

    row = data[0]

    # Conversões: ação "lead" ou "purchase"
    actions = row.get("actions") or []
    conversions = sum(
        int(a.get("value", 0))
        for a in actions
        if a.get("action_type") in ("lead", "purchase", "offsite_conversion.fb_pixel_lead")
    )

    # Receita: action_values de "purchase"
    action_values = row.get("action_values") or []
    revenue = sum(
        float(a.get("value", 0))
        for a in action_values
        if a.get("action_type") == "purchase"
    )

    result = {
        "spend":       float(row.get("spend", 0)),
        "impressions": int(row.get("impressions", 0)),
        "clicks":      int(row.get("clicks", 0)),
        "conversions": conversions,
        "revenue":     revenue,
    }
    print(f"  Gasto: R$ {result['spend']:.2f} | Impressões: {result['impressions']:,}")
    return result


# ═══════════════════════════════════════════════════════════════════════════
#  GOOGLE ADS
# ═══════════════════════════════════════════════════════════════════════════

def fetch_google_ads():
    """
    Usa a biblioteca google-ads para buscar métricas do mês.
    Credenciais via variáveis de ambiente (GitHub Secrets).
    """
    print("[Google Ads] Buscando dados...")

    try:
        from google.ads.googleads.client import GoogleAdsClient
    except ImportError:
        print("  AVISO: google-ads não instalado. Pulando Google Ads.")
        return {"spend": 0, "impressions": 0, "clicks": 0, "conversions": 0, "revenue": 0}

    # Configura cliente via ENV (sem arquivo yaml exposto)
    config = {
        "developer_token":  os.environ["GOOGLE_ADS_DEVELOPER_TOKEN"],
        "client_id":        os.environ["GOOGLE_ADS_CLIENT_ID"],
        "client_secret":    os.environ["GOOGLE_ADS_CLIENT_SECRET"],
        "refresh_token":    os.environ["GOOGLE_ADS_REFRESH_TOKEN"],
        "use_proto_plus":   True,
    }
    customer_id = os.environ["GOOGLE_ADS_CUSTOMER_ID"]  # ex: "1234567890"

    client = GoogleAdsClient.load_from_dict(config)
    service = client.get_service("GoogleAdsService")

    # GAQL: métricas agregadas do mês
    start_fmt = START.replace("-", "")   # YYYYMMDD
    end_fmt   = END.replace("-", "")

    query = f"""
        SELECT
          metrics.cost_micros,
          metrics.impressions,
          metrics.clicks,
          metrics.conversions,
          metrics.conversions_value
        FROM customer
        WHERE segments.date BETWEEN '{start_fmt}' AND '{end_fmt}'
    """

    response = service.search(customer_id=customer_id, query=query)

    spend = 0.0
    impressions = 0
    clicks = 0
    conversions = 0.0
    revenue = 0.0

    for row in response:
        m = row.metrics
        spend       += m.cost_micros / 1_000_000
        impressions += m.impressions
        clicks      += m.clicks
        conversions += m.conversions
        revenue     += m.conversions_value

    result = {
        "spend":       round(spend, 2),
        "impressions": impressions,
        "clicks":      clicks,
        "conversions": int(conversions),
        "revenue":     round(revenue, 2),
    }
    print(f"  Gasto: R$ {result['spend']:.2f} | Impressões: {result['impressions']:,}")
    return result


# ═══════════════════════════════════════════════════════════════════════════
#  COMBINAÇÃO E ESCRITA
# ═══════════════════════════════════════════════════════════════════════════

def write_csv(meta, gads):
    total_spend       = meta["spend"] + gads["spend"]
    total_impressions = meta["impressions"] + gads["impressions"]
    total_clicks      = meta["clicks"] + gads["clicks"]
    total_conversions = meta["conversions"] + gads["conversions"]
    total_revenue     = meta["revenue"] + gads["revenue"]

    ctr  = round((total_clicks / total_impressions * 100), 2) if total_impressions > 0 else 0.0
    cpc  = round((total_spend / total_clicks), 2)              if total_clicks > 0 else 0.0
    roas = round((total_revenue / total_spend), 2)             if total_spend > 0 else 0.0

    row = {
        "Investimento": round(total_spend, 2),
        "Impressões":   total_impressions,
        "Cliques":      total_clicks,
        "CTR":          ctr,
        "CPC":          cpc,
        "Conversões":   total_conversions,
        "ROAS":         roas,
    }

    path = f"assets/data/{YEAR}/{MONTH:02d}/midia-paga.csv"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    fields = ["Investimento","Impressões","Cliques","CTR","CPC","Conversões","ROAS"]
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerow(row)
    print(f"  ✓ Gravado em {path}")
    print(f"  Total: R$ {total_spend:.2f} | CTR: {ctr}% | CPC: R$ {cpc:.2f} | ROAS: {roas}")


if __name__ == "__main__":
    meta = fetch_meta()
    gads = fetch_google_ads()
    write_csv(meta, gads)
    print("[Mídia Paga] Concluído.")
