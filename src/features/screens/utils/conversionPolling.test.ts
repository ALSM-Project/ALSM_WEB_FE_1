import { describe, it, expect } from 'vitest';
import type { LegacyScreen, ScreenStatus } from '../types/screen';
import {
  TRACK_GRACE_MS,
  TRACK_MAX_MS,
  isActiveStatus,
  isTerminalStatus,
  reconcileTracked,
  sameScreens,
  shouldPoll,
  trackConversions,
  withQueuedStatus,
} from './conversionPolling';

const screen = (id: string, status: ScreenStatus): LegacyScreen => ({
  id,
  projectId: 'p1',
  name: `${id}.cbl`,
  sourceType: 'COBOL',
  status,
  framework: 'Java (Spring Boot)',
  lastUpdated: 'now',
});

describe('conversion polling helpers', () => {
  it('tells running statuses from final ones', () => {
    for (const s of ['Processing', 'Queued']) expect(isActiveStatus(s)).toBe(true);
    for (const s of ['Completed', 'Converted', 'COMPLETED', 'Failed', 'Review Required']) {
      expect(isTerminalStatus(s)).toBe(true);
      expect(isActiveStatus(s)).toBe(false);
    }
    expect(isActiveStatus('Ready')).toBe(false);
    expect(isTerminalStatus('Ready')).toBe(false);
  });

  describe('shouldPoll', () => {
    it('does not poll an idle list, however many screens are Ready', () => {
      expect(shouldPoll([screen('a', 'Ready'), screen('b', 'Completed')], {})).toBe(false);
    });

    it('polls while a screen is processing', () => {
      expect(shouldPoll([screen('a', 'Processing'), screen('b', 'Ready')], {})).toBe(true);
    });

    it('polls while a screen sent to the queue is tracked, though the backend still says Ready', () => {
      const tracked = trackConversions({}, ['a'], [screen('a', 'Ready')], 0);
      expect(shouldPoll([screen('a', 'Ready')], tracked)).toBe(true);
    });
  });

  describe('reconcileTracked', () => {
    it('keeps a queued screen that is still Ready and drops it once it is completed', () => {
      const tracked = trackConversions({}, ['a'], [screen('a', 'Ready')], 0);
      expect(reconcileTracked(tracked, [screen('a', 'Ready')], 1000)).toBe(tracked);
      expect(reconcileTracked(tracked, [screen('a', 'Completed')], 1000)).toEqual({});
    });

    it('drops a screen that failed or needs review', () => {
      const tracked = trackConversions({}, ['a', 'b'], [screen('a', 'Ready'), screen('b', 'Ready')], 0);
      expect(
        reconcileTracked(tracked, [screen('a', 'Failed'), screen('b', 'Review Required')], 1000),
      ).toEqual({});
    });

    it('remembers that a screen was seen processing', () => {
      const tracked = trackConversions({}, ['a'], [screen('a', 'Ready')], 0);
      const next = reconcileTracked(tracked, [screen('a', 'Processing')], 1000);
      expect(next.a.sawActive).toBe(true);
    });

    it('waits for the new run of a screen that was already finished', () => {
      const tracked = trackConversions({}, ['a'], [screen('a', 'Failed')], 0);
      // Still showing the old failure shortly after: the retry has not started yet.
      expect(reconcileTracked(tracked, [screen('a', 'Failed')], 5000)).toBe(tracked);
      // It started and ended: done.
      const running = reconcileTracked(tracked, [screen('a', 'Processing')], 6000);
      expect(reconcileTracked(running, [screen('a', 'Completed')], 9000)).toEqual({});
      // It never started: not waited for forever.
      expect(reconcileTracked(tracked, [screen('a', 'Failed')], TRACK_GRACE_MS + 1)).toEqual({});
    });

    it('gives up on a screen that is still unfinished after a long time', () => {
      const tracked = trackConversions({}, ['a'], [screen('a', 'Ready')], 0);
      expect(reconcileTracked(tracked, [screen('a', 'Ready')], TRACK_MAX_MS + 1)).toEqual({});
    });

    it('forgets a deleted screen', () => {
      const tracked = trackConversions({}, ['a'], [screen('a', 'Ready')], 0);
      expect(reconcileTracked(tracked, [], 1000)).toEqual({});
    });

    it('stops polling once every tracked screen is done', () => {
      const assets = [screen('a', 'Ready'), screen('b', 'Ready')];
      let tracked = trackConversions({}, ['a', 'b'], assets, 0);
      tracked = reconcileTracked(tracked, [screen('a', 'Completed'), screen('b', 'Processing')], 3000);
      expect(shouldPoll([screen('a', 'Completed'), screen('b', 'Processing')], tracked)).toBe(true);
      const done = [screen('a', 'Completed'), screen('b', 'Completed')];
      tracked = reconcileTracked(tracked, done, 6000);
      expect(shouldPoll(done, tracked)).toBe(false);
    });
  });

  describe('withQueuedStatus', () => {
    it('shows a tracked Ready screen as Queued and leaves the others alone', () => {
      const assets = [screen('a', 'Ready'), screen('b', 'Ready'), screen('c', 'Processing')];
      const tracked = trackConversions({}, ['a', 'c'], assets, 0);
      expect(withQueuedStatus(assets, tracked, 1000).map((s) => s.status)).toEqual([
        'Queued',
        'Ready',
        'Processing',
      ]);
    });

    it('shows a screen sent again as Queued until its new run starts', () => {
      const assets = [screen('a', 'Failed')];
      const tracked = trackConversions({}, ['a'], assets, 0);
      expect(withQueuedStatus(assets, tracked, 1000)[0].status).toBe('Queued');
      expect(withQueuedStatus(assets, tracked, TRACK_GRACE_MS + 1)[0].status).toBe('Failed');
    });

    it('returns the same list when nothing is tracked', () => {
      const assets = [screen('a', 'Ready')];
      expect(withQueuedStatus(assets, {}, 0)).toBe(assets);
    });
  });

  it('compares lists by id, status, name and update time', () => {
    const a = [screen('a', 'Ready')];
    expect(sameScreens(a, [screen('a', 'Ready')])).toBe(true);
    expect(sameScreens(a, [screen('a', 'Completed')])).toBe(false);
    expect(sameScreens(a, [])).toBe(false);
  });
});
