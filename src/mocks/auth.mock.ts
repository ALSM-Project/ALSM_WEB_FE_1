import type { User } from '@/features/auth/types/auth';

export const mockUser: User = {
  id: 'user-001',
  fullName: 'Alex Vance',
  email: 'alex.vance@acmecorp.com',
  company: 'Acme Corp',
  role: 'USER',
  createdAt: '2023-01-15T08:00:00Z',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
};
