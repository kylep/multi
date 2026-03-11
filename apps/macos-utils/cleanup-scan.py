#!/usr/bin/env python3
"""macOS storage cleanup scanner. Report-only — never deletes anything."""

import os
import sys
import time
import shutil
import heapq
import pathlib
import subprocess

HOME = pathlib.Path.home()
DOWNLOADS_AGE_DAYS = 30
LARGE_FILE_COUNT = 20
SCAN_TIMEOUT_SECS = 30

# Directories to skip when walking ~ for large files
SKIP_DIRS = {
    ".git", "node_modules", ".venv", "venv", "__pycache__",
    "DerivedData", "CoreSimulator", ".Trash", "Library",
}


# ─── Colors ──────────────────────────────────────────────────────────────────

class Color:
    BOLD = "\033[1m"
    DIM = "\033[2m"
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    RESET = "\033[0m"


if not sys.stdout.isatty():
    for attr in ("BOLD", "DIM", "CYAN", "GREEN", "YELLOW", "RED", "RESET"):
        setattr(Color, attr, "")


# ─── Utilities ───────────────────────────────────────────────────────────────

def human_size(nbytes):
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if abs(nbytes) < 1024:
            if unit == "B":
                return f"{nbytes} {unit}"
            return f"{nbytes:.1f} {unit}"
        nbytes /= 1024
    return f"{nbytes:.1f} PB"


def size_color(nbytes):
    if nbytes >= 1 << 30:
        return Color.RED
    if nbytes >= 100 << 20:
        return Color.YELLOW
    return Color.GREEN


def short_path(p):
    s = str(p)
    home = str(HOME)
    if s.startswith(home):
        return "~" + s[len(home):]
    return s


def run_cmd(cmd, timeout=30):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        if r.returncode == 0:
            return r.stdout, True
        return r.stderr, False
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        return "", False


def tool_available(name):
    return shutil.which(name) is not None


def dir_size(path):
    total = 0
    try:
        for dirpath, _dirnames, filenames in os.walk(path, followlinks=False):
            for f in filenames:
                try:
                    total += os.path.getsize(os.path.join(dirpath, f))
                except OSError:
                    pass
    except OSError:
        pass
    return total


def print_banner():
    print()
    print(f"{Color.BOLD}{Color.CYAN}{'=' * 56}")
    print("        macOS Storage Cleanup Scanner")
    print("        Report only — nothing will be deleted")
    print(f"{'=' * 56}{Color.RESET}")
    print()


def print_category(title, items, note=None):
    print(f"\n{Color.BOLD}{Color.CYAN}--- {title} ---{Color.RESET}")
    if note:
        print(f"  {Color.DIM}{note}{Color.RESET}")
    if not items:
        print(f"  {Color.DIM}(nothing found){Color.RESET}")
        return 0
    items.sort(key=lambda x: x[1], reverse=True)
    subtotal = 0
    for label, size in items:
        c = size_color(size)
        print(f"  {c}{human_size(size):>10}{Color.RESET}  {short_path(label)}")
        subtotal += size
    c = size_color(subtotal)
    print(f"  {Color.DIM}{'─' * 40}{Color.RESET}")
    print(f"  {c}{Color.BOLD}{human_size(subtotal):>10}{Color.RESET}  subtotal")
    return subtotal


# ─── Scanners ────────────────────────────────────────────────────────────────

def scan_system_caches():
    caches = HOME / "Library" / "Caches"
    if not caches.is_dir():
        return []
    items = []
    try:
        for entry in os.scandir(caches):
            try:
                if entry.is_dir(follow_symlinks=False):
                    size = dir_size(entry.path)
                else:
                    size = entry.stat(follow_symlinks=False).st_size
                if size > 1 << 20:  # only show > 1 MB
                    items.append((entry.path, size))
            except OSError:
                pass
    except OSError:
        pass
    return sorted(items, key=lambda x: x[1], reverse=True)[:15]


def scan_homebrew():
    if not tool_available("brew"):
        return []
    items = []
    out, ok = run_cmd(["brew", "--cache"], timeout=10)
    if ok:
        cache_dir = out.strip()
        if os.path.isdir(cache_dir):
            size = dir_size(cache_dir)
            if size > 0:
                items.append((f"Homebrew cache ({cache_dir})", size))
    return items


def scan_npm_yarn_pnpm():
    items = []
    paths = [
        ("npm cache", HOME / ".npm" / "_cacache"),
        ("yarn v1 cache", HOME / "Library" / "Caches" / "Yarn"),
        ("yarn berry cache", HOME / ".yarn" / "berry" / "cache"),
        ("pnpm store", HOME / "Library" / "pnpm" / "store"),
    ]
    for label, p in paths:
        if p.is_dir():
            size = dir_size(p)
            if size > 1 << 20:
                items.append((label, size))
    return items


def scan_pip():
    items = []
    # Try pip3 cache dir
    out, ok = run_cmd(["pip3", "cache", "dir"], timeout=10)
    cache_dir = None
    if ok:
        cache_dir = out.strip()
    if not cache_dir or not os.path.isdir(cache_dir):
        cache_dir = str(HOME / "Library" / "Caches" / "pip")
    if os.path.isdir(cache_dir):
        size = dir_size(cache_dir)
        if size > 1 << 20:
            items.append(("pip cache", size))
    return items


def scan_docker():
    if not tool_available("docker"):
        return []
    out, ok = run_cmd(["docker", "system", "df"], timeout=15)
    if not ok:
        return []
    items = []
    for line in out.strip().splitlines()[1:]:
        parts = line.split()
        if len(parts) < 5:
            continue
        # TYPE  TOTAL  ACTIVE  SIZE  RECLAIMABLE
        # Size and reclaimable may have units: "2.3GB", "100MB", etc.
        label = parts[0]
        reclaimable_str = parts[-1].rstrip(")")
        # Sometimes it's like "2.3GB (100%)" — two tokens at end
        if "(" in line:
            # Find the reclaimable size token before the parenthesized percentage
            paren_idx = line.index("(")
            before_paren = line[:paren_idx].rstrip().split()
            if before_paren:
                reclaimable_str = before_paren[-1]
        size_bytes = parse_docker_size(reclaimable_str)
        if size_bytes > 1 << 20:
            items.append((f"Docker {label} (reclaimable)", size_bytes))
    return items


def parse_docker_size(s):
    s = s.strip()
    multipliers = {"B": 1, "KB": 1e3, "MB": 1e6, "GB": 1e9, "TB": 1e12,
                   "kB": 1e3}
    for suffix, mult in sorted(multipliers.items(), key=lambda x: -len(x[0])):
        if s.endswith(suffix):
            try:
                return int(float(s[:-len(suffix)]) * mult)
            except ValueError:
                return 0
    try:
        return int(float(s))
    except ValueError:
        return 0


def scan_xcode():
    items = []
    paths = [
        ("Xcode DerivedData", HOME / "Library" / "Developer" / "Xcode" / "DerivedData"),
        ("Xcode Archives", HOME / "Library" / "Developer" / "Xcode" / "Archives"),
        ("iOS DeviceSupport", HOME / "Library" / "Developer" / "Xcode" / "iOS DeviceSupport"),
        ("CoreSimulator Devices", HOME / "Library" / "Developer" / "CoreSimulator" / "Devices"),
    ]
    for label, p in paths:
        if p.is_dir():
            size = dir_size(p)
            if size > 1 << 20:
                items.append((label, size))
    return items


def scan_downloads():
    downloads = HOME / "Downloads"
    if not downloads.is_dir():
        return []
    cutoff = time.time() - DOWNLOADS_AGE_DAYS * 86400
    items = []
    try:
        for entry in os.scandir(downloads):
            try:
                stat = entry.stat(follow_symlinks=False)
                if stat.st_mtime < cutoff:
                    if entry.is_dir(follow_symlinks=False):
                        size = dir_size(entry.path)
                    else:
                        size = stat.st_size
                    if size > 1 << 20:
                        items.append((entry.path, size))
            except OSError:
                pass
    except OSError:
        pass
    return sorted(items, key=lambda x: x[1], reverse=True)[:20]


def scan_trash():
    trash = HOME / ".Trash"
    if not trash.is_dir():
        return []
    size = dir_size(trash)
    if size > 1 << 20:
        return [("Trash", size)]
    return []


def scan_logs():
    items = []
    for log_dir in [HOME / "Library" / "Logs", pathlib.Path("/var/log")]:
        if not log_dir.is_dir():
            continue
        try:
            for entry in os.scandir(log_dir):
                try:
                    if not os.access(entry.path, os.R_OK):
                        continue
                    if entry.is_dir(follow_symlinks=False):
                        size = dir_size(entry.path)
                    else:
                        size = entry.stat(follow_symlinks=False).st_size
                    if size > 1 << 20:
                        items.append((entry.path, size))
                except OSError:
                    pass
        except OSError:
            pass
    return sorted(items, key=lambda x: x[1], reverse=True)[:15]


def scan_large_files():
    """Find the largest files under ~, skipping well-known heavy dirs."""
    top = []
    deadline = time.time() + 60
    timed_out = False
    for dirpath, dirnames, filenames in os.walk(HOME, followlinks=False):
        if time.time() > deadline:
            timed_out = True
            break
        # Prune dirs we don't want to walk
        dirnames[:] = [
            d for d in dirnames
            if d not in SKIP_DIRS and not d.startswith(".")
        ]
        for f in filenames:
            if f.startswith("."):
                continue
            fp = os.path.join(dirpath, f)
            try:
                size = os.path.getsize(fp)
                if size > 50 << 20:  # only track files > 50 MB
                    if len(top) < LARGE_FILE_COUNT:
                        heapq.heappush(top, (size, fp))
                    elif size > top[0][0]:
                        heapq.heapreplace(top, (size, fp))
            except OSError:
                pass
    items = [(fp, size) for size, fp in top]
    if timed_out:
        items.append(("(scan timed out at 60s, results may be incomplete)", 0))
    return items


def scan_node_modules():
    items = []
    deadline = time.time() + SCAN_TIMEOUT_SECS
    timed_out = False
    for dirpath, dirnames, _filenames in os.walk(HOME, followlinks=False):
        if time.time() > deadline:
            timed_out = True
            break
        # Skip Library and hidden dirs for speed
        rel = os.path.relpath(dirpath, HOME)
        if rel.startswith("Library") or rel.startswith("."):
            dirnames.clear()
            continue
        if "node_modules" in dirnames:
            nm_path = os.path.join(dirpath, "node_modules")
            size = dir_size(nm_path)
            if size > 1 << 20:
                items.append((nm_path, size))
            dirnames.remove("node_modules")
    if timed_out:
        items.append(("(scan timed out, results may be incomplete)", 0))
    return items


def scan_python_venvs():
    items = []
    deadline = time.time() + SCAN_TIMEOUT_SECS
    timed_out = False
    for dirpath, dirnames, _filenames in os.walk(HOME, followlinks=False):
        if time.time() > deadline:
            timed_out = True
            break
        rel = os.path.relpath(dirpath, HOME)
        if rel.startswith("Library") or rel.startswith("."):
            dirnames.clear()
            continue
        for venv_name in (".venv", "venv"):
            if venv_name in dirnames:
                venv_path = os.path.join(dirpath, venv_name)
                # Verify it's actually a venv
                if os.path.exists(os.path.join(venv_path, "pyvenv.cfg")):
                    size = dir_size(venv_path)
                    if size > 1 << 20:
                        items.append((venv_path, size))
                dirnames.remove(venv_name)
    if timed_out:
        items.append(("(scan timed out, results may be incomplete)", 0))
    return items


def scan_application_support():
    app_support = HOME / "Library" / "Application Support"
    if not app_support.is_dir():
        return []
    items = []
    try:
        for entry in os.scandir(app_support):
            try:
                if entry.is_dir(follow_symlinks=False):
                    size = dir_size(entry.path)
                else:
                    size = entry.stat(follow_symlinks=False).st_size
                if size > 50 << 20:  # only show > 50 MB
                    items.append((entry.path, size))
            except OSError:
                pass
    except OSError:
        pass
    return sorted(items, key=lambda x: x[1], reverse=True)[:15]


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    print_banner()

    scanners = [
        ("System Caches (~/Library/Caches)", scan_system_caches, None),
        ("Homebrew", scan_homebrew, "brew not installed" if not tool_available("brew") else None),
        ("npm / yarn / pnpm", scan_npm_yarn_pnpm, None),
        ("pip", scan_pip, None),
        ("Docker", scan_docker, "docker not installed" if not tool_available("docker") else None),
        ("Xcode / iOS Development", scan_xcode, None),
        (f"Downloads (older than {DOWNLOADS_AGE_DAYS} days)", scan_downloads, None),
        ("Trash", scan_trash, None),
        ("Log Files", scan_logs, None),
        (f"Large Files (top {LARGE_FILE_COUNT} in ~)", scan_large_files, None),
        ("node_modules Directories", scan_node_modules, None),
        ("Python Virtual Environments", scan_python_venvs, None),
        ("Application Support (> 50 MB)", scan_application_support, None),
    ]

    grand_total = 0
    for title, scanner_fn, skip_note in scanners:
        if skip_note:
            print(f"\n{Color.BOLD}{Color.CYAN}--- {title} ---{Color.RESET}")
            print(f"  {Color.DIM}({skip_note}, skipping){Color.RESET}")
            continue
        try:
            items = scanner_fn()
            subtotal = print_category(title, items)
            grand_total += subtotal
        except Exception as e:
            print(f"\n{Color.BOLD}{Color.CYAN}--- {title} ---{Color.RESET}")
            print(f"  {Color.RED}Error: {e}{Color.RESET}")

    print()
    print(f"{Color.BOLD}{'=' * 56}{Color.RESET}")
    c = size_color(grand_total)
    print(f"  {c}{Color.BOLD}TOTAL IDENTIFIED: {human_size(grand_total)}{Color.RESET}")
    print(f"{Color.BOLD}{'=' * 56}{Color.RESET}")
    print()


if __name__ == "__main__":
    main()
