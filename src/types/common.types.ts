export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export type TableDensityMode = 'compact' | 'expanded';

export interface DateFilterRange {
  startDate: string | null;
  endDate: string | null;
}
