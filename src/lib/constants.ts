/**
 * Operational Platform Constants
 */
export const OPERATIONAL_TIMEZONE = 'Africa/Lagos'; // Standard WAT (UTC+1)
export const DEFAULT_PAGE_SIZE = 25;
export const FRESHNESS_WINDOW_MINUTES = 5; // Re-authentication threshold for high-security actions

export const ROUTES = {
  LOGIN: '/login',
  ACCEPT_INVITE: '/accept-invite',
  ACCESS_DENIED: '/unauthorized',
  DASHBOARD: '/',
  TOURNAMENTS: '/tournaments',
  DISPUTES: '/disputes',
  FINANCE: '/finance',
  DISCIPLINARY: '/players',
  SUPPORT: '/support',
  ACHIEVEMENTS: '/achievements',
  GOVERNANCE: '/governance',
} as const;
