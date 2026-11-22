"""Exercise the built dashboard at a project subpath in Chromium."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import shutil
import tempfile
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    screenshots = ROOT / "browser-checks"
    screenshots.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as temporary:
        shutil.copytree(ROOT / "dist", Path(temporary) / "example-tool")
        server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=temporary))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(executable_path=os.environ.get("CHROMIUM_EXECUTABLE_PATH"))
                page = browser.new_page(viewport={"width": 1280, "height": 1000})
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(f"http://127.0.0.1:{server.server_port}/example-tool/")
                page.locator("#period").select_option("2026-03-31")
                assert page.locator("#total").inner_text() == "189,908"
                assert "Scams (including phishing)" in page.locator("#sms").inner_text()
                page.locator("#measure").select_option("demands")
                page.locator("#chart button").filter(has_text="Oct 2023 – Mar 2024").click()
                assert page.locator("#period").input_value() == "2024-03-31"
                assert page.locator("#source-note").is_visible()
                assert page.locator("#source").get_attribute("href").endswith("20240331.htm")
                page.reload()
                assert page.locator("#period").input_value() == "2024-03-31"
                assert page.locator("#measure").input_value() == "demands"
                with page.expect_download() as download:
                    page.locator("#csv").click()
                assert download.value.suggested_filename.endswith(".csv")
                assert "Scams (including phishing)" in Path(download.value.path()).read_text()
                page.locator("#period").select_option("2020-09-30")
                assert "No breakdown" in page.locator("#sms").inner_text()
                page.locator("#period").select_option("2026-03-31")
                page.locator("#measure").select_option("submissions")
                page.screenshot(path=str(screenshots / "desktop.png"), full_page=True)
                page.set_viewport_size({"width": 390, "height": 844})
                assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
                page.screenshot(path=str(screenshots / "mobile.png"), full_page=True)
                assert not errors, errors
                browser.close()
            print("Browser checks passed: project subpath, summary, chart, shared selection, CSV, source and mobile layout")
        finally:
            server.shutdown()


if __name__ == "__main__":
    main()
