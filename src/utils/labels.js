import {
  CalendarCog,
  ClipboardList,
  TrendingUp,
  UserPen,
  UserCheck,
  Gavel,
  Megaphone,
} from 'lucide-react';

export const ROLE_LABELS = {
  SYSTEM_ADMIN: 'Quản trị hệ thống',
  EXECUTIVE: 'Lãnh đạo cơ quan',
  UNIT_HEAD: 'Trưởng đơn vị',
  LINE_MANAGER: 'Quản lý trực tiếp',
  HR_OFFICER: 'Tổ chức cán bộ',
  EMPLOYEE: 'Cán bộ, nhân viên',
  COUNCIL_MEMBER: 'Hội đồng thi đua',
  SECRETARY: 'Thư ký tổng hợp',
  AUDITOR: 'Thanh tra, giám sát',
  PEER_REVIEWER: 'Đồng nghiệp góp ý',
  ADMIN: 'Quản trị hệ thống',
  MANAGER: 'Quản lý trực tiếp',
  HR: 'Tổ chức cán bộ',
};

export const SCOPE_LABELS = {
  ALL: 'Toàn cơ quan',
  UNIT_AND_CHILDREN: 'Đơn vị và cấp dưới',
  DEPARTMENT_AND_CHILDREN: 'Đơn vị và cấp dưới',
  OWN_UNIT: 'Trong đơn vị',
  SELF: 'Cá nhân',
  SELF_ONLY: 'Cá nhân',
  ASSIGNED: 'Được phân công',
};

export const getRoleLabel = (code) => ROLE_LABELS[code] || code || '';
export const getScopeLabel = (code) => SCOPE_LABELS[code] || code || '';

/**
 * Quy trình đánh giá KPI chuẩn (áp dụng cho cả cơ quan nhà nước theo NĐ 90/2020, 48/2023
 * và doanh nghiệp). Mỗi phiếu KPI luôn nằm ở đúng 1 bước.
 */
export const KPI_PROCESS_STEPS = [
  {
    key: 'SETUP',
    label: 'Mở kỳ',
    icon: CalendarCog,
    owner: 'Tổ chức cán bộ',
    module: 'periods',
    info: 'Tổ chức cán bộ mở kỳ đánh giá, chốt thời hạn đăng ký và thời hạn đánh giá.',
  },
  {
    key: 'PLANNING',
    label: 'Giao KPI',
    icon: ClipboardList,
    owner: 'Quản lý trực tiếp',
    module: 'library',
    info: 'Quản lý giao chỉ tiêu (tổng trọng số = 100%). Cán bộ xác nhận hoặc đề nghị điều chỉnh, quản lý phê duyệt.',
  },
  {
    key: 'EXECUTION',
    label: 'Thực hiện',
    icon: TrendingUp,
    owner: 'Cán bộ',
    module: 'my-kpi',
    info: 'Cán bộ cập nhật kết quả định kỳ kèm minh chứng. Quản lý xác nhận số liệu, trao đổi 1:1 khi chậm tiến độ.',
  },
  {
    key: 'SELF_REVIEW',
    label: 'Tự đánh giá',
    icon: UserPen,
    owner: 'Cán bộ',
    module: 'team-kpi',
    info: 'Hết kỳ, cán bộ tự chấm điểm từng chỉ tiêu và tự nhận mức xếp loại.',
  },
  {
    key: 'MANAGER_REVIEW',
    label: 'Cấp trên đánh giá',
    icon: UserCheck,
    owner: 'Quản lý trực tiếp',
    module: 'team-kpi',
    info: 'Quản lý trực tiếp chấm điểm, nhận xét và đề xuất mức xếp loại.',
  },
  {
    key: 'COUNCIL',
    label: 'Phê duyệt',
    icon: Gavel,
    owner: 'Hội đồng',
    module: 'team-kpi',
    info: 'Lấy ý kiến tập thể, Hội đồng thi đua thẩm định, người đứng đầu quyết định. Khống chế tỷ lệ Xuất sắc ≤ 20%.',
  },
  {
    key: 'PUBLISHED',
    label: 'Công bố',
    icon: Megaphone,
    owner: 'Tổ chức cán bộ',
    module: 'reports',
    info: 'Công bố kết quả, tiếp nhận khiếu nại, lưu hồ sơ và làm căn cứ thi đua, khen thưởng, lương thưởng.',
  },
];

export const getStepIndex = (key) => KPI_PROCESS_STEPS.findIndex((s) => s.key === key);

/** Xác định phiếu KPI đang ở bước nào của quy trình. */
export const getPlanStage = (plan, period) => {
  if (!plan) return 'PLANNING';
  if (plan.isPublished || period?.status === 'CLOSED') return 'PUBLISHED';
  if (plan.evaluationStatus === 'EVALUATED') return 'COUNCIL';
  if (plan.evaluationStatus === 'SELF_EVALUATED') return 'MANAGER_REVIEW';
  if (['APPROVED', 'LOCKED'].includes(plan.status)) {
    return period?.status === 'EVALUATING' ? 'SELF_REVIEW' : 'EXECUTION';
  }
  return 'PLANNING';
};

/** Việc cần làm tiếp theo của phiếu, theo góc nhìn người dùng. */
export const getNextAction = (plan, { isOwner, period } = {}) => {
  const stage = getPlanStage(plan, period);
  if (!plan) return { text: 'Chưa có phiếu KPI trong kỳ', module: 'library' };
  switch (plan.status) {
    case 'ASSIGNED':
      return isOwner
        ? { text: 'Xác nhận chỉ tiêu được giao', module: 'library' }
        : { text: 'Chờ cán bộ xác nhận chỉ tiêu', module: 'library' };
    case 'FEEDBACK_REQUESTED':
    case 'REJECTED':
      return isOwner
        ? { text: 'Chờ quản lý điều chỉnh chỉ tiêu', module: 'library' }
        : { text: 'Điều chỉnh chỉ tiêu theo đề nghị', module: 'library' };
    case 'DRAFT':
      return { text: 'Hoàn thiện và giao chỉ tiêu', module: 'library' };
    case 'SUBMITTED':
    case 'ACCEPTED':
      return isOwner
        ? { text: 'Chờ quản lý phê duyệt chỉ tiêu', module: 'library' }
        : { text: 'Phê duyệt chỉ tiêu', module: 'library' };
    default:
      break;
  }
  if (stage === 'EXECUTION') {
    return isOwner
      ? { text: 'Cập nhật kết quả và minh chứng', module: 'my-kpi' }
      : { text: 'Xác nhận số liệu cán bộ báo cáo', module: 'my-kpi' };
  }
  if (stage === 'SELF_REVIEW') {
    return isOwner
      ? { text: 'Tự chấm điểm cuối kỳ', module: 'team-kpi' }
      : { text: 'Chờ cán bộ tự đánh giá', module: 'team-kpi' };
  }
  if (stage === 'MANAGER_REVIEW') {
    return isOwner
      ? { text: 'Chờ cấp trên đánh giá', module: 'team-kpi' }
      : { text: 'Chấm điểm, nhận xét cán bộ', module: 'team-kpi' };
  }
  if (stage === 'COUNCIL') return { text: 'Chờ Hội đồng họp xét, phê duyệt', module: 'team-kpi' };
  return { text: 'Đã công bố kết quả', module: 'reports' };
};

/**
 * Khống chế tỷ lệ "Hoàn thành xuất sắc" theo NĐ 90/2020 (sửa đổi bởi NĐ 48/2023):
 * số Xuất sắc không vượt quá 20% số được xếp loại "Hoàn thành tốt" trong cùng nhóm.
 */
export const EXCELLENT_QUOTA_INFO =
  'Theo NĐ 90/2020 (sửa đổi bởi NĐ 48/2023): số người "Hoàn thành xuất sắc" không vượt quá 20% số người "Hoàn thành tốt" trong cùng nhóm đối tượng.';

export const checkExcellentQuota = (countExcellent, countGood) => {
  const maxAllowed = Math.floor(countGood * 0.2);
  const rate = countGood > 0 ? Math.round((countExcellent / countGood) * 1000) / 10 : countExcellent > 0 ? 100 : 0;
  return { rate, maxAllowed, withinQuota: countExcellent <= maxAllowed };
};

export const RANK_LABELS = {
  'XUẤT SẮC': 'Xuất sắc',
  'TỐT': 'Tốt',
  'HOÀN THÀNH': 'Hoàn thành',
  'KHÔNG HOÀN THÀNH': 'Không hoàn thành',
  'CHƯA XẾP LOẠI': 'Chưa xếp loại',
};

const RANK_CODE = {
  'XUẤT SẮC': 'EXCELLENT',
  'TỐT': 'GOOD',
  'HOÀN THÀNH': 'COMPLETED',
  'KHÔNG HOÀN THÀNH': 'FAILED',
};

export const getRankStats = (plans = []) => {
  const counts = { EXCELLENT: 0, GOOD: 0, COMPLETED: 0, FAILED: 0 };
  plans.forEach((p) => {
    const code = RANK_CODE[p.finalRank];
    if (code && p.evaluationStatus === 'EVALUATED') counts[code] += 1;
  });
  const evaluated = Object.values(counts).reduce((a, b) => a + b, 0);
  const scored = plans.filter((p) => p.evaluationStatus === 'EVALUATED' && p.finalScore);
  const avgScore = scored.length
    ? Math.round((scored.reduce((s, p) => s + p.finalScore, 0) / scored.length) * 10) / 10
    : 0;
  return { counts, evaluated, total: plans.length, avgScore, quota: checkExcellentQuota(counts.EXCELLENT, counts.GOOD) };
};

export const getDepartmentStats = (plans = []) => {
  const map = new Map();
  plans.forEach((p) => {
    const items = p.items || [];
    const progress = items.length ? items.reduce((s, it) => s + (it.progressPercent || 0), 0) / items.length : 0;
    const cur = map.get(p.departmentName) || { name: p.departmentName, count: 0, progressSum: 0, scoreSum: 0, scored: 0 };
    cur.count += 1;
    cur.progressSum += progress;
    if (p.evaluationStatus === 'EVALUATED' && p.finalScore) {
      cur.scoreSum += p.finalScore;
      cur.scored += 1;
    }
    map.set(p.departmentName, cur);
  });
  return [...map.values()]
    .map((d) => ({
      name: d.name,
      count: d.count,
      progress: Math.round(d.progressSum / d.count),
      avgScore: d.scored ? Math.round((d.scoreSum / d.scored) * 10) / 10 : null,
    }))
    .sort((a, b) => (b.avgScore ?? b.progress) - (a.avgScore ?? a.progress));
};
