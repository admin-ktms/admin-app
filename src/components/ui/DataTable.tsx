import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  isCompact?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  isLoading,
  emptyMessage = 'No records found in this operational queue.',
  isCompact = true,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex min-h-[220px] w-full items-center justify-center rounded border border-ktms-border bg-ktms-panel/50">
        <div className="flex items-center gap-3 text-ktms-muted text-sm font-medium">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-ktms-cyan border-t-transparent" />
          <span>Synchronizing records from engine...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex min-h-[180px] w-full flex-col items-center justify-center rounded border border-ktms-border bg-ktms-panel/30 p-6 text-center">
        <p className="text-sm font-medium text-ktms-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded border border-ktms-border bg-ktms-panel shadow-sm">
      <table className="w-full text-left text-sm text-ktms-text border-collapse">
        <thead className="border-b border-ktms-border bg-ktms-surface/90 text-[11px] font-semibold uppercase tracking-wider text-ktms-muted">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-2.5" style={{ width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ktms-border/40 font-normal">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              onClick={() => onRowClick && onRowClick(item)}
              className={`transition hover:bg-ktms-surface/60 ${
                onRowClick ? 'cursor-pointer active:bg-ktms-surface' : ''
              }`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 whitespace-nowrap ${
                    isCompact ? 'py-2 lg:py-2 text-xs' : 'py-3 text-sm'
                  }`}
                >
                  {col.render ? col.render(item) : (item as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
