from __future__ import annotations

import json
import shutil
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent
EXTENSION_ROOT = ROOT / "tol-extension"
DIST_ROOT = ROOT / "dist"
BUILD_ROOT = ROOT / ".build-extension"


def load_manifest() -> dict:
    return json.loads((EXTENSION_ROOT / "manifest.json").read_text(encoding="utf-8"))


def write_manifest(target_root: Path, manifest: dict) -> None:
    (target_root / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
    )


def copy_extension_tree(target_root: Path) -> None:
    if target_root.exists():
        shutil.rmtree(target_root)
    shutil.copytree(EXTENSION_ROOT, target_root)


def build_chromium_manifest(base_manifest: dict) -> dict:
    manifest = json.loads(json.dumps(base_manifest))
    background = manifest.get("background", {})
    background.pop("scripts", None)
    manifest["background"] = background
    manifest.pop("browser_specific_settings", None)
    return manifest


def build_firefox_manifest(base_manifest: dict) -> dict:
    manifest = json.loads(json.dumps(base_manifest))
    background = manifest.setdefault("background", {})
    background["scripts"] = ["background.js"]
    background["service_worker"] = "background.js"
    return manifest


def zip_dir(source_root: Path, out_path: Path) -> None:
    if out_path.exists():
        out_path.unlink()
    with zipfile.ZipFile(out_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(source_root.rglob("*")):
            if path.is_dir():
                continue
            zf.write(path, path.relative_to(source_root).as_posix())


def main() -> None:
    DIST_ROOT.mkdir(exist_ok=True)
    BUILD_ROOT.mkdir(exist_ok=True)

    base_manifest = load_manifest()

    chromium_root = BUILD_ROOT / "chromium"
    firefox_root = BUILD_ROOT / "firefox"

    copy_extension_tree(chromium_root)
    write_manifest(chromium_root, build_chromium_manifest(base_manifest))

    copy_extension_tree(firefox_root)
    write_manifest(firefox_root, build_firefox_manifest(base_manifest))

    zip_dir(chromium_root, DIST_ROOT / "tol-extension-chromium.zip")
    zip_dir(firefox_root, DIST_ROOT / "tol-extension-firefox.zip")
    zip_dir(firefox_root, DIST_ROOT / "tol-extension-firefox.xpi")

    print("Built:")
    print(DIST_ROOT / "tol-extension-chromium.zip")
    print(DIST_ROOT / "tol-extension-firefox.zip")
    print(DIST_ROOT / "tol-extension-firefox.xpi")


if __name__ == "__main__":
    main()
