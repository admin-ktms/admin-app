import React, { useState } from 'react';
import { ShieldAlert, Users, Database, FileText } from 'lucide-react';
import { ApprovalsDesk } from './ApprovalsDesk';
import { StaffDirectoryDesk } from './StaffDirectoryDesk';
import { AuditExplorerDesk } from './AuditExplorerDesk';
import { ArchiveExplorerDesk } from './ArchiveExplorerDesk';

export const GovernanceDeskShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'staff' | 'audit' | 'archive'>('approvals');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-ktms-text flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-ktms-cyan" />
          Governance & Game Master Console
        </h1>
        <p className="text-xs text-ktms-muted mt-0.5">
          Dual-control approvals, staff lifecycle administration, immutable audit telemetry, and cold storage.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-ktms-border">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'approvals'
              ? 'border-ktms-cyan text-ktms-cyan'
              : 'border-transparent text-ktms-muted hover:text-white'
          }`}
        >
          <ShieldAlert size={14} /> Maker-Checker Approvals
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'staff'
              ? 'border-ktms-cyan text-ktms-cyan'
              : 'border-transparent text-ktms-muted hover:text-white'
          }`}
        >
          <Users size={14} /> Staff Roster & Invites
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'audit'
              ? 'border-ktms-cyan text-ktms-cyan'
              : 'border-transparent text-ktms-muted hover:text-white'
          }`}
        >
          <FileText size={14} /> Audit Log Telemetry
        </button>

        <button
          onClick={() => setActiveTab('archive')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'archive'
              ? 'border-ktms-cyan text-ktms-cyan'
              : 'border-transparent text-ktms-muted hover:text-white'
          }`}
        >
          <Database size={14} /> Cold Storage Explorer
        </button>
      </div>

      {/* Selected Workspace Panel */}
      {activeTab === 'approvals' && <ApprovalsDesk />}
      {activeTab === 'staff' && <StaffDirectoryDesk />}
      {activeTab === 'audit' && <AuditExplorerDesk />}
      {activeTab === 'archive' && <ArchiveExplorerDesk />}
    </div>
  );
};
