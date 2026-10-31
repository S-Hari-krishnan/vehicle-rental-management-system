const DAY_MS = 1000 * 60 * 60 * 24;

const parseDateOnly = (value) => {
  if (value instanceof Date) return new Date(value.getTime());
  if (typeof value !== "string") return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  const date = match ? new Date(`${value.trim()}T00:00:00.000Z`) : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfTodayUTC = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

const diffDays = (start, end) => Math.round((end.getTime() - start.getTime()) / DAY_MS);

const rangesOverlap = (aStart, aEnd, bStart, bEnd) => aStart <= bEnd && aEnd >= bStart;

const formatDateOnly = (date) => new Date(date).toISOString().slice(0, 10);

module.exports = {
  DAY_MS,
  parseDateOnly,
  startOfTodayUTC,
  diffDays,
  rangesOverlap,
  formatDateOnly,
};
