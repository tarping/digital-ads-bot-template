#!/usr/bin/env python3
"""Comprueba que prompt.md y skills/ concuerdan.

Una referencia a un skill que no existe no falla en ningún sitio: Copilot Studio
no avisa y el bot simplemente nunca lo invoca. Ejecutar antes de pegar el prompt.
"""
import pathlib, re, sys

root = pathlib.Path(__file__).resolve().parent.parent
prompt = (root / "prompt" / "prompt.md").read_text(encoding="utf-8")

# Los skills se declaran en SKILLS DISPONIBLES como "- <nombre> → ..."
block = prompt.split("SKILLS DISPONIBLES", 1)[1].split("=" * 50, 1)[0]
declared = set(re.findall(r"^- ([A-Za-z][\w-]*) →", block, re.M))

files = {}
for f in sorted((root / "skills").glob("*.md")):
    if f.name == "README.md":
        continue
    m = re.search(r"^name:\s*(\S+)", f.read_text(encoding="utf-8"), re.M)
    files[m.group(1) if m else f"<sin name: en {f.name}>"] = f.name

errs = []
for name in sorted(declared - files.keys()):
    errs.append(f"  el prompt declara '{name}' — no hay skill con ese name:")
for name in sorted(files.keys() - declared):
    errs.append(f"  skill '{name}' ({files[name]}) — el prompt no lo declara")

print(f"prompt declara {len(declared)} skills; skills/ define {len(files)}")
if errs:
    print("\nDESAJUSTES:\n" + "\n".join(errs))
    sys.exit(1)
print("ok — todos concuerdan: " + ", ".join(sorted(declared)))
