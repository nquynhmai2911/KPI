import React, { useState, useMemo } from 'react';
import {
  MoreVertical,
  BellRing,
  ExternalLink,
  RefreshCw,
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  CalendarClock,
} from 'lucide-react';
import { DataTable } from '../common/DataTable';
import { UserAvatarCell } from '../common/UserAvatarCell';
import { DateText } from '../common/DateText';
import { ProgressBar } from '../common/ProgressBar';
import { StatusBadge } from '../common/StatusBadge';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';
import { calculateDaysLeft } from '../../types/kpiTaskSchema';

export const UpcomingKPITable = () => {
  const { kpiTasks = [], showToast, setActiveModule, changeTaskDueDate } = useApp();
  const [filter, setFilter] = useState('ALL'); // ALL, DUE_SOON, OVERDUE, IN_PROGRESS, COMPLETED
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);

  // Quick edit deadline state
  const [quickDateModal, setQuickDateModal] = useState({
    isOpen: false,
    task: null,
    newDate: '',
    reason: '',
  });

  // Calculate live daysLeft for each task
  const processedTasks = useMemo(() => {
    return kpiTasks.map((t) => {
      const days = typeof t.daysLeft === 'number' ? t.daysLeft : calculateDaysLeft(t.dueDate);
      const isCompleted = t.progress >= 100 || t.status === 'COMPLETED';
      return {
        ...t,
        daysLeft: days,
        isOverdue: !isCompleted && days < 0,
        isDueSoon: !isCompleted && days >= 0 && days <= 7,
      };
    });
  }, [kpiTasks]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: processedTasks.length,
      dueSoon: processedTasks.filter((t) => t.isDueSoon).length,
      overdue: processedTasks.filter((t) => t.isOverdue).length,
      inProgress: processedTasks.filter((t) => t.status === 'IN_PROGRESS' && !t.isOverdue).length,
      completed: processedTasks.filter((t) => t.status === 'COMPLETED' || t.progress >= 100).length,
    };
  }, [processedTasks]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return processedTasks.filter((task) => {
      if (filter === 'ALL') return true;
      if (filter === 'DUE_SOON') return task.isDueSoon;
      if (filter === 'OVERDUE') return task.isOverdue;
      if (filter === 'IN_PROGRESS') return task.status === 'IN_PROGRESS';
      if (filter === 'COMPLETED') return task.status === 'COMPLETED' || task.progress >= 100;
      return true;
    });
  }, [processedTasks, filter]);

  const handleUrge = (task) => {
    const assigneeName = task.assignee?.name || task.assignee || 'Cán bộ';
    showToast(`Đã gửi thông báo nhắc việc & đôn đốc hạn chót tới: ${assigneeName}`, 'warning');
    setActiveMenuId(null);
  };

  const handleSimulateReload = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showToast('Đã làm mới danh sách chỉ tiêu KPI!', 'info');
    }, 350);
  };

  const handleOpenQuickDate = (task) => {
    setQuickDateModal({
      isOpen: true,
      task,
      newDate: task.dueDate || '',
      reason: '',
    });
    setActiveMenuId(null);
  };

  const handleSaveQuickDate = (e) => {
    e.preventDefault();
    if (!quickDateModal.newDate) {
      showToast('Vui lòng chọn ngày hạn chót mới', 'error');
      return;
    }
    if (!quickDateModal.reason || quickDateModal.reason.trim().length < 5) {
      showToast('Vui lòng nhập lý do điều chỉnh hạn chót (tối thiểu 5 ký tự)', 'error');
      return;
    }

    changeTaskDueDate(quickDateModal.task.id, quickDateModal.newDate, quickDateModal.reason.trim());
    setQuickDateModal({ isOpen: false, task: null, newDate: '', reason: '' });
  };

  const columns = [
    {
      id: 'taskName',
      header: 'Công việc / Chỉ tiêu',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => {
        const taskName = row.name || row.taskName || 'Chỉ tiêu công việc';
        const taskCode = row.code || row.id;
        const weightVal = row.weight ?? 0;
        const categoryName = row.category;

        return (
          <div className="space-y-1.5 max-w-md">
            <div className="font-semibold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
              {taskName}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900 tabular-nums">
                {weightVal}%
              </span>
              <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                {taskCode}
              </span>
              {categoryName && (
                <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                  • {categoryName}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: 'assignee',
      header: 'Người thực hiện',
      accessorKey: 'assignee',
      sortable: true,
      cell: (row) => {
        const assigneeObj = typeof row.assignee === 'object' && row.assignee !== null ? row.assignee : {};
        const name = assigneeObj.name || (typeof row.assignee === 'string' ? row.assignee : 'Cán bộ');
        const avatarUrl = assigneeObj.avatarUrl || row.avatar;
        const position = assigneeObj.position || row.role || 'Chuyên viên';
        const unit = assigneeObj.unit || row.department || 'Đơn vị công tác';

        return (
          <UserAvatarCell
            name={name}
            avatarUrl={avatarUrl}
            subtext={`${position} • ${unit}`}
            size="md"
          />
        );
      },
    },
    {
      id: 'dueDate',
      header: 'Hạn chót',
      accessorKey: 'dueDate',
      sortable: true,
      cell: (row) => {
        const dueDate = row.dueDate || row.deadline;
        const days = row.daysLeft ?? calculateDaysLeft(dueDate);
        const isCompleted = row.status === 'COMPLETED' || row.progress >= 100;

        return (
          <div className="space-y-1">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 tabular-nums flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <DateText date={dueDate} />
            </div>
            <div>
              {isCompleted ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 tabular-nums">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Đã hoàn thành
                </span>
              ) : days < 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900 tabular-nums animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  Trễ {Math.abs(days)} ngày
                </span>
              ) : days === 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/70 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800 tabular-nums">
                  <Clock className="w-3 h-3 text-amber-600" />
                  Hôm nay
                </span>
              ) : days <= 7 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900 tabular-nums">
                  <Clock className="w-3 h-3 text-amber-500" />
                  Còn {days} ngày
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900 tabular-nums">
                  Còn {days} ngày
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: 'progress',
      header: 'Tiến độ',
      accessorKey: 'progress',
      sortable: true,
      cell: (row) => {
        const progressVal = Number(row.progress) || 0;
        return (
          <div className="w-36 space-y-1">
            <ProgressBar
              progress={progressVal}
              size="md"
              showLabel={true}
            />
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Trạng thái',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        const isCompleted = row.status === 'COMPLETED' || row.progress >= 100;
        const effectiveStatus = isCompleted ? 'COMPLETED' : row.isOverdue ? 'OVERDUE' : row.status;
        return <StatusBadge status={effectiveStatus} />;
      },
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: (row) => (
        <div className="relative flex items-center justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuId(activeMenuId === row.id ? null : row.id);
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-hidden transition-colors"
            aria-label="Tùy chọn thao tác"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {activeMenuId === row.id && (
            <div className="absolute right-0 top-8 w-48 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => handleUrge(row)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-left transition-colors"
              >
                <BellRing className="w-3.5 h-3.5 shrink-0" />
                <span>Gửi đôn đốc hạn</span>
              </button>
              <button
                onClick={() => handleOpenQuickDate(row)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-left transition-colors"
              >
                <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                <span>Điều chỉnh hạn chót</span>
              </button>
              <button
                onClick={() => {
                  setActiveMenuId(null);
                  setActiveModule('my-kpi');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span>Xem chi tiết hồ sơ</span>
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Filter Toolbar with Segmented Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <SegmentedControl
          options={[
            { value: 'ALL', label: `Tất cả (${counts.all})` },
            { value: 'DUE_SOON', label: `Sắp đến hạn (${counts.dueSoon})` },
            { value: 'OVERDUE', label: `Quá hạn (${counts.overdue})` },
            { value: 'IN_PROGRESS', label: `Đang làm (${counts.inProgress})` },
            { value: 'COMPLETED', label: `Hoàn thành (${counts.completed})` },
          ]}
          value={filter}
          onChange={(val) => setFilter(val)}
          size="md"
        />

        <div className="flex items-center gap-2 self-end lg:self-auto">
          <Button variant="ghost" size="icon" onClick={handleSimulateReload} title="Làm mới" aria-label="Làm mới">
            <RefreshCw size={16} />
          </Button>
        </div>
      </div>

      {/* Main DataTable */}
      <DataTable
        columns={columns}
        data={filteredData}
        isLoading={isLoading}
        error={errorState}
        onRetry={() => {
          setErrorState(null);
          handleSimulateReload();
        }}
        pageSize={8}
        pageSizeOptions={[8, 15, 30]}
        defaultPageSize={8}
        searchable={true}
        searchPlaceholder="Tìm công việc, mã, cán bộ..."
        searchKeys={['name', 'code', 'category']}
        columnVisibilityToggle={true}
        emptyTitle="Không có chỉ tiêu nào"
        emptyDescription="Không tìm thấy chỉ tiêu KPI nào thỏa mãn điều kiện lọc hiện tại."
      />

      {/* Modal Điều chỉnh Hạn chót nhanh */}
      {quickDateModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-blue-600" />
              Điều chỉnh Hạn chót Chỉ tiêu
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
              {quickDateModal.task?.name} ({quickDateModal.task?.code})
            </p>

            <form onSubmit={handleSaveQuickDate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hạn chót hiện tại
                </label>
                <div className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300">
                  {quickDateModal.task?.dueDate}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hạn chót mới <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  value={quickDateModal.newDate}
                  onChange={(e) =>
                    setQuickDateModal((prev) => ({ ...prev, newDate: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lý do điều chỉnh gia hạn <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập lý do khách quan/chủ quan (tối thiểu 5 ký tự)..."
                  value={quickDateModal.reason}
                  onChange={(e) =>
                    setQuickDateModal((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setQuickDateModal({ isOpen: false, task: null, newDate: '', reason: '' })
                  }
                >
                  Hủy bỏ
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Lưu thay đổi hạn
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
