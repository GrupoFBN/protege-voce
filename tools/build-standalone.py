#!/usr/bin/env python3
"""Gera dist/protege-voce.html: a landing em UM único arquivo.

- CSS e JS de popup/ (cookies, pop-up, rastreamento) ficam embutidos no HTML.
- As imagens de assets/ são redimensionadas, convertidas para WebP e embutidas (data URI).
- Fontes e Font Awesome continuam vindo de CDN (Google Fonts / cdnjs).
- As tags Open Graph (og:image etc.) ficam com URL absoluta, como exigem o WhatsApp e o Facebook.

Uso:
    python tools/build-standalone.py
    python tools/build-standalone.py --checkout-url https://exemplo.com/checkout/index.html \
                                     --privacy-url  https://exemplo.com/politica-de-privacidade.html
"""
import argparse
import base64
import io
import mimetypes
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent

mimetypes.add_type("image/webp", ".webp")


# largura máxima (px) de cada imagem: ~2x o tamanho exibido, para telas retina sem pesar
MAX_WIDTH = {
    "ChatGPT Image 28 de abr. de 2026, 23_17_01.webp": 560,  # hero
    "logo-protege-voce-cropped.webp": 380,
    "sura-logo.png": 340,
    "botao-whatsapp-bubble.png": 128,
    "botao-whatsapp-phone.png": 128,
}
DEFAULT_MAX_WIDTH = 800  # fotos dos cards
QUALITY = 72


def data_uri(path: Path) -> str:
    """Redimensiona, converte para WebP e devolve como data URI."""
    img = Image.open(path)
    max_w = MAX_WIDTH.get(path.name, DEFAULT_MAX_WIDTH)
    if img.width > max_w:
        img = img.resize((max_w, round(img.height * max_w / img.width)), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, "WEBP", quality=QUALITY, method=6)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--checkout-url", help="URL base do checkout (substitui ./checkout/index.html)")
    ap.add_argument("--privacy-url", help="URL da Política de Privacidade")
    ap.add_argument("--out", default=str(ROOT / "dist" / "protege-voce.html"))
    args = ap.parse_args()

    html = (ROOT / "index.html").read_text(encoding="utf-8")

    # 1) CSS de popup/ -> <style>
    def inline_css(m):
        css = (ROOT / m.group(1)).read_text(encoding="utf-8")
        return f"<style>\n/* {m.group(1)} */\n{css}\n</style>"

    html = re.sub(r'<link rel="stylesheet" href="(popup/[^"]+\.css)"\s*/?>', inline_css, html)

    # 2) JS de popup/ -> <script>
    def inline_js(m):
        js = (ROOT / m.group(1)).read_text(encoding="utf-8")
        if "</script" in js.lower():
            raise SystemExit(f"{m.group(1)} contém '</script' e não pode ser embutido")
        return f"<script>\n/* {m.group(1)} */\n{js}\n</script>"

    html = re.sub(r'<script src="(popup/[^"]+\.js)"></script>', inline_js, html)

    # 3) imagens de assets/ -> data URI (só caminhos relativos; as URLs absolutas do og:image não mudam)
    cache = {}

    def inline_img(m):
        rel = m.group(2)
        f = ROOT / "assets" / rel
        if not f.exists():
            print(f"AVISO: assets/{rel} não encontrado", file=sys.stderr)
            return m.group(0)
        if rel not in cache:
            cache[rel] = data_uri(f)
        return m.group(1) + cache[rel] + m.group(3)

    html = re.sub(r'(["\'(])assets/([^"\')]+)(["\')])', inline_img, html)

    # 4) links para outras páginas (checkout e política) apontando para onde o fornecedor hospedar
    if args.checkout_url:
        html = html.replace("./checkout/index.html", args.checkout_url)
    if args.privacy_url:
        html = html.replace('href="politica-de-privacidade.html"', f'href="{args.privacy_url}"')
        html = html.replace("privacyUrl: 'politica-de-privacidade.html'", f"privacyUrl: '{args.privacy_url}'")

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(f"{out}  ({out.stat().st_size / 1024:.0f} KB, {len(cache)} imagens embutidas)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
