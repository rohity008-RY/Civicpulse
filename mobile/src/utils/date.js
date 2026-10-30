export function timeAgo(value, language = 'en') {
  const date = new Date(value);
  if (!value || !Number.isFinite(date.getTime())) return '';
  const seconds = (date.getTime() - Date.now()) / 1000;
  const units = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1]];
  const [unit, size] = units.find(([, size]) => Math.abs(seconds) >= size) || units[units.length - 1];
  if (typeof Intl.RelativeTimeFormat === 'function') return new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(Math.round(seconds / size), unit);
  return new Intl.DateTimeFormat(language).format(date);
}
