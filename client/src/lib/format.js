export function compact(n) {
  if (n >= 1000000) return (n / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mi'
  if (n >= 1000) return (n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil'
  return String(n)
}

export function timeAgo(date) {
  const d = new Date(date)
  const diff = (Date.now() - d.getTime()) / 1000
  const days = Math.floor(diff / 86400)
  if (days >= 1) return `${days}d`
  const hours = Math.floor(diff / 3600)
  if (hours >= 1) return `${hours}h`
  const mins = Math.floor(diff / 60)
  return `${Math.max(mins, 1)}m`
}