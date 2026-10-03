import json, requests, re
U="https://ikrfcpbkjkvxqhkxdklc.supabase.co"
K=re.search(r'VITE_SUPABASE_PUBLISHABLE_KEY="([^"]+)"',open("/dev-server/.env").read()).group(1)
SK="sb-ikrfcpbkjkvxqhkxdklc-auth-token"
def session(who):
    r=requests.post(f"{U}/auth/v1/token?grant_type=password",headers={"apikey":K},json={"email":f"{who}@mgcv-pilot.test","password":"PilotQa#2026x"}); r.raise_for_status(); return r.json()
async def login(context, page, who, path, w=1280, h=1800):
    s=session(who)
    await page.goto("http://localhost:8080/", wait_until="domcontentloaded")
    await page.evaluate(f"localStorage.setItem({json.dumps(SK)}, {json.dumps(json.dumps(s))}); localStorage.setItem('buddy_has_opened','1')")
    await page.goto("http://localhost:8080"+path, wait_until="networkidle")
    return s
def rest(tok, path, method="GET", body=None, prefer=None):
    h={"apikey":K,"Authorization":f"Bearer {tok}","Content-Type":"application/json"}
    if prefer: h["Prefer"]=prefer
    return requests.request(method, f"{U}/rest/v1/{path}", headers=h, json=body)
def fn(tok, name, body):
    return requests.post(f"{U}/functions/v1/{name}", headers={"apikey":K,"Authorization":f"Bearer {tok}"}, json=body)
