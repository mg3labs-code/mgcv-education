import asyncio, sys
from playwright.async_api import async_playwright
from common import *
RUN, DATE = sys.argv[1], sys.argv[2]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(headless=True); c=await b.new_context(viewport={"width":1280,"height":1800}); pg=await c.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    await login(c,pg,"qa.t1","/teacher/schedule")
    await pg.wait_for_timeout(4000)
    cell=pg.get_by_label(f"Edit schedule for {DATE}")
    print("cells", await cell.count())
    await cell.first.click()
    await pg.get_by_placeholder("Add a note for this date").fill(f"QA run {RUN}")
    await pg.get_by_role("button", name="Save date").click()
    await pg.wait_for_timeout(800)
    await pg.get_by_title("Save & Publish").click(force=True)
    await pg.wait_for_timeout(6000)
    await pg.screenshot(path=f"sched_{RUN}.png")
    print("toasts", await pg.locator("[role=status], li[data-sonner-toast]").all_inner_texts())
    print("errors", errs)
    await b.close()
asyncio.run(main())
