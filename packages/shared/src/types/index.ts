import {
  OperatingMode,
  RoleType,
  DataScopeType,
  PeriodType,
  PeriodStatus,
  EvaluationStatus,
  GovClassificationLevel,
  EnterpriseGrade,
  ReviewerType,
  AuditAction,
  BSCCategory,
  GovCriteriaGroup,
} from '../enums';

// ==============================================================================
// AUTH & USER INTERFACES
// ==============================================================================

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  departmentId: string;
  departmentName?: string;
  departmentPath?: string;
  positionId: string;
  positionName?: string;
  roles: RoleType[];
  dataScope: DataScopeType;
  isTwoFactorEnabled: boolean;
}

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  roles: RoleType[];
  departmentId: string;
  dataScope: DataScopeType;
  iat?: number;
  exp?: number;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthenticatedUser;
}

// ==============================================================================
// DEPARTMENT & ORGANIZATION INTERFACES
// ==============================================================================

export interface DepartmentNode {
  id: string;
  code: string;
  name: string;
  level: number;
  parentId: string | null;
  path: string; // E.g., "/dept-root/dept-01/dept-01-01"
  operatingMode: OperatingMode;
  managerId: string | null;
  managerName?: string | null;
  headcount?: number;
  children?: DepartmentNode[];
}

// ==============================================================================
// ASSESSMENT CONFIGURATION INTERFACES (DYNAMIC RULES)
// ==============================================================================

export interface ScoringScaleRule {
  id: string;
  name: string;
  minScore: number;
  maxScore: number;
  step?: number;
  description?: string;
}

export interface ClassificationThreshold {
  level: GovClassificationLevel | EnterpriseGrade;
  name: string;
  minTotalScore: number;
  maxTotalScore?: number;
  requiresAllTasksCompleted?: boolean;
  maxQuotaPercentage?: number | null; // E.g., 20% for HOAN_THANH_XUAT_SAC
  colorCode: string;
}

export interface WeightMatrixRule {
  reviewerType: ReviewerType;
  weightPercentage: number; // E.g., SELF: 10, DIRECT_MANAGER: 60, COLLECTIVE_PEER: 30
}

export interface CriteriaItemDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  groupType: GovCriteriaGroup | BSCCategory | string;
  weight: number; // Trọng số (%)
  targetValue?: number | string | null;
  unit?: string | null;
  scoringType: 'SCORE_SCALE' | 'PERCENTAGE' | 'BINARY_PASS_FAIL' | 'FORMULA';
  formula?: string | null;
  minValue?: number;
  maxValue?: number;
}

// ==============================================================================
// AUDIT LOG INTERFACE
// ==============================================================================

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  username: string | null;
  action: AuditAction;
  entityName: string;
  entityId: string;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string | Date;
}

// ==============================================================================
// PHASE 2: KPI LIBRARY, TEMPLATES & CASCADE ASSIGNMENT INTERFACES
// ==============================================================================

export interface StepTierConfig {
  min: number;
  max: number;
  score: number;
  label?: string;
}

export interface FormulaConfig {
  tiers?: StepTierConfig[];
  bonusPerUnitOver?: number;
  maxBonus?: number;
  penaltyPerUnitUnder?: number;
  maxPenalty?: number;
  passScore?: number;
  failScore?: number;
  allowOverAchievement?: boolean;
  maxScoreCap?: number; // e.g. 100, 120, 150
}

export interface KpiLibraryDto {
  id: string;
  code: string;
  name: string;
  category: string;
  kpiType: string;
  unit: string;
  targetDirection: string;
  defaultWeight: number;
  defaultTarget?: number | null;
  minThreshold?: number | null;
  maxThreshold?: number | null;
  scoringMethod: string;
  formulaConfig?: FormulaConfig | null;
  description?: string | null;
  guidance?: string | null;
  departmentId?: string | null;
  isActive: boolean;
  createdAt?: string | Date;
}

export interface KpiTemplateItemDto {
  id: string;
  templateId: string;
  kpiLibraryId?: string | null;
  code: string;
  name: string;
  kpiType: string;
  unit: string;
  targetDirection: string;
  weight: number;
  targetValue: number;
  minThreshold?: number | null;
  maxThreshold?: number | null;
  scoringMethod: string;
  formulaConfig?: FormulaConfig | null;
  sortOrder: number;
}

export interface KpiTemplateDto {
  id: string;
  code: string;
  name: string;
  positionId?: string | null;
  departmentId?: string | null;
  description?: string | null;
  isActive: boolean;
  items: KpiTemplateItemDto[];
}

export interface KpiAssignmentItemDto {
  id: string;
  assignmentId: string;
  parentKpiId?: string | null;
  kpiLibraryId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  kpiType: string;
  unit: string;
  targetDirection: string;
  weight: number;
  targetValue: number;
  minThreshold?: number | null;
  maxThreshold?: number | null;
  scoringMethod: string;
  formulaConfig?: FormulaConfig | null;
  actualValue?: number | null;
  bonusPoints?: number;
  penaltyPoints?: number;
  calculatedScore?: number | null;
  weightedScore?: number | null;
  sortOrder?: number;
  childKpis?: KpiAssignmentItemDto[];
}

export interface KpiAssignmentDto {
  id: string;
  periodId: string;
  periodName?: string;
  departmentId?: string | null;
  departmentName?: string | null;
  userId?: string | null;
  userName?: string | null;
  userPositionTitle?: string | null;
  assignedById?: string | null;
  assignedByName?: string | null;
  status: string;
  version: number;
  totalWeight: number;
  feedbackText?: string | null;
  approvedAt?: string | Date | null;
  lockedAt?: string | Date | null;
  items: KpiAssignmentItemDto[];
  revisions?: KpiRevisionHistoryDto[];
}

export interface KpiRevisionHistoryDto {
  id: string;
  assignmentId: string;
  version: number;
  reason: string;
  changedById: string;
  changedByName?: string;
  snapshotData: any;
  createdAt: string | Date;
}

export interface KpiScoreInput {
  kpiType?: string;
  scoringMethod: string;
  targetDirection?: string;
  targetValue: number;
  actualValue?: number | null;
  minThreshold?: number | null;
  maxThreshold?: number | null;
  formulaConfig?: FormulaConfig | null;
  bonusPoints?: number;
  penaltyPoints?: number;
  weight?: number;
}

export interface KpiScoreResult {
  rawRatio: number;
  calculatedScore: number;
  bonusPoints: number;
  penaltyPoints: number;
  finalScore: number;
  weightedScore: number;
  status: 'COMPLETED' | 'MISSING_DATA' | 'BELOW_MIN' | 'CAPPED' | 'OVER_ACHIEVED';
  note?: string;
}

export interface KpiWeightValidationResult {
  isValid: boolean;
  totalWeight: number;
  difference: number;
  message: string;
}

export * from './kpi-task';
