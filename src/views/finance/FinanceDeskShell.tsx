import React, { useState } from 'react';
import { Receipt, Award } from 'lucide-react';
import { BankTransferDesk } from './BankTransferDesk';
import { AwardDisbursementDesk } from './AwardDisbursementDesk';

export const FinanceDeskShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'transfers' | 'awards'>('transfers');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-ktms-text flex items-center gap-2">
          <Receipt className="h-5 w-5 text-ktms-green" />
          Finance Desk & Disbursements
        </h1>
        <p className="text-xs text-ktms-muted mt-0.5">
          Manual bank transfer reconciliation, entry provisioning, and podium award settlements.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-ktms-border">
        <button
          onClick={() => setActiveTab('transfers')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'transfers'
              ? 'border-ktms-cyan text-ktms-cyan'
              : 'border-transparent text-ktms-muted hover:text-white'
          }`}
        >
          <Receipt size={14} /> Bank Transfer Queue
        </button>
        <button
          onClick={() => setActiveTab('awards')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'awards'
              ? 'border-ktms-gold text-ktms-gold'
              : 'border-transparent text-ktms-muted hover:text-white'
          }`}
        >
          <Award size={14} /> Podium Award Disbursements
        </button>
      </div>

      {/* Desk Content */}
      {activeTab === 'transfers' ? <BankTransferDesk /> : <AwardDisbursementDesk />}
    </div>
  );
};
