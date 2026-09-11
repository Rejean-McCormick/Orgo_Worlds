# -*- coding: utf-8 -*-
"""Orgo Worlds scenario pack manager.

This UI never writes to Orgo directly. Validation/planning and real injection are
owned by the sibling Orgo Scenario Injector.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import threading
from pathlib import Path
import tkinter as tk
from tkinter import messagebox, ttk

ROOT = Path(__file__).resolve().parent
PACKS = ROOT / "world-packs"
DEFAULT_ORGO = Path(os.environ.get("ORGO_ROOT", str(ROOT.parent / "Orgo"))).resolve()


def _hidden_kwargs() -> dict:
    if os.name != "nt":
        return {}
    startupinfo = subprocess.STARTUPINFO()
    startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
    startupinfo.wShowWindow = subprocess.SW_HIDE
    return {"creationflags": getattr(subprocess, "CREATE_NO_WINDOW", 0), "startupinfo": startupinfo}


class App(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("Orgo Worlds — Scenario Manager")
        self.geometry("980x650")
        self.minsize(820, 560)
        self.orgo_root = tk.StringVar(value=str(DEFAULT_ORGO))
        self.world = tk.StringVar()
        self.checkpoint = tk.StringVar()
        self.pack = None
        self._build()
        self._load_worlds()

    def _build(self) -> None:
        self.columnconfigure(0, weight=1)
        self.rowconfigure(3, weight=1)
        head = ttk.Frame(self, padding=14)
        head.grid(row=0, column=0, sticky="ew")
        ttk.Label(head, text="Orgo Worlds — Scenario Manager", font=("Segoe UI", 18, "bold")).pack(anchor="w")
        ttk.Label(head, text="World pack → orgo.scenario.v1 → Orgo Scenario Injector → API Orgo").pack(anchor="w", pady=(4,0))

        form = ttk.LabelFrame(self, text="World", padding=10)
        form.grid(row=1, column=0, sticky="ew", padx=14, pady=(0,8))
        form.columnconfigure(1, weight=1)
        ttk.Label(form, text="Repo Orgo").grid(row=0,column=0,sticky="w",padx=(0,8),pady=4)
        ttk.Entry(form, textvariable=self.orgo_root).grid(row=0,column=1,columnspan=3,sticky="ew",pady=4)
        ttk.Label(form, text="World pack").grid(row=1,column=0,sticky="w",padx=(0,8),pady=4)
        self.world_combo=ttk.Combobox(form,textvariable=self.world,state="readonly")
        self.world_combo.grid(row=1,column=1,sticky="ew",pady=4)
        self.world_combo.bind("<<ComboboxSelected>>", lambda _e:self._load_pack())
        ttk.Label(form, text="Checkpoint").grid(row=1,column=2,sticky="w",padx=(12,8),pady=4)
        self.cp_combo=ttk.Combobox(form,textvariable=self.checkpoint,state="readonly",width=18)
        self.cp_combo.grid(row=1,column=3,sticky="ew",pady=4)
        self.cp_combo.bind("<<ComboboxSelected>>", lambda _e:self._describe())

        actions=ttk.Frame(self,padding=(14,0,14,8))
        actions.grid(row=2,column=0,sticky="ew")
        ttk.Button(actions,text="Valider",command=lambda:self._run("validate")).pack(side="left",padx=(0,6))
        ttk.Button(actions,text="Plan / Dry-run",command=lambda:self._run("plan")).pack(side="left",padx=6)
        ttk.Button(actions,text="Ouvrir dans Orgo Scenario Injector",command=self._open_injector).pack(side="left",padx=6)
        ttk.Button(actions,text="Ouvrir documentation",command=self._open_docs).pack(side="right",padx=(6,0))

        panel=ttk.LabelFrame(self,text="Détails / sortie",padding=8)
        panel.grid(row=3,column=0,sticky="nsew",padx=14,pady=(0,14))
        panel.rowconfigure(0,weight=1); panel.columnconfigure(0,weight=1)
        self.log=tk.Text(panel,wrap="word",state="disabled",font=("Consolas",10))
        self.log.grid(row=0,column=0,sticky="nsew")
        sb=ttk.Scrollbar(panel,orient="vertical",command=self.log.yview); sb.grid(row=0,column=1,sticky="ns")
        self.log.configure(yscrollcommand=sb.set)

    def _write(self,text:str) -> None:
        self.log.configure(state="normal"); self.log.insert("end",text); self.log.see("end"); self.log.configure(state="disabled")

    def _load_worlds(self) -> None:
        worlds=[]
        if PACKS.exists():
            for d in sorted(PACKS.iterdir()):
                if d.is_dir() and (d/"world-pack.json").is_file(): worlds.append(d.name)
        self.world_combo["values"]=worlds
        if worlds:
            self.world.set(worlds[0]); self._load_pack()

    def _load_pack(self) -> None:
        try:
            path=PACKS/self.world.get()/"world-pack.json"
            self.pack=json.loads(path.read_text(encoding="utf-8"))
            cps=self.pack.get("checkpoint_order",[])
            self.cp_combo["values"]=cps
            if cps: self.checkpoint.set(cps[0])
            self._describe()
        except Exception as exc:
            messagebox.showerror(self.title(),str(exc))

    def _scenario(self) -> Path:
        if not self.pack: raise RuntimeError("World pack non chargé")
        cp=self.checkpoint.get(); row=self.pack.get("checkpoints",{}).get(cp)
        if not row: raise RuntimeError(f"Checkpoint inconnu: {cp}")
        return (PACKS/self.world.get()/row["scenario"]).resolve()

    def _injector_cli(self) -> Path:
        p=Path(self.orgo_root.get()).expanduser().resolve()/"tools"/"scenario-injector"/"cli.mjs"
        if not p.is_file(): raise RuntimeError(f"Scenario Injector introuvable: {p}")
        return p

    def _describe(self) -> None:
        if not self.pack: return
        row=self.pack.get("checkpoints",{}).get(self.checkpoint.get(),{})
        self._write("\n=== WORLD ===\n")
        self._write(f"{self.pack['world']['title']}\nrelease: {self.pack['world'].get('release')}\n")
        self._write(f"checkpoint: {self.checkpoint.get()}\nmutates Orgo: {row.get('mutates_orgo')}\n")
        try: self._write(f"scenario: {self._scenario()}\n")
        except Exception: pass

    def _run(self, command:str) -> None:
        try:
            cli=self._injector_cli(); scenario=self._scenario()
        except Exception as exc:
            messagebox.showerror(self.title(),str(exc)); return
        self._write(f"\n$ node {cli} {command} {scenario}\n")
        def worker():
            cp=subprocess.run(["node",str(cli),command,str(scenario)],cwd=str(Path(self.orgo_root.get()).resolve()),stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,encoding="utf-8",errors="replace",**_hidden_kwargs())
            self.after(0,lambda:self._finish(command,cp.returncode,cp.stdout,cp.stderr))
        threading.Thread(target=worker,daemon=True).start()

    def _finish(self,command:str,code:int,out:str,err:str)->None:
        if out: self._write(out.rstrip()+"\n")
        if err: self._write(err.rstrip()+"\n")
        if code: messagebox.showerror(self.title(),f"{command} a échoué (code {code}).")

    def _open_injector(self) -> None:
        try:
            root=Path(self.orgo_root.get()).resolve(); ui=root/"OrgoScenarioInjector.pyw"; scenario=self._scenario()
            if not ui.is_file(): raise RuntimeError(f"UI Scenario Injector introuvable: {ui}")
            if os.name=="nt":
                pyw=Path(sys.executable).with_name("pythonw.exe")
                exe=str(pyw if pyw.exists() else sys.executable)
                subprocess.Popen([exe,str(ui),"--scenario",str(scenario)],cwd=str(root),**_hidden_kwargs())
            else:
                subprocess.Popen([sys.executable,str(ui),"--scenario",str(scenario)],cwd=str(root))
        except Exception as exc:
            messagebox.showerror(self.title(),str(exc))

    def _open_docs(self) -> None:
        path=(PACKS/self.world.get()/"docs"/"00_INDEX.md").resolve()
        try:
            if os.name=="nt": os.startfile(str(path))  # type: ignore[attr-defined]
            elif sys.platform=="darwin": subprocess.Popen(["open",str(path)])
            else: subprocess.Popen(["xdg-open",str(path)])
        except Exception as exc: messagebox.showerror(self.title(),str(exc))


if __name__ == "__main__":
    App().mainloop()
