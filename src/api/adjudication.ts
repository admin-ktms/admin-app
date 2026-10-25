import { supabase } from '@/lib/supabase';

export interface ResultDisputeCase {
  dispute_id: string;
  fixture_id: string;
  tournament_id: string;
  match_code: string;
  round_name: string;
  dispute_status: 'Open' | 'Admin Review' | 'Resolved' | 'Dismissed';
  created_datetime: string;
  original_submission?: {
    submission_id: string;
    registration_id: string;
    submitted_score: string;
    screenshot_url: string | null;
    verified_by_admin_id: string | null;
  };
  counter_submission?: {
    submission_id: string;
    registration_id: string;
    submitted_score: string;
    screenshot_url: string | null;
    verified_by_admin_id: string | null;
  };
}

export interface NoShowCase {
  no_show_report_id: string;
  fixture_id: string;
  tournament_id: string;
  match_code: string;
  round_name: string;
  reporting_registration_id: string;
  reported_registration_id: string;
  validation_status: 'Reported' | 'No-show Disputed' | 'Admin Review' | 'Validated' | 'Dismissed' | 'Resolved';
  evidence_url: string | null;
  report_reason: string;
  created_datetime: string;
}

export interface ResolveDisputeParams {
  case_type: 'Result Dispute' | 'No-show';
  case_id: string;
  resolution_decision:
    | 'Accept Original'
    | 'Accept Counter'
    | 'Reschedule'
    | 'Award Walkover - Reporting Player'
    | 'Award Walkover - Reported Player'
    | 'Declare Double No-show';
  resolution_reason: string;
}

/**
 * Fetch all pending result disputes under Admin Review
 */
export async function getPendingResultDisputes(): Promise<ResultDisputeCase[]> {
  const { data, error } = await supabase
    .schema('kt')
    .from('kt_match_result_disputes')
    .select(`
      dispute_id,
      fixture_id,
      dispute_status,
      created_datetime,
      kt_fixtures!inner (
        tournament_id,
        match_code,
        round_name
      ),
      orig:kt_match_result_submissions!original_submission_id (
        submission_id,
        registration_id,
        home_score,
        away_score,
        screenshot_url,
        verified_by_admin_id
      ),
      counter:kt_match_result_submissions!counter_submission_id (
        submission_id,
        registration_id,
        home_score,
        away_score,
        screenshot_url,
        verified_by_admin_id
      )
    `)
    .in('dispute_status', ['Open', 'Admin Review'])
    .order('created_datetime', { ascending: false });

  if (error) throw error;

  return (data || []).map((d: any) => ({
    dispute_id: d.dispute_id,
    fixture_id: d.fixture_id,
    tournament_id: d.kt_fixtures.tournament_id,
    match_code: d.kt_fixtures.match_code,
    round_name: d.kt_fixtures.round_name,
    dispute_status: d.dispute_status,
    created_datetime: d.created_datetime,
    original_submission: d.orig
      ? {
          submission_id: d.orig.submission_id,
          registration_id: d.orig.registration_id,
          submitted_score: `${d.orig.home_score} - ${d.orig.away_score}`,
          screenshot_url: d.orig.screenshot_url,
          verified_by_admin_id: d.orig.verified_by_admin_id,
        }
      : undefined,
    counter_submission: d.counter
      ? {
          submission_id: d.counter.submission_id,
          registration_id: d.counter.registration_id,
          submitted_score: `${d.counter.home_score} - ${d.counter.away_score}`,
          screenshot_url: d.counter.screenshot_url,
          verified_by_admin_id: d.counter.verified_by_admin_id,
        }
      : undefined,
  }));
}

/**
 * Fetch all pending no-show reports under Admin Review
 */
export async function getPendingNoShows(): Promise<NoShowCase[]> {
  const { data, error } = await supabase
    .schema('kt')
    .from('kt_fixture_no_show_reports')
    .select(`
      no_show_report_id,
      fixture_id,
      reporting_registration_id,
      reported_registration_id,
      validation_status,
      evidence_url,
      report_reason,
      created_datetime,
      kt_fixtures!inner (
        tournament_id,
        match_code,
        round_name
      )
    `)
    .eq('validation_status', 'Admin Review')
    .order('created_datetime', { ascending: false });

  if (error) throw error;

  return (data || []).map((r: any) => ({
    no_show_report_id: r.no_show_report_id,
    fixture_id: r.fixture_id,
    tournament_id: r.kt_fixtures.tournament_id,
    match_code: r.kt_fixtures.match_code,
    round_name: r.kt_fixtures.round_name,
    reporting_registration_id: r.reporting_registration_id,
    reported_registration_id: r.reported_registration_id,
    validation_status: r.validation_status,
    evidence_url: r.evidence_url,
    report_reason: r.report_reason,
    created_datetime: r.created_datetime,
  }));
}

/**
 * Adjudicate a dispute or walkover case via kt.admin_resolve_kt_result RPC
 */
export async function resolveKtResultRpc(params: ResolveDisputeParams) {
  const { data, error } = await supabase.rpc('admin_resolve_kt_result', {
    p_case_type: params.case_type,
    p_case_id: params.case_id,
    p_resolution_decision: params.resolution_decision,
    p_resolution_reason: params.resolution_reason.trim(),
  });

  if (error) throw error;
  return data;
}
