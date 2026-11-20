import type { Env } from './auth/_shared';

// Public images (logo, hero slides, news, events, gallery, executives) are committed to the GitHub
// repository and served back through /api/files. Private files (member profile photos, documents)
// stay in the R2 bucket, because a public repository would expose them.

const DEFAULT_REPO = 'AnointingPaschal/nacosmouau';
const MEDIA_ROOT = 'media';

export const githubEnabled = (env: Env) => Boolean(env.GITHUB_TOKEN);
export const isPublicImage = (mime: string, purpose = 'media') => mime.startsWith('image/') && purpose !== 'profile' && purpose !== 'proof';

const repo = (env: Env) => env.GITHUB_REPO || DEFAULT_REPO;
const branch = (env: Env) => env.GITHUB_BRANCH || 'main';
const contentsUrl = (env: Env, key: string) => `https://api.github.com/repos/${repo(env)}/contents/${MEDIA_ROOT}/${key.split('/').map(encodeURIComponent).join('/')}`;
const headers = (env: Env, accept: string) => ({ Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: accept, 'User-Agent': 'nacos-mouau-platform', 'X-GitHub-Api-Version': '2022-11-28' });

function toBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export async function putGithub(env: Env, key: string, bytes: Uint8Array) {
  const response = await fetch(contentsUrl(env, key), {
    method: 'PUT',
    headers: { ...headers(env, 'application/vnd.github+json'), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `chore(media): add ${key} [skip ci] [cf skip]`, content: toBase64(bytes), branch: branch(env) }),
  });
  if (!response.ok) throw new Error(`GitHub upload failed (${response.status}): ${(await response.text()).slice(0, 200)}`);
}

export async function getGithub(env: Env, key: string): Promise<Response | null> {
  const response = await fetch(`${contentsUrl(env, key)}?ref=${encodeURIComponent(branch(env))}`, { headers: headers(env, 'application/vnd.github.raw+json') });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub read failed (${response.status})`);
  return response;
}

async function deleteGithub(env: Env, key: string) {
  const meta = await fetch(`${contentsUrl(env, key)}?ref=${encodeURIComponent(branch(env))}`, { headers: headers(env, 'application/vnd.github+json') });
  if (!meta.ok) return;
  const { sha } = await meta.json<{ sha: string }>();
  await fetch(contentsUrl(env, key), {
    method: 'DELETE',
    headers: { ...headers(env, 'application/vnd.github+json'), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `chore(media): remove ${key} [skip ci] [cf skip]`, sha, branch: branch(env) }),
  });
}

/** Removes a stored file from whichever store holds it. Never throws: cleanup must not block a CMS save. */
export async function deleteObject(env: Env, key: string) {
  const record = await env.DB.prepare('SELECT mime_type FROM media_objects WHERE object_key=?').bind(key).first<{ mime_type: string }>().catch(() => null);
  if (record?.mime_type.startsWith('image/') && githubEnabled(env)) await deleteGithub(env, key).catch(error => console.error('GitHub delete failed:', error));
  if (env.BUCKET) await env.BUCKET.delete(key).catch(() => undefined);
}
