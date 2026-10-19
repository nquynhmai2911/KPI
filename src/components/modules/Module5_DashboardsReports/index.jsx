import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Printer,
  Download,
  AlertTriangle,
  TrendingUp,
  Award,
  CheckCircle2,
  DollarSign,
  Briefcase,
  FileText,
  Building,
  Sparkles,
  Building2,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PageHeader } from '../../common/PageHeader';
import { SectionCard } from '../../common/SectionCard';
import { StatCard } from '../../common/StatCard';
import { EXCELLENT_QUOTA_INFO, getRankStats, getRankVariant, RANK_LABELS } from '../../../utils/labels';
import { DepartmentKPIChart } from '../../dashboard/DepartmentKPIChart';
import { RankDistributionChart } from '../../dashboard/RankDistributionChart';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { SegmentedControl } from '../../ui/SegmentedControl';

import { NumberText } from '../../common/NumberText';

export const Module5_DashboardsReports = () => {
  const {
    currentUser,
    users,
    kpiPlans,
    activePeriod,
    departments,
    systemOperatingMode,
    showToast,
  } = useApp();

  // Active Tab: 'executive' (Dashboard Lãnh đạo), 'reports' (Báo cáo chuyên sâu), 'multi-period' (Xu hướng nhiều kỳ), 'bonus-salary' (Lương/Thưởng KPI & Quy hoạch), 'export-templates' (Mẫu In & Xuất file)
  const [activeTab, setActiveTab] = useState('executive');
  const [reportFilter, setReportFilter] = useState('ALL'); // ALL, PENDING, REWARD, FAILED
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printDocType, setPrintDocType] = useState('FORM_01'); // FORM_01, MEETING_MINUTES, UNIT_SUMMARY

  // Plans in active period
  const periodPlans = kpiPlans.filter((p) => p.periodId === activePeriod.id);

  const rankStats = getRankStats(periodPlans);
  const { quota } = rankStats;
  const countExcellent = rankStats.counts.EXCELLENT;
  const countFailed = rankStats.counts.FAILED;
  const rateExcellent = rankStats.evaluated ? Math.round((countExcellent / rankStats.evaluated) * 1000) / 10 : 0;
  const avgOrgScore = rankStats.avgScore;

  // Multi-period historical trend data
  const multiPeriodTrendData = [
    { period: 'Q1/2026', avgScore: 84.2, completionRate: 88.5, excellentRate: 16.5 },
    { period: 'Q2/2026', avgScore: 86.8, completionRate: 90.2, excellentRate: 18.0 },
    { period: 'Q3/2026', avgScore: 87.5, completionRate: 91.4, excellentRate: 19.2 },
    { period: 'Q4/2026', avgScore: avgOrgScore, completionRate: 92.4, excellentRate: rateExcellent },
  ];

  // Reward Proposals (Danh sách đề xuất khen thưởng)
  const rewardList = periodPlans.filter((p) => p.finalRank === 'XUẤT SẮC');
  // Failed List
  const failedList = periodPlans.filter((p) => p.finalRank === 'KHÔNG HOÀN THÀNH');

  // Export CSV Helper
  const handleExportCSV = (type = 'GENERAL') => {
    let csvContent = '\uFEFF'; // BOM
    csvContent += 'STT,Họ và tên cán bộ,Chức danh,Đơn vị công tác,Kỳ đánh giá,Số lượng KPI,Tổng trọng số,Điểm Quản lý,Điểm 360,Điểm Tổng,Xếp loại,Hệ số KPI (K),Thưởng KPI (VNĐ)\n';

    periodPlans.forEach((p, idx) => {
      const multiplier = p.finalRank === 'XUẤT SẮC' ? 1.5 : p.finalRank === 'TỐT' ? 1.2 : p.finalRank === 'HOÀN THÀNH' ? 1.0 : 0.0;
      const baseSalary = 18000000;
      const bonus = Math.round(baseSalary * multiplier);
      csvContent += `"${idx + 1}","${p.employeeName}","${p.positionTitle}","${p.departmentName}","${activePeriod.name}","${p.items?.length || 0}","${p.totalWeight}%","${p.overallManagerScore ?? ''}","${p.peerScoreAvg ?? ''}","${p.finalScore || ''}","${p.finalRank || ''}","${multiplier}x","${bonus.toLocaleString('vi-VN')}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BaoCao_TongHop_KPI_${activePeriod.code || 'Q4_2026'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Đã xuất báo cáo Excel!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Kết quả & báo cáo"
        subtitle={
          systemOperatingMode === 'GOVERNMENT'
            ? 'Công bố kết quả xếp loại, tổng hợp theo đơn vị, theo dõi nhiều kỳ và sử dụng kết quả cho thi đua khen thưởng, quy hoạch, bổ nhiệm (Nghị định 90/2020).'
            : 'Tổng hợp kết quả hiệu suất, so sánh đơn vị, theo dõi nhiều kỳ và tính thưởng theo KPI.'
        }
        actions={
          <Button variant="outline" size="sm" icon={Download} onClick={() => handleExportCSV('ALL')}>
            Xuất Excel
          </Button>
        }
      />

      <SegmentedControl
        options={[
          { value: 'executive', label: 'Tổng quan', icon: LayoutDashboard },
          { value: 'reports', label: 'Danh sách xếp loại', icon: FileSpreadsheet },
          { value: 'multi-period', label: 'Nhiều kỳ', icon: TrendingUp },
          {
            value: 'bonus-salary',
            label: systemOperatingMode === 'GOVERNMENT' ? 'Quy hoạch' : 'Thưởng KPI',
            icon: systemOperatingMode === 'GOVERNMENT' ? Briefcase : DollarSign,
          },
          { value: 'export-templates', label: 'Mẫu in', icon: Printer },
        ]}
        value={activeTab}
        onChange={(val) => setActiveTab(val)}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Điểm trung bình" value={avgOrgScore} unit="điểm" icon={Award} color="primary" />
        <StatCard
          label="Xuất sắc"
          value={countExcellent}
          unit={`/ ${quota.maxAllowed} tối đa`}
          icon={CheckCircle2}
          color={quota.withinQuota ? 'success' : 'danger'}
          subtext={EXCELLENT_QUOTA_INFO}
        />
        <StatCard label="Đề xuất khen thưởng" value={rewardList.length} unit="người" icon={Sparkles} color="info" />
        <StatCard
          label="Không hoàn thành"
          value={countFailed}
          unit="người"
          icon={AlertTriangle}
          color={countFailed > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* ==============================================================================
          TAB 1: DASHBOARD LÃNH ĐẠO (EXECUTIVE DASHBOARD)
          ============================================================================== */}
      {activeTab === 'executive' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SectionCard className="lg:col-span-2" icon={Building2} title="Theo đơn vị" description="Tiến độ trung bình các chỉ tiêu và điểm trung bình của cán bộ đã xếp loại trong từng đơn vị.">
              <DepartmentKPIChart />
            </SectionCard>
            <SectionCard icon={PieChartIcon} title="Phân bổ xếp loại" description={EXCELLENT_QUOTA_INFO}>
              <RankDistributionChart />
            </SectionCard>
          </div>
        </div>
      )}

      {/* ==============================================================================
          TAB 2: BÁO CÁO CHUYÊN SÂU & DANH SÁCH LỌC (Yêu cầu Phase 5)
          ============================================================================== */}
      {activeTab === 'reports' && (
        <SectionCard
          icon={FileSpreadsheet}
          title="Danh sách xếp loại"
        >
          <div className="space-y-4">
            {/* Filter toolbar */}
            <div className="flex flex-wrap gap-2 text-xs">
              <Button
                variant={reportFilter === 'ALL' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setReportFilter('ALL')}
              >
                Tất cả ({periodPlans.length})
              </Button>
              <Button
                variant={reportFilter === 'REWARD' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setReportFilter('REWARD')}
              >
                Đề xuất khen thưởng ({rewardList.length})
              </Button>
              <Button
                variant={reportFilter === 'FAILED' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setReportFilter('FAILED')}
              >
                Không hoàn thành nhiệm vụ ({failedList.length})
              </Button>
            </div>

            {/* Report Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs font-medium text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Cán bộ</th>
                    <th className="p-3">Đơn vị</th>
                    <th className="p-3">Số KPI</th>
                    <th className="p-3">Điểm quản lý</th>
                    <th className="p-3">Điểm 360°</th>
                    <th className="p-3">Điểm tổng</th>
                    <th className="p-3">Xếp loại</th>
                    <th className="p-3">Khen thưởng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {periodPlans
                    .filter((p) => {
                      if (reportFilter === 'REWARD') return p.finalRank === 'XUẤT SẮC';
                      if (reportFilter === 'FAILED') return p.finalRank === 'KHÔNG HOÀN THÀNH';
                      return true;
                    })
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3">
                          <strong className="text-slate-900 dark:text-slate-100">{p.employeeName}</strong>
                          <div className="text-[11px] text-slate-400">{p.positionTitle}</div>
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">{p.departmentName}</td>
                        <td className="p-3 tabular-nums">{p.items?.length || 0}</td>
                        <td className="p-3 font-semibold tabular-nums">{p.overallManagerScore || 88}</td>
                        <td className="p-3 font-semibold tabular-nums">{p.peerScoreAvg || 90}</td>
                        <td className="p-3 font-bold text-primary-600 tabular-nums">{p.finalScore || 88}</td>
                        <td className="p-3">
                          <Badge variant={getRankVariant(p.finalRank)}>
                            {RANK_LABELS[p.finalRank] || 'Chưa xếp loại'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {p.finalRank === 'XUẤT SẮC' ? (
                            <span className="text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                              Chiến sĩ thi đua cơ sở
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ==============================================================================
          TAB 3: LỊCH SỬ ĐÁNH GIÁ NHIỀU KỲ & BIỂU ĐỒ XU HƯỚNG (Yêu cầu Phase 5)
          ============================================================================== */}
      {activeTab === 'multi-period' && (
        <SectionCard
          icon={TrendingUp}
          title="Xu hướng nhiều kỳ"
          description="Điểm trung bình và tỷ lệ hoàn thành qua các quý."
        >
          <div className="space-y-6">
            <div className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={multiPeriodTrendData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                  <XAxis dataKey="period" tick={{ fill: 'currentColor', fontSize: 12 }} className="text-slate-500 font-medium" />
                  <YAxis domain={[75, 100]} tick={{ fill: 'currentColor', fontSize: 12 }} className="text-slate-500 font-mono" />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgScore" name="Điểm trung bình" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} />
                  <Line type="monotone" dataKey="completionRate" name="Tỷ lệ hoàn thành %" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="excellentRate" name="Tỷ lệ Xuất sắc %" stroke="#7c3aed" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              {multiPeriodTrendData.map((d, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                  <div className="font-bold text-slate-800 dark:text-slate-200">{d.period}</div>
                  <div className="text-primary-600 font-black text-lg tabular-nums">{d.avgScore} điểm</div>
                  <div className="text-slate-400 text-[11px]">Hoàn thành: {d.completionRate}% | Xuất sắc: {d.excellentRate}%</div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      )}

      {/* ==============================================================================
          TAB 4: SỬ DỤNG KẾT QUẢ (LƯƠNG THƯỞNG KPI & QUY HOẠCH BỔ NHIỆM) (Yêu cầu Phase 5)
          ============================================================================== */}
      {activeTab === 'bonus-salary' && (
        <SectionCard
          title={
            systemOperatingMode === 'GOVERNMENT'
              ? 'Sử dụng Kết quả: Phục vụ Quy hoạch Cán bộ, Bổ nhiệm & Nâng lương Trước hạn'
              : 'Sử dụng Kết quả: Tính Quỹ thưởng & Bảng Lương theo Hệ số KPI'
          }
          description={
            systemOperatingMode === 'GOVERNMENT'
              ? 'Áp dụng kết quả xếp loại 02 năm liên tiếp phục vụ quy hoạch chức danh lãnh đạo và nâng bậc lương trước thời hạn'
              : 'Quy đổi hệ số K_KPI theo từng bậc xếp loại: Loại A (1.5x), Loại B (1.2x), Loại C (1.0x), Loại D (0.0x)'
          }
          action={
            <Button variant="primary" size="sm" icon={Download} onClick={() => handleExportCSV('SALARY')}>
              Xuất bảng phân bổ thưởng
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            {systemOperatingMode === 'GOVERNMENT' ? (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 text-purple-900 dark:text-purple-200 space-y-1">
                  <strong>Điều kiện Nâng lương Trước thời hạn (Khoản 1 Điều 3 Thông tư 08/2013/TT-BNV):</strong>
                  <p>Cán bộ, công chức, viên chức được xếp loại chất lượng ở mức <strong>Hoàn thành xuất sắc nhiệm vụ</strong> và có thành tích xuất sắc được xem xét nâng bậc lương trước thời hạn tối đa 12 tháng.</p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs font-medium text-slate-500">
                      <tr>
                        <th className="p-3">Cán bộ</th>
                        <th className="p-3">Ngạch bậc hiện tại</th>
                        <th className="p-3">Hệ số lương</th>
                        <th className="p-3">Xếp loại Q4/2026</th>
                        <th className="p-3">Đề xuất sử dụng kết quả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {rewardList.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{p.employeeName}</td>
                          <td className="p-3 text-slate-600">{p.positionTitle}</td>
                          <td className="p-3 tabular-nums font-mono">3.00</td>
                          <td className="p-3"><Badge variant="excellent">XUẤT SẮC</Badge></td>
                          <td className="p-3 font-semibold text-emerald-600">Đủ điều kiện quy hoạch bổ nhiệm & nâng bậc lương trước thời hạn 12 tháng</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs font-medium text-slate-500">
                      <tr>
                        <th className="p-3">Nhân sự</th>
                        <th className="p-3">Chức danh</th>
                        <th className="p-3">Lương cơ bản</th>
                        <th className="p-3">Xếp loại</th>
                        <th className="p-3">Hệ số K_KPI</th>
                        <th className="p-3">Thưởng KPI thực nhận</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {periodPlans.map((p) => {
                        const mult = p.finalRank === 'XUẤT SẮC' ? 1.5 : p.finalRank === 'TỐT' ? 1.2 : p.finalRank === 'HOÀN THÀNH' ? 1.0 : 0.0;
                        const base = 20000000;
                        const bonus = Math.round(base * mult);
                        return (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{p.employeeName}</td>
                            <td className="p-3 text-slate-600">{p.positionTitle}</td>
                            <td className="p-3 tabular-nums"><NumberText value={base} /> VNĐ</td>
                            <td className="p-3"><Badge variant={getRankVariant(p.finalRank)}>{RANK_LABELS[p.finalRank] || 'Chưa xếp loại'}</Badge></td>
                            <td className="p-3 font-bold tabular-nums text-primary-600">{mult}x</td>
                            <td className="p-3 font-black tabular-nums text-emerald-600"><NumberText value={bonus} /> VNĐ</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* ==============================================================================
          TAB 5: MẪU IN & XUẤT PDF / WORD THEO QUY ĐỊNH (Yêu cầu Phase 5)
          ============================================================================== */}
      {activeTab === 'export-templates' && (
        <SectionCard
          icon={Printer}
          title="Mẫu in"
          description="Phiếu đánh giá cá nhân và biên bản họp theo mẫu Nghị định 90/2020; in trực tiếp hoặc lưu PDF."
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm">Mẫu số 01: Phiếu Đánh giá Cá nhân</h4>
              <p className="text-slate-500">Mẫu nhận xét, tự đánh giá và phân loại cán bộ, công chức chuẩn NĐ 90/2020/NĐ-CP.</p>
              <Button
                variant="primary"
                size="sm"
                icon={Printer}
                onClick={() => {
                  setPrintDocType('FORM_01');
                  setShowPrintModal(true);
                }}
              >
                In mẫu 01
              </Button>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm">Biên bản Họp Hội nghị Tập thể</h4>
              <p className="text-slate-500">Biên bản họp lấy ý kiến góp ý của tập thể đơn vị và kết quả bỏ phiếu biểu quyết.</p>
              <Button
                variant="outline"
                size="sm"
                icon={Printer}
                onClick={() => {
                  setPrintDocType('MEETING_MINUTES');
                  setShowPrintModal(true);
                }}
              >
                In biên bản
              </Button>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Building className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm">Bảng Tổng hợp Kết quả Đơn vị</h4>
              <p className="text-slate-500">Bảng kê phân loại mức chất lượng của toàn thể công chức, viên chức trong cơ quan.</p>
              <Button
                variant="outline"
                size="sm"
                icon={Printer}
                onClick={() => {
                  setPrintDocType('UNIT_SUMMARY');
                  setShowPrintModal(true);
                }}
              >
                In bảng kê
              </Button>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Modal In & Preview Văn bản */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {printDocType === 'FORM_01'
                  ? 'Xem trước: Mẫu số 01 - Phiếu đánh giá, xếp loại chất lượng cán bộ'
                  : printDocType === 'MEETING_MINUTES'
                  ? 'Xem trước: Biên bản Hội nghị lấy ý kiến tập thể'
                  : 'Xem trước: Bảng tổng hợp xếp loại chất lượng đơn vị'}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowPrintModal(false)}>
                Đóng
              </Button>
            </div>

            <div className="p-6 rounded-lg bg-slate-50 dark:bg-slate-800 font-serif text-xs space-y-4 leading-relaxed text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700">
              <div className="text-center space-y-1">
                <div className="font-bold uppercase tracking-wider text-sm">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div className="font-bold text-xs underline">Độc lập - Tự do - Hạnh phúc</div>
                <div className="text-[11px] italic mt-2">Hà Nội, ngày 17 tháng 10 năm 2026</div>
              </div>

              <div className="text-center font-bold text-sm uppercase pt-2">
                {printDocType === 'FORM_01' && 'PHIẾU ĐÁNH GIÁ, XẾP LOẠI CHẤT LƯỢNG CÁN BỘ'}
                {printDocType === 'MEETING_MINUTES' && 'BIÊN BẢN HỘI NGHỊ LẤY Ý KIẾN TẬP THỂ ĐƠN VỊ'}
                {printDocType === 'UNIT_SUMMARY' && 'BẢNG TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ XẾP LOẠI CÔNG CHỨC NĂM 2026'}
              </div>

              <div className="space-y-1 text-xs">
                <div>Họ và tên: <strong>Phạm Đức Thắng</strong></div>
                <div>Chức vụ, chức danh: <strong>Kỹ sư phần mềm chính</strong></div>
                <div>Đơn vị công tác: <strong>Tổ Kỹ thuật Hệ thống & Dữ liệu lớn</strong></div>
                <div>Kỳ đánh giá: <strong>Quý 4 / Năm 2026</strong></div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-300">
                <div className="font-bold">I. KẾT QUẢ TỰ ĐÁNH GIÁ:</div>
                <p>1. Về tư tưởng chính trị, phẩm chất đạo đức, lối sống, tác phong lề lối làm việc: Tốt, chấp hành nghiêm túc quy chế cơ quan.</p>
                <p>2. Về kết quả thực hiện nhiệm vụ theo kế hoạch: Hoàn thành 100% các chỉ tiêu KPI được giao trong kỳ, giải quyết vượt tiến độ 2 nhiệm vụ trọng yếu.</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-300">
                <div className="font-bold">II. Ý KIẾN CỦA TẬP THỂ & QUẢN LÝ TRỰC TIẾP:</div>
                <p>Hội nghị tập thể nhất trí đánh giá: Đồng chí có năng lực chuyên môn vững vàng, trách nhiệm cao, phối hợp tốt với các phòng ban liên quan.</p>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-300">
                <div className="font-bold">III. KẾT LUẬN & XẾP LOẠI CỦA NGƯỜI ĐỨNG ĐẦU:</div>
                <div className="font-bold text-primary-700 text-sm">Mức xếp loại: HOÀN THÀNH XUẤT SẮC NHIỆM VỤ</div>
              </div>

              <div className="grid grid-cols-2 text-center pt-8 font-bold">
                <div>NGƯỜI TỰ NHẬN XÉT<br /><br /><br /><br />Phạm Đức Thắng</div>
                <div>THỦ TRƯỞNG ĐƠN VỊ<br /><br /><br /><br />Lê Hoàng Minh</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setShowPrintModal(false)}>
                Đóng
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Printer}
                onClick={() => {
                  window.print();
                }}
              >
                In / lưu PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
