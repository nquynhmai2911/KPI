import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  FolderOpen,
} from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from './EmptyState';

export const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  stickyHeader = true,
  searchable = true,
  searchPlaceholder = 'Tìm kiếm dữ liệu...',
  searchKeys = [], // array of object property names to search across
  emptyTitle = 'Không tìm thấy dữ liệu',
  emptyDescription = 'Không có bản ghi nào phù hợp với điều kiện tìm kiếm hoặc dữ liệu đang trống.',
  emptyActionLabel,
  onEmptyAction,
  initialSort = { key: null, direction: 'asc' }, // { key: string, direction: 'asc' | 'desc' }
  pageSizeOptions = [10, 25, 50],
  defaultPageSize = 10,
  className = '',
  tableClassName = '',
  onRowClick,
}) => {
  // 1. Search Query State
  const [searchTerm, setSearchTerm] = useState('');

  // 2. Sorting State
  const [sortConfig, setSortConfig] = useState(initialSort);

  // 3. Pagination State
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [currentPage, setCurrentPage] = useState(1);

  // 4. Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const initial = {};
    columns.forEach((col) => {
      const colId = col.id || col.accessorKey;
      initial[colId] = col.hidden ? false : true;
    });
    return initial;
  });
  const [showColumnToggle, setShowColumnToggle] = useState(false);

  // Filter columns based on visibility
  const activeColumns = useMemo(() => {
    return columns.filter((col) => {
      const colId = col.id || col.accessorKey;
      return visibleColumns[colId] !== false;
    });
  }, [columns, visibleColumns]);

  // Handle Sort
  const handleSort = (colId, sortable) => {
    if (!sortable) return;
    setSortConfig((prev) => {
      if (prev.key === colId) {
        if (prev.direction === 'asc') return { key: colId, direction: 'desc' };
        return { key: null, direction: 'asc' };
      }
      return { key: colId, direction: 'asc' };
    });
  };

  // Filter Data
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase().trim();

    return data.filter((row) => {
      // If specific search keys are given, search only those
      if (searchKeys.length > 0) {
        return searchKeys.some((k) => {
          const val = row[k];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(term);
        });
      }

      // Default: search all string / number values in row
      return Object.values(row).some((val) => {
        if (typeof val === 'string' || typeof val === 'number') {
          return String(val).toLowerCase().includes(term);
        }
        return false;
      });
    });
  }, [data, searchTerm, searchKeys]);

  // Sort Data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    const { key, direction } = sortConfig;

    return [...filteredData].sort((a, b) => {
      const valA = a[key];
      const valB = b[key];

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return direction === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return direction === 'asc' ? strA.localeCompare(strB, 'vi') : strB.localeCompare(strA, 'vi');
    });
  }, [filteredData, sortConfig]);

  // Paginated Data
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Total count info
  const startItem = sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, sortedData.length);

  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      {/* Top Toolbar: Search & Options */}
      {(searchable || columns.length > 4) && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {searchable ? (
            <div className="w-full sm:max-w-xs">
              <Input
                size="sm"
                placeholder={searchPlaceholder}
                leftIcon={Search}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          ) : <div />}

          <div className="flex items-center gap-2 self-end sm:self-auto relative">
            {/* Column Picker Dropdown */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={SlidersHorizontal}
              onClick={() => setShowColumnToggle(!showColumnToggle)}
            >
              Cột ({activeColumns.length}/{columns.length})
            </Button>

            {showColumnToggle && (
              <div
                className="absolute right-0 top-10 z-30 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-3 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-100"
                onMouseLeave={() => setShowColumnToggle(false)}
              >
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-1.5 border-b border-slate-100 dark:border-slate-800">
                  Hiển thị cột
                </div>
                {columns.map((col) => {
                  const colId = col.id || col.accessorKey;
                  const isVisible = visibleColumns[colId] !== false;
                  return (
                    <label
                      key={colId}
                      className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 py-1 px-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={(e) => {
                          setVisibleColumns((prev) => ({
                            ...prev,
                            [colId]: e.target.checked,
                          }));
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="truncate">{col.header || colId}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="w-full border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="w-full overflow-x-auto max-h-[640px]">
          <table className={`w-full text-left border-collapse text-sm ${tableClassName}`}>
            <thead
              className={`bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 select-none ${
                stickyHeader ? 'sticky top-0 z-10 backdrop-blur-xs' : ''
              }`}
            >
              <tr>
                {activeColumns.map((col) => {
                  const colId = col.id || col.accessorKey;
                  const isSorted = sortConfig.key === colId;
                  const isAsc = isSorted && sortConfig.direction === 'asc';
                  const isDesc = isSorted && sortConfig.direction === 'desc';

                  return (
                    <th
                      key={colId}
                      style={{ width: col.width }}
                      onClick={() => handleSort(colId, col.sortable !== false)}
                      className={`py-3.5 px-4 font-bold tracking-tight whitespace-nowrap transition-colors ${
                        col.sortable !== false
                          ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-slate-100'
                          : ''
                      } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                    >
                      <div
                        className={`inline-flex items-center gap-1.5 ${
                          col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
                        }`}
                      >
                        <span>{col.header}</span>
                        {col.sortable !== false && (
                          <span className="text-slate-400">
                            {isAsc ? (
                              <ArrowUp size={13} className="text-blue-600 dark:text-blue-400" />
                            ) : isDesc ? (
                              <ArrowDown size={13} className="text-blue-600 dark:text-blue-400" />
                            ) : (
                              <ArrowUpDown size={13} className="opacity-40" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {isLoading ? (
                // Skeleton Loading Rows
                Array.from({ length: pageSize }).map((_, rIdx) => (
                  <tr key={rIdx} className="bg-white dark:bg-slate-900">
                    {activeColumns.map((c, cIdx) => (
                      <td key={cIdx} className="py-3.5 px-4">
                        <Skeleton className="h-4 w-full max-w-[140px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                // Empty State inside table
                <tr>
                  <td colSpan={activeColumns.length} className="p-0">
                    <EmptyState
                      icon={FolderOpen}
                      title={emptyTitle}
                      description={emptyDescription}
                      actionLabel={emptyActionLabel}
                      onAction={onEmptyAction}
                      className="border-none rounded-none bg-transparent"
                    />
                  </td>
                </tr>
              ) : (
                // Rendered Rows
                paginatedData.map((row, rIdx) => {
                  return (
                    <tr
                      key={row.id || rIdx}
                      onClick={() => onRowClick && onRowClick(row)}
                      className={`transition-colors duration-100 ${
                        onRowClick ? 'cursor-pointer hover:bg-blue-50/40 dark:hover:bg-slate-800/60' : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {activeColumns.map((col) => {
                        const colId = col.id || col.accessorKey;
                        const cellValue = row[col.accessorKey];

                        return (
                          <td
                            key={colId}
                            className={`py-3.5 px-4 align-middle whitespace-nowrap ${
                              col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                            }`}
                          >
                            {col.cell
                              ? col.cell({ ...row, row, value: cellValue, index: rIdx }, cellValue, rIdx)
                              : cellValue}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Bar */}
        {!isLoading && sortedData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400">
            {/* Counter */}
            <div className="tabular-nums">
              Hiển thị <span className="font-bold text-slate-700 dark:text-slate-200">{startItem}</span> -{' '}
              <span className="font-bold text-slate-700 dark:text-slate-200">{endItem}</span> trên tổng số{' '}
              <span className="font-bold text-slate-700 dark:text-slate-200">{sortedData.length}</span> mục
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              {/* Page size select */}
              <div className="flex items-center gap-1.5">
                <span>Số dòng:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(1)}
                  title="Trang đầu"
                  className="h-7 w-7 text-xs"
                >
                  <ChevronsLeft size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  title="Trang trước"
                  className="h-7 w-7 text-xs"
                >
                  <ChevronLeft size={14} />
                </Button>

                <span className="px-2 font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                  {currentPage} / {totalPages}
                </span>

                <Button
                  variant="ghost"
                  size="icon"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  title="Trang sau"
                  className="h-7 w-7 text-xs"
                >
                  <ChevronRight size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  title="Trang cuối"
                  className="h-7 w-7 text-xs"
                >
                  <ChevronsRight size={14} />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
