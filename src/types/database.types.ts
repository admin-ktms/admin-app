import { AdminRoleCode, AdminAccountStatus } from './auth.types';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  identity: {
    Tables: {
      admin: {
        Row: {
          admin_id: string;
          auth_user_id: string;
          full_name: string;
          display_name: string;
          email_address: string;
          admin_status: AdminAccountStatus;
          created_at: string;
          updated_at: string;
        };
      };
      admin_role_assignments: {
        Row: {
          assignment_id: string;
          admin_id: string;
          role_code: AdminRoleCode;
          status: 'active' | 'revoked' | 'superseded';
          assigned_by_admin_id: string;
          revocation_reason: string | null;
          assigned_at: string;
          revoked_at: string | null;
        };
      };
      admin_tournament_assignments: {
        Row: {
          assignment_id: string;
          admin_id: string;
          tournament_id: string;
          status: 'active' | 'revoked';
          assigned_by_admin_id: string;
          revocation_reason: string | null;
          assigned_at: string;
          revoked_at: string | null;
        };
      };
      admin_invitation: {
        Row: {
          invitation_id: string;
          invited_email: string;
          role_code: AdminRoleCode;
          invitation_status: 'Pending' | 'Accepted' | 'Revoked' | 'Expired';
          expires_at: string;
          invited_by_admin_id: string;
          created_at: string;
        };
      };
      administrative_approvals: {
        Row: {
          approval_id: string;
          permission_code: string;
          resource_entity: string;
          resource_id: string;
          requested_by_admin_id: string;
          approved_by_admin_id: string | null;
          request_reason: string;
          approval_status: 'Pending' | 'Approved' | 'Rejected' | 'Expired' | 'Consumed';
          approval_notes: string | null;
          requested_at: string;
          approved_at: string | null;
          expires_at: string;
          consumed_at: string | null;
        };
      };
    };
  };
  kt: {
    Tables: {
      kt_tournaments: {
        Row: {
          tournament_id: string;
          tournament_type_id: string;
          tournament_edition: number;
          tournament_name: string;
          tournament_status:
            | 'Upcoming'
            | 'Registration Open'
            | 'Registration Closed'
            | 'Group Stage'
            | 'Playoff Stage'
            | 'Knockout Stage'
            | 'Completed'
            | 'Suspended'
            | 'Archived';
          registration_fee: number;
          maximum_players: number;
          minimum_age: number;
          payment_deadline_datetime: string;
          registration_open_datetime: string;
          created_datetime: string;
        };
      };
      kt_fixtures: {
        Row: {
          fixture_id: string;
          tournament_id: string;
          round_name: string;
          match_code: string;
          registration_a_id: string;
          registration_b_id: string;
          fixture_status: 'Scheduled' | 'In Progress' | 'Disputed' | 'Official' | 'Walkover' | 'Rescheduled';
          fixture_locked: boolean;
          match_start_datetime: string;
          result_submission_deadline: string;
        };
      };
      kt_match_result_disputes: {
        Row: {
          dispute_id: string;
          fixture_id: string;
          dispute_status: 'Open' | 'Admin Review' | 'Resolved' | 'Dismissed';
          resolution_decision: string | null;
          resolution_reason: string | null;
          resolved_by_admin_id: string | null;
          created_datetime: string;
        };
      };
      kt_fixture_no_show_reports: {
        Row: {
          no_show_report_id: string;
          fixture_id: string;
          reporting_registration_id: string;
          validation_status: 'Reported' | 'No-show Disputed' | 'Admin Review' | 'Validated' | 'Dismissed';
          resolution_decision: string | null;
          resolution_reason: string | null;
          resolved_by_admin_id: string | null;
          created_datetime: string;
        };
      };
    };
  };
  finance: {
    Tables: {
      transaction_history: {
        Row: {
          transaction_history_id: string;
          registration_reference_id: string | null;
          player_id: string;
          tournament_id: string;
          amount: number;
          currency: string;
          payment_provider: 'Bank Transfer' | 'Paystack';
          payment_proof_url: string | null;
          payment_status: 'Pending' | 'Success' | 'Failed' | 'Rejected';
          created_datetime: string;
        };
      };
    };
  };
  notifications: {
    Tables: {
      notification: {
        Row: {
          notification_id: string;
          recipient_type: 'Admin' | 'Player';
          recipient_id: string;
          source_entity: string | null;
          source_record_id: string | null;
          notification_type: string;
          notification_subject: string;
          notification_body: string;
          notification_priority: 'Low' | 'Normal' | 'High' | 'Critical';
          read_status: 'Unread' | 'Read';
          created_datetime: string;
        };
      };
      support_case: {
        Row: {
          support_case_id: string;
          player_id: string;
          conversation_id: string;
          subject: string;
          case_description: string;
          case_status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
          case_priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
          assigned_admin_id: string | null;
          created_at: string;
          last_activity_at: string;
        };
      };
    };
  };
}
