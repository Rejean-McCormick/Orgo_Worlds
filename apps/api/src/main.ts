import { createApp } from './bootstrap';
async function main() {
  const app = await createApp();
  await app.listen(Number(process.env.PORT ?? 4100), '0.0.0.0');
  console.log(
    JSON.stringify({
      event: 'orgo-worlds.api.ready',
      port: Number(process.env.PORT ?? 4100),
    }),
  );
}
main().catch(() => {
  console.error('Orgo Worlds API startup failed');
  process.exitCode = 1;
});
