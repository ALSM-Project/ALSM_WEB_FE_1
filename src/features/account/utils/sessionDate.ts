const isValidDate = (value: string): boolean => !Number.isNaN(new Date(value).getTime());

export const formatSessionLastActive = (value: string, now = Date.now()): string => {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return 'Unavailable';
  }

  const elapsedSeconds = Math.max(0, Math.floor((now - timestamp) / 1_000));

  if (elapsedSeconds < 60) return 'Just now';

  const relativeTime = (amount: number, unit: 'minute' | 'hour' | 'day') =>
    `${amount} ${unit}${amount === 1 ? '' : 's'} ago`;

  if (elapsedSeconds < 3_600) return relativeTime(Math.floor(elapsedSeconds / 60), 'minute');
  if (elapsedSeconds < 86_400) return relativeTime(Math.floor(elapsedSeconds / 3_600), 'hour');
  if (elapsedSeconds < 604_800) return relativeTime(Math.floor(elapsedSeconds / 86_400), 'day');

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
};

export const formatSessionTimestamp = (value: string): string | undefined => {
  if (!isValidDate(value)) {
    return undefined;
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};
