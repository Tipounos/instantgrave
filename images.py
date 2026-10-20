#!/usr/bin/env python3
"""
Récupère les images du site actuel instantgrave.fr (Wix) et les range
automatiquement dans assets/images/ avec les noms attendus par le nouveau site.

Utilisation (depuis le dossier qui contient index.html) :
    pip install requests pillow
    python recuperer_images.py

Ce que fait le script :
  1. télécharge les images repérées sur la page d'accueil (noms fixes) ;
  2. visite chaque page de prestation et récupère ses photos :
       - la première devient assets/images/prestations/<slug>.webp (si pas déjà prise) ;
       - les autres vont dans assets/images/produits/<slug>-2.webp, -3.webp, ... ;
  3. recadre et enregistre le logo (assets/images/logo.webp) ;
  4. convertit tout en .webp (max 1920 px de large).
"""

import re
import sys
from pathlib import Path
from urllib.parse import quote

try:
    import requests
    from PIL import Image
    import io
except ImportError:
    sys.exit("Il manque des modules : pip install requests pillow")

BASE = "https://www.instantgrave.fr"
MEDIA = "https://static.wixstatic.com/media/"
OUT = Path("assets/images")
HEADERS = {"User-Agent": "Mozilla/5.0"}
MAX_SIZE = 1920
MIN_WIDTH_EXTRA = 300  # ignore les icônes / petites images sur les pages produits

# Images repérées sur la page d'accueil -> noms (sans extension) dans assets/images/
KNOWN = {
    "067544_18864834c1df45d296e921761d78dd16~mv2.jpg": ["hero"],
    "067544_67f2d77c945045d99359abaa8c1a6ad9~mv2.jpeg": ["approche", "gallery-6"],
    "067544_b6a21f743aa94cfdbf9e1a4fd109b54d~mv2.jpeg": ["prestations/photobooth", "gallery-1"],
    "067544_5ca0fc18a8e2450cb46505e2223a3d54~mv2.jpg": ["prestations/videobooth", "gallery-2"],
    "067544_4ee9e77f6c1a4fe58201cc270af3b75b~mv2.jpg": ["prestations/miroirbooth", "gallery-3"],
    "067544_1d50810f222a45028b45760a9f525287~mv2.jpg": ["prestations/livre-d-or-audio", "gallery-4"],
    "067544_7a8dda59304941019831e92684361961~mv2.jpg": ["pourquoi", "gallery-5"],
    "067544_b035129ee23e4987837f00cf7b6a3c57~mv2.png": ["prestations/enclos"],
    "067544_2acabf542e3243d2ba88e025bde67ce3~mv2.png": ["prestations/granita"],
    "067544_1123039c2e314cbcb7b5f65dd8f10d99~mv2.png": ["prestations/gaufres"],
    "067544_88bac4a8be8b4ba8b957b82cfbd02df0~mv2.png": ["prestations/barbe-a-papa"],
}

# Logo : même recadrage que sur le site (x, y, x+largeur, y+hauteur)
LOGO_FILE = "067544_5e65a3acf7fc4fce807bfe183e637a09~mv2.png"
LOGO_CROP = (0, 1372, 4500, 1372 + 1840)

# slug du nouveau site -> chemin de la page sur instantgrave.fr
PAGES = {
    "photobooth": "photobooth",
    "photobooth-v2": "photobooth-v2",
    "videobooth": "videobooth",
    "miroirbooth": "miroirbooth",
    "livre-d-or-audio": "livre-d-or-audio",
    "livre-d-or-video": "livre-d-or-vidéo",
    "panneau-fontaine": "panneaux-fontaine",
    "poteaux-led": "poteaux-led",
    "mur-de-fond": "mur-de-fond",
    "enclos": "enclos",
    "photo-porte-cles": "photo-porte-clés",
    "granita": "granita",
    "barbe-a-papa": "barbe-à-papa",
    "gaufres": "gaufres",
    "pancakes": "pancakes",
    "popcorn": "popcorn",  # pas dans le menu actuel : sera ignoré si la page n'existe pas
}

# Fichiers à ne jamais récupérer (icônes réseaux sociaux, bannière, logo...)
IGNORE_PREFIXES = ("11062b_", "8d6893", "84770f_")
IMG_RE = re.compile(r"https://static\.wixstatic\.com/media/([A-Za-z0-9_]+~mv2\.(?:jpg|jpeg|png|webp))")


def download(filename):
    r = requests.get(MEDIA + filename, headers=HEADERS, timeout=30)
    r.raise_for_status()
    return Image.open(io.BytesIO(r.content))


def save(img, rel, crop=None):
    if crop:
        img = img.crop(crop)
    img.thumbnail((MAX_SIZE, MAX_SIZE))
    img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
    dest = OUT / f"{rel}.webp"
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "WEBP", quality=85)
    print(f"  OK  {dest}")


def main():
    print("== Images de la page d'accueil ==")
    for filename, names in KNOWN.items():
        try:
            img = download(filename)
            for name in names:
                save(img, name)
        except Exception as e:
            print(f"  !!  {filename} : {e}")

    print("== Logo ==")
    try:
        save(download(LOGO_FILE), "logo", crop=LOGO_CROP)
    except Exception as e:
        print(f"  !!  logo : {e}")

    print("== Pages de prestations ==")
    done = set(KNOWN) | {LOGO_FILE}
    for slug, path in PAGES.items():
        url = f"{BASE}/{quote(path)}"
        try:
            r = requests.get(url, headers=HEADERS, timeout=30)
            r.raise_for_status()
        except Exception as e:
            print(f"  --  {slug} : page introuvable ({e})")
            continue

        files = []
        for f in IMG_RE.findall(r.text):
            if f not in files and f not in done and not f.startswith(IGNORE_PREFIXES):
                files.append(f)

        n = 1
        for f in files:
            try:
                img = download(f)
            except Exception as e:
                print(f"  !!  {f} : {e}")
                continue
            if img.width < MIN_WIDTH_EXTRA:
                continue
            done.add(f)
            main_path = OUT / "prestations" / f"{slug}.webp"
            if not main_path.exists():
                save(img, f"prestations/{slug}")
            else:
                n += 1
                save(img, f"produits/{slug}-{n}")

    print("\nTerminé. Vérifie les images dans assets/images/ (surtout les noms hero, approche, pourquoi).")
    print("Popcorn et les prestations sans photo sur le site : exporte-les depuis le catalogue PDF.")


if __name__ == "__main__":
    main()