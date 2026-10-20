from pathlib import Path
import subprocess
import imageio_ffmpeg

# Dossier contenant les vidéos
VIDEO_DIR = Path("assets/videos")

# Chemin vers FFmpeg
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def generate_posters():
    if not VIDEO_DIR.exists():
        print(f"❌ Dossier introuvable : {VIDEO_DIR.resolve()}")
        return

    videos = sorted(
        VIDEO_DIR.glob("clip-*.mp4"),
        key=lambda p: int(p.stem.split("-")[1])
        if p.stem.split("-")[1].isdigit()
        else float("inf")
    )

    if not videos:
        print("Aucune vidéo trouvée.")
        return

    for video in videos:
        poster = video.with_name(f"{video.stem}-poster.webp")

        # Ne pas écraser les posters déjà existants
        if poster.exists():
            print(f"⏭️ Déjà existant : {poster.name}")
            continue

        try:
            subprocess.run(
                [
                    FFMPEG,
                    "-y",
                    "-i", str(video),
                    "-frames:v", "1",
                    "-c:v", "libwebp",
                    "-quality", "85",
                    str(poster)
                ],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
                check=True
            )

            print(f"✅ {video.name} → {poster.name}")

        except subprocess.CalledProcessError as error:
            print(f"❌ Erreur avec {video.name}")
            print(error.stderr.decode(errors="replace")[-1000:])

    print("\nTerminé ! 🎉")


if __name__ == "__main__":
    generate_posters()