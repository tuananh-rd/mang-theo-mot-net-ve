import type { APIRoute } from 'astro';
import { loadValidatedSnapshot } from '../../data/lib/snapshot-loader';

export const prerender = true;

export const GET: APIRoute = async () => {
  const snapshot = loadValidatedSnapshot();
  const nodeEnv = (globalThis as any).process?.env ?? {};
  const metaEnv = (import.meta as any).env ?? {};
  const commitSha = nodeEnv.CF_PAGES_COMMIT_SHA || nodeEnv.GITHUB_SHA || metaEnv.CF_PAGES_COMMIT_SHA || metaEnv.GITHUB_SHA || null;

  const payload = {
    sha256: snapshot ? snapshot.sha256 : null,
    commitSha: commitSha ? String(commitSha).trim() : null,
    generatedAt: snapshot ? snapshot.generatedAt : null,
    schemaVersion: snapshot ? snapshot.version : '1.0.0',
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  });
};
