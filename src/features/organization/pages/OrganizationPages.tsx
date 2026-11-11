import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users2,
  FolderGit2,
  FolderKanban,
  Download,
  Plus,
  Search,
  AlertCircle,
  RefreshCw,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  CheckCircle2,
  UserCheck,
  UserPlus,
  Users,
  Save,
  Sparkles,
  Layers,
  Edit2,
} from 'lucide-react';
import { Card, Button, Badge, PageHeader, Modal } from '@/shared/ui';
import {
  organizationApi,
  type OrganizationMemberItem,
  type InternalTeamItem,
  type SystemRoleItem,
  type PermissionInventoryItem,
  type OrganizationAnalyticsData,
  type AuditLogItem,
} from '../api/organization.api';
import type { Project } from '@/features/projects/types/project';
import { CreateProjectModal } from '@/features/projects/components/CreateProjectModal';

// ─────────────────────────────────────────────────────────────────────────────
// 1. ORGANISATION PROFILE PAGE (Legal Profile & Registry Verification)
// ─────────────────────────────────────────────────────────────────────────────
import { CompanyLegalProfilePage } from '@/features/account/pages/CompanyLegalProfilePage';

export const OrganizationProfilePage: React.FC = () => {
  return <CompanyLegalProfilePage />;
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. TEAM MEMBERS / TEAM MANAGEMENT PAGE
// ─────────────────────────────────────────────────────────────────────────────
export const OrganizationMembersPage: React.FC = () => {
  const [members, setMembers] = useState<OrganizationMemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Modernization Engineer');
  const [inviteError, setInviteError] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // Role Edit Modal
  const [roleEditMember, setRoleEditMember] = useState<OrganizationMemberItem | null>(null);
  const [newSelectedRole, setNewSelectedRole] = useState('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Lock Account Modal
  const [lockTarget, setLockTarget] = useState<OrganizationMemberItem | null>(null);
  const [lockReason, setLockReason] = useState('Security policy violation / Suspicious activity');
  const [lockDuration, setLockDuration] = useState('24_HOURS');
  const [isLocking, setIsLocking] = useState(false);

  // Unlock Account Modal
  const [unlockTarget, setUnlockTarget] = useState<OrganizationMemberItem | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Remove Member Modal
  const [deletingMember, setDeletingMember] = useState<OrganizationMemberItem | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await organizationApi.getMembers();
      setMembers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim() || !inviteEmail.includes('@')) {
      setInviteError('Please provide a valid name and email address.');
      return;
    }

    try {
      setIsInviting(true);
      setInviteError('');
      await organizationApi.inviteMember({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setIsInviteOpen(false);
      setInviteName('');
      setInviteEmail('');
      await fetchMembers();
    } catch {
      setInviteError('Failed to invite member. Please check details.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleOpenRoleModal = (m: OrganizationMemberItem) => {
    setRoleEditMember(m);
    setNewSelectedRole(m.role);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleEditMember || !newSelectedRole) return;
    try {
      setIsUpdatingRole(true);
      await organizationApi.updateMember(roleEditMember.id, { role: newSelectedRole });
      setRoleEditMember(null);
      await fetchMembers();
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleConfirmLock = async () => {
    if (!lockTarget) return;
    try {
      setIsLocking(true);
      await organizationApi.lockMember(lockTarget.id, lockReason);
      setLockTarget(null);
      await fetchMembers();
    } finally {
      setIsLocking(false);
    }
  };

  const handleConfirmUnlock = async () => {
    if (!unlockTarget) return;
    try {
      setIsUnlocking(true);
      await organizationApi.unlockMember(unlockTarget.id);
      setUnlockTarget(null);
      await fetchMembers();
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleRemove = async () => {
    if (!deletingMember) return;
    try {
      await organizationApi.removeMember(deletingMember.id);
      setDeletingMember(null);
      await fetchMembers();
    } catch {
      // Handled
    }
  };

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRole = roleFilter === 'ALL' || m.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [members, searchQuery, roleFilter, statusFilter]);

  const getRoleCapabilities = (roleName: string) => {
    switch (roleName) {
      case 'Partner Lead':
        return 'Full modernization lifecycle control, pipeline execution, code exports, team management, and contract reviews.';
      case 'Enterprise Architect':
        return 'Target React/TypeScript architecture planning, complex field & method mapping overrides, and rule configuration.';
      case 'Modernization Engineer':
        return 'Execute BMS/DSPF conversions, review AST findings, inspect generated components, and test code exports.';
      case 'QA Specialist':
        return 'Quality review, AST parity verification, rule compliance testing, and validation issue tracking.';
      case 'Viewer':
      default:
        return 'Read-only access to project dashboards, conversion telemetry, and downloaded package summaries.';
    }
  };

  // KPI metrics
  const totalCount = members.length;
  const activeCount = members.filter((m) => m.status === 'Active').length;
  const invitedCount = members.filter((m) => m.status === 'Invited').length;
  const lockedCount = members.filter((m) => m.status === 'Locked').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Members"
        subtitle="Manage users, access permissions, security statuses, and role assignments within your organisation."
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="secondary" size="sm" onClick={fetchMembers} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsInviteOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              <span>Invite Member</span>
            </Button>
          </div>
        }
      />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Total Members</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0652CC] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#091E42] mt-2">{totalCount}</p>
          <span className="text-[11px] text-[#6B778C] block mt-0.5">Enrolled staff accounts</span>
        </div>

        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Active Staff</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">{activeCount}</p>
          <span className="text-[11px] text-emerald-700 font-medium block mt-0.5">Authenticated & active</span>
        </div>

        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Pending Invites</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-2">{invitedCount}</p>
          <span className="text-[11px] text-amber-700 font-medium block mt-0.5">Awaiting enrollment</span>
        </div>

        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Locked Accounts</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-600 mt-2">{lockedCount}</p>
          <span className="text-[11px] text-rose-700 font-medium block mt-0.5">Security policy hold</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B778C]" />
            <input
              type="text"
              placeholder="Search members by name or email address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl pl-10 pr-4 py-2 text-xs text-[#091E42] placeholder-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#0652CC]"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto shrink-0">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="Partner Lead">Partner Lead</option>
              <option value="Enterprise Architect">Enterprise Architect</option>
              <option value="Modernization Engineer">Modernization Engineer</option>
              <option value="QA Specialist">QA Specialist</option>
              <option value="Viewer">Viewer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Invited">Invited</option>
              <option value="Locked">Locked</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Full-Width Members Table */}
      <Card variant="default" padding="none" className="overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E5EAF0] text-[#6B778C] font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Member Details</th>
                <th className="px-4 py-3.5">Assigned Role</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Joined Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF0]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#6B778C]">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-[#0652CC]" />
                    Loading members directory...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#6B778C]">
                    No members match your criteria.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-[#E8F1FF] text-[#0652CC] font-bold flex items-center justify-center text-xs shrink-0">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-[#091E42]">{m.name}</p>
                            {m.isCurrentUser && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-semibold">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#6B778C] font-mono">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#42526E] bg-slate-100 px-2.5 py-1 rounded-md text-[11px] border border-slate-200">
                          {m.role}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenRoleModal(m)}
                          className="p-1 text-slate-400 hover:text-[#0652CC] hover:bg-blue-50 rounded transition-colors"
                          title="Change Role"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {m.status === 'Active' && <Badge variant="success">Active</Badge>}
                      {m.status === 'Invited' && <Badge variant="info">Invited</Badge>}
                      {m.status === 'Locked' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <Lock className="w-3 h-3 text-rose-600" />
                          Locked
                        </span>
                      )}
                      {m.status === 'Inactive' && <Badge variant="neutral">Inactive</Badge>}
                    </td>
                    <td className="px-4 py-3.5 text-[#6B778C]">{m.joinedDate}</td>
                    <td className="px-5 py-3.5 text-right">
                      {m.isCurrentUser ? (
                        <span className="text-[11px] text-[#6B778C] italic">Current Account</span>
                      ) : (
                        <div className="flex items-center justify-end space-x-1.5">
                          {m.status === 'Locked' ? (
                            <button
                              type="button"
                              onClick={() => setUnlockTarget(m)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Unlock Account"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setLockTarget(m)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Lock Account"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeletingMember(m)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite Team Member">
          <form onSubmit={handleInvite} className="space-y-4">
            {inviteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{inviteError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#091E42] block">Full Name</label>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="e.g. Elena Rostova"
                className="w-full px-3 py-2 text-xs border border-[#D9E2EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0652CC]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#091E42] block">Email Address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="e.g. e.rostova@fintechnexus.io"
                className="w-full px-3 py-2 text-xs border border-[#D9E2EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0652CC]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#091E42] block">Assigned Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#D9E2EC] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0652CC]"
              >
                <option value="Modernization Engineer">Modernization Engineer</option>
                <option value="Enterprise Architect">Enterprise Architect</option>
                <option value="Partner Lead">Partner Lead</option>
                <option value="QA Specialist">QA Specialist</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>

            {/* Role Capabilities Preview */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-[#0652CC] uppercase tracking-wide flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Role Capability Scope
              </span>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                {getRoleCapabilities(inviteRole)}
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-[#E5EAF0]">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsInviteOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isInviting}>
                {isInviting ? 'Sending Invite...' : 'Send Invitation'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Change Role Modal */}
      {roleEditMember && (
        <Modal isOpen={Boolean(roleEditMember)} onClose={() => setRoleEditMember(null)} title="Reassign Member Role">
          <form onSubmit={handleUpdateRole} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-xs font-bold text-[#091E42]">{roleEditMember.name}</p>
              <p className="text-[11px] text-[#6B778C]">{roleEditMember.email}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#091E42] block">Select New Role</label>
              <select
                value={newSelectedRole}
                onChange={(e) => setNewSelectedRole(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#D9E2EC] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0652CC]"
              >
                <option value="Partner Lead">Partner Lead</option>
                <option value="Enterprise Architect">Enterprise Architect</option>
                <option value="Modernization Engineer">Modernization Engineer</option>
                <option value="QA Specialist">QA Specialist</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-[#0652CC] uppercase tracking-wide flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Granted Privileges
              </span>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                {getRoleCapabilities(newSelectedRole)}
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-[#E5EAF0]">
              <Button variant="outline" size="sm" type="button" onClick={() => setRoleEditMember(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isUpdatingRole}>
                {isUpdatingRole ? 'Updating...' : 'Save Role Assignment'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Lock Account Modal */}
      {lockTarget && (
        <Modal isOpen={Boolean(lockTarget)} onClose={() => setLockTarget(null)} title="Security Account Lock">
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <p className="font-bold">Suspend Active Session & Credentials</p>
                <p className="mt-0.5">
                  Are you sure you want to temporarily lock <strong>{lockTarget.name}</strong> ({lockTarget.email})? 
                  They will be logged out immediately and blocked from accessing projects.
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#091E42] block">Lock Reason</label>
              <select
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#D9E2EC] rounded-xl bg-white"
              >
                <option value="Security policy violation / Suspicious activity">Security policy violation / Suspicious activity</option>
                <option value="Temporary access suspension">Temporary access suspension</option>
                <option value="Administrative hold during review">Administrative hold during review</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#091E42] block">Lock Duration</label>
              <select
                value={lockDuration}
                onChange={(e) => setLockDuration(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#D9E2EC] rounded-xl bg-white"
              >
                <option value="24_HOURS">24 Hours</option>
                <option value="7_DAYS">7 Days</option>
                <option value="INDEFINITE">Indefinite (Until manually restored)</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-[#E5EAF0]">
              <Button variant="outline" size="sm" onClick={() => setLockTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmLock} disabled={isLocking}>
                {isLocking ? 'Locking...' : 'Confirm Account Lock'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Unlock Account Modal */}
      {unlockTarget && (
        <Modal isOpen={Boolean(unlockTarget)} onClose={() => setUnlockTarget(null)} title="Restore Account Access">
          <div className="space-y-4">
            <p className="text-xs text-[#42526E]">
              Unlock account for <strong>{unlockTarget.name}</strong> ({unlockTarget.email})?
              Their security hold will be cleared and they will regain access based on their assigned role.
            </p>
            <div className="flex justify-end space-x-2 pt-3 border-t border-[#E5EAF0]">
              <Button variant="outline" size="sm" onClick={() => setUnlockTarget(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmUnlock} disabled={isUnlocking}>
                {isUnlocking ? 'Restoring...' : 'Restore Access'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Remove Member Confirmation Modal */}
      {deletingMember && (
        <Modal isOpen={Boolean(deletingMember)} onClose={() => setDeletingMember(null)} title="Confirm Member Removal">
          <div className="space-y-4">
            <p className="text-xs text-[#42526E]">
              Are you sure you want to remove <strong>{deletingMember.name}</strong> ({deletingMember.email}) from your organisation?
              Their project assignments and team allocations will be unlinked.
            </p>
            <div className="flex justify-end space-x-2 pt-3 border-t border-[#E5EAF0]">
              <Button variant="outline" size="sm" onClick={() => setDeletingMember(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleRemove}>
                Confirm Removal
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. INTERNAL TEAMS PAGE
// ─────────────────────────────────────────────────────────────────────────────
export const OrganizationTeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<InternalTeamItem[]>([]);
  const [members, setMembers] = useState<OrganizationMemberItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState('ALL');

  // Create Team Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamKind, setNewTeamKind] = useState('CONVERSION');
  const [newTeamLead, setNewTeamLead] = useState('Marcus Vance');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Allocate Members Modal
  const [allocatingTeam, setAllocatingTeam] = useState<InternalTeamItem | null>(null);
  const [selectedMemberNames, setSelectedMemberNames] = useState<string[]>([]);
  const [savingMembers, setSavingMembers] = useState(false);

  // Assign Project Modal
  const [assigningTeam, setAssigningTeam] = useState<InternalTeamItem | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState('');
  const [savingProject, setSavingProject] = useState(false);

  // Delete Team Modal
  const [deletingTeam, setDeletingTeam] = useState<InternalTeamItem | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tData, mData, pData] = await Promise.all([
        organizationApi.getTeams(),
        organizationApi.getMembers(),
        organizationApi.getProjects(),
      ]);
      setTeams(tData);
      setMembers(mData);
      setProjects(pData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      setCreating(true);
      await organizationApi.createTeam({
        name: newTeamName.trim(),
        kind: newTeamKind,
        lead: newTeamLead,
      });
      setIsCreateOpen(false);
      setNewTeamName('');
      setNewTeamDesc('');
      await fetchData();
    } finally {
      setCreating(false);
    }
  };

  const handleOpenAllocateModal = (team: InternalTeamItem) => {
    setAllocatingTeam(team);
    setSelectedMemberNames(team.members || [team.lead]);
  };

  const handleToggleMember = (name: string) => {
    setSelectedMemberNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleSaveAllocatedMembers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocatingTeam) return;
    try {
      setSavingMembers(true);
      await organizationApi.updateTeam(allocatingTeam.id, {
        members: selectedMemberNames,
        memberCount: selectedMemberNames.length,
      });
      setAllocatingTeam(null);
      await fetchData();
    } finally {
      setSavingMembers(false);
    }
  };

  const handleOpenAssignProjectModal = (team: InternalTeamItem) => {
    setAssigningTeam(team);
    setSelectedProjectName(projects[0]?.name || 'Acme Core Banking Modernization');
  };

  const handleSaveAssignedProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTeam || !selectedProjectName) return;
    try {
      setSavingProject(true);
      const currentProjects = assigningTeam.projectNames || ['Core Banking BMS Modernization'];
      const updatedProjects = Array.from(new Set([...currentProjects, selectedProjectName]));
      await organizationApi.updateTeam(assigningTeam.id, {
        projectNames: updatedProjects,
        activeProjectsCount: updatedProjects.length,
      });
      setAssigningTeam(null);
      await fetchData();
    } finally {
      setSavingProject(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!deletingTeam) return;
    try {
      await organizationApi.deleteTeam(deletingTeam.id);
      setDeletingTeam(null);
      await fetchData();
    } catch {
      // Handled
    }
  };

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.lead.toLowerCase().includes(searchQuery.toLowerCase());
      const matchKind = kindFilter === 'ALL' || t.kind === kindFilter;
      return matchSearch && matchKind;
    });
  }, [teams, searchQuery, kindFilter]);

  // KPI Metrics
  const totalTeamsCount = teams.length;
  const totalProjectsAssigned = teams.reduce((acc, t) => acc + (t.activeProjectsCount || 0), 0);
  const totalEngineersAllocated = teams.reduce((acc, t) => acc + (t.memberCount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Internal Teams"
        subtitle="Coordinate specialized modernization squads, team lead assignments, and project allocations."
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="secondary" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              <span>Create Team</span>
            </Button>
          </div>
        }
      />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Internal Squads</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0652CC] flex items-center justify-center">
              <Users2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#091E42] mt-2">{totalTeamsCount}</p>
          <span className="text-[11px] text-[#6B778C] block mt-0.5">Specialized engineering teams</span>
        </div>

        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Active Projects</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">{totalProjectsAssigned}</p>
          <span className="text-[11px] text-emerald-700 font-medium block mt-0.5">Assigned workspaces</span>
        </div>

        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Allocated Engineers</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-purple-600 mt-2">{totalEngineersAllocated}</p>
          <span className="text-[11px] text-purple-700 font-medium block mt-0.5">Staff across squads</span>
        </div>

        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Disciplines</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#091E42] mt-2">BMS & QA</p>
          <span className="text-[11px] text-[#6B778C] block mt-0.5">Conversion, Validation, Support</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B778C]" />
            <input
              type="text"
              placeholder="Search teams by name or squad lead..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl pl-10 pr-4 py-2 text-xs text-[#091E42] placeholder-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#0652CC]"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto shrink-0">
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
              className="bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:outline-none"
            >
              <option value="ALL">All Disciplines</option>
              <option value="CONVERSION">Conversion & Code Generation</option>
              <option value="VALIDATION">Validation & QA</option>
              <option value="SUPPORT">Architecture Support</option>
            </select>
          </div>
        </div>
      </div>

      {/* Responsive Teams Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#6B778C]">
          <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-[#0652CC]" />
          Loading team roster...
        </div>
      ) : filteredTeams.length === 0 ? (
        <Card variant="default" padding="lg" className="text-center py-12">
          <Users2 className="w-8 h-8 text-[#6B778C] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#091E42]">No Teams Found</h3>
          <p className="text-xs text-[#6B778C] mt-1">Get started by creating your first internal squad.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((t) => (
            <Card key={t.id} variant="default" padding="lg" className="flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#E8F1FF] text-[#0652CC] flex items-center justify-center font-bold">
                      <Users2 className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#091E42] leading-tight">{t.name}</h3>
                      <span className="text-[10px] font-semibold text-[#0652CC] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">
                        {t.kind}
                      </span>
                    </div>
                  </div>
                  <Badge variant="info">{t.memberCount} Members</Badge>
                </div>

                <div className="pt-2 text-xs space-y-2 border-t border-[#E5EAF0]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B778C]">Squad Lead:</span>
                    <span className="font-semibold text-[#091E42]">{t.lead}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#6B778C]">Active Projects:</span>
                    <span className="font-semibold text-[#091E42]">{t.activeProjectsCount} assigned</span>
                  </div>

                  {/* Allocated Staff preview */}
                  <div className="pt-1">
                    <span className="text-[11px] text-[#6B778C] block mb-1">Squad Members:</span>
                    <div className="flex flex-wrap gap-1">
                      {(t.members || [t.lead]).slice(0, 4).map((mName, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded-md font-medium"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#244A70]" />
                          {mName}
                        </span>
                      ))}
                      {(t.members || []).length > 4 && (
                        <span className="text-[10px] text-[#6B778C] self-center">
                          +{t.members.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons on Card */}
              <div className="pt-3 border-t border-[#E5EAF0] flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenAllocateModal(t)}
                    className="text-xs w-full justify-center"
                  >
                    <span>Members</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenAssignProjectModal(t)}
                    className="text-xs w-full justify-center"
                  >
                    <span>+ Project</span>
                  </Button>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setDeletingTeam(t)}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                  >
                    Delete Team
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      {isCreateOpen && (
        <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Internal Squad">
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#091E42] block">Squad / Team Name</label>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g. Payments Migration Team"
                className="w-full px-3 py-2 text-xs border border-[#D9E2EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0652CC]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#091E42] block">Discipline / Kind</label>
              <select
                value={newTeamKind}
                onChange={(e) => setNewTeamKind(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#D9E2EC] rounded-xl bg-white"
              >
                <option value="CONVERSION">Conversion & Code Generation</option>
                <option value="VALIDATION">Rule-Based QA & Validation</option>
                <option value="SUPPORT">Architecture Support</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#091E42] block">Squad Lead</label>
              <select
                value={newTeamLead}
                onChange={(e) => setNewTeamLead(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#D9E2EC] rounded-xl bg-white"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#091E42] block">Description & Scope</label>
              <textarea
                value={newTeamDesc}
                onChange={(e) => setNewTeamDesc(e.target.value)}
                placeholder="Scope of modernization responsibility..."
                rows={2}
                className="w-full px-3 py-2 text-xs border border-[#D9E2EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0652CC]"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-[#E5EAF0]">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create Team'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Allocate Members Modal */}
      {allocatingTeam && (
        <Modal
          isOpen={Boolean(allocatingTeam)}
          onClose={() => setAllocatingTeam(null)}
          title={`Allocate Members — ${allocatingTeam.name}`}
        >
          <form onSubmit={handleSaveAllocatedMembers} className="space-y-4">
            <p className="text-xs text-[#6B778C]">
              Select staff members from your organisation to allocate to this modernization squad.
            </p>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl p-2 space-y-1">
              {members.map((m) => {
                const isSelected = selectedMemberNames.includes(m.name);
                return (
                  <label
                    key={m.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleMember(m.name)}
                        className="rounded text-[#0652CC] focus:ring-[#0652CC] h-4 w-4"
                      />
                      <div>
                        <span className="text-xs font-bold text-[#091E42] block">{m.name}</span>
                        <span className="text-[10px] text-[#6B778C] block">{m.role}</span>
                      </div>
                    </div>
                    <Badge variant={m.status === 'Active' ? 'success' : 'neutral'}>{m.status}</Badge>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#E5EAF0]">
              <span className="text-xs text-[#6B778C]">
                {selectedMemberNames.length} members selected
              </span>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setAllocatingTeam(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={savingMembers}>
                  {savingMembers ? 'Saving...' : 'Save Allocation'}
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Project Modal */}
      {assigningTeam && (
        <Modal
          isOpen={Boolean(assigningTeam)}
          onClose={() => setAssigningTeam(null)}
          title={`Assign Project — ${assigningTeam.name}`}
        >
          <form onSubmit={handleSaveAssignedProject} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#091E42] block">Select Modernization Workspace</label>
              <select
                value={selectedProjectName}
                onChange={(e) => setSelectedProjectName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#D9E2EC] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0652CC]"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.conversionType === 'BMS_DSPF_TO_FRONTEND' ? 'BMS/DSPF' : 'COBOL'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-[#E5EAF0]">
              <Button variant="outline" size="sm" type="button" onClick={() => setAssigningTeam(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={savingProject}>
                {savingProject ? 'Assigning...' : 'Assign Project'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Team Confirmation Modal */}
      {deletingTeam && (
        <Modal isOpen={Boolean(deletingTeam)} onClose={() => setDeletingTeam(null)} title="Delete Internal Squad">
          <div className="space-y-4">
            <p className="text-xs text-[#42526E]">
              Are you sure you want to delete squad <strong>{deletingTeam.name}</strong>?
              Allocated staff and active project assignments will be unlinked.
            </p>
            <div className="flex justify-end space-x-2 pt-3 border-t border-[#E5EAF0]">
              <Button variant="outline" size="sm" onClick={() => setDeletingTeam(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleDeleteTeam}>
                Confirm Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. ORGANISATION PROJECTS PAGE
// ─────────────────────────────────────────────────────────────────────────────
export const OrganizationProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await organizationApi.getProjects();
      setProjects(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organisation Projects"
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="secondary" size="sm" onClick={fetchProjects}>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              <span>New Project</span>
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B778C]" />
            <input
              type="text"
              placeholder="Search organisation projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl pl-10 pr-4 py-2 text-xs text-[#091E42] placeholder-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#0652CC]"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Full-Width Projects Table */}
      <Card variant="default" padding="none" className="overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E5EAF0] text-[#6B778C] font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Project Name</th>
                <th className="px-4 py-3.5">Architecture Target</th>
                <th className="px-4 py-3.5">Screens</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF0]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#6B778C]">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-[#0652CC]" />
                    Loading organisation projects...
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#6B778C]">
                    No projects found.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-[#091E42] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          <FolderGit2 className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-bold text-[#091E42]">{p.name}</p>
                          <p className="text-[11px] text-[#6B778C]">{p.description || 'Legacy modernization workspace'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-[#42526E]">
                      {p.conversionType === 'BMS_DSPF_TO_FRONTEND' ? 'BMS/DSPF → React 19' : 'COBOL → Java 21'}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-[#091E42]">12</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={p.status === 'ACTIVE' ? 'success' : 'neutral'}>{p.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/projects/${p.id}/diagnostics`)}
                        className="text-xs"
                      >
                        Diagnostics
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/projects/${p.id}/screens`)}
                        className="text-xs"
                      >
                        <span>Workspace</span>
                        <ArrowUpRight className="w-3 h-3 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onProjectCreated={() => {
          setIsCreateOpen(false);
          fetchProjects();
        }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. ROLES & PERMISSIONS PAGE
// ─────────────────────────────────────────────────────────────────────────────
export const OrganizationRolesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');
  const [roles, setRoles] = useState<SystemRoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionInventoryItem[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('ENTERPRISE_ADMIN');
  const [loading, setLoading] = useState(true);
  const [permSearch, setPermSearch] = useState('');

  // Unsaved permissions state for selected role
  const [activeRolePerms, setActiveRolePerms] = useState<string[]>([]);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Modals state
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleId, setNewRoleId] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRolePerms, setNewRolePerms] = useState<string[]>([]);
  const [creatingRole, setCreatingRole] = useState(false);

  const [deletingRole, setDeletingRole] = useState<SystemRoleItem | null>(null);

  const fetchRolesData = async () => {
    try {
      setLoading(true);
      const [rData, pData] = await Promise.all([
        organizationApi.getRoles(),
        organizationApi.getPermissions(),
      ]);
      setRoles(rData);
      setPermissions(pData);

      const currentSelected = rData.find((r) => r.id === selectedRoleId) || rData[0];
      if (currentSelected) {
        setSelectedRoleId(currentSelected.id);
        setActiveRolePerms(currentSelected.permissions || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesData();
  }, []);

  const selectedRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || roles[0];
  }, [roles, selectedRoleId]);

  const handleSelectRole = (role: SystemRoleItem) => {
    setSelectedRoleId(role.id);
    setActiveRolePerms(role.permissions || []);
    setSaveSuccessMsg(null);
  };

  const handleTogglePermission = (permKey: string) => {
    if (selectedRole?.isSystem) return;
    setActiveRolePerms((prev) =>
      prev.includes(permKey) ? prev.filter((k) => k !== permKey) : [...prev, permKey]
    );
    setSaveSuccessMsg(null);
  };

  const hasUnsavedChanges = useMemo(() => {
    if (!selectedRole) return false;
    const original = [...(selectedRole.permissions || [])].sort().join(',');
    const current = [...activeRolePerms].sort().join(',');
    return original !== current;
  }, [selectedRole, activeRolePerms]);

  const handleSavePolicy = async () => {
    if (!selectedRole || selectedRole.isSystem) return;
    try {
      setIsSavingPolicy(true);
      await organizationApi.updateRolePermissions(selectedRole.id, activeRolePerms);
      setSaveSuccessMsg(`Policy permissions successfully saved for ${selectedRole.name}.`);
      await fetchRolesData();
    } finally {
      setIsSavingPolicy(false);
    }
  };

  const handleResetPolicy = () => {
    if (!selectedRole) return;
    setActiveRolePerms(selectedRole.permissions || []);
    setSaveSuccessMsg(null);
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim() || !newRoleId.trim()) return;
    try {
      setCreatingRole(true);
      await organizationApi.createRole({
        name: newRoleName.trim(),
        id: newRoleId.trim().toUpperCase(),
        description: newRoleDesc.trim() || 'Custom enterprise modernization role',
        permissions: newRolePerms,
      });
      setIsCreateRoleOpen(false);
      setNewRoleName('');
      setNewRoleId('');
      setNewRoleDesc('');
      setNewRolePerms([]);
      await fetchRolesData();
    } finally {
      setCreatingRole(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deletingRole || deletingRole.isSystem) return;
    try {
      await organizationApi.deleteRole(deletingRole.id);
      setDeletingRole(null);
      if (selectedRoleId === deletingRole.id) {
        setSelectedRoleId('ENTERPRISE_ADMIN');
      }
      await fetchRolesData();
    } catch {
      // Handled
    }
  };

  // Group permissions by functional category
  const permissionGroups = useMemo(() => {
    const groups: Record<string, PermissionInventoryItem[]> = {};
    permissions.forEach((p) => {
      const g = p.group || 'General Capabilities';
      if (!groups[g]) groups[g] = [];
      groups[g].push(p);
    });
    return groups;
  }, [permissions]);

  const filteredPerms = useMemo(() => {
    return permissions.filter((p) => {
      const term = permSearch.toLowerCase();
      return (
        p.key.toLowerCase().includes(term) ||
        p.label.toLowerCase().includes(term) ||
        p.group.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
      );
    });
  }, [permissions, permSearch]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        subtitle="Configure role-based access control (RBAC), security policies, and granular functional permissions."
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="secondary" size="sm" onClick={fetchRolesData} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsCreateRoleOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              <span>Create Custom Role</span>
            </Button>
          </div>
        }
      />

      {/* Tabs Switcher */}
      <div className="flex border-b border-[#E5EAF0] space-x-8 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`pb-3 border-b-2 cursor-pointer transition-colors ${
            activeTab === 'roles'
              ? 'border-[#0652CC] text-[#0652CC]'
              : 'border-transparent text-[#6B778C] hover:text-[#091E42]'
          }`}
        >
          Roles & Policy Matrix ({roles.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('permissions')}
          className={`pb-3 border-b-2 cursor-pointer transition-colors ${
            activeTab === 'permissions'
              ? 'border-[#0652CC] text-[#0652CC]'
              : 'border-transparent text-[#6B778C] hover:text-[#091E42]'
          }`}
        >
          Permission Catalog ({permissions.length})
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#6B778C]">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0652CC]" />
          Loading enterprise roles & security permissions...
        </div>
      ) : activeTab === 'roles' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Roles Directory */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">
                Enterprise Roles ({roles.length})
              </span>
            </div>

            <div className="space-y-2.5">
              {roles.map((r) => {
                const isSelected = selectedRoleId === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectRole(r)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#0652CC] bg-blue-50/40 shadow-xs ring-1 ring-[#0652CC]/20'
                        : 'border-[#D9E2EC] bg-white hover:border-slate-300 hover:shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-[#091E42]">{r.name}</h4>
                        <span className="text-[10px] font-mono text-[#0652CC] block mt-0.5">
                          {r.id}
                        </span>
                      </div>
                      <Badge variant={r.isSystem ? 'info' : 'ai'}>
                        {r.isSystem ? 'System Defined' : 'Custom'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-[#6B778C] line-clamp-2 mt-1.5 leading-relaxed">
                      {r.description}
                    </p>
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-[#42526E]">
                      <span>{r.assignedUsersCount} Users Assigned</span>
                      <span className="font-semibold text-[#0652CC]">
                        {r.permissions?.includes('*') ? 'Full System Root' : `${r.permissions?.length || 0} Permissions`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Role Policy & Permissions Matrix */}
          <div className="lg:col-span-8 space-y-4">
            {selectedRole && (
              <Card variant="default" padding="lg" className="space-y-5">
                {/* Role Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5EAF0]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#091E42]">{selectedRole.name}</h3>
                      <Badge variant={selectedRole.isSystem ? 'info' : 'ai'}>
                        {selectedRole.isSystem ? 'System Defined' : 'Custom Policy'}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#6B778C]">{selectedRole.description}</p>
                    <span className="text-[11px] font-mono text-[#0652CC] block">
                      Role Identifier: {selectedRole.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!selectedRole.isSystem ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetPolicy}
                          disabled={!hasUnsavedChanges}
                          className="text-xs"
                        >
                          Reset
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleSavePolicy}
                          disabled={!hasUnsavedChanges || isSavingPolicy}
                          className="text-xs flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isSavingPolicy ? 'Saving...' : 'Save Policy'}</span>
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeletingRole(selectedRole)}
                          className="text-xs px-2"
                          title="Delete Custom Role"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : (
                      <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-semibold border border-slate-200">
                        Immutable Policy
                      </span>
                    )}
                  </div>
                </div>

                {saveSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                {/* System vs Custom Notice */}
                {selectedRole.isSystem ? (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
                    <ShieldCheck className="w-4 h-4 text-[#0652CC] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Protected System Role</p>
                      <p className="text-[11px] text-blue-800 mt-0.5">
                        This role is managed directly by ALSM platform security. Core permissions are immutably granted to preserve operational consistency.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex items-start gap-2.5 text-xs text-purple-900">
                    <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Custom Policy Configuration</p>
                      <p className="text-[11px] text-purple-800 mt-0.5">
                        Select or deselect permissions below to fine-tune what capabilities members with this role can execute.
                      </p>
                    </div>
                  </div>
                )}

                {/* Categorized Permissions Matrix */}
                <div className="space-y-6">
                  {Object.entries(permissionGroups).map(([groupName, groupPerms]) => (
                    <div key={groupName} className="space-y-2">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                        <span className="text-xs font-bold text-[#091E42] uppercase tracking-wide">
                          {groupName}
                        </span>
                        <span className="text-[10px] text-[#6B778C]">
                          {groupPerms.length} capabilities
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {groupPerms.map((p) => {
                          const isRoot = selectedRole.permissions?.includes('*');
                          const isChecked = isRoot || activeRolePerms.includes(p.key);
                          const isDisabled = selectedRole.isSystem;

                          return (
                            <label
                              key={p.key}
                              className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all ${
                                isDisabled
                                  ? 'bg-slate-50 border-slate-200 cursor-default'
                                  : 'bg-white border-slate-200 hover:border-[#0652CC]/50 cursor-pointer'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={isDisabled}
                                onChange={() => handleTogglePermission(p.key)}
                                className="mt-0.5 rounded text-[#0652CC] focus:ring-[#0652CC] h-4 w-4"
                              />
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-[#091E42] block">
                                  {p.label}
                                </span>
                                <span className="text-[10px] font-mono text-[#0652CC] block">
                                  {p.key}
                                </span>
                                <p className="text-[11px] text-[#6B778C] leading-tight">
                                  {p.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* Tab 2: Permission Inventory Catalog */
        <div className="space-y-4">
          <div className="bg-white border border-[#D9E2EC] rounded-2xl p-4 shadow-2xs">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B778C]" />
              <input
                type="text"
                placeholder="Search permissions by key, module, or description..."
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                className="w-full bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl pl-10 pr-4 py-2 text-xs text-[#091E42] placeholder-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#0652CC]"
              />
            </div>
          </div>

          <Card variant="default" padding="none" className="overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E5EAF0] text-[#6B778C] font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Permission Key</th>
                  <th className="px-4 py-3.5">Module / Group</th>
                  <th className="px-4 py-3.5">Functional Capability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAF0]">
                {filteredPerms.map((p) => (
                  <tr key={p.key} className="hover:bg-[#F8FAFC]">
                    <td className="px-5 py-3 font-mono font-bold text-[#0652CC]">{p.key}</td>
                    <td className="px-4 py-3 font-medium text-[#091E42]">{p.group}</td>
                    <td className="px-4 py-3 text-[#42526E]">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Create Custom Role Modal */}
      {isCreateRoleOpen && (
        <Modal isOpen={isCreateRoleOpen} onClose={() => setIsCreateRoleOpen(false)} title="Create Custom Enterprise Role">
          <form onSubmit={handleCreateRole} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#091E42] block">Role Name</label>
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g. Migration Tech Lead"
                className="w-full px-3 py-2 text-xs border border-[#D9E2EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0652CC]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#091E42] block">Role Identifier (Key)</label>
              <input
                type="text"
                value={newRoleId}
                onChange={(e) => setNewRoleId(e.target.value)}
                placeholder="e.g. MIGRATION_TECH_LEAD"
                className="w-full px-3 py-2 text-xs border border-[#D9E2EC] rounded-xl font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#0652CC]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#091E42] block">Description</label>
              <textarea
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                placeholder="Describe the scope and responsibilities of this custom role..."
                rows={2}
                className="w-full px-3 py-2 text-xs border border-[#D9E2EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0652CC]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#091E42] block">
                Assign Initial Permissions ({newRolePerms.length} selected)
              </label>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl p-2 space-y-1">
                {permissions.map((p) => {
                  const isChecked = newRolePerms.includes(p.key);
                  return (
                    <label key={p.key} className="flex items-center space-x-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() =>
                          setNewRolePerms((prev) =>
                            prev.includes(p.key) ? prev.filter((k) => k !== p.key) : [...prev, p.key]
                          )
                        }
                        className="rounded text-[#0652CC] h-3.5 w-3.5"
                      />
                      <span className="text-xs text-[#091E42] font-medium">{p.label}</span>
                      <span className="text-[10px] font-mono text-[#6B778C]">({p.key})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-[#E5EAF0]">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateRoleOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={creatingRole}>
                {creatingRole ? 'Creating...' : 'Create Role'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Custom Role Confirmation Modal */}
      {deletingRole && (
        <Modal isOpen={Boolean(deletingRole)} onClose={() => setDeletingRole(null)} title="Delete Custom Role">
          <div className="space-y-4">
            <p className="text-xs text-[#42526E]">
              Are you sure you want to delete role <strong>{deletingRole.name}</strong> ({deletingRole.id})?
              Any users currently assigned this role will need to be reassigned.
            </p>
            <div className="flex justify-end space-x-2 pt-3 border-t border-[#E5EAF0]">
              <Button variant="outline" size="sm" onClick={() => setDeletingRole(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleDeleteRole}>
                Confirm Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. ORGANISATION ANALYTICS PAGE
// ─────────────────────────────────────────────────────────────────────────────
export const OrganizationAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<OrganizationAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await organizationApi.getAnalytics();
        setData(res);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'Metric,Value',
        `Contract Number,${data.contractNumber || 'ALSM-CTR-2026-9A52'}`,
        `Service Mode,${data.serviceMode || 'WE_CONVERT_FOR_YOU'}`,
        `Total Projects,${data.totalProjects}`,
        `Active Projects,${data.activeProjects}`,
        `Screens Converted,${data.totalScreensConverted}`,
        `Screen Quota,${data.screenQuota}`,
        `Storage Used GB,${data.storageUsedGb}`,
        `Storage Quota GB,${data.storageQuotaGb}`,
        `Average Accuracy Rate,${data.averageAccuracyRate}%`,
        `SLA Commitment,${data.slaCommitment || '99.9% AST Parity Guaranteed'}`
      ].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'organisation_analytics_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6"> 
      <PageHeader
        title="Organisation Analytics"
        actions={
          <div className="flex items-center space-x-2">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-white border border-[#D9E2EC] rounded-xl px-3 py-1.5 text-xs text-[#091E42] focus:outline-none"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="ytd">Year to Date</option>
            </select>
            <Button variant="outline" size="sm" onClick={handleExportCsv} className="space-x-1.5">
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="p-12 text-center text-xs text-[#6B778C]">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0652CC]" />
          Loading organisation analytics telemetry...
        </div>
      ) : (
        <>
          {/* Active Contract & SLA Context Header */}
          {data?.contractNumber && (
            <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white border border-blue-200/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#244A70] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-[#091E42]">
                      {data.contractPlanName || 'Enterprise Modernization Agreement'}
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      Active MSA
                    </span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                      We Convert For You
                    </span>
                  </div>
                  <p className="text-[11px] text-[#42526E] mt-0.5">
                    Contract #{data.contractNumber} • SLA: {data.slaCommitment || '99.9% Parity AST Warranty'} • Dedicated Lead Engineer Assigned
                  </p>
                </div>
              </div>
              <Link
                to="/service/contracts"
                className="text-xs font-semibold text-[#0652CC] hover:text-[#0540A3] flex items-center gap-1 shrink-0 self-start md:self-auto"
              >
                <span>View Full Contract Scope</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* 4 Responsive KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card variant="default" padding="lg">
              <span className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Converted Screens</span>
              <p className="text-2xl font-extrabold text-[#091E42] mt-1">{data?.totalScreensConverted ?? 0}</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">Quota: {data?.screenQuota === -1 ? 'Unlimited' : (data?.screenQuota ?? 50)} Max</p>
            </Card>

            <Card variant="default" padding="lg">
              <span className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Rule Validation Health</span>
              <p className="text-2xl font-extrabold text-[#091E42] mt-1">{data?.averageAccuracyRate ?? 99.9}%</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">Rule-Validated (0 AST Syntax Faults)</p>
            </Card>

            <Card variant="default" padding="lg">
              <span className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Active Workspaces</span>
              <p className="text-2xl font-extrabold text-[#091E42] mt-1">{data?.activeProjects ?? 1}</p>
              <p className="text-[11px] text-[#0652CC] font-semibold mt-1">{data?.totalProjects ?? 1} Total Projects</p>
            </Card>

            <Card variant="default" padding="lg">
              <span className="text-[11px] font-bold text-[#6B778C] uppercase tracking-wider">Storage Utilisation</span>
              <p className="text-2xl font-extrabold text-[#091E42] mt-1">{Number(data?.storageUsedGb ?? 0).toFixed(1)} GB</p>
              <p className="text-[11px] text-[#6B778C] font-semibold mt-1">Of {data?.storageQuotaGb === -1 ? 'Unlimited' : (data?.storageQuotaGb ?? 50.0)} GB Quota</p>
            </Card>
          </div>

          {/* Stage Breakdown & Activity Progression */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="default" padding="lg" className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-2">
                <div>
                  <h3 className="text-sm font-bold text-[#091E42]">
                    Pipeline Stage Progression
                  </h3>
                  <p className="text-[11px] text-[#6B778C]">
                    Managed Modernization Workflow (We Convert For You)
                  </p>
                </div>
                <span className="text-[10px] bg-blue-50 text-[#0652CC] font-bold px-2 py-0.5 rounded-md border border-blue-200">
                  SLA Parity Warranty
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                {(data?.managedPipelineStages || [
                  {
                    stageNumber: 1,
                    name: 'Stage 1: Requirements Gathering & Ingestion',
                    count: 1,
                    unit: 'Engagements',
                    progressPct: 100,
                    color: 'bg-[#244A70]',
                  },
                  {
                    stageNumber: 2,
                    name: 'Stage 2: Legacy Analysis & AST Parsing',
                    count: 0,
                    unit: 'Screens / AST Nodes',
                    progressPct: 25,
                    color: 'bg-sky-500',
                  },
                  {
                    stageNumber: 3,
                    name: 'Stage 3: Automated Conversion (BMS → React 19)',
                    count: 0,
                    unit: 'Screens',
                    progressPct: 0,
                    color: 'bg-indigo-600',
                  },
                  {
                    stageNumber: 4,
                    name: 'Stage 4: AST Parity Testing & SLA Verification',
                    count: 0,
                    unit: 'Validated Screens',
                    progressPct: 0,
                    color: 'bg-emerald-500',
                  },
                  {
                    stageNumber: 5,
                    name: 'Stage 5: Turnkey Handover & Customer Acceptance',
                    count: 0,
                    unit: 'Delivered Packages',
                    progressPct: 0,
                    color: 'bg-purple-600',
                  },
                ]).map((stage) => (
                  <div key={stage.stageNumber}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-[#091E42] font-bold flex items-center justify-center text-[10px] border border-slate-200">
                          {stage.stageNumber}
                        </span>
                        <span className="text-[#42526E] font-medium">{stage.name}</span>
                      </div>
                      <span className="font-bold text-[#091E42]">
                        {stage.count} {stage.unit}
                      </span>
                    </div>
                    <div className="w-full bg-[#E5EAF0] rounded-full h-2">
                      <div
                        className={`${stage.color || 'bg-[#244A70]'} h-2 rounded-full transition-all`}
                        style={{ width: `${Math.max(4, stage.progressPct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card variant="default" padding="lg" className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-2">
                <div>
                  <h3 className="text-sm font-bold text-[#091E42]">
                    Monthly Conversion Throughput
                  </h3>
                  <p className="text-[11px] text-[#6B778C]">
                    Screens Delivered Under SLA
                  </p>
                </div>
                <span className="text-[11px] text-[#6B778C] font-semibold">
                  {data?.totalScreensConverted ?? 0} Screens Total
                </span>
              </div>

              <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2">
                {(data?.activityTrend || []).map((t) => {
                  const maxCount = Math.max(...(data?.activityTrend.map((x) => x.count) || [1]), 10);
                  const heightPx = Math.max(8, Math.round((t.count / maxCount) * 110));
                  return (
                    <div key={t.period} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#42526E]">{t.count}</span>
                      <div
                        className="w-full bg-[#244A70] rounded-t-md hover:bg-[#1B3856] transition-all opacity-85"
                        style={{ height: `${heightPx}px` }}
                        title={`${t.count} screens delivered in ${t.period}`}
                      />
                      <span className="text-[11px] font-semibold text-[#6B778C]">{t.period}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. SECURITY AUDIT LOGS PAGE
// ─────────────────────────────────────────────────────────────────────────────
export const OrganizationAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await organizationApi.getAuditLogs({
        page,
        limit: 15,
        action: actionFilter,
      });
      setLogs(res.items);
      setTotalPages(res.totalPages || 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const matchSearch =
        l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.ipAddress.includes(searchQuery);
      return matchSearch;
    });
  }, [logs, searchQuery]);

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Action,Actor,Email,Resource,IP,Timestamp', ...logs.map((l) => `${l.action},${l.actor},${l.actorEmail},${l.resourceType},${l.ipAddress},${l.timestamp}`)].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'security_audit_logs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Audit Logs"
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="secondary" size="sm" onClick={fetchLogs}>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCsv} className="space-x-1.5">
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B778C]" />
            <input
              type="text"
              placeholder="Filter audit events by actor, action name, or IP address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl pl-10 pr-4 py-2 text-xs text-[#091E42] placeholder-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#0652CC]"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto shrink-0">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl px-3 py-2 text-xs text-[#091E42] focus:outline-none"
            >
              <option value="ALL">All Event Types</option>
              <option value="PROJECT_CREATED">Project Creation</option>
              <option value="USER_INVITED">User Onboarding</option>
              <option value="EXPORT_BUNDLE_DOWNLOAD">Export Downloads</option>
              <option value="TEAM_MEMBER_ASSIGNED">Team Assignments</option>
              <option value="ROLE_PERMISSIONS_UPDATED">Role Permissions</option>
              <option value="MFA_VERIFIED_LOGIN">MFA Logins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Full-Width Immutable Audit Log Table */}
      <Card variant="default" padding="none" className="overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E5EAF0] text-[#6B778C] font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Action / Event</th>
                <th className="px-4 py-3.5">Actor</th>
                <th className="px-4 py-3.5">Target Resource</th>
                <th className="px-4 py-3.5">IP Address</th>
                <th className="px-5 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF0]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#6B778C]">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-[#0652CC]" />
                    Loading audit stream...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#6B778C]">
                    No audit records match the current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-3.5 h-3.5 text-[#0652CC] shrink-0" />
                        <span className="font-bold text-[#091E42] font-mono text-[11px]">{l.action}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-[#091E42]">{l.actor}</p>
                      <p className="text-[11px] text-[#6B778C]">{l.actorEmail}</p>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[#42526E] text-[11px]">
                      {l.resourceType} {l.resourceId ? `(${l.resourceId})` : ''}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[#6B778C]">{l.ipAddress}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-[#6B778C] text-[11px]">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between p-4 border-t border-[#E5EAF0] text-xs">
          <span className="text-[#6B778C]">
            Page <strong className="text-[#091E42]">{page}</strong> of <strong className="text-[#091E42]">{totalPages}</strong>
          </span>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              <span>Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
