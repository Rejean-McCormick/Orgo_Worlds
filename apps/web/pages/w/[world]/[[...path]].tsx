import Head from "next/head";
import { useRouter } from "next/router";
import { OrgoApp } from "../../../src/orgo/OrgoApp";

export default function WorldPage() {
  const router = useRouter();
  const world = typeof router.query.world === "string" ? router.query.world : "";
  const path = (router.query.path as string[] | undefined) ?? [];
  if (!world) return null;
  return (
    <>
      <Head><title>Orgo Worlds · {world}</title></Head>
      <OrgoApp
        worldKey={world}
        path={path}
        navigate={(next) => void router.push(`/w/${encodeURIComponent(world)}/${next}`)}
      />
    </>
  );
}
