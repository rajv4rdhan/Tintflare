export class ServerTiming {
  private readonly metrics: string[] = [];

  add(name: string, durationMs?: number, description?: string): void {
    const parts = [name];

    if (durationMs !== undefined) {
      parts.push(`dur=${formatDuration(durationMs)}`);
    }

    if (description) {
      parts.push(`desc=${description}`);
    }

    this.metrics.push(parts.join(';'));
  }

  toString(): string {
    return this.metrics.join(', ');
  }
}

export function withServerTiming(
  response: Response,
  timing: ServerTiming,
): Response {
  const value = timing.toString();
  if (!value) return response;

  const headers = new Headers(response.headers);
  headers.set('Server-Timing', value);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function formatDuration(ms: number): string {
  const value = Math.max(0, ms);
  return value < 1 ? value.toFixed(2) : value.toFixed(1);
}
