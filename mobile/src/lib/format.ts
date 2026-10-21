export function compact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1000000) return sign + (abs / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mi';
  if (abs >= 1000) return sign + (abs / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil';
  return String(n);
}

export function timeAgo(date: string): string {
  const d = new Date(date);
  const diff = Math.max(0, (Date.now() - d.getTime()) / 1000);
  const days = Math.floor(diff / 86400);
  if (days >= 1) return `${days}d`;
  const hours = Math.floor(diff / 3600);
  if (hours >= 1) return `${hours}h`;
  const mins = Math.floor(diff / 60);
  return `${Math.max(mins, 1)}m`;
}

export function domHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
