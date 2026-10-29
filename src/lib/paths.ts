const INDEX_FILE = 'index.html';

/**
 * Maps a URL pathname to a Backblaze B2 object key.
 *
 * `/` and directory paths resolve to `index.html`. Returns `undefined` when the
 * pathname contains invalid percent-encoding.
 */
export function resolveObjectKey(pathname: string): string | undefined {
  let decodedPath: string;

  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return undefined;
  }

  const key = decodedPath.replace(/^\/+/, '');

  if (key === '') {
    return INDEX_FILE;
  }

  return key.endsWith('/') ? `${key}${INDEX_FILE}` : key;
}
