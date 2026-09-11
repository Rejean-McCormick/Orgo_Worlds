"""Orgo Worlds desktop control-plane client.

Uses only the public HTTP API. It never opens the PostgreSQL database directly and
never stores bearer tokens on disk.
"""
from __future__ import annotations

import json
import tkinter as tk
from tkinter import messagebox, simpledialog, ttk
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class Api:
    def __init__(self, base: str, token: str):
        self.base = base.rstrip("/") + "/api/v3"
        self.token = token.strip()

    def request(self, path: str, method: str = "GET", data=None):
        body = None if data is None else json.dumps(data).encode("utf-8")
        headers = {"Accept": "application/json"}
        if body is not None:
            headers["Content-Type"] = "application/json"
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        req = Request(f"{self.base}/{path.lstrip('/')}", data=body, method=method, headers=headers)
        try:
            with urlopen(req, timeout=15) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            try:
                payload = json.loads(exc.read().decode("utf-8"))
                detail = payload.get("error", {}).get("message") or str(exc)
            except Exception:
                detail = str(exc)
            raise RuntimeError(detail) from exc
        except URLError as exc:
            raise RuntimeError(f"API inaccessible: {exc.reason}") from exc
        if not payload.get("ok"):
            raise RuntimeError(payload.get("error", {}).get("message") or "Erreur API")
        return payload.get("data")


class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Orgo World Manager")
        self.geometry("1040x680")
        self.minsize(840, 560)
        self.base = tk.StringVar(value="http://127.0.0.1:4100")
        self.organization = tk.StringVar(value="orgo-worlds")
        self.email = tk.StringVar(value="admin@example.test")
        self.password = tk.StringVar()
        self._token = ""
        self.status = tk.StringVar(value="Déconnecté")
        self.worlds = []
        self._build()

    def _build(self):
        top = ttk.Frame(self, padding=12)
        top.pack(fill="x")
        ttk.Label(top, text="API").grid(row=0, column=0, sticky="w")
        ttk.Entry(top, textvariable=self.base, width=28).grid(row=0, column=1, padx=6)
        ttk.Label(top, text="Organisation").grid(row=0, column=2, sticky="w")
        ttk.Entry(top, textvariable=self.organization, width=18).grid(row=0, column=3, padx=6)
        ttk.Label(top, text="Courriel").grid(row=1, column=0, sticky="w", pady=(8, 0))
        ttk.Entry(top, textvariable=self.email, width=28).grid(row=1, column=1, padx=6, pady=(8, 0))
        ttk.Label(top, text="Mot de passe").grid(row=1, column=2, sticky="w", pady=(8, 0))
        password = ttk.Entry(top, textvariable=self.password, width=24, show="•")
        password.grid(row=1, column=3, padx=6, pady=(8, 0), sticky="ew")
        password.bind("<Return>", lambda _e: self.login())
        ttk.Button(top, text="Connexion", command=self.login).grid(row=0, column=4, rowspan=2, padx=(6, 0))
        top.columnconfigure(3, weight=1)
        ttk.Label(top, textvariable=self.status).grid(row=2, column=0, columnspan=5, sticky="w", pady=(8, 0))

        body = ttk.Panedwindow(self, orient="horizontal")
        body.pack(fill="both", expand=True, padx=12, pady=(0, 12))
        left = ttk.Frame(body, padding=8)
        right = ttk.Frame(body, padding=8)
        body.add(left, weight=1)
        body.add(right, weight=2)

        actions = ttk.Frame(left)
        actions.pack(fill="x", pady=(0, 8))
        ttk.Button(actions, text="Nouveau World", command=self.create_world).pack(side="left")
        ttk.Button(actions, text="Actualiser", command=self.refresh).pack(side="right")
        self.listbox = tk.Listbox(left, exportselection=False)
        self.listbox.pack(fill="both", expand=True)
        self.listbox.bind("<<ListboxSelect>>", lambda _e: self.show_selected())

        self.title_var = tk.StringVar(value="Sélectionnez un World")
        ttk.Label(right, textvariable=self.title_var, font=("Segoe UI", 16, "bold")).pack(anchor="w")
        self.detail = tk.Text(right, height=14, wrap="word", state="disabled")
        self.detail.pack(fill="both", expand=True, pady=8)
        buttons = ttk.Frame(right)
        buttons.pack(fill="x")
        ttk.Button(buttons, text="Nouvelle release", command=self.create_release).pack(side="left", padx=(0, 6))
        ttk.Button(buttons, text="Promouvoir release", command=self.promote_release).pack(side="left", padx=(0, 6))
        ttk.Button(buttons, text="Archiver", command=self.archive_world).pack(side="left")

    def api(self):
        if not self._token:
            raise RuntimeError("Connexion requise")
        return Api(self.base.get(), self._token)

    def login(self):
        organization = self.organization.get().strip()
        email = self.email.get().strip()
        password = self.password.get()
        if not organization or not email or not password:
            messagebox.showerror("Orgo Worlds", "Organisation, courriel et mot de passe requis.", parent=self)
            return
        try:
            data = Api(self.base.get(), "").request(
                "auth/login",
                "POST",
                {"organization": organization, "email": email, "password": password},
            )
            token = (data or {}).get("token")
            if not token:
                raise RuntimeError("Le serveur n'a pas retourné de session.")
            self._token = token
            self.password.set("")
            self.status.set("Connecté")
            self.refresh()
        except Exception as exc:
            self._token = ""
            self.status.set("Connexion refusée")
            messagebox.showerror("Orgo Worlds", str(exc), parent=self)

    def selected(self):
        selection = self.listbox.curselection()
        return self.worlds[selection[0]] if selection else None

    def refresh(self):
        try:
            self.worlds = self.api().request("control/worlds") or []
            self.listbox.delete(0, "end")
            for world in self.worlds:
                release = (world.get("current_release") or {}).get("release_number", "—")
                self.listbox.insert("end", f"{world['title']}   [{world['key']}]   r{release}")
            self.status.set(f"{len(self.worlds)} World(s) chargés")
            if self.worlds:
                self.listbox.selection_set(0)
                self.show_selected()
        except Exception as exc:
            self.status.set("Erreur")
            messagebox.showerror("Orgo Worlds", str(exc), parent=self)

    def show_selected(self):
        world = self.selected()
        if not world:
            return
        try:
            data = self.api().request(f"control/worlds/{world['key']}")
            self.title_var.set(f"{data['title']} · {data['key']}")
            self.detail.configure(state="normal")
            self.detail.delete("1.0", "end")
            self.detail.insert("end", json.dumps(data, indent=2, ensure_ascii=False, default=str))
            self.detail.configure(state="disabled")
        except Exception as exc:
            messagebox.showerror("Orgo Worlds", str(exc), parent=self)

    def create_world(self):
        key = simpledialog.askstring("Nouveau World", "Clé (ex. atelier-nord):", parent=self)
        if not key:
            return
        title = simpledialog.askstring("Nouveau World", "Titre:", initialvalue=key, parent=self)
        if not title:
            return
        try:
            self.api().request("control/worlds", "POST", {"key": key.strip().lower(), "title": title.strip(), "visibility": "private"})
            self.refresh()
        except Exception as exc:
            messagebox.showerror("Orgo Worlds", str(exc), parent=self)

    def create_release(self):
        world = self.selected()
        if not world:
            return
        label = simpledialog.askstring("Nouvelle release", "Libellé:", parent=self) or ""
        config_raw = simpledialog.askstring("Nouvelle release", "Configuration JSON (objet):", initialvalue="{}", parent=self)
        if config_raw is None:
            return
        try:
            config = json.loads(config_raw)
            if not isinstance(config, dict):
                raise ValueError("La configuration doit être un objet JSON")
            self.api().request(f"control/worlds/{world['key']}/releases", "POST", {"label": label, "config": config})
            self.show_selected()
        except Exception as exc:
            messagebox.showerror("Orgo Worlds", str(exc), parent=self)

    def promote_release(self):
        world = self.selected()
        if not world:
            return
        try:
            releases = self.api().request(f"control/worlds/{world['key']}/releases") or []
            candidates = [r for r in releases if r.get("status") == "ready"]
            if not candidates:
                messagebox.showinfo("Orgo Worlds", "Aucune release prête à promouvoir.", parent=self)
                return
            options = "\n".join(f"r{r['release_number']}  {r.get('label','')}  {r['id']}" for r in candidates)
            rid = simpledialog.askstring("Promouvoir", f"Copiez l'UUID de la release:\n\n{options}", parent=self)
            if not rid:
                return
            self.api().request(f"control/worlds/{world['key']}/releases/{rid.strip()}/promote", "POST")
            self.refresh()
        except Exception as exc:
            messagebox.showerror("Orgo Worlds", str(exc), parent=self)

    def archive_world(self):
        world = self.selected()
        if not world:
            return
        if not messagebox.askyesno("Archiver", f"Archiver {world['title']} ?", parent=self):
            return
        try:
            self.api().request(f"control/worlds/{world['key']}/archive", "POST")
            self.refresh()
        except Exception as exc:
            messagebox.showerror("Orgo Worlds", str(exc), parent=self)


if __name__ == "__main__":
    App().mainloop()
