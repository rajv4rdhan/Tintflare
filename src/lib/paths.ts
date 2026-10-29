export function resolveObjectKey(pathname: string): string | undefined {
  try {
    const path = decodeURIComponent(pathname).replace(/^\/+/, '');
    if (!path) return 'index.html';
    return path.endsWith('/') ? `${path}index.html` : path;
  } catch {
    return undefined;
  }
}
