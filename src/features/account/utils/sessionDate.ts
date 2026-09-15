export const SESSION_TIME_ZONE = 'Asia/Ho_Chi_Minh';
export const SESSION_LOCALE = 'vi-VN';

const isValidDate = (value: string): boolean => !Number.isNaN(new Date(value).getTime());

const sessionDateParts = (value: string, includeSeconds: boolean): Record<string, string> | undefined => {
  if (!isValidDate(value)) return undefined;

  const parts = new Intl.DateTimeFormat(SESSION_LOCALE, {
    timeZone: SESSION_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit', timeZoneName: 'shortOffset' } : {}),
    hourCycle: 'h23',
  }).formatToParts(new Date(value));

  return Object.fromEntries(parts.filter(({ type }) => type !== 'literal').map(({ type, value: partValue }) => [type, partValue]));
};

/** Formats a session's visible activity time in Vietnam local time. */
export const formatSessionLastActive = (value: string): string => {
  const parts = sessionDateParts(value, false);
  if (!parts) return 'Unavailable';

  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
};

/** Formats the timestamp used in the last-active tooltip, including seconds and GMT offset. */
export const formatSessionTimestamp = (value: string): string | undefined => {
  const parts = sessionDateParts(value, true);
  if (!parts) return undefined;

  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}:${parts.second} (${parts.timeZoneName})`;
};
