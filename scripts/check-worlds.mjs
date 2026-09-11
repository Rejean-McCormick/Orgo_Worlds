import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const contains = (file, pattern, label = pattern) => {
  const text = read(file);
  expect(typeof pattern === 'string' ? text.includes(pattern) : pattern.test(text), `${file}: missing ${label}`);
};

contains('package.json', '"name": "orgo-worlds"', 'standalone package name');
contains('docker-compose.yml', 'orgo-worlds-postgres', 'standalone postgres container');
contains('docker-compose.yml', 'orgo_worlds_data', 'standalone database volume');
contains('apps/api/prisma/schema.prisma', 'model World {');
contains('apps/api/prisma/schema.prisma', 'model WorldRelease {');
contains('apps/api/prisma/schema.prisma', 'model WorldMembership {');
for (const model of ['Task', 'Case', 'Signal', 'WorkflowInstance', 'IdempotencyRecord', 'WorkEvent', 'OutboxMessage']) {
  const schema = read('apps/api/prisma/schema.prisma');
  const start = schema.indexOf(`model ${model} {`);
  const end = schema.indexOf('\nmodel ', start + 1);
  const block = schema.slice(start, end < 0 ? schema.length : end);
  expect(block.includes('world_id'), `${model}: world_id required`);
  expect(block.includes('world_release_id'), `${model}: world_release_id required`);
}
contains('apps/api/src/bootstrap.ts', '/api\\/v3\\/w\\/', 'canonical world route rewrite');
contains('apps/api/src/orgo/adapters/inbound/http/boundary.ts', "'WORLD_READ_ONLY'", 'viewer write protection');
contains('apps/api/src/orgo/platform/outbox/worker.service.ts', 'worldReleaseId: message.world_release_id', 'worker release pinning');
contains('apps/web/src/orgo/WorldSwitcher.tsx', '/w/${encodeURIComponent(key)}', 'world switch navigation');
expect(fs.existsSync(path.join(root, 'apps/web/pages/worlds.tsx')), 'World Manager page missing');
expect(fs.existsSync(path.join(root, 'apps/web/pages/w/[world]/[[...path]].tsx')), 'World runtime page missing');
expect(fs.existsSync(path.join(root, 'Orgo_World_Manager.pyw')), 'desktop World Manager missing');
contains('docs/Technical-Reference/Worlds/AI_LOCK.yaml', 'ORGO-WORLDS-1', 'architecture lock');
contains('apps/api/prisma/migrations/20260911120000_orgo_worlds_phase5/migration.sql', 'tasks_world_release_same_world_fkey', 'runtime release/world composite foreign key');
contains('apps/api/prisma/migrations/20260911120000_orgo_worlds_phase5/migration.sql', 'worlds_current_release_same_world_fkey', 'current release belongs to World');
contains('apps/api/src/orgo/modules/worlds/worlds.service.ts', "ctx.permissions.includes('worlds:manage')", 'organization Worlds administration gate');
contains('apps/api/src/orgo/modules/worlds/worlds.service.ts', 'MANAGE_ROLES.has(membership.role)', 'owner/maintainer local administration');
expect(fs.existsSync(path.join(root, 'VALIDATE_ORGO_WORLDS.ps1')), 'one-click validation script missing');
expect(fs.existsSync(path.join(root, 'START_ORGO_WORLDS.ps1')), 'standalone start script missing');

const worldsService = read('apps/api/src/orgo/modules/worlds/worlds.service.ts');
expect(!worldsService.includes('search_path'), 'WorldsService must not use dynamic PostgreSQL search_path');
for (const p of ['docker-compose.yml', '.env.example', 'apps/api/src/main.ts', 'apps/web/next.config.js']) {
  expect(!read(p).includes('C:\\mycode\\Orgo\\Orgo'), `${p}: must not depend on sibling Orgo filesystem`);
}

if (failures.length) {
  console.error('Orgo Worlds static architecture check FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Orgo Worlds static architecture check: PASS');
}
