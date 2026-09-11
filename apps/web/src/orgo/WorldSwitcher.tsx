import { useEffect, useMemo, useState } from "react";
import { Actor, OrgoClient } from "./api";

interface ReleaseSummary {
  id: string;
  release_number: number;
  status: string;
  label: string;
}
interface WorldSummary {
  id: string;
  key: string;
  title: string;
  status: string;
  visibility: string;
  is_default: boolean;
  role: string | null;
  current_release: ReleaseSummary | null;
}

const RECENTS = "orgo-worlds:recent-worlds";

function recentKeys(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(RECENTS) ?? "[]");
    return Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}
function remember(key: string) {
  if (typeof window === "undefined") return;
  const next = [key, ...recentKeys().filter((v) => v !== key)].slice(0, 8);
  window.localStorage.setItem(RECENTS, JSON.stringify(next));
}
function appPath() {
  if (typeof window === "undefined") return "/";
  const match = /^\/w\/[^/]+(\/.*)?$/.exec(window.location.pathname);
  return match?.[1] || (window.location.pathname === "/worlds" ? "/" : window.location.pathname);
}

export function WorldSwitcher({
  client,
  actor,
  worldKey,
}: {
  client: OrgoClient;
  actor: Actor;
  worldKey?: string;
}) {
  const [worlds, setWorlds] = useState<WorldSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const currentKey = worldKey ?? actor.worldKey ?? "main";

  useEffect(() => {
    let cancelled = false;
    client
      .request<WorldSummary[]>("control/worlds")
      .then((rows) => {
        if (!cancelled) setWorlds(rows);
      })
      .catch(() => {
        if (!cancelled) setWorlds([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client]);

  const ordered = useMemo(() => {
    const recents = recentKeys();
    const rank = new Map(recents.map((key, index) => [key, index]));
    return [...worlds].sort((a, b) => {
      const ar = rank.get(a.key);
      const br = rank.get(b.key);
      if (ar !== undefined || br !== undefined) {
        if (ar === undefined) return 1;
        if (br === undefined) return -1;
        return ar - br;
      }
      return a.title.localeCompare(b.title);
    });
  }, [worlds]);

  if (!loading && worlds.length === 0) return null;
  return (
    <div className="world-switcher">
      <span className="world-switcher-label">World</span>
      <select
        aria-label="World actif"
        value={currentKey}
        disabled={loading}
        onChange={(event) => {
          const key = event.target.value;
          if (!key || key === currentKey) return;
          remember(key);
          const path = appPath();
          window.location.assign(`/w/${encodeURIComponent(key)}${path === "/" ? "" : path}`);
        }}
      >
        {ordered.map((world) => (
          <option
            key={world.id}
            value={world.key}
            disabled={world.status === "archived" || !world.current_release}
          >
            {world.title} · r{world.current_release?.release_number ?? "—"}
          </option>
        ))}
      </select>
      <button
        className="world-manager-link"
        type="button"
        onClick={() => window.location.assign("/worlds")}
      >
        Gérer
      </button>
    </div>
  );
}
