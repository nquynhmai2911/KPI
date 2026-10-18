import { z } from 'zod';

export const TaskStatusEnum = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'OVERDUE',
  'CANCELLED',
]);

export const DueDateHistoryItemSchema = z.object({
  id: z.string(),
  oldDueDate: z.string(),
  newDueDate: z.string(),
  reason: z.string().min(5, 'Lý do thay đổi hạn chót tối thiểu 5 ký tự'),
  changedBy: z.string(),
  changedByName: z.string().optional(),
  changedAt: z.string(),
});

export const TaskAssigneeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Tên người thực hiện không được để trống'),
  avatarUrl: z.string().optional().nullable(),
  unit: z.string().min(1, 'Đơn vị công tác không được để trống'),
  position: z.string().optional(),
  email: z.string().email().optional(),
});

export const KpiTaskSchema = z.object({
  id: z.string(),
  code: z.string().min(1, 'Mã chỉ tiêu công việc không được để trống'),
  name: z.string().min(3, 'Tên chỉ tiêu công việc tối thiểu 3 ký tự'),
  weight: z.number().min(0).max(100, 'Trọng số từ 0% đến 100%'),
  assigneeId: z.string().min(1, 'Vui lòng chọn người thực hiện'),
  assignee: TaskAssigneeSchema,
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Hạn chót phải đúng định dạng YYYY-MM-DD'),
  progress: z.number().min(0).max(100, 'Tiến độ hoàn thành từ 0% đến 100%'),
  status: TaskStatusEnum,
  periodId: z.string().min(1, 'Kỳ đánh giá không được để trống'),
  
  description: z.string().optional(),
  category: z.string().optional(),
  unitOfMeasure: z.string().optional(),
  targetValue: z.number().optional(),
  actualValue: z.number().optional(),
  daysLeft: z.number().optional(),
  dueDateHistory: z.array(DueDateHistoryItemSchema).optional().default([]),
  evidenceCount: z.number().optional().default(0),
  commentsCount: z.number().optional().default(0),
  deletedAt: z.string().nullable().optional(),
});

/**
 * Helper tính toán số ngày còn lại (hoặc quá hạn) theo múi giờ Việt Nam
 * @param {string} dueDateStr - 'YYYY-MM-DD'
 * @param {Date} [referenceDate] - Ngày mốc (mặc định hôm nay)
 * @returns {number} Số ngày còn lại (>0: còn x ngày, 0: hôm nay, <0: trễ x ngày)
 */
export function calculateDaysLeft(dueDateStr, referenceDate = new Date()) {
  if (!dueDateStr) return 0;
  
  const due = new Date(dueDateStr + 'T23:59:59');
  const now = new Date(referenceDate);
  // Reset time to start of day for comparison
  const d1 = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = d1.getTime() - d2.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}
