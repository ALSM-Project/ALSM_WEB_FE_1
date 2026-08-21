import type { UserSession } from '@/features/auth/types/auth';

export const mockSessions: UserSession[] = [
  {
    id: 'sess-1',
    deviceName: 'MacBook Pro 16"',
    browser: 'Chrome on macOS',
    os: 'macOS Sonoma',
    ipAddress: '113.161.42.10',
    location: 'Da Nang, Vietnam',
    lastActive: 'Now (Active)',
    isCurrent: true,
  },
  {
    id: 'sess-2',
    deviceName: 'iPhone 15 Pro',
    browser: 'Safari on iOS',
    os: 'iOS 17.4',
    ipAddress: '14.241.22.88',
    location: 'Ho Chi Minh City, Vietnam',
    lastActive: '2 hours ago',
    isCurrent: false,
  },
  {
    id: 'sess-3',
    deviceName: 'Workstation PC',
    browser: 'Firefox on Windows',
    os: 'Windows 11',
    ipAddress: '118.69.18.99',
    location: 'Hanoi, Vietnam',
    lastActive: '3 days ago',
    isCurrent: false,
  },
];
