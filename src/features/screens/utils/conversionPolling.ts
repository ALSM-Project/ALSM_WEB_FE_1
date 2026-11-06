import type { LegacyScreen } from '../types/screen';

/** How often the list is refreshed while a conversion is running. */
export const POLL_INTERVAL_MS = 3000;
/** A screen the backend still shows as unfinished this long after it was sent is given up on. */
export const TRACK_MAX_MS = 30 * 60 * 1000;
/** A screen that was already finished when it was sent again waits this long for its new job to start. */
export const TRACK_GRACE_MS = 60 * 1000;

const ACTIVE = new Set(['processing', 'queued', 'converting']);
const TERMINAL = new Set(['completed', 'converted', 'failed', 'review required']);
const WAITING = new Set(['ready', 'pending parse']);

const normalize = (status: string) => status.trim().toLowerCase();

/** The backend is working on it (or has it in line). */
export const isActiveStatus = (status: string) => ACTIVE.has(normalize(status));

/** Nothing more will happen to it without a new conversion. */
export const isTerminalStatus = (status: string) => TERMINAL.has(normalize(status));

/**
 * A screen sent to the conversion queue by this page. The backend keeps a queued screen at
 * "Ready" until a worker picks its job up (only then it becomes "Processing"), so a screen
 * that waits in a long queue looks untouched; tracking is what keeps the page refreshing and
 * showing it as queued until it reaches a final status.
 */
export interface TrackedConversion {
  since: number;
  /** It was already finished when it was sent, so "finished" alone does not mean the new run is done. */
  wasFinished: boolean;
  /** It has been seen processing at least once. */
  sawActive: boolean;
}

export type TrackedConversions = Record<string, TrackedConversion>;

/** Adds ids to the tracked set; known screens record whether they were already finished. */
export function trackConversions(
  tracked: TrackedConversions,
  ids: string[],
  assets: LegacyScreen[],
  now: number,
): TrackedConversions {
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  const next = { ...tracked };
  for (const id of ids) {
    const asset = byId.get(id);
    next[id] = {
      since: now,
      wasFinished: asset ? isTerminalStatus(asset.status) : false,
      sawActive: asset ? isActiveStatus(asset.status) : false,
    };
  }
  return next;
}

/**
 * Drops the screens that no longer need watching: gone from the project, finished (once the
 * new run is known to have happened), or tracked for too long. Returns the same object when
 * nothing changed, so a state update with it does not re-render.
 */
export function reconcileTracked(
  tracked: TrackedConversions,
  assets: LegacyScreen[],
  now: number,
): TrackedConversions {
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  const next: TrackedConversions = {};
  let changed = false;
  for (const [id, entry] of Object.entries(tracked)) {
    const asset = byId.get(id);
    if (!asset) {
      changed = true;
      continue;
    }
    const sawActive = entry.sawActive || isActiveStatus(asset.status);
    const age = now - entry.since;
    const finished =
      isTerminalStatus(asset.status) && (!entry.wasFinished || sawActive || age > TRACK_GRACE_MS);
    if (finished || age > TRACK_MAX_MS) {
      changed = true;
      continue;
    }
    if (sawActive !== entry.sawActive) {
      changed = true;
      next[id] = { ...entry, sawActive };
    } else {
      next[id] = entry;
    }
  }
  return changed ? next : tracked;
}

/** Keep refreshing while anything is running, or a screen sent to the queue has not finished. */
export function shouldPoll(assets: LegacyScreen[], tracked: TrackedConversions): boolean {
  return assets.some((asset) => isActiveStatus(asset.status)) || Object.keys(tracked).length > 0;
}

/**
 * Shows a tracked screen the backend still reports as waiting ("Ready", or an old final status
 * from before it was sent again) as "Queued", so a batch is visible the moment it is started.
 */
export function withQueuedStatus(
  assets: LegacyScreen[],
  tracked: TrackedConversions,
  now: number,
): LegacyScreen[] {
  if (Object.keys(tracked).length === 0) return assets;
  return assets.map((asset) => {
    const entry = tracked[asset.id];
    if (!entry || isActiveStatus(asset.status)) return asset;
    const waiting =
      WAITING.has(normalize(asset.status)) ||
      (entry.wasFinished && !entry.sawActive && now - entry.since <= TRACK_GRACE_MS);
    return waiting ? { ...asset, status: 'Queued' } : asset;
  });
}

/** The same screens in the same states: a refresh that brings nothing new must not re-render the table. */
export function sameScreens(a: LegacyScreen[], b: LegacyScreen[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, index) => {
    const other = b[index];
    return (
      item.id === other.id &&
      item.status === other.status &&
      item.name === other.name &&
      item.lastUpdated === other.lastUpdated
    );
  });
}
