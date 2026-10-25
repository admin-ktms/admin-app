import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Mail,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  useStaffDirectory,
  usePendingInvitations,
  useGovernanceMutations,
} from '@/hooks/useAdminOperationsFeed';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { StaffDirectoryItem, PendingAdminInvitation } from '@/api/governance';
import { AdminRoleCode } from '@/types/auth.types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { DrawerModal } from '@/components/layout/DrawerModal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { RoleGate } from '@/routes/RoleGate';

export const StaffDirectoryDesk: React.FC = () => {
  const { user, isGameMaster } = useAdminAuth();
  const { data: staff = [], isLoading: isStaffLoading } = useStaffDirectory();
  const { data: invites = [], isLoading: isInvitesLoading } = usePendingInvitations();
  const { inviteStaff, revokeInvite, assignRole, revokeRole } = useGovernanceMutations();

  // Invite Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AdminRoleCode>('moderator');
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Role Mutation Modal State
  const [selectedStaff, setSelectedStaff] = useState<StaffDirectoryItem | null>(null);
  const [targetRole, setTargetRole] = useState<AdminRoleCode>('moderator');
  const [roleReason, setRoleReason] = useState('');
  const [roleError, setRoleError] = useState<string | null>(null);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setInviteError(null);
      // Default expiration: 7 days from now
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await inviteStaff.mutateAsync({
        invited_email: inviteEmail.trim(),
        role_code: inviteRole,
        expires_at: expiresAt,
      });

      setIsInviteOpen(false);
      setInviteEmail('');
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : 'Failed to issue staff invitation.');
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || !roleReason.trim()) return;

    try {
      setRoleError(null);
      await assignRole.mutateAsync({
        target_admin_id: selectedStaff.admin_id,
        role_code: targetRole,
        reason: roleReason.trim(),
      });

      setSelectedStaff(null);
      setRoleReason('');
    } catch (err: unknown) {
      setRoleError(err instanceof Error ? err.message : 'Role assignment failed.');
    }
  };

  const staffColumns: Column<StaffDirectoryItem>[] = [
    {
      key: 'admin_id',
      header: 'Staff ID',
      render: (s) => (
        <span className="font-mono font-bold text-ktms-cyan">{s.admin_id}</span>
      ),
      width: '120px',
    },
    {
      key: 'identity',
      header: 'Staff Member',
      render: (s) => (
        <div>
          <span className="font-bold text-xs text-ktms-text block">{s.display_name}</span>
          <span className="text-[11px] text-ktms-muted">{s.email_address}</span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Assigned Role',
      render: (s) => (
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border uppercase tracking-wider bg-ktms-cyan/10 text-ktms-cyan border-ktms-cyan/30">
          <Shield size={12} /> {s.active_role?.replace('_', ' ') || 'None'}
        </div>
      ),
    },
    {
      key: 'scope',
      header: 'Tournament Scope',
      render: (s) => (
        <span className="font-mono text-xs text-ktms-muted">
          {s.assigned_tournaments.length > 0 ? s.assigned_tournaments.join(', ') : 'Global Scope'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Account Status',
      render: (s) => (
        <StatusBadge
          label={s.admin_status}
          variant={s.admin_status === 'Active' ? 'success' : 'danger'}
        />
      ),
      width: '110px',
    },
    {
      key: 'actions',
      header: 'Governance',
      render: (s) => (
        <RoleGate allowedRoles={['game_master']}>
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedStaff(s);
              setTargetRole(s.active_role || 'moderator');
              setRoleReason('');
            }}
          >
            Reassign
          </Button>
        </RoleGate>
      ),
      width: '110px',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Invite Modal */}
      <DrawerModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite Administrative Personnel"
        description="Issue an audited security invitation link and assign initial operational role."
      >
        <form onSubmit={handleSendInvite} className="space-y-4">
          {inviteError && (
            <div className="p-3 rounded bg-ktms-coral/10 border border-ktms-coral/30 text-xs text-ktms-coral flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{inviteError}</span>
            </div>
          )}

          <Input
            id="invite_email"
            type="email"
            label="Staff Corporate / Authorized Email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="staff@kickoff.ng"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-ktms-muted">
              Assigned Operational Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as AdminRoleCode)}
              className="min-h-[44px] w-full rounded border border-ktms-border bg-ktms-bg px-3 py-2 text-xs text-ktms-text focus:border-ktms-cyan focus:outline-none"
            >
              <option value="moderator">Moderator (Tournament Adjudication & Scopes)</option>
              <option value="support">Support Agent (Triage & Communications)</option>
              <option value="accountant">Accountant (Bank Transfers & Awards)</option>
              <option value="platform_manager">Platform Manager (Competitions & Curation)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={inviteStaff.isPending}
              icon={<Mail size={14} />}
            >
              Issue Invitation
            </Button>
          </div>
        </form>
      </DrawerModal>

      {/* Role Reassignment Modal */}
      <DrawerModal
        isOpen={!!selectedStaff}
        onClose={() => setSelectedStaff(null)}
        title="Reassign Administrative Role"
        description={`Target Staff: ${selectedStaff?.display_name} (${selectedStaff?.admin_id})`}
      >
        <form onSubmit={handleRoleSubmit} className="space-y-4">
          {roleError && (
            <div className="p-3 rounded bg-ktms-coral/10 border border-ktms-coral/30 text-xs text-ktms-coral flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{roleError}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-ktms-muted">
              Select New Platform Role
            </label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as AdminRoleCode)}
              className="min-h-[44px] w-full rounded border border-ktms-border bg-ktms-bg px-3 py-2 text-xs text-ktms-text focus:border-ktms-cyan focus:outline-none"
            >
              <option value="game_master">Game Master (Root Authority)</option>
              <option value="platform_manager">Platform Manager</option>
              <option value="moderator">Moderator</option>
              <option value="support">Support Agent</option>
              <option value="accountant">Accountant</option>
            </select>
          </div>

          <Textarea
            id="role_reason"
            label="Mandatory Reason for Role Change (Audited)"
            required
            rows={3}
            value={roleReason}
            onChange={(e) => setRoleReason(e.target.value)}
            placeholder="Document operational necessity for role change..."
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedStaff(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={assignRole.isPending}>
              Confirm Reassignment
            </Button>
          </div>
        </form>
      </DrawerModal>

      {/* Staff Roster Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-ktms-text">Platform Staff Personnel</h2>
          <p className="text-xs text-ktms-muted">
            Active administrative operators with registered role assignments and tournament scopes.
          </p>
        </div>

        <RoleGate allowedRoles={['game_master']}>
          <Button
            size="md"
            variant="primary"
            icon={<UserPlus size={16} />}
            onClick={() => setIsInviteOpen(true)}
          >
            Invite Staff Member
          </Button>
        </RoleGate>
      </div>

      <DataTable
        columns={staffColumns}
        data={staff}
        keyExtractor={(s) => s.admin_id}
        isLoading={isStaffLoading}
        emptyMessage="No administrative staff registered."
      />

      {/* Pending Invitations Section */}
      {invites.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-ktms-border">
          <h3 className="text-sm font-bold text-ktms-text flex items-center gap-2">
            <Clock size={15} className="text-ktms-gold" />
            Pending Administrative Invitations ({invites.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {invites.map((inv: PendingAdminInvitation) => (
              <div
                key={inv.invitation_id}
                className="flex items-center justify-between p-3 rounded-lg border border-ktms-border bg-ktms-panel"
              >
                <div>
                  <span className="font-semibold text-xs text-ktms-text block">
                    {inv.invited_email}
                  </span>
                  <span className="text-[10px] font-mono text-ktms-muted">
                    Role: {inv.role_code} • Expires:{' '}
                    {new Date(inv.expires_at).toLocaleDateString()}
                  </span>
                </div>

                <RoleGate allowedRoles={['game_master']}>
                  <button
                    onClick={() => revokeInvite.mutate(inv.invitation_id)}
                    className="p-1.5 rounded text-ktms-muted hover:text-ktms-coral hover:bg-ktms-surface transition"
                    title="Revoke Invitation"
                  >
                    <Trash2 size={15} />
                  </button>
                </RoleGate>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
