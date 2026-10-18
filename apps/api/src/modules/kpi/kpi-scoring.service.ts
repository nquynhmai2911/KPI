import { Injectable, Logger } from '@nestjs/common';
import {
  KpiType,
  ScoringMethod,
  TargetDirection,
} from '../../common/enums';

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

export interface KpiScoreInput {
  kpiType?: KpiType | string;
  scoringMethod: ScoringMethod | string;
  targetDirection?: TargetDirection | string;
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

@Injectable()
export class KpiScoringService {
  private readonly logger = new Logger(KpiScoringService.name);

  /**
   * Kiểm tra tổng trọng số các chỉ tiêu trong một bảng giao KPI
   * Quy định chuẩn: Tổng trọng số bắt buộc = 100% (chấp nhận sai số làm tròn floating point epsilon <= 0.001)
   */
  validateTotalWeight(
    items: Array<{ weight?: number | null }>,
    tolerance: number = 0.001
  ): KpiWeightValidationResult {
    if (!items || items.length === 0) {
      return {
        isValid: false,
        totalWeight: 0,
        difference: 100,
        message: 'Danh sách KPI chưa có chỉ tiêu nào.',
      };
    }

    const rawSum = items.reduce((acc, item) => {
      const w = typeof item.weight === 'number' && !isNaN(item.weight) ? item.weight : 0;
      return acc + w;
    }, 0);

    const roundedSum = Math.round(rawSum * 1000) / 1000;
    const diff = Math.round((100 - roundedSum) * 1000) / 1000;
    const isValid = Math.abs(diff) <= tolerance;

    let message = 'Tổng trọng số đạt chuẩn 100%.';
    if (!isValid) {
      if (diff > 0) {
        message = `Tổng trọng số hiện tại là ${roundedSum}%, còn thiếu ${diff}% để đạt 100%.`;
      } else {
        message = `Tổng trọng số hiện tại là ${roundedSum}%, vượt quá ${Math.abs(diff)}% so với mức 100%.`;
      }
    }

    return {
      isValid,
      totalWeight: roundedSum,
      difference: diff,
      message,
    };
  }

  /**
   * Tính điểm KPI độc lập, xử lý toàn diện các công thức và case biên
   */
  calculateScore(input: KpiScoreInput): KpiScoreResult {
    const {
      scoringMethod,
      targetDirection = TargetDirection.HIGHER_IS_BETTER,
      targetValue,
      actualValue,
      minThreshold,
      maxThreshold,
      formulaConfig,
      bonusPoints = 0,
      penaltyPoints = 0,
      weight = 10,
    } = input;

    // --------------------------------------------------------------------------
    // CASE BIÊN 1: THIẾU DỮ LIỆU HOẶC KHÔNG PHẢI SỐ HỢP LỆ
    // --------------------------------------------------------------------------
    if (
      actualValue === null ||
      actualValue === undefined ||
      typeof actualValue !== 'number' ||
      isNaN(actualValue)
    ) {
      return {
        rawRatio: 0,
        calculatedScore: 0,
        bonusPoints: 0,
        penaltyPoints: 0,
        finalScore: 0,
        weightedScore: 0,
        status: 'MISSING_DATA',
        note: 'Chưa có dữ liệu thực hiện hoặc giá trị không hợp lệ',
      };
    }

    let calculatedScore = 0;
    let rawRatio = 0;
    let status: KpiScoreResult['status'] = 'COMPLETED';
    let note = '';

    const allowOverAchievement = formulaConfig?.allowOverAchievement ?? true;
    const maxScoreCap = formulaConfig?.maxScoreCap ?? 120;

    // --------------------------------------------------------------------------
    // CASE BIÊN 2: CHIA CHO 0 (TARGET = 0)
    // --------------------------------------------------------------------------
    if (targetValue === 0) {
      if (actualValue === 0) {
        // Cả target lẫn actual đều bằng 0 => Hoàn thành chuẩn 100%
        rawRatio = 1.0;
        calculatedScore = 100;
        status = 'COMPLETED';
        note = 'Mục tiêu 0 và thực tế 0: Hoàn thành tuyệt đối';
      } else if (targetDirection === TargetDirection.LOWER_IS_BETTER) {
        // Ví dụ: Mục tiêu 0 lỗi bug / 0 khiếu nại, nhưng thực tế > 0 => 0 điểm
        rawRatio = 0;
        calculatedScore = 0;
        status = 'BELOW_MIN';
        note = `Mục tiêu là 0 nhưng thực tế phát sinh ${actualValue} (chỉ tiêu nghịch)`;
      } else {
        // Target = 0, thực tế > 0 với chỉ tiêu HIGHER_IS_BETTER => Đạt điểm tối đa
        rawRatio = 1.0;
        calculatedScore = allowOverAchievement ? Math.min(100 + actualValue * 10, maxScoreCap) : 100;
        status = calculatedScore > 100 ? 'OVER_ACHIEVED' : 'COMPLETED';
        note = `Khởi điểm từ 0 và đạt thực tế ${actualValue}`;
      }
    } else {
      // ------------------------------------------------------------------------
      // PHƯƠNG PHÁP 1: TUYẾN TÍNH (LINEAR)
      // ------------------------------------------------------------------------
      if (scoringMethod === ScoringMethod.LINEAR || scoringMethod === 'LINEAR') {
        if (targetDirection === TargetDirection.HIGHER_IS_BETTER) {
          rawRatio = actualValue / targetValue;
          const rawScore = rawRatio * 100;

          // Kiểm tra ngưỡng sàn tối thiểu (minThreshold)
          if (
            minThreshold !== null &&
            minThreshold !== undefined &&
            actualValue < minThreshold
          ) {
            calculatedScore = 0;
            status = 'BELOW_MIN';
            note = `Thực tế (${actualValue}) dưới ngưỡng tối thiểu (${minThreshold})`;
          } else if (rawScore > 100) {
            if (!allowOverAchievement) {
              calculatedScore = 100;
              status = 'CAPPED';
              note = 'Đạt trên 100% nhưng bị giới hạn mức trần 100%';
            } else {
              calculatedScore = Math.min(rawScore, maxScoreCap);
              status = calculatedScore < rawScore ? 'CAPPED' : 'OVER_ACHIEVED';
              note = `Vượt kế hoạch (${(rawRatio * 100).toFixed(1)}%)`;
            }
          } else {
            calculatedScore = Math.max(0, rawScore);
            status = 'COMPLETED';
          }
        } else {
          // LOWER_IS_BETTER (Càng thấp càng tốt: Số lỗi, thời gian trễ, chi phí)
          // Ngưỡng maxThreshold là ngưỡng xấu nhất không được vượt quá
          if (
            maxThreshold !== null &&
            maxThreshold !== undefined &&
            actualValue > maxThreshold
          ) {
            rawRatio = 0;
            calculatedScore = 0;
            status = 'BELOW_MIN';
            note = `Thực tế (${actualValue}) vượt ngưỡng lỗi cho phép (${maxThreshold})`;
          } else if (actualValue <= targetValue) {
            // Tốt hơn hoặc bằng mục tiêu (ví dụ: mục tiêu tối đa 10 lỗi, thực tế chỉ có 4 lỗi)
            const improvementRatio = (targetValue - actualValue) / targetValue;
            rawRatio = 1 + improvementRatio;
            const potentialScore = 100 + improvementRatio * 100;

            if (!allowOverAchievement) {
              calculatedScore = 100;
              status = 'COMPLETED';
            } else {
              calculatedScore = Math.min(potentialScore, maxScoreCap);
              status = calculatedScore > 100 ? 'OVER_ACHIEVED' : 'COMPLETED';
              note = `Chỉ tiêu nghịch hoàn thành tốt hơn cam kết (${(rawRatio * 100).toFixed(1)}%)`;
            }
          } else {
            // Xấu hơn mục tiêu (thực tế > target)
            const degradationRatio = (actualValue - targetValue) / targetValue;
            rawRatio = Math.max(0, 1 - degradationRatio);
            calculatedScore = Math.max(0, 100 - degradationRatio * 100);
            status = 'COMPLETED';
            note = `Chỉ tiêu nghịch vượt quá mục tiêu cho phép`;
          }
        }
      }

      // ------------------------------------------------------------------------
      // PHƯƠNG PHÁP 2: BẬC THANG (STEP / TIERED)
      // ------------------------------------------------------------------------
      else if (scoringMethod === ScoringMethod.STEP || scoringMethod === 'STEP') {
        const percentageRatio = (actualValue / targetValue) * 100;
        rawRatio = actualValue / targetValue;

        const tiers = formulaConfig?.tiers;
        if (tiers && tiers.length > 0) {
          // Sắp xếp các tiers tăng dần theo min
          const sortedTiers = [...tiers].sort((a, b) => a.min - b.min);
          let matchedTier: StepTierConfig | null = null;

          for (const tier of sortedTiers) {
            if (percentageRatio >= tier.min && percentageRatio <= tier.max) {
              matchedTier = tier;
              break;
            }
          }

          if (matchedTier) {
            calculatedScore = matchedTier.score;
            note = matchedTier.label || `Khung bậc thang [${matchedTier.min}% - ${matchedTier.max}%]`;
          } else if (percentageRatio > sortedTiers[sortedTiers.length - 1].max) {
            // Vượt khung cao nhất
            const highest = sortedTiers[sortedTiers.length - 1];
            calculatedScore = allowOverAchievement
              ? Math.min(highest.score, maxScoreCap)
              : Math.min(highest.score, 100);
            status = 'OVER_ACHIEVED';
            note = `Vượt trên khung bậc thang cao nhất (đạt ${percentageRatio.toFixed(1)}%)`;
          } else {
            // Dưới khung thấp nhất
            calculatedScore = sortedTiers[0].score > 0 ? sortedTiers[0].score : 0;
            status = 'BELOW_MIN';
            note = `Dưới khung bậc thang tối thiểu (${percentageRatio.toFixed(1)}%)`;
          }
        } else {
          // Fallback bậc thang mặc định nếu chưa cấu hình tiers
          if (percentageRatio < 70) calculatedScore = 0;
          else if (percentageRatio < 85) calculatedScore = 70;
          else if (percentageRatio < 100) calculatedScore = 85;
          else if (percentageRatio < 115) calculatedScore = 100;
          else calculatedScore = allowOverAchievement ? 115 : 100;
        }
      }

      // ------------------------------------------------------------------------
      // PHƯƠNG PHÁP 3: ĐẠT / KHÔNG ĐẠT (BINARY_PASS_FAIL)
      // ------------------------------------------------------------------------
      else if (
        scoringMethod === ScoringMethod.BINARY_PASS_FAIL ||
        scoringMethod === 'BINARY_PASS_FAIL' ||
        input.kpiType === KpiType.BINARY
      ) {
        const passScore = formulaConfig?.passScore ?? 100;
        const failScore = formulaConfig?.failScore ?? 0;

        const isPassed =
          targetDirection === TargetDirection.LOWER_IS_BETTER
            ? actualValue <= targetValue
            : actualValue >= targetValue;

        rawRatio = isPassed ? 1.0 : 0.0;
        calculatedScore = isPassed ? passScore : failScore;
        status = isPassed ? 'COMPLETED' : 'BELOW_MIN';
        note = isPassed ? 'Đạt chuẩn yêu cầu' : 'Không đạt chuẩn yêu cầu';
      }

      // ------------------------------------------------------------------------
      // PHƯƠNG PHÁP 4: MILESTONE (MỐC THỜI GIAN)
      // ------------------------------------------------------------------------
      else if (input.kpiType === KpiType.MILESTONE || scoringMethod === 'MILESTONE') {
        rawRatio = targetValue > 0 ? actualValue / targetValue : 1;
        calculatedScore = actualValue >= targetValue ? 100 : Math.max(0, rawRatio * 100);
        status = actualValue >= targetValue ? 'COMPLETED' : 'BELOW_MIN';
        note = actualValue >= targetValue ? 'Hoàn thành đúng mốc tiến độ' : 'Chưa hoàn thành mốc tiến độ';
      } else {
        // Fallback Tuyến tính thông thường
        rawRatio = targetValue > 0 ? actualValue / targetValue : 1;
        calculatedScore = Math.max(0, Math.min(rawRatio * 100, maxScoreCap));
      }
    }

    // --------------------------------------------------------------------------
    // ĐIỂM THƯỞNG / ĐIỂM TRỪ BỔ SUNG (BONUS & PENALTY)
    // --------------------------------------------------------------------------
    const appliedBonus = Math.max(0, bonusPoints || 0);
    const appliedPenalty = Math.max(0, penaltyPoints || 0);

    let finalScore = calculatedScore + appliedBonus - appliedPenalty;
    finalScore = Math.max(0, finalScore); // Điểm không được âm

    if (allowOverAchievement && finalScore > maxScoreCap) {
      finalScore = maxScoreCap;
      status = 'CAPPED';
    } else if (!allowOverAchievement && finalScore > 100) {
      finalScore = 100;
      status = 'CAPPED';
    }

    finalScore = Math.round(finalScore * 100) / 100;
    const weightedScore = Math.round(((finalScore * weight) / 100) * 100) / 100;

    return {
      rawRatio: Math.round(rawRatio * 1000) / 1000,
      calculatedScore: Math.round(calculatedScore * 100) / 100,
      bonusPoints: appliedBonus,
      penaltyPoints: appliedPenalty,
      finalScore,
      weightedScore,
      status,
      note,
    };
  }

  /**
   * Tính điểm tổng hợp cho toàn bộ bảng KPI
   */
  calculateAssignmentTotal(
    items: Array<KpiScoreInput & { weight: number }>
  ): {
    totalWeight: number;
    totalWeightedScore: number;
    itemResults: KpiScoreResult[];
    weightValidation: KpiWeightValidationResult;
  } {
    const weightValidation = this.validateTotalWeight(items);
    let totalWeightedScore = 0;

    const itemResults = items.map((item) => {
      const result = this.calculateScore(item);
      totalWeightedScore += result.weightedScore;
      return result;
    });

    return {
      totalWeight: weightValidation.totalWeight,
      totalWeightedScore: Math.round(totalWeightedScore * 100) / 100,
      itemResults,
      weightValidation,
    };
  }
}
