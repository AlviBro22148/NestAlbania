import { forwardRef, useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Download, Columns } from 'lucide-react';
import { Skeleton } from './Skeleton';

export const Table = forwardRef(({
  columns = [],
  data = [],
  loading = false,
  sortable = true,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  pagination = null,
  onPageChange,
  onSort,
  emptyMessage = 'No data available',
  className = '',
  ...props
}, ref) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (column) => {
    if (!sortable || !column.sortable) return;

    const direction = sortConfig.key === column.key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key: column.key, direction });
    onSort?.({ key: column.key, direction });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      onSelectionChange?.(data.map(row => row.id));
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (rowId, checked) => {
    if (checked) {
      onSelectionChange?.([...selectedRows, rowId]);
    } else {
      onSelectionChange?.(selectedRows.filter(id => id !== rowId));
    }
  };

  const isAllSelected = data.length > 0 && selectedRows.length === data.length;
  const isPartialSelected = selectedRows.length > 0 && selectedRows.length < data.length;

  const getSortIcon = (column) => {
    if (!sortable || !column.sortable) return null;

    if (sortConfig.key !== column.key) {
      return <ChevronsUpDown className="w-4 h-4 text-[var(--text-muted)]" />;
    }

    return sortConfig.direction === 'asc'
      ? <ChevronUp className="w-4 h-4 text-primary-600" />
      : <ChevronDown className="w-4 h-4 text-primary-600" />;
  };

  return (
    <div
      ref={ref}
      className={`
        bg-[var(--bg-card)] rounded-xl border border-[var(--border-primary)]
        overflow-hidden
        ${className}
      `}
      {...props}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--bg-tertiary)] border-b border-[var(--border-primary)]">
              {selectable && (
                <th className="px-4 py-3 w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={input => {
                      if (input) input.indeterminate = isPartialSelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--border-secondary)] text-primary-600 focus:ring-primary-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column)}
                  className={`
                    px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider
                    text-[var(--text-secondary)]
                    ${sortable && column.sortable ? 'cursor-pointer hover:text-[var(--text-primary)]' : ''}
                  `}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center gap-1.5">
                    {column.header}
                    {getSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--border-primary)]">
                  {selectable && (
                    <td className="px-4 py-3">
                      <Skeleton className="w-4 h-4" />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3">
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-[var(--text-muted)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className={`
                    border-b border-[var(--border-primary)] last:border-b-0
                    transition-colors hover:bg-[var(--bg-hover)]
                    ${selectedRows.includes(row.id) ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}
                  `}
                >
                  {selectable && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                        className="w-4 h-4 rounded border-[var(--border-secondary)] text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-3 text-sm text-[var(--text-primary)]"
                    >
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-primary)]">
          <div className="text-sm text-[var(--text-secondary)]">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="
                p-2 rounded-lg
                text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                hover:bg-[var(--bg-hover)]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange?.(page)}
                  className={`
                    w-8 h-8 rounded-lg text-sm font-medium
                    transition-colors
                    ${page === pagination.page
                      ? 'bg-primary-600 text-white'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                    }
                  `}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="
                p-2 rounded-lg
                text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                hover:bg-[var(--bg-hover)]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

Table.displayName = 'Table';

// Table Toolbar
export const TableToolbar = forwardRef(({
  children,
  title,
  selectedCount = 0,
  onExport,
  className = '',
  ...props
}, ref) => (
  <div
    ref={ref}
    className={`
      flex items-center justify-between gap-4 p-4
      bg-[var(--bg-card)] rounded-t-xl border border-b-0 border-[var(--border-primary)]
      ${className}
    `}
    {...props}
  >
    <div className="flex items-center gap-4">
      {title && (
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          {title}
        </h3>
      )}
      {selectedCount > 0 && (
        <span className="text-sm text-primary-600 font-medium">
          {selectedCount} selected
        </span>
      )}
    </div>
    <div className="flex items-center gap-2">
      {onExport && (
        <button
          onClick={onExport}
          className="
            inline-flex items-center gap-2 px-3 py-2
            text-sm font-medium text-[var(--text-secondary)]
            hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]
            rounded-lg transition-colors
          "
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      )}
      {children}
    </div>
  </div>
));

TableToolbar.displayName = 'TableToolbar';

export default Table;
