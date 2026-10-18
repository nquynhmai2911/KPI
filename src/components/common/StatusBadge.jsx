import React from 'react';
import { Badge } from '../ui/Badge';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Lock,
  Send,
  FileEdit,
  Sparkles,
} from 'lucide-react';

export const StatusBadge = ({ status, type = 'auto', size = 'md', className = '' }) => {
  if (!status) return null;

  const normalized = String(status).toUpperCase();

  // 1. Phân loại Cán bộ, công chức (NĐ 90/2020 & NĐ 48/2023)
  if (
    normalized === 'HOAN_THANH_XUAT_SAC' ||
    normalized === 'XUAT_SAC' ||
    normalized === 'XUẤT SẮC' ||
    normalized === 'GRADE_A_PLUS'
  ) {
    return (
      <Badge variant="excellent" size={size} dot icon={Sparkles} className={className}>
        Hoàn thành xuất sắc
      </Badge>
    );
  }

  if (
    normalized === 'HOAN_THANH_TOT' ||
    normalized === 'TOT' ||
    normalized === 'TỐT' ||
    normalized === 'GRADE_A'
  ) {
    return (
      <Badge variant="good" size={size} dot icon={CheckCircle2} className={className}>
        Hoàn thành tốt
      </Badge>
    );
  }

  if (
    normalized === 'HOAN_THANH' ||
    normalized === 'HOÀN THÀNH' ||
    normalized === 'GRADE_B'
  ) {
    return (
      <Badge variant="completed" size={size} dot icon={CheckCircle2} className={className}>
        Hoàn thành nhiệm vụ
      </Badge>
    );
  }

  if (
    normalized === 'KHONG_HOAN_THANH' ||
    normalized === 'KHÔNG HOÀN THÀNH' ||
    normalized === 'GRADE_D'
  ) {
    return (
      <Badge variant="failed" size={size} dot icon={XCircle} className={className}>
        Không hoàn thành
      </Badge>
    );
  }

  // 2. Trạng thái Bảng giao KPI & Kế hoạch
  if (normalized === 'DRAFT' || normalized === 'NHÁP') {
    return (
      <Badge variant="secondary" size={size} icon={FileEdit} className={className}>
        Bản nháp
      </Badge>
    );
  }

  if (normalized === 'ASSIGNED' || normalized === 'GIAO KPI' || normalized === 'ASSIGNING') {
    return (
      <Badge variant="primary" size={size} dot icon={Send} className={className}>
        Quản lý đã giao
      </Badge>
    );
  }

  if (normalized === 'ACCEPTED' || normalized === 'ĐÃ XÁC NHẬN') {
    return (
      <Badge variant="info" size={size} dot icon={CheckCircle2} className={className}>
        Nhân viên đã xác nhận
      </Badge>
    );
  }

  if (
    normalized === 'FEEDBACK_REQUESTED' ||
    normalized === 'REJECTED' ||
    normalized === 'ĐỀ NGHỊ ĐIỀU CHỈNH' ||
    normalized === 'YÊU CẦU ĐIỀU CHỈNH LẠI'
  ) {
    return (
      <Badge variant="warning" size={size} dot icon={AlertTriangle} className={className}>
        Đề nghị điều chỉnh
      </Badge>
    );
  }

  if (normalized === 'SUBMITTED' || normalized === 'CHỜ DUYỆT') {
    return (
      <Badge variant="warning" size={size} dot icon={Clock} className={className}>
        Chờ phê duyệt
      </Badge>
    );
  }

  if (normalized === 'APPROVED' || normalized === 'ĐÃ PHÊ DUYỆT' || normalized === 'ĐÃ DUYỆT') {
    return (
      <Badge variant="success" size={size} dot icon={CheckCircle2} className={className}>
        Đã phê duyệt
      </Badge>
    );
  }

  if (normalized === 'LOCKED' || normalized === 'CLOSED' || normalized === 'ĐÃ KHÓA') {
    return (
      <Badge variant="purple" size={size} icon={Lock} className={className}>
        Đã khóa chỉ tiêu
      </Badge>
    );
  }

  if (normalized === 'IN_PROGRESS' || normalized === 'ĐANG THỰC HIỆN') {
    return (
      <Badge variant="primary" size={size} dot className={className}>
        Đang thực hiện
      </Badge>
    );
  }

  if (normalized === 'OVERDUE' || normalized === 'QUÁ HẠN') {
    return (
      <Badge variant="danger" size={size} dot icon={AlertTriangle} className={className}>
        Quá hạn
      </Badge>
    );
  }

  if (normalized === 'DUE_SOON' || normalized === 'SẮP ĐẾN HẠN') {
    return (
      <Badge variant="warning" size={size} dot icon={Clock} className={className}>
        Sắp đến hạn
      </Badge>
    );
  }

  // Fallback
  return (
    <Badge variant="default" size={size} className={className}>
      {String(status)}
    </Badge>
  );
};
