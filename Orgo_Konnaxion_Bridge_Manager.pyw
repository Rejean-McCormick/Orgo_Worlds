from __future__ import annotations

import json
import os
import queue
import secrets
import shutil
import subprocess
import threading
import time
import urllib.parse
import urllib.request
from pathlib import Path
import tkinter as tk
from tkinter import messagebox, ttk


DEFAULT_KX = Path(r"C:\mycode\Konnaxion\Konnaxion_Worlds")
DEFAULT_ORGO = Path(r"C:\mycode\Orgo\Orgo")
IMPACT_REF = "impact:UCKK-A014:day30:v1"


def _env_file_value(path: Path, key: str) -> str:
    if not path.exists():
        return ""
    try:
        for raw in path.read_text(encoding="utf-8-sig").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            name, value = line.split("=", 1)
            if name.strip() == key:
                return value.strip().strip('"').strip("'")
    except OSError:
        return ""
    return ""


def _initial_konnaxion_database_url(root: Path) -> str:
    backend = root / "backend"
    for candidate in (
        backend / ".env",
        backend / ".envs" / ".local" / ".postgres",
    ):
        value = _env_file_value(candidate, "DATABASE_URL")
        if value:
            return value
    return os.environ.get("KONNAXION_DATABASE_URL", "").strip()


def _initial_orgo_database_url(root: Path) -> str:
    direct = os.environ.get("DATABASE_URL", "").strip()
    if direct:
        return direct
    for candidate in (root / ".env", root / "apps" / "api" / ".env"):
        value = _env_file_value(candidate, "DATABASE_URL")
        if value:
            return value
    return ""


class BridgeManager(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Orgo ↔ Konnaxion — J30 Impact Bridge")
        self.geometry("1000x760")
        self.minsize(860, 650)

        self.bridge_token = secrets.token_urlsafe(36)
        self.bridge_proc: subprocess.Popen | None = None
        self.worker_proc: subprocess.Popen | None = None
        self.log_queue: queue.Queue[str] = queue.Queue()

        self.kx_root = tk.StringVar(value=str(DEFAULT_KX))
        self.orgo_root = tk.StringVar(value=str(DEFAULT_ORGO))
        self.port = tk.StringVar(value="8011")
        self.world = tk.StringVar(value="")
        self.kx_database_url = tk.StringVar(value=_initial_konnaxion_database_url(DEFAULT_KX))
        self.database_url = tk.StringVar(value=_initial_orgo_database_url(DEFAULT_ORGO))
        self.status = tk.StringVar(value="1. Préparer Konnaxion. Aucun secret n'est écrit dans les logs.")

        self._build_ui()
        self.after(100, self._drain_logs)
        self.protocol("WM_DELETE_WINDOW", self._on_close)

    def _build_ui(self):
        root = ttk.Frame(self, padding=12)
        root.pack(fill="both", expand=True)
        root.columnconfigure(1, weight=1)
        root.rowconfigure(12, weight=1)

        ttk.Label(root, text="Konnaxion_Worlds").grid(row=0, column=0, sticky="w", pady=3)
        ttk.Entry(root, textvariable=self.kx_root).grid(row=0, column=1, sticky="ew", pady=3)

        ttk.Label(root, text="Orgo").grid(row=1, column=0, sticky="w", pady=3)
        ttk.Entry(root, textvariable=self.orgo_root).grid(row=1, column=1, sticky="ew", pady=3)

        ttk.Label(root, text="Provider port").grid(row=2, column=0, sticky="w", pady=3)
        ttk.Entry(root, textvariable=self.port, width=12).grid(row=2, column=1, sticky="w", pady=3)

        ttk.Label(root, text="Konnaxion World").grid(row=3, column=0, sticky="w", pady=3)
        self.world_combo = ttk.Combobox(root, textvariable=self.world, state="normal")
        self.world_combo.grid(row=3, column=1, sticky="ew", pady=3)

        ttk.Label(root, text="Konnaxion DATABASE_URL").grid(row=4, column=0, sticky="w", pady=3)
        ttk.Entry(root, textvariable=self.kx_database_url, show="•").grid(row=4, column=1, sticky="ew", pady=3)
        ttk.Label(
            root,
            text=r"Détecté depuis backend\.env ou backend\.envs\.local\.postgres. Sinon colle ici la DATABASE_URL Konnaxion/Neon.",
            wraplength=880,
        ).grid(row=5, column=0, columnspan=2, sticky="w", pady=(0, 4))

        ttk.Label(root, text="Orgo DATABASE_URL").grid(row=6, column=0, sticky="w", pady=3)
        ttk.Entry(root, textvariable=self.database_url, show="•").grid(row=6, column=1, sticky="ew", pady=3)
        ttk.Label(
            root,
            text="Doit être le même DATABASE_URL que l'API Orgo. Laisse vide si tu veux seulement démarrer le provider Konnaxion.",
            wraplength=880,
        ).grid(row=7, column=0, columnspan=2, sticky="w", pady=(0, 8))

        buttons = ttk.Frame(root)
        buttons.grid(row=8, column=0, columnspan=2, sticky="ew", pady=(6, 6))
        for i in range(5):
            buttons.columnconfigure(i, weight=1)
        ttk.Button(buttons, text="1. Charger Worlds", command=self.prepare_konnaxion).grid(row=0, column=0, padx=3, sticky="ew")
        ttk.Button(buttons, text="2. Démarrer Bridge", command=self.start_bridge).grid(row=0, column=1, padx=3, sticky="ew")
        ttk.Button(buttons, text="3. Démarrer worker Orgo", command=self.start_worker).grid(row=0, column=2, padx=3, sticky="ew")
        ttk.Button(buttons, text="Vérifier Impact J30", command=self.check_impact).grid(row=0, column=3, padx=3, sticky="ew")
        ttk.Button(buttons, text="Arrêter", command=self.stop_all).grid(row=0, column=4, padx=3, sticky="ew")

        ttk.Label(root, textvariable=self.status).grid(row=9, column=0, columnspan=2, sticky="w", pady=4)
        ttk.Label(
            root,
            text=(
                "Avant le bouton 3, ferme l'ancien worker Orgo avec Ctrl+C. "
                "Quand Bridge + worker sont actifs, retourne dans Orgo World Scenario Manager, "
                "sélectionne J30 et clique Injecter TEST. J30 attendra maintenant un receipt SUCCEEDED."
            ),
            wraplength=900,
        ).grid(row=10, column=0, columnspan=2, sticky="w", pady=(0, 8))

        ttk.Separator(root).grid(row=11, column=0, columnspan=2, sticky="ew", pady=4)
        self.log = tk.Text(root, wrap="word", height=25)
        self.log.grid(row=12, column=0, columnspan=2, sticky="nsew")
        self.log.configure(state="disabled")

    def _set_status(self, text: str):
        self.after(0, lambda: self.status.set(text))

    def _set_worlds(self, values: list[str]):
        def update():
            self.world_combo["values"] = values
            current = self.world.get().strip()
            if not current and values:
                self.world.set("main" if "main" in values else values[0])
        self.after(0, update)

    def _append(self, text: str):
        self.log_queue.put(text.rstrip())

    def _drain_logs(self):
        try:
            while True:
                text = self.log_queue.get_nowait()
                self.log.configure(state="normal")
                self.log.insert("end", text + "\n")
                self.log.see("end")
                self.log.configure(state="disabled")
        except queue.Empty:
            pass
        self.after(100, self._drain_logs)

    def _thread(self, fn):
        threading.Thread(target=fn, daemon=True).start()

    def _show_error(self, title: str, exc: Exception):
        self._append(f"ERREUR: {exc}")
        self.after(0, lambda: messagebox.showerror(title, str(exc)))

    def _kx_backend(self) -> Path:
        backend = Path(self.kx_root.get().strip()) / "backend"
        if not (backend / "manage.py").exists():
            raise RuntimeError(f"Konnaxion backend introuvable: {backend}")
        return backend

    def _kx_python(self) -> Path:
        backend = self._kx_backend()
        py = backend / ".venv" / "Scripts" / "python.exe"
        if py.exists():
            return py
        uv = shutil.which("uv.exe") or shutil.which("uv")
        if not uv:
            raise RuntimeError("backend/.venv absent et uv introuvable. Lance RUN_backend_local.bat une fois.")
        self._append("Création de backend/.venv...")
        subprocess.run([uv, "venv", ".venv", "--python", "3.12"], cwd=backend, check=True)
        self._append("Installation des dépendances Konnaxion...")
        subprocess.run(
            [uv, "pip", "install", "--python", str(py), "-r", r"requirements\local.txt"],
            cwd=backend,
            check=True,
        )
        return py

    def _provider_env(self):
        database_url = self.kx_database_url.get().strip()
        if not database_url:
            raise RuntimeError(
                "Konnaxion DATABASE_URL est vide. Le backend Konnaxion exige PostgreSQL. "
                "Colle la DATABASE_URL utilisée par Konnaxion (Neon/local), ou crée backend\\.env."
            )
        env = os.environ.copy()
        env["DATABASE_URL"] = database_url
        env["ORGO_KONNAXION_BRIDGE_TOKEN"] = self.bridge_token
        return env

    def _parse_json_output(self, text: str):
        for line in reversed(text.splitlines()):
            line = line.strip()
            if line.startswith("{") and line.endswith("}"):
                return json.loads(line)
        raise RuntimeError("Réponse JSON de la commande Konnaxion introuvable")

    def _run_manage_json(self, *args: str):
        backend = self._kx_backend()
        py = self._kx_python()
        result = subprocess.run(
            [str(py), "manage.py", *args, "--json"],
            cwd=backend,
            env=self._provider_env(),
            text=True,
            capture_output=True,
        )
        if result.returncode != 0:
            detail = (result.stderr or result.stdout).strip()
            raise RuntimeError(detail or f"manage.py {' '.join(args)} failed")
        return self._parse_json_output(result.stdout)

    def _pipe(self, proc: subprocess.Popen, prefix: str):
        def work():
            if not proc.stdout:
                return
            for line in proc.stdout:
                self._append(f"[{prefix}] {line.rstrip()}")
        threading.Thread(target=work, daemon=True).start()

    def _base_url(self) -> str:
        return f"http://127.0.0.1:{int(self.port.get())}/api/integrations/orgo/konnaxion"

    def _publish_url(self, world: str) -> str:
        return f"{self._base_url()}/{urllib.parse.quote(world)}/publish/"

    def _request_json(self, url: str):
        req = urllib.request.Request(
            url,
            headers={"Authorization": f"Bearer {self.bridge_token}"},
            method="GET",
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            return json.loads(response.read().decode("utf-8"))

    def prepare_konnaxion(self):
        def work():
            try:
                self._kx_backend()
                self._kx_python()
                # No global/control-plane migration is run here. The bridge setup
                # migrates only the selected World's ethikos schema.
                data = self._run_manage_json("orgo_bridge_setup", "--list-worlds")
                worlds = [row["key"] for row in data.get("worlds", []) if row.get("release_status") == "current"]
                self._set_worlds(worlds)
                self._append("Worlds CURRENT: " + (", ".join(worlds) if worlds else "aucun"))
                self._set_status("Worlds chargés. Choisis le World puis démarre le Bridge.")
            except Exception as exc:
                self._set_status("Erreur préparation Konnaxion")
                self._show_error("Préparation Konnaxion", exc)
        self._thread(work)

    def start_bridge(self):
        def work():
            try:
                world = self.world.get().strip()
                if not world:
                    raise RuntimeError("Choisis un Konnaxion World.")
                backend = self._kx_backend()
                py = self._kx_python()

                self._set_status(f"Migration du World {world}...")
                setup = self._run_manage_json("orgo_bridge_setup", "--world", world)
                self._append(
                    f"World {setup['world']} r{setup['release']} bridge table: {setup['bridge_table']}"
                )

                if self.bridge_proc and self.bridge_proc.poll() is None:
                    self._append("Provider Konnaxion déjà actif.")
                else:
                    cmd = [
                        str(py), "-m", "uvicorn", "config.asgi:application",
                        "--host", "127.0.0.1", "--port", str(int(self.port.get())),
                    ]
                    self.bridge_proc = subprocess.Popen(
                        cmd,
                        cwd=backend,
                        env=self._provider_env(),
                        stdout=subprocess.PIPE,
                        stderr=subprocess.STDOUT,
                        text=True,
                        bufsize=1,
                    )
                    self._pipe(self.bridge_proc, "KX")

                last = None
                for _ in range(40):
                    if self.bridge_proc and self.bridge_proc.poll() is not None:
                        raise RuntimeError("Le provider Konnaxion s'est arrêté au démarrage.")
                    try:
                        health = self._request_json(self._base_url() + "/health/")
                        if health.get("ok"):
                            break
                    except Exception as exc:
                        last = exc
                        time.sleep(0.5)
                else:
                    raise RuntimeError(f"Provider non joignable: {last}")

                self._append(f"Provider READY: {self._publish_url(world)}")
                self._set_status("Bridge READY. Ferme l'ancien worker Orgo, puis démarre le worker ici.")
            except Exception as exc:
                self._set_status("Erreur Bridge")
                self._show_error("Bridge Konnaxion", exc)
        self._thread(work)

    def start_worker(self):
        def work():
            try:
                if not self.bridge_proc or self.bridge_proc.poll() is not None:
                    raise RuntimeError("Démarre d'abord le Bridge Konnaxion.")
                world = self.world.get().strip()
                if not world:
                    raise RuntimeError("Choisis un Konnaxion World.")
                database_url = self.database_url.get().strip()
                if not database_url:
                    raise RuntimeError("Orgo DATABASE_URL est vide. Colle le même DATABASE_URL que celui de l'API Orgo.")

                orgo = Path(self.orgo_root.get().strip())
                if not (orgo / "package.json").exists():
                    raise RuntimeError(f"Orgo introuvable: {orgo}")
                npm = shutil.which("npm.cmd") or shutil.which("npm")
                if not npm:
                    raise RuntimeError("npm introuvable")

                if self.worker_proc and self.worker_proc.poll() is None:
                    self._append("Worker Orgo déjà démarré par cet outil.")
                    return

                env = os.environ.copy()
                env["DATABASE_URL"] = database_url
                env["NODE_ENV"] = "development"
                env["KONNAXION_BRIDGE_TOKEN"] = self.bridge_token
                env["KONNAXION_BRIDGE_URL"] = self._publish_url(world)
                self.worker_proc = subprocess.Popen(
                    [npm, "run", "worker"],
                    cwd=orgo,
                    env=env,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    bufsize=1,
                )
                self._pipe(self.worker_proc, "ORGO")
                time.sleep(1.0)
                if self.worker_proc.poll() is not None:
                    raise RuntimeError("Le worker Orgo s'est arrêté au démarrage; consulte les logs ci-dessous.")
                self._append(f"Worker Orgo actif -> Konnaxion World {world}")
                self._set_status("Bridge + worker actifs. Relance J30 → Injecter TEST.")
            except Exception as exc:
                self._set_status("Erreur worker Orgo")
                self._show_error("Worker Orgo", exc)
        self._thread(work)

    def check_impact(self):
        def work():
            try:
                world = self.world.get().strip()
                if not world:
                    raise RuntimeError("Choisis un Konnaxion World.")
                query = urllib.parse.urlencode({"external_reference": IMPACT_REF})
                data = self._request_json(f"{self._base_url()}/{urllib.parse.quote(world)}/impacts/?{query}")
                self._append("=== Impact J30 ===")
                self._append(json.dumps(data, indent=2, ensure_ascii=False))
                count = int(data.get("count", 0))
                self._set_status(
                    "Impact J30 Konnaxion: exactement 1 artefact." if count == 1 else f"Impact J30 count={count}"
                )
            except Exception as exc:
                self._set_status("Impact J30 non vérifié")
                self._show_error("Vérifier Impact", exc)
        self._thread(work)

    def stop_all(self):
        for name, proc in (("ORGO", self.worker_proc), ("KX", self.bridge_proc)):
            if proc and proc.poll() is None:
                self._append(f"Arrêt {name}...")
                proc.terminate()
                try:
                    proc.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    proc.kill()
        self.worker_proc = None
        self.bridge_proc = None
        self._set_status("Arrêté")

    def _on_close(self):
        if messagebox.askyesno("Fermer", "Arrêter les processus lancés par cet outil et fermer?"):
            self.stop_all()
            self.destroy()


if __name__ == "__main__":
    BridgeManager().mainloop()
