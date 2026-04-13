"""
fetch_rdstation.py
Busca dados de leads e funil na RD Station Marketing API
e gera o crm.csv para o mês corrente.

Formato de saída (mantém compatibilidade com o dashboard):
  Novos Leads,Leads Qualificados,Oportunidades,Negócios Fechados,Taxa de Conversão,Receita
  83,40,19,7,8.4,23543
"""

import os
import csv
import requests
from datetime import datetime, date, timezone

# ── Configuração ───────────────────────────────────────────────────────────
TOKEN = os.environ["RD_TOKEN"]           # GitHub Secret: RD_TOKEN
BASE  = "https://api.rd.com.br/platform"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
}

# ── Período: mês atual ─────────────────────────────────────────────────────
today     = date.today()
YEAR      = today.year
MONTH     = today.month
START_ISO = f"{YEAR}-{MONTH:02d}-01T00:00:00-03:00"
# Último dia do mês não importa: filtramos "created_at >= START" em memória
# A RD Station aceita filtro de range via query params

# ── Helpers ────────────────────────────────────────────────────────────────

def get_all_contacts(extra_params=None):
    """Busca todos os contatos paginando automaticamente."""
    contacts = []
    page = 1
    while True:
        params = {"page": page, "page_size": 100}
        if extra_params:
            params.update(extra_params)
        r = requests.get(f"{BASE}/contacts", headers=HEADERS, params=params, timeout=30)
        r.raise_for_status()
        data = r.json()
        batch = data.get("contacts", [])
        contacts.extend(batch)
        total = data.get("total", 0)
        if len(contacts) >= total or not batch:
            break
        page += 1
    return contacts

def in_current_month(iso_str):
    """Retorna True se a data ISO estiver no mês/ano atual."""
    if not iso_str:
        return False
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        return dt.year == YEAR and dt.month == MONTH
    except Exception:
        return False

# ── Fetch ──────────────────────────────────────────────────────────────────

def fetch():
    print(f"[RD Station] Buscando dados de {MONTH:02d}/{YEAR}...")

    # 1. Novos Leads: todos criados no mês atual
    all_contacts = get_all_contacts()
    novos_leads = [c for c in all_contacts if in_current_month(c.get("created_at"))]
    n_leads = len(novos_leads)
    print(f"  Novos leads: {n_leads}")

    # 2. Leads Qualificados (MQL): tag "mql" ou lifecycle stage "MQL"
    mql = [
        c for c in novos_leads
        if "mql" in [t.lower() for t in (c.get("tags") or [])]
        or (c.get("lifecycle_stage") or "").upper() == "MQL"
    ]
    n_mql = len(mql)
    print(f"  MQL: {n_mql}")

    # 3. Oportunidades: lifecycle stage "SQL" ou "Opportunity"
    oportunidades = [
        c for c in novos_leads
        if (c.get("lifecycle_stage") or "").upper() in ("SQL", "OPPORTUNITY", "OPORTUNIDADE")
    ]
    n_oportunidades = len(oportunidades)
    print(f"  Oportunidades: {n_oportunidades}")

    # 4. Negócios Fechados: lifecycle stage "Customer" ou "Won"
    fechados = [
        c for c in novos_leads
        if (c.get("lifecycle_stage") or "").upper() in ("CUSTOMER", "WON", "FECHADO")
    ]
    n_fechados = len(fechados)
    print(f"  Fechados: {n_fechados}")

    # 5. Taxa de Conversão
    taxa = round((n_fechados / n_leads * 100), 1) if n_leads > 0 else 0.0

    # 6. Receita: RD Station Marketing não tem receita nativa.
    #    Mantemos 0 por padrão. Se usar RD CRM, substituir aqui.
    receita = 0

    return {
        "Novos Leads": n_leads,
        "Leads Qualificados": n_mql,
        "Oportunidades": n_oportunidades,
        "Negócios Fechados": n_fechados,
        "Taxa de Conversão": taxa,
        "Receita": receita,
    }

# ── Escrita do CSV ─────────────────────────────────────────────────────────

def write_csv(data):
    path = f"assets/data/{YEAR}/{MONTH:02d}/crm.csv"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    fields = ["Novos Leads","Leads Qualificados","Oportunidades",
              "Negócios Fechados","Taxa de Conversão","Receita"]
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerow(data)
    print(f"  ✓ Gravado em {path}")

# ── Main ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    data = fetch()
    write_csv(data)
    print("[RD Station] Concluído.")
