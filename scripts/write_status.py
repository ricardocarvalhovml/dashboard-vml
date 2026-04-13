"""
write_status.py
Grava api-status.json no diretório do mês atual.
Executado como último passo do GitHub Actions, após todos os fetches.

Arquivo gerado: assets/data/YYYY/MM/api-status.json
"""

import os
import json
from datetime import datetime, timezone, timedelta

BRT = timezone(timedelta(hours=-3))
now = datetime.now(BRT)

YEAR  = now.year
MONTH = now.month
MO    = str(MONTH).padStart if hasattr(str(MONTH), 'padStart') else str(MONTH).zfill(2)
MO    = str(MONTH).zfill(2)

# Checa quais áreas foram atualizadas com sucesso (arquivo existe e não está vazio)
areas = {}
for area in ['crm', 'midia-paga', 'seo']:
    # Tenta CSV e XLSX
    for ext in ['csv', 'xlsx']:
        path = f'assets/data/{YEAR}/{MO}/{area}.{ext}'
        if os.path.exists(path) and os.path.getsize(path) > 10:
            areas[area] = {
                'ok':         True,
                'format':     ext,
                'updated_at': now.isoformat(),
            }
            break
    else:
        areas[area] = { 'ok': False }

status = {
    'source':     'api',
    'fetched_at': now.isoformat(),
    'fetched_at_display': now.strftime('%d/%m/%Y às %H:%M'),
    'areas':      areas,
}

path = f'assets/data/{YEAR}/{MO}/api-status.json'
os.makedirs(os.path.dirname(path), exist_ok=True)
with open(path, 'w', encoding='utf-8') as f:
    json.dump(status, f, ensure_ascii=False, indent=2)

print(f'[status] ✓ Gravado em {path}')
print(f'[status] {json.dumps(status, ensure_ascii=False)}')
