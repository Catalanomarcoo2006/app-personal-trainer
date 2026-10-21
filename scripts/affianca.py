# Affianca riferimento e prototipo (stessa scala) e salva una mappa delle differenze.
# Uso: python scripts/affianca.py <screenshot-prototipo> <cartella-uscita>
import sys
from PIL import Image, ImageChops

ref = Image.open("docs/riferimenti/dashboard-principale.png").convert("RGB").crop((52, 0, 1355, 778))
proto = Image.open(sys.argv[1]).convert("RGB").resize(ref.size)
out = sys.argv[2]

side = Image.new("RGB", (ref.width, ref.height * 2 + 10), "white")
side.paste(ref, (0, 0))
side.paste(proto, (0, ref.height + 10))
side.save(f"{out}/affiancati.png")

overlay = Image.blend(ref, proto, 0.5)
overlay.save(f"{out}/sovrapposti.png")

diff = ImageChops.difference(ref, proto).convert("L").point(lambda v: 255 if v > 40 else 0)
diff.save(f"{out}/differenze.png")
print("pixel diversi:", sum(1 for v in diff.getdata() if v) / (ref.width * ref.height))
