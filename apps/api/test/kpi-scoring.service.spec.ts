import { KpiScoringService } from '../src/modules/kpi/kpi-scoring.service';
import { ScoringMethod, TargetDirection, KpiType } from '../src/common/enums';

describe('KpiScoringService (Engine Tính Điểm KPI Động)', () => {
  let service: KpiScoringService;

  beforeEach(() => {
    service = new KpiScoringService();
  });

  describe('Kiểm tra Tổng Trọng số (validateTotalWeight)', () => {
    it('Hợp lệ khi tổng trọng số chính xác bằng 100%', () => {
      const items = [
        { weight: 40 },
        { weight: 30 },
        { weight: 20 },
        { weight: 10 },
      ];
      const result = service.validateTotalWeight(items);
      expect(result.isValid).toBe(true);
      expect(result.totalWeight).toBe(100);
      expect(result.difference).toBe(0);
    });

    it('Xử lý sai số làm tròn số thực (Floating point: 33.333 + 33.333 + 33.334)', () => {
      const items = [
        { weight: 33.333 },
        { weight: 33.333 },
        { weight: 33.334 },
      ];
      const result = service.validateTotalWeight(items);
      expect(result.isValid).toBe(true);
      expect(result.totalWeight).toBe(100);
    });

    it('Không hợp lệ khi tổng trọng số < 100%', () => {
      const items = [
        { weight: 40 },
        { weight: 35 },
      ];
      const result = service.validateTotalWeight(items);
      expect(result.isValid).toBe(false);
      expect(result.totalWeight).toBe(75);
      expect(result.difference).toBe(25);
      expect(result.message).toContain('còn thiếu 25%');
    });

    it('Không hợp lệ khi tổng trọng số > 100%', () => {
      const items = [
        { weight: 60 },
        { weight: 55 },
      ];
      const result = service.validateTotalWeight(items);
      expect(result.isValid).toBe(false);
      expect(result.totalWeight).toBe(115);
      expect(result.difference).toBe(-15);
      expect(result.message).toContain('vượt quá 15%');
    });

    it('Báo lỗi khi danh sách rỗng hoặc null', () => {
      const result = service.validateTotalWeight([]);
      expect(result.isValid).toBe(false);
      expect(result.totalWeight).toBe(0);
      expect(result.message).toContain('chưa có chỉ tiêu nào');
    });
  });

  describe('Công thức Tuyến tính (LINEAR)', () => {
    it('Chỉ tiêu bình thường (HIGHER_IS_BETTER): Đạt đúng 100%', () => {
      const result = service.calculateScore({
        scoringMethod: ScoringMethod.LINEAR,
        targetDirection: TargetDirection.HIGHER_IS_BETTER,
        targetValue: 100,
        actualValue: 100,
        weight: 20,
      });

      expect(result.calculatedScore).toBe(100);
      expect(result.finalScore).toBe(100);
      expect(result.weightedScore).toBe(20);
      expect(result.status).toBe('COMPLETED');
    });

    it('Chỉ tiêu bình thường: Đạt một phần (80%)', () => {
      const result = service.calculateScore({
        scoringMethod: ScoringMethod.LINEAR,
        targetDirection: TargetDirection.HIGHER_IS_BETTER,
        targetValue: 200,
        actualValue: 160,
        weight: 10,
      });

      expect(result.calculatedScore).toBe(80);
      expect(result.finalScore).toBe(80);
      expect(result.weightedScore).toBe(8);
      expect(result.status).toBe('COMPLETED');
    });

    it('Rơi xuống dưới ngưỡng tối thiểu (minThreshold) => 0 điểm', () => {
      const result = service.calculateScore({
        scoringMethod: ScoringMethod.LINEAR,
        targetDirection: TargetDirection.HIGHER_IS_BETTER,
        targetValue: 100,
        actualValue: 65,
        minThreshold: 70, // Ngưỡng sàn 70
        weight: 15,
      });

      expect(result.calculatedScore).toBe(0);
      expect(result.finalScore).toBe(0);
      expect(result.weightedScore).toBe(0);
      expect(result.status).toBe('BELOW_MIN');
    });

    it('Chỉ tiêu nghịch (LOWER_IS_BETTER, ví dụ số lỗi/thời gian): Tốt hơn mục tiêu', () => {
      // Mục tiêu tối đa 10 lỗi. Thực tế chỉ có 5 lỗi => Tốt hơn 50%
      const result = service.calculateScore({
        scoringMethod: ScoringMethod.LINEAR,
        targetDirection: TargetDirection.LOWER_IS_BETTER,
        targetValue: 10,
        actualValue: 5,
        weight: 20,
        formulaConfig: { allowOverAchievement: true, maxScoreCap: 150 },
      });

      expect(result.calculatedScore).toBe(150);
      expect(result.status).toBe('OVER_ACHIEVED');
      expect(result.weightedScore).toBe(30);
    });

    it('Chỉ tiêu nghịch: Vượt quá ngưỡng lỗi tối đa (maxThreshold) => 0 điểm', () => {
      // Mục tiêu 10 lỗi, ngưỡng chịu đựng tối đa 15 lỗi. Thực tế 16 lỗi
      const result = service.calculateScore({
        scoringMethod: ScoringMethod.LINEAR,
        targetDirection: TargetDirection.LOWER_IS_BETTER,
        targetValue: 10,
        actualValue: 16,
        maxThreshold: 15,
        weight: 20,
      });

      expect(result.calculatedScore).toBe(0);
      expect(result.status).toBe('BELOW_MIN');
    });
  });

  describe('Công thức Bậc thang (STEP)', () => {
    const tieredConfig = {
      tiers: [
        { min: 0, max: 79.99, score: 0, label: 'Không đạt' },
        { min: 80, max: 89.99, score: 80, label: 'Đạt mức 1' },
        { min: 90, max: 99.99, score: 90, label: 'Đạt mức 2' },
        { min: 100, max: 119.99, score: 100, label: 'Đạt chuẩn' },
        { min: 120, max: 9999, score: 120, label: 'Xuất sắc' },
      ],
      allowOverAchievement: true,
      maxScoreCap: 120,
    };

    it('Rơi vào bậc 80 - 89.99% => 80 điểm', () => {
      const result = service.calculateScore({
        scoringMethod: ScoringMethod.STEP,
        targetValue: 100,
        actualValue: 85,
        formulaConfig: tieredConfig,
        weight: 10,
      });

      expect(result.calculatedScore).toBe(80);
      expect(result.finalScore).toBe(80);
      expect(result.weightedScore).toBe(8);
      expect(result.note).toBe('Đạt mức 1');
    });

    it('Rơi vào bậc Xuất sắc >= 120% => 120 điểm', () => {
      const result = service.calculateScore({
        scoringMethod: ScoringMethod.STEP,
        targetValue: 100,
        actualValue: 125,
        formulaConfig: tieredConfig,
        weight: 20,
      });

      expect(result.calculatedScore).toBe(120);
      expect(result.finalScore).toBe(120);
      expect(result.weightedScore).toBe(24);
      expect(result.note).toBe('Xuất sắc');
    });

    it('Rơi vào mức dưới 80% => 0 điểm', () => {
      const result = service.calculateScore({
        scoringMethod: ScoringMethod.STEP,
        targetValue: 100,
        actualValue: 75,
        formulaConfig: tieredConfig,
        weight: 10,
      });

      expect(result.calculatedScore).toBe(0);
      expect(result.finalScore).toBe(0);
    });
  });

  describe('Công thức Đạt / Không đạt (BINARY_PASS_FAIL)', () => {
    it('Đạt khi actualValue >= targetValue => 100 điểm', () => {
      const result = service.calculateScore({
        scoringMethod: ScoringMethod.BINARY_PASS_FAIL,
        targetValue: 1,
        actualValue: 1,
        weight: 15,
      });

      expect(result.calculatedScore).toBe(100);
      expect(result.finalScore).toBe(100);
      expect(result.weightedScore).toBe(15);
      expect(result.status).toBe('COMPLETED');
    });

    it('Không đạt khi actualValue < targetValue => 0 điểm', () => {
      const result = service.calculateScore({
        scoringMethod: ScoringMethod.BINARY_PASS_FAIL,
        targetValue: 1,
        actualValue: 0,
        weight: 15,
      });

      expect(result.calculatedScore).toBe(0);
      expect(result.finalScore).toBe(0);
      expect(result.weightedScore).toBe(0);
      expect(result.status).toBe('BELOW_MIN');
    });
  });

  describe('Xử lý Case Biên (Edge Cases)', () => {
    it('Case Chia cho 0: target = 0 và actual = 0 => 100 điểm an toàn', () => {
      const result = service.calculateScore({
        scoringMethod: ScoringMethod.LINEAR,
        targetValue: 0,
        actualValue: 0,
        weight: 10,
      });

      expect(result.calculatedScore).toBe(100);
      expect(result.finalScore).toBe(100);
      expect(result.weightedScore).toBe(10);
      expect(result.status).toBe('COMPLETED');
    });

    it('Case Chia cho 0 với LOWER_IS_BETTER: target = 0 nhưng actual > 0 => 0 điểm', () => {
      const result = service.calculateScore({
        scoringMethod: ScoringMethod.LINEAR,
        targetDirection: TargetDirection.LOWER_IS_BETTER,
        targetValue: 0,
        actualValue: 2,
        weight: 10,
      });

      expect(result.calculatedScore).toBe(0);
      expect(result.status).toBe('BELOW_MIN');
    });

    it('Case Thiếu dữ liệu (null / undefined / NaN) => Báo trạng thái MISSING_DATA', () => {
      const resultNull = service.calculateScore({
        scoringMethod: ScoringMethod.LINEAR,
        targetValue: 100,
        actualValue: null,
      });
      expect(resultNull.status).toBe('MISSING_DATA');
      expect(resultNull.finalScore).toBe(0);

      const resultNaN = service.calculateScore({
        scoringMethod: ScoringMethod.LINEAR,
        targetValue: 100,
        actualValue: NaN,
      });
      expect(resultNaN.status).toBe('MISSING_DATA');
      expect(resultNaN.finalScore).toBe(0);
    });

    it('Case Vượt 100%: Khi KHÔNG cho phép vượt (allowOverAchievement = false) => Cap ở 100', () => {
      const result = service.calculateScore({
        scoringMethod: ScoringMethod.LINEAR,
        targetValue: 100,
        actualValue: 150,
        formulaConfig: { allowOverAchievement: false },
        weight: 10,
      });

      expect(result.calculatedScore).toBe(100);
      expect(result.finalScore).toBe(100);
      expect(result.status).toBe('CAPPED');
    });

    it('Case Vượt 100%: Khi cho phép vượt có trần (maxScoreCap = 120) => Cap ở 120', () => {
      const result = service.calculateScore({
        scoringMethod: ScoringMethod.LINEAR,
        targetValue: 100,
        actualValue: 140, // 140%
        formulaConfig: { allowOverAchievement: true, maxScoreCap: 120 },
        weight: 10,
      });

      expect(result.calculatedScore).toBe(120);
      expect(result.finalScore).toBe(120);
      expect(result.status).toBe('CAPPED');
    });

    it('Case Điểm thưởng và Điểm trừ (Bonus & Penalty)', () => {
      const result = service.calculateScore({
        scoringMethod: ScoringMethod.LINEAR,
        targetValue: 100,
        actualValue: 90, // 90 điểm
        bonusPoints: 5,  // + 5
        penaltyPoints: 2, // - 2
        weight: 10,
      });

      expect(result.calculatedScore).toBe(90);
      expect(result.bonusPoints).toBe(5);
      expect(result.penaltyPoints).toBe(2);
      expect(result.finalScore).toBe(93); // 90 + 5 - 2 = 93
      expect(result.weightedScore).toBe(9.3);
    });
  });

  describe('Tổng hợp Bảng Điểm Toàn bộ KPI (calculateAssignmentTotal)', () => {
    it('Tính điểm chính xác toàn bộ bảng giao KPI gồm nhiều chỉ tiêu hỗn hợp', () => {
      const assignmentItems = [
        {
          scoringMethod: ScoringMethod.LINEAR,
          targetValue: 100,
          actualValue: 95,
          weight: 40,
        },
        {
          scoringMethod: ScoringMethod.BINARY_PASS_FAIL,
          targetValue: 1,
          actualValue: 1,
          weight: 30,
        },
        {
          scoringMethod: ScoringMethod.LINEAR,
          targetDirection: TargetDirection.LOWER_IS_BETTER,
          targetValue: 10,
          actualValue: 8,
          weight: 30,
        },
      ];

      const summary = service.calculateAssignmentTotal(assignmentItems);
      expect(summary.totalWeight).toBe(100);
      expect(summary.weightValidation.isValid).toBe(true);
      expect(summary.itemResults.length).toBe(3);
      // Item 1: 95 * 0.4 = 38
      // Item 2: 100 * 0.3 = 30
      // Item 3: (100 + (2/10)*100) = 120, capped 120 * 0.3 = 36
      // Total: 38 + 30 + 36 = 104
      expect(summary.totalWeightedScore).toBe(104);
    });
  });
});
