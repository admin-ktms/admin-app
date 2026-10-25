import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  UserCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Shield,
  User,
} from 'lucide-react';
import {
  useSupportCaseDetail,
  useConversationMessages,
  useSupportMutations,
} from '@/hooks/useSupport';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useCasePresence } from '@/hooks/useCasePresence';
import { PresenceCollisionBanner } from '@/components/feedback/PresenceCollisionBanner';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { DrawerModal } from '@/components/layout/DrawerModal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

export const SupportCaseView: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { user } = useAdminAuth();

  const { data: ticket, isLoading: isTicketLoading } = useSupportCaseDetail(caseId);
  const { data: messages = [], isLoading: isMessagesLoading } = useConversationMessages(
    ticket?.conversation_id
  );
  const { sendMessage, assignCase, changeStatus } = useSupportMutations();

  // Ephemeral Presence Collision Guard
  const { isConflicted, activeStaff } = useCasePresence('support', caseId || null);

  const [inputBody, setInputBody] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Assignment Modal State
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [targetAdminId, setTargetAdminId] = useState('');
  const [assignReason, setAssignReason] = useState('');
  const [assignError, setAssignError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (isTicketLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center font-mono text-xs text-ktms-muted">
        Loading support case thread...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm text-ktms-muted">Support ticket not found or inaccessible.</p>
        <Button size="sm" variant="secondary" onClick={() => navigate('/support')}>
          Return to Support Desk
        </Button>
      </div>
    );
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputBody.trim() || !user || !ticket.conversation_id) return;

    try {
      setFormError(null);
      await sendMessage.mutateAsync({
        conversation_id: ticket.conversation_id,
        sender_admin_id: user.admin_id,
        message_body: inputBody.trim(),
      });
      setInputBody('');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to send message.');
    }
  };

  const handleSelfAssign = async () => {
    if (!user) return;
    await assignCase.mutateAsync({
      case_id: ticket.support_case_id,
      target_admin_id: user.admin_id,
      reason: 'Self-assigned from Support Triage Queue',
    });
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAdminId.trim() || !assignReason.trim()) return;

    try {
      setAssignError(null);
      const res = await assignCase.mutateAsync({
        case_id: ticket.support_case_id,
        target_admin_id: targetAdminId.trim(),
        reason: assignReason.trim(),
      });

      if (!res?.success) {
        throw new Error(res?.message || res?.reason_code || 'Case routing rejected by backend');
      }

      setIsAssignOpen(false);
      setTargetAdminId('');
      setAssignReason('');
    } catch (err: unknown) {
      setAssignError(err instanceof Error ? err.message : 'Failed to reassign case.');
    }
  };

  const handleStatusChange = async (nextStatus: 'RESOLVED' | 'CLOSED') => {
    await changeStatus.mutateAsync({
      caseId: ticket.support_case_id,
      status: nextStatus,
      reason: `Case transitioned to ${nextStatus} via Operations Console`,
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] lg:h-[calc(100vh-60px)] max-w-5xl mx-auto space-y-3">
      {/* Route & Assignment Modal */}
      <DrawerModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title="Route Support Ticket"
        description="Reassign case to another administrative agent across the role routing matrix."
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          {assignError && (
            <div className="p-3 rounded bg-ktms-coral/10 border border-ktms-coral/30 text-xs text-ktms-coral flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{assignError}</span>
            </div>
          )}

          <Input
            id="target_admin_id"
            label="Target Staff Identifier (ADM-XXXXXX)"
            required
            value={targetAdminId}
            onChange={(e) => setTargetAdminId(e.target.value)}
            placeholder="ADM-000001"
          />

          <Textarea
            id="assign_reason"
            label="Mandatory Routing Reason (Audited)"
            required
            rows={3}
            value={assignReason}
            onChange={(e) => setAssignReason(e.target.value)}
            placeholder="State why this case is being transferred (e.g. Needs accountant review for refund)..."
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAssignOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={assignCase.isPending}>
              Confirm Reassignment
            </Button>
          </div>
        </form>
      </DrawerModal>

      {/* Top Header */}
      <div className="shrink-0 space-y-2 border-b border-ktms-border pb-3">
        <button
          onClick={() => navigate('/support')}
          className="flex items-center gap-1.5 text-xs font-semibold text-ktms-muted hover:text-ktms-cyan transition w-fit"
        >
          <ArrowLeft size={14} /> Back to Support Desk
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-ktms-cyan">
                {ticket.support_case_id}
              </span>
              <StatusBadge
                label={ticket.case_priority}
                variant={ticket.case_priority === 'URGENT' ? 'danger' : 'warning'}
              />
              <StatusBadge
                label={ticket.case_status}
                variant={ticket.case_status === 'RESOLVED' ? 'success' : 'active'}
              />
            </div>
            <h1 className="text-base font-bold text-ktms-text">{ticket.subject}</h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!ticket.assigned_admin_id && (
              <Button
                size="sm"
                variant="primary"
                onClick={handleSelfAssign}
                isLoading={assignCase.isPending}
                icon={<UserCheck size={14} />}
              >
                Claim Ticket
              </Button>
            )}

            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsAssignOpen(true)}
              icon={<Shield size={14} />}
            >
              Route Ticket
            </Button>

            {ticket.case_status !== 'RESOLVED' && ticket.case_status !== 'CLOSED' && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleStatusChange('RESOLVED')}
                isLoading={changeStatus.isPending}
                icon={<CheckCircle size={14} />}
              >
                Resolve
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Realtime Presence Collision Banner */}
      {isConflicted && (
        <div className="shrink-0">
          <PresenceCollisionBanner activeStaff={activeStaff} resourceLabel="support ticket" />
        </div>
      )}

      {/* Case Metadata Bar */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2 rounded bg-ktms-surface/40 border border-ktms-border text-xs text-ktms-muted font-mono">
        <span>Player: {ticket.player_id}</span>
        <span>
          Assigned to:{' '}
          <strong className="text-ktms-text">
            {ticket.assigned_admin_id
              ? ticket.assigned_admin_id === user?.admin_id
                ? 'You'
                : ticket.assigned_admin_id
              : 'Unassigned'}
          </strong>
        </span>
      </div>

      {/* Chat Messages Scroll Container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 rounded-xl border border-ktms-border bg-ktms-panel space-y-3"
      >
        {/* Ticket Initial Problem Description */}
        <div className="flex flex-col p-3 rounded-lg bg-ktms-surface/70 border border-ktms-border/80 text-xs">
          <span className="font-semibold text-ktms-cyan mb-1 flex items-center gap-1.5">
            <User size={13} /> Original Player Inquiry:
          </span>
          <p className="text-ktms-text leading-relaxed whitespace-pre-wrap">
            {ticket.case_description}
          </p>
          <span className="font-mono text-[10px] text-ktms-muted mt-2 text-right">
            {new Date(ticket.created_at).toLocaleString()}
          </span>
        </div>

        {/* Chronological Conversation Thread */}
        {isMessagesLoading ? (
          <div className="p-6 text-center text-xs font-mono text-ktms-muted">
            Loading ticket messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="p-6 text-center text-xs text-ktms-muted italic">
            No follow-up messages posted in this conversation yet.
          </div>
        ) : (
          messages.map((m) => {
            const isAdmin = m.sender_type === 'ADMIN';

            return (
              <div
                key={m.message_id}
                className={`flex flex-col max-w-[80%] rounded-lg p-3 text-xs leading-relaxed ${
                  isAdmin
                    ? 'ml-auto bg-ktms-cyan/10 border border-ktms-cyan/30 text-ktms-text'
                    : 'mr-auto bg-ktms-surface border border-ktms-border text-ktms-text'
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-ktms-muted mb-1">
                  <span className="font-bold">
                    {isAdmin
                      ? m.sender_admin_id === user?.admin_id
                        ? 'You (Staff)'
                        : `Admin (${m.sender_admin_id})`
                      : `Player (${m.sender_player_id || ticket.player_id})`}
                  </span>
                  <span>
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{m.message_body}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Message Composer */}
      <form onSubmit={handleSendMessage} className="shrink-0 flex items-center gap-2 pt-1">
        <input
          type="text"
          value={inputBody}
          onChange={(e) => setInputBody(e.target.value)}
          placeholder={
            ticket.case_status === 'CLOSED'
              ? 'This ticket is closed.'
              : 'Type administrative response...'
          }
          disabled={ticket.case_status === 'CLOSED'}
          className="min-h-[44px] flex-1 rounded border border-ktms-border bg-ktms-panel px-3 py-2 text-sm text-ktms-text placeholder:text-ktms-muted/50 focus:border-ktms-cyan focus:outline-none"
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={!inputBody.trim() || ticket.case_status === 'CLOSED' || sendMessage.isPending}
          isLoading={sendMessage.isPending}
          icon={<Send size={15} />}
        >
          Send
        </Button>
      </form>
    </div>
  );
};
