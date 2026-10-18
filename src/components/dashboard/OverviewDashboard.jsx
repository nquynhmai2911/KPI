import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Clock,
  Award,
  TrendingUp,
  Building,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Calendar,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { SectionCard } from '../common/SectionCard';
import { PageHeader } from '../common/PageHeader';
import { DepartmentKPIChart } from './DepartmentKPIChart';
import { RankDistributionChart } from './RankDistributionChart';
import { UpcomingKPITable } from './UpcomingKPITable';
import { Button } from '../ui/Button';

export const OverviewDashboard = () => {
  const {
    users,
    kpiPlans,
    activePeriod,
    systemOperatingMode,
    showToast,
  } = useApp();

  // Metrics
  const totalEmployees = 148;
  const pendingReviews = 24;
  const averageScore = 88.6;
  const completionRate = 92.4;

  const handleExportQuickReport = () => {
    showToast('Đang kết xuất báo cáo tổng hợp Q4/2026 dạng Excel...');
    setTimeout(() => {
      showToast('Đã tải xuống file BaoCao_TongHop_KPI_Q4_2026.xlsx thành công!', 'success');
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', onClick: () => {} },
          { label: 'Bảng điều khiển' },
          { label: systemOperatingMode === 'GOVERNMENT' ? 'Đánh giá Cán bộ Công chức' : 'Tổng quan Doanh nghiệp' },
        ]}
        title={
          systemOperatingMode === 'GOVERNMENT'
            ? 'Bảng điều khiển Đánh giá & Xếp loại Cán bộ'
            : 'Bảng điều khiển Hiệu suất & Quản trị KPI Doanh nghiệp'
        }
        subtitle={
          systemOperatingMode === 'GOVERNMENT'
            ? `Theo dõi tiến độ, tỷ lệ hoàn thành nhiệm vụ và phân bổ xếp loại theo Nghị định 90/2020/NĐ-CP • Kỳ: ${activePeriod?.name || 'Q4/2026'}`
            : `Hệ thống đo lường hiệu suất BSC/KPI, tiến độ thực hiện mục tiêu chiến lược • Kỳ: ${activePeriod?.name || 'Q4/2026'}`
        }
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Trực tuyến • Kỳ hoạt động: {activePeriod?.name || 'Q4/2026'}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={handleExportQuickReport}
            >
              Xuất báo cáo
            </Button>
          </div>
        }
      />

      {/* Hàng 1: 4 StatCard đều nhau (Yêu cầu Bước 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label={systemOperatingMode === 'GOVERNMENT' ? 'Tổng số cán bộ' : 'Tổng số nhân sự'}
          value={totalEmployees}
          unit="cán bộ/NV"
          trend="+8.5%"
          trendDirection="up"
          subtext="So với cùng kỳ năm trước"
          icon={Users}
          color="primary"
        />

        <StatCard
          label="Hồ sơ chờ phê duyệt"
          value={pendingReviews}
          unit="hồ sơ"
          trend="-12.0%"
          trendDirection="down"
          subtext="Hạn xử lý đợt 1: 25/10/2026"
          icon={Clock}
          color="warning"
        />

        <StatCard
          label="Điểm trung bình toàn đơn vị"
          value={averageScore}
          unit="điểm"
          trend="+3.2%"
          trendDirection="up"
          subtext={systemOperatingMode === 'GOVERNMENT' ? 'Mức chuẩn: Hoàn thành tốt' : 'Mức B - Đạt kỳ vọng'}
          icon={Award}
          color="success"
        />

        <StatCard
          label="Tỷ lệ hoàn thành mục tiêu"
          value={completionRate}
          unit="%"
          trend="+5.1%"
          trendDirection="up"
          subtext="Vượt ngưỡng tham chiếu (90%)"
          icon={TrendingUp}
          color="info"
        />
      </div>

      {/* Hàng 2: Biểu đồ cột (2/3) + Phân bố xếp loại Donut (1/3) (Yêu cầu Bước 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột 1 & 2: Biểu đồ tỷ lệ hoàn thành theo đơn vị (2/3) */}
        <div className="lg:col-span-2">
          <SectionCard
            title="Tỷ lệ hoàn thành nhiệm vụ theo Đơn vị trực thuộc"
            description="So sánh kết quả thực hiện so với đường tham chiếu chuẩn 90% (Đạt: Xanh lá, Cần đôn đốc: Cam)"
            action={
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                  Đạt chuẩn (&gt;=90%)
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" />
                  Cần đôn đốc (&lt;90%)
                </span>
              </div>
            }
          >
            <DepartmentKPIChart />
          </SectionCard>
        </div>

        {/* Cột 3: Card phân bố xếp loại (1/3) */}
        <div className="lg:col-span-1">
          <SectionCard
            title={systemOperatingMode === 'GOVERNMENT' ? 'Cơ cấu Xếp loại Cán bộ' : 'Phân bố Xếp loại Hiệu suất'}
            description={systemOperatingMode === 'GOVERNMENT' ? 'Khống chế Xuất sắc <= 20% (NĐ 90)' : 'Tỷ lệ phân bổ theo chuẩn Bell Curve'}
          >
            <RankDistributionChart />
          </SectionCard>
        </div>
      </div>

      {/* Hàng 3: Bảng KPI sắp đến hạn và quá hạn (Yêu cầu Bước 4) */}
      <SectionCard
        title="Chỉ tiêu KPI sắp đến hạn & Quá hạn cần đôn đốc"
        description="Danh sách các công việc trọng yếu có thời hạn trong kỳ cần hoàn tất nghiệm thu và báo cáo minh chứng"
      >
        <UpcomingKPITable />
      </SectionCard>
    </div>
  );
};
