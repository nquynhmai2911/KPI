import React, { useState } from 'react';
import {
  Palette,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Users,
  Award,
  Clock,
  TrendingUp,
  Download,
  Trash2,
  Plus,
  Search,
  ExternalLink,
  Mail,
  Lock,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Skeleton } from '../ui/Skeleton';

import { PageHeader } from '../common/PageHeader';
import { StatCard } from '../common/StatCard';
import { SectionCard } from '../common/SectionCard';
import { StatusBadge } from '../common/StatusBadge';
import { ProgressBar } from '../common/ProgressBar';
import { DateText } from '../common/DateText';
import { NumberText } from '../common/NumberText';
import { FormField } from '../common/FormField';
import { UserAvatarCell } from '../common/UserAvatarCell';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { DataTable } from '../common/DataTable';
import { useApp } from '../../context/AppContext';

export const UiKitPage = () => {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState('ALL');
  const [segmentedVal, setSegmentedVal] = useState('option-1');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  // Sample data for DataTable demo
  const sampleData = [
    { id: 1, name: 'Nguyễn Văn An', dept: 'Văn phòng Lãnh đạo', score: 95.5, status: 'APPROVED', date: '2026-10-15' },
    { id: 2, name: 'Lê Hoàng Minh', dept: 'Phát triển Phần mềm', score: 91.2, status: 'SUBMITTED', date: '2026-10-14' },
    { id: 3, name: 'Phạm Đức Thắng', dept: 'Công nghệ & Số hóa', score: 88.0, status: 'IN_PROGRESS', date: '2026-10-12' },
    { id: 4, name: 'Vũ Mai Linh', dept: 'Kiểm toán & Đảm bảo CL', score: 76.4, status: 'OVERDUE', date: '2026-10-08' },
    { id: 5, name: 'Hoàng Quốc Việt', dept: 'Kế hoạch - Tài chính', score: 62.0, status: 'REJECTED', date: '2026-10-05' },
  ];

  const columns = [
    {
      id: 'name',
      header: 'Cán bộ / Nhân sự',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <UserAvatarCell
          name={row.name}
          subtitle={row.dept}
          avatar={`https://images.unsplash.com/photo-${1534528741775 + row.id}?w=120&auto=format&fit=crop&q=80`}
        />
      ),
    },
    {
      id: 'score',
      header: 'Điểm KPI',
      accessorKey: 'score',
      sortable: true,
      cell: (row) => (
        <span className="font-bold tabular-nums text-slate-800 dark:text-slate-200">
          <NumberText value={row.score} decimals={1} /> điểm
        </span>
      ),
    },
    {
      id: 'date',
      header: 'Ngày cập nhật',
      accessorKey: 'date',
      sortable: true,
      cell: (row) => <DateText date={row.date} />,
    },
    {
      id: 'status',
      header: 'Trạng thái',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-10 pb-16">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Hệ thống' },
          { label: 'Phát triển (Dev)' },
          { label: 'UI Kit & Design System' },
        ]}
        title="UI Kit & Thư viện Component Dùng chung"
        subtitle="Tổng hợp các Design Tokens, UI Primitives và Shared Components đạt chuẩn WCAG AA, Be Vietnam Pro font và tỷ lệ spacing 4px."
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300">
            <Palette className="w-3.5 h-3.5" />
            Design Tokens v2.5
          </span>
        }
      />

      {/* 1. MÀU SẮC & TOKENS */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-600" />
          1. Bảng màu & Xếp loại Cố định Toàn Hệ thống
        </h2>

        {/* Primary & Neutral */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          <div className="p-3 rounded-lg bg-blue-700 text-white shadow-xs">
            <div className="font-bold text-xs">Primary Blue</div>
            <div className="text-[11px] opacity-80 font-mono">#1d4ed8</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-800 text-white shadow-xs">
            <div className="font-bold text-xs">Slate 800</div>
            <div className="text-[11px] opacity-80 font-mono">#1e293b</div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-600 text-white shadow-xs">
            <div className="font-bold text-xs">Success</div>
            <div className="text-[11px] opacity-80 font-mono">#059669</div>
          </div>
          <div className="p-3 rounded-lg bg-amber-500 text-white shadow-xs">
            <div className="font-bold text-xs">Warning</div>
            <div className="text-[11px] opacity-80 font-mono">#d97706</div>
          </div>
          <div className="p-3 rounded-lg bg-rose-600 text-white shadow-xs">
            <div className="font-bold text-xs">Danger</div>
            <div className="text-[11px] opacity-80 font-mono">#dc2626</div>
          </div>
          <div className="p-3 rounded-lg bg-sky-500 text-white shadow-xs">
            <div className="font-bold text-xs">Info</div>
            <div className="text-[11px] opacity-80 font-mono">#0284c7</div>
          </div>
        </div>

        {/* Fixed Ranking Colors (Nghị định 90 & Doanh nghiệp) */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Màu xếp loại cố định & dùng thống nhất:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200">
              <div className="font-bold text-sm">Xuất sắc (Loại A)</div>
              <div className="text-xs mt-1">Nghị định 90 & Doanh nghiệp</div>
              <Badge variant="excellent" className="mt-2">Hoàn thành xuất sắc</Badge>
            </div>
            <div className="p-3 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200">
              <div className="font-bold text-sm">Tốt (Loại B)</div>
              <div className="text-xs mt-1">Đạt chỉ tiêu kỳ vọng</div>
              <Badge variant="good" className="mt-2">Hoàn thành tốt</Badge>
            </div>
            <div className="p-3 rounded-lg border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200">
              <div className="font-bold text-sm">Hoàn thành (Loại C)</div>
              <div className="text-xs mt-1">Đạt ngưỡng tối thiểu</div>
              <Badge variant="completed" className="mt-2">Hoàn thành nhiệm vụ</Badge>
            </div>
            <div className="p-3 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200">
              <div className="font-bold text-sm">Không hoàn thành (Loại D)</div>
              <div className="text-xs mt-1">Dưới ngưỡng cam kết</div>
              <Badge variant="failed" className="mt-2">Không hoàn thành</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BUTTONS & PRIMITIVES */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-600" />
          2. Button & Control Primitives
        </h2>

        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
          {/* Variants */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Variants</div>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="success">Success</Button>
            </div>
          </div>

          {/* Sizes & Icons */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Sizes & States</div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" icon={Plus}>Small + Icon</Button>
              <Button size="md" icon={Download}>Medium</Button>
              <Button size="lg">Large Action</Button>
              <Button
                variant="primary"
                loading={btnLoading}
                onClick={() => {
                  setBtnLoading(true);
                  setTimeout(() => setBtnLoading(false), 1500);
                }}
              >
                {btnLoading ? 'Đang xử lý...' : 'Bấm thử Loading'}
              </Button>
              <Button
                variant="danger"
                icon={Trash2}
                onClick={() => setDialogOpen(true)}
              >
                Mở ConfirmDialog
              </Button>
            </div>
          </div>

          {/* Segmented Control */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Segmented Control</div>
            <SegmentedControl
              options={[
                { value: 'option-1', label: 'Tất cả (148)' },
                { value: 'option-2', label: 'Đang thực hiện (96)' },
                { value: 'option-3', label: 'Quá hạn (12)' },
              ]}
              value={segmentedVal}
              onChange={setSegmentedVal}
              size="md"
            />
          </div>
        </div>
      </section>

      {/* 3. FORM FIELDS & INPUTS */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-600" />
          3. Form Controls & Validation
        </h2>

        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <FormField label="Họ và tên cán bộ" required hint="Theo căn cước công dân">
            <Input placeholder="Ví dụ: Nguyễn Văn An" />
          </FormField>

          <FormField label="Địa chỉ Email" required icon={Mail}>
            <Input type="email" placeholder="canbo@coquan.gov.vn" leftIcon={Mail} />
          </FormField>

          <FormField label="Phòng ban trực thuộc" error="Vui lòng chọn đơn vị hợp lệ">
            <Select
              options={[
                { value: 'dept-1', label: 'Văn phòng Ban Lãnh đạo' },
                { value: 'dept-2', label: 'Khối Công nghệ & Số hóa' },
              ]}
              error={true}
            />
          </FormField>
        </div>
      </section>

      {/* 4. STAT CARDS */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-600" />
          4. StatCards (4 Màu Ngữ Nghĩa)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Tổng số cán bộ"
            value={148}
            unit="người"
            trend="+8.5%"
            trendDirection="up"
            subtext="So với kỳ trước"
            icon={Users}
            color="primary"
          />
          <StatCard
            label="Đang chờ phê duyệt"
            value={24}
            unit="hồ sơ"
            trend="-12.0%"
            trendDirection="down"
            subtext="Hạn 25/10/2026"
            icon={Clock}
            color="warning"
          />
          <StatCard
            label="Điểm trung bình"
            value={88.6}
            unit="điểm"
            trend="+3.2%"
            trendDirection="up"
            subtext="Xếp loại: Tốt"
            icon={Award}
            color="success"
          />
          <StatCard
            label="Tỷ lệ hoàn thành"
            value={92.4}
            unit="%"
            trend="+5.1%"
            trendDirection="up"
            subtext="Vượt ngưỡng chuẩn"
            icon={TrendingUp}
            color="info"
          />
        </div>
      </section>

      {/* 5. DATA TABLE */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-600" />
          5. DataTable Component Dùng chung (Sticky header, Sắp xếp, Lọc, Phân trang)
        </h2>

        <DataTable
          columns={columns}
          data={sampleData}
          searchable={true}
          searchPlaceholder="Tìm theo tên hoặc đơn vị..."
          columnVisibilityToggle={true}
          pageSize={5}
        />
      </section>

      {/* 6. PROGRESS BAR & STATUS BADGE */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-600" />
          6. Tiến độ & Trạng thái (Ngữ nghĩa Màu sắc)
        </h2>

        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Progress Bars */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">ProgressBar Ngưỡng màu</div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Dưới 50% (Đỏ - Cảnh báo nguy cơ)</div>
              <ProgressBar progress={35} showLabel={true} />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">50% - 79% (Vàng cam - Cần đôn đốc)</div>
              <ProgressBar progress={68} showLabel={true} />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">80% - 100% (Xanh lục - Đạt chuẩn)</div>
              <ProgressBar progress={92} showLabel={true} />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Trên 100% (Tím - Vượt kế hoạch)</div>
              <ProgressBar progress={115} showLabel={true} />
            </div>
          </div>

          {/* Status Badges */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">StatusBadge Hệ thống</div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="DRAFT" />
              <StatusBadge status="SUBMITTED" />
              <StatusBadge status="APPROVED" />
              <StatusBadge status="REJECTED" />
              <StatusBadge status="IN_PROGRESS" />
              <StatusBadge status="OVERDUE" />
              <StatusBadge status="LOCKED" />
            </div>
            <div className="pt-2 text-xs text-slate-500">Định dạng số và ngày tháng:</div>
            <div className="flex items-center gap-4 text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-200">
              <div>Ngày: <DateText date="2026-10-17" /></div>
              <div>Tiền tệ: <NumberText value={1520000000} /> VNĐ</div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. EMPTY & ERROR STATES */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-600" />
          7. Empty State & Error State
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <EmptyState
              title="Chưa có dữ liệu đánh giá"
              description="Kỳ này hiện chưa phát sinh phiếu đăng ký chỉ tiêu từ các phòng ban."
              actionLabel="Tạo phiếu mới"
              onAction={() => showToast('Mở wizard tạo phiếu!')}
            />
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <ErrorState
              title="Không thể tải danh sách chỉ tiêu"
              description="Đã xảy ra sự cố kết nối tới máy chủ cơ sở dữ liệu."
              onRetry={() => showToast('Đang tải lại dữ liệu...')}
            />
          </div>
        </div>
      </section>

      {/* Confirm Dialog instance */}
      <ConfirmDialog
        isOpen={dialogOpen}
        title="Xác nhận xóa bản ghi demo"
        message="Hành động này sẽ xóa dữ liệu thử nghiệm khỏi bộ nhớ tạm. Bạn có chắc chắn muốn tiếp tục?"
        confirmLabel="Đồng ý xóa"
        confirmVariant="danger"
        onConfirm={() => {
          setDialogOpen(false);
          showToast('Đã thực hiện hành động xác nhận!');
        }}
        onCancel={() => setDialogOpen(false)}
      />
    </div>
  );
};
