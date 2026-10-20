#!/usr/bin/env python3
"""
Télécharge les reels Facebook listés dans urls.txt (un lien par ligne)
et prépare les fichiers attendus par le site :

    assets/videos/clip-1.mp4, clip-2.mp4 ...
    assets/images/clip-1-poster.webp, clip-2-poster.webp ...

Prérequis (une seule fois) :
    pip install yt-dlp
    ffmpeg (conseillé) : sous Windows, dans un terminal -> winget install ffmpeg
    (puis ferme et rouvre le terminal)

Utilisation :
    1. Mets un fichier urls.txt à côté de ce script (un lien de reel par ligne,
       les lignes qui commencent par # sont ignorées).
    2. Lance :  python download_clips.py

À n'utiliser que pour les vidéos de Festi Vivi (ou avec leur accord).
Ça ne marche que pour les vidéos publiques.
"""

import importlib.util
import shutil
import subprocess
import sys
from pathlib import Path

URLS_FILE = Path("urls.txt")
VIDEOS_DIR = Path("assets/videos")
IMAGES_DIR = Path("assets/images")


def main():
    if importlib.util.find_spec("yt_dlp") is None:
        sys.exit("yt-dlp n'est pas installé : lance d'abord  pip install yt-dlp")

    if not URLS_FILE.exists():
        sys.exit("urls.txt introuvable : crée-le avec un lien de reel par ligne.")

    urls = [
        line.strip()
        for line in URLS_FILE.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.startswith("#")
    ]
    if not urls:
        sys.exit("urls.txt est vide.")

    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg:
        # 720p max pour garder des fichiers légers pour le site
        fmt = "bv*[height<=720]+ba/b[height<=720]/b"
    else:
        print("⚠️  ffmpeg introuvable : vidéos téléchargées en un seul fichier,")
        print("   et AUCUNE miniature (poster) ne sera créée.")
        print("   Installe-le avec :  winget install ffmpeg  (puis rouvre le terminal)\n")
        fmt = "b[ext=mp4]/b"

    VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    for i, url in enumerate(urls, start=1):
        video = VIDEOS_DIR / f"clip-{i}.mp4"
        poster = IMAGES_DIR / f"clip-{i}-poster.webp"
        print(f"\n[{i}/{len(urls)}] {url}")

        try:
            # "python -m yt_dlp" évite le problème de PATH sous Windows
            subprocess.run(
                [
                    sys.executable, "-m", "yt_dlp",
                    "-f", fmt,
                    "--merge-output-format", "mp4",
                    "--force-overwrites",
                    "-o", str(video),
                    url,
                ],
                check=True,
            )
            if ffmpeg:
                subprocess.run(
                    [
                        ffmpeg, "-y", "-loglevel", "error",
                        "-ss", "1", "-i", str(video),
                        "-frames:v", "1", "-vf", "scale=540:-2",
                        str(poster),
                    ],
                    check=True,
                )
                print(f"   OK -> {video} + {poster}")
            else:
                print(f"   OK -> {video}")
        except subprocess.CalledProcessError as err:
            print(f"   ÉCHEC : {err}")

    print("\nTerminé.")


if __name__ == "__main__":
    main()