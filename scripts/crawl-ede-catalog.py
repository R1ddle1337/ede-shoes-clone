#!/usr/bin/env python3
"""Build a source-of-truth catalog snapshot from Ede's public BigCommerce pages.
Run only with permission from the store owner and respect crawl-delay/terms."""
import json, re, time
from pathlib import Path
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup

BASE='https://edeshoes.com/'
SEEDS=['women-shoes/','mens-shoes/']
session=requests.Session(); session.headers['User-Agent']='EdeThemeDataImporter/1.0 (authorized migration)'
seen=set(); products={}

def get(path):
    url=urljoin(BASE,path)
    r=session.get(url,timeout=30); r.raise_for_status(); return r.text,url

for seed in SEEDS:
    try: html,source=get(seed)
    except Exception as e: print('skip',seed,e); continue
    soup=BeautifulSoup(html,'html.parser')
    for a in soup.select('.card a[href], .product a[href]'):
        u=urljoin(source,a['href']).split('#')[0]
        if urlparse(u).netloc=='edeshoes.com': seen.add(u)

print('product URLs',len(seen))
for i,url in enumerate(sorted(seen),1):
    try:
        html,_=get(url); soup=BeautifulSoup(html,'html.parser')
        ld=None
        for s in soup.select('script[type="application/ld+json"]'):
            try:
                val=json.loads(s.string or '')
                if isinstance(val,dict) and val.get('@type') in ('Product',['Product']): ld=val; break
            except Exception: pass
        title=(ld or {}).get('name') or (soup.select_one('h1') or {}).get_text(' ',strip=True)
        desc=(ld or {}).get('description') or ''
        image=(ld or {}).get('image') or []
        if isinstance(image,str): image=[image]
        if not ld or not title: print('skip non-product',url); continue
        offers=(ld or {}).get('offers') or {}
        products[url]={'url':url,'slug':urlparse(url).path.strip('/'),'name':title,'description':re.sub(r'\\s+',' ',desc).strip(),'images':[urljoin(url,x) for x in image],'price':offers.get('price'),'currency':offers.get('priceCurrency')}
        print(i,title)
        time.sleep(1)
    except Exception as e: print('error',url,e)

Path('data/ede-catalog.json').write_text(json.dumps({'source':BASE,'captured_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'products':list(products.values())},ensure_ascii=False,indent=2))
print('wrote',len(products),'products')
