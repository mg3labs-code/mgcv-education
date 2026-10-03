import asyncio, sys
from playwright.async_api import async_playwright
from common import *
A, TOTAL = sys.argv[1], sys.argv[2]
title=rest(session("qa.t1")["access_token"],f"assignments?select=title&id=eq.{A}").json()[0]["title"]
async def check(pg,tag):
  sk=pg.get_by_role('button',name='Skip for now')
  if await sk.count(): await sk.first.click(); await pg.wait_for_timeout(500)
  await pg.get_by_text(title).first.click(); await pg.wait_for_timeout(3500)
  body=await pg.inner_text("body")
  sw=await pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")
  fi=await pg.locator("input[type=file], textarea[placeholder='Type your answer here...']").count()
  await pg.screenshot(path=f"res_{tag}.png")
  ok=(f"Final Score: {TOTAL}" in body or f"Final Score: {float(TOTAL):g}" in body) and "QA override" in body and sw<=0 and fi==0
  print(tag, "PASS" if ok else "FAIL", "hscroll",sw,"inputs",fi, "final" , [l for l in body.splitlines() if "Final Score" in l or "Teacher Score" in l][:4])
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(headless=True)
    for w,h in [(360,800),(390,844)]:
      c=await b.new_context(viewport={"width":w,"height":h}); pg=await c.new_page()
      await login(c,pg,"qa.s1","/student/assignments"); await pg.wait_for_timeout(2500)
      await check(pg,f"{w}_first")
      await pg.reload(wait_until="networkidle"); await pg.wait_for_timeout(2500); await check(pg,f"{w}_refresh")
      await c.close()
      c=await b.new_context(viewport={"width":w,"height":h}); pg=await c.new_page()
      await login(c,pg,"qa.s1","/student/assignments"); await pg.wait_for_timeout(2500); await check(pg,f"{w}_fresh_signin"); await c.close()
    await b.close()
asyncio.run(main())
