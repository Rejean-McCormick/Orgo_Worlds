#!/usr/bin/env node
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const worldsRoot = resolve(here, '../..');

function usage() {
  console.log(`Orgo Worlds → Orgo Scenario Injector bridge\n\nCommandes:\n  list\n  show <world>\n  validate <world> <checkpoint> [--orgo-root PATH]\n  validate-all <world> [--orgo-root PATH]\n  plan <world> <checkpoint> [--orgo-root PATH]\n  inject <world> <checkpoint> --apply [--orgo-root PATH] [--report PATH]\n  open <world> <checkpoint> [--orgo-root PATH]\n\nLe bridge n'écrit jamais directement dans Orgo. Il délègue toujours à Orgo/tools/scenario-injector.\n`);
}
function value(args,name) { const i=args.indexOf(name); return i>=0 ? args[i+1] : undefined; }
function flag(args,name) { return args.includes(name); }
async function loadWorld(world) {
  const path=resolve(worldsRoot,'world-packs',world,'world-pack.json');
  if (!existsSync(path)) throw new Error(`World pack introuvable: ${path}`);
  const doc=JSON.parse(await readFile(path,'utf8'));
  return {path,dir:dirname(path),doc};
}
function orgoRoot(args) {
  return resolve(value(args,'--orgo-root') || process.env.ORGO_ROOT || resolve(worldsRoot,'../Orgo'));
}
function injector(orgo) {
  const cli=resolve(orgo,'tools/scenario-injector/cli.mjs');
  if (!existsSync(cli)) throw new Error(`Scenario Injector Orgo introuvable: ${cli}`);
  return cli;
}
function scenarioFor(pack, checkpoint) {
  const row=pack.doc.checkpoints?.[checkpoint];
  if (!row) throw new Error(`Checkpoint inconnu ${checkpoint}. Valides: ${(pack.doc.checkpoint_order||[]).join(', ')}`);
  const path=resolve(pack.dir,row.scenario);
  if (!existsSync(path)) throw new Error(`Scénario introuvable: ${path}`);
  return {path,row};
}
function runNode(cli,args,{capture=false}={}) {
  const r=spawnSync(process.execPath,[cli,...args],{encoding:'utf8',stdio:capture?'pipe':'inherit',env:process.env});
  if (capture) {
    if (r.stdout) process.stdout.write(r.stdout);
    if (r.stderr) process.stderr.write(r.stderr);
  }
  if (r.error) throw r.error;
  if ((r.status??1)!==0) throw new Error(`Scenario Injector a échoué (code ${r.status})`);
  return r;
}

const [, , command, ...args]=process.argv;
try {
  if (!command || ['help','-h','--help'].includes(command)) { usage(); process.exitCode=0; }
  else if (command==='list') {
    const { readdir }=await import('node:fs/promises');
    const base=resolve(worldsRoot,'world-packs');
    const names=existsSync(base) ? (await readdir(base,{withFileTypes:true})).filter(x=>x.isDirectory()).map(x=>x.name) : [];
    for (const name of names) {
      try { const p=await loadWorld(name); console.log(`${name}\t${p.doc.world?.title||''}\t${p.doc.world?.release||''}`); } catch {}
    }
  }
  else if (command==='show') {
    const world=args[0]; if (!world) throw new Error('World requis');
    const pack=await loadWorld(world); console.log(JSON.stringify(pack.doc,null,2));
  }
  else {
    const world=args[0];
    if (!world) throw new Error('World requis');
    const pack=await loadWorld(world); const orgo=orgoRoot(args); const cli=injector(orgo);
    if (command==='validate-all') {
      for (const cp of pack.doc.checkpoint_order||[]) {
        const s=scenarioFor(pack,cp); console.error(`=== ${world} ${cp} ===`); runNode(cli,['validate',s.path]);
      }
    }
    else {
      const checkpoint=args[1]; if (!checkpoint) throw new Error('Checkpoint requis');
      const scenario=scenarioFor(pack,checkpoint);
      if (command==='validate') runNode(cli,['validate',scenario.path]);
    else if (command==='plan') runNode(cli,['plan',scenario.path]);
    else if (command==='inject') {
      if (!flag(args,'--apply')) throw new Error('Par sécurité, inject exige --apply');
      const report=value(args,'--report') || resolve(worldsRoot,'runtime','world-injections',world,`${checkpoint}.import-report.json`);
      await mkdir(dirname(report),{recursive:true});
      runNode(cli,['inject',scenario.path,'--apply','--report',report]);
      console.error(`Rapport: ${report}`);
    }
      else if (command==='open') {
        const ui=resolve(orgo,'OrgoScenarioInjector.pyw'); if (!existsSync(ui)) throw new Error(`UI Scenario Injector introuvable: ${ui}`);
        const py=process.env.ORGO_PYTHONW || (process.platform==='win32'?'pythonw':'python3');
        const r=spawnSync(py,[ui,'--scenario',scenario.path],{stdio:'ignore',windowsHide:true});
        if (r.error) throw r.error;
        console.log(`Ouvert: ${ui}\nScénario: ${scenario.path}`);
      }
      else throw new Error(`Commande inconnue: ${command}`);
    }
  }
} catch (error) {
  console.error(`ERREUR: ${error.message}`); process.exitCode=1;
}
