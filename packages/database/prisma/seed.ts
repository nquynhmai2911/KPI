import { PrismaClient, OperatingMode, RoleType, DataScopeType, PeriodType, PeriodStatus, GovClassification, EvaluationStatus, ReviewerType, AuditAction } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Hàm mã hóa password giả lập SHA256/bcrypt đơn giản cho seed script
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'kpi_salt_2026').digest('hex');
}

async function main() {
  console.log('🌱 Bắt đầu khởi tạo dữ liệu mẫu chuẩn nghiệp vụ tiếng Việt...');

  // 1. Khởi tạo Quyền (Permissions)
  const permissionsData = [
    { code: 'EVALUATION:VIEW_ALL', name: 'Xem tất cả đánh giá', resource: 'EVALUATION', action: 'VIEW' },
    { code: 'EVALUATION:SELF_SUBMIT', name: 'Tự đánh giá và nộp phiếu', resource: 'EVALUATION', action: 'CREATE' },
    { code: 'EVALUATION:PEER_REVIEW', name: 'Góp ý tập thể / Đánh giá 360', resource: 'EVALUATION', action: 'REVIEW' },
    { code: 'EVALUATION:MANAGER_ASSESS', name: 'Lãnh đạo trực tiếp nhận xét điểm', resource: 'EVALUATION', action: 'ASSESS' },
    { code: 'EVALUATION:HEAD_APPROVE', name: 'Người đứng đầu quyết định xếp loại', resource: 'EVALUATION', action: 'APPROVE' },
    { code: 'PERIOD:MANAGE', name: 'Tạo lập và cấu hình kỳ đánh giá', resource: 'PERIOD', action: 'MANAGE' },
    { code: 'PERIOD:LOCK', name: 'Khóa kỳ đánh giá', resource: 'PERIOD', action: 'LOCK' },
    { code: 'PERIOD:UNLOCK', name: 'Mở khóa đặc biệt kèm lý do', resource: 'PERIOD', action: 'UNLOCK' },
    { code: 'ORG:MANAGE', name: 'Quản lý cây đơn vị và chức vụ', resource: 'ORG', action: 'MANAGE' },
    { code: 'AUDIT:VIEW', name: 'Xem sổ nhật ký kiểm toán', resource: 'AUDIT', action: 'VIEW' },
  ];

  for (const perm of permissionsData) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
  }

  // 2. Khởi tạo Vai trò RBAC (Roles)
  const rolesData = [
    {
      code: RoleType.SUPER_ADMIN,
      name: 'Quản trị viên Hệ thống tối cao',
      description: 'Toàn quyền cấu hình hệ thống, quản lý tài khoản và giám sát toàn bộ hoạt động',
      dataScope: DataScopeType.ALL,
    },
    {
      code: RoleType.HR_ADMIN,
      name: 'Quản trị Nhân sự / Vụ Tổ chức Cán bộ',
      description: 'Quản lý cây tổ chức, thiết lập kỳ đánh giá, tiêu chí mẫu và giám sát tiến độ toàn cơ quan',
      dataScope: DataScopeType.ALL,
    },
    {
      code: RoleType.HEAD_OF_AGENCY,
      name: 'Người đứng đầu Cơ quan / Tổng Giám đốc',
      description: 'Thẩm quyền quyết định xếp loại cuối cùng theo NĐ 90/2020 và phê duyệt thưởng KPI',
      dataScope: DataScopeType.ALL,
    },
    {
      code: RoleType.DEPT_HEAD,
      name: 'Trưởng đơn vị / Trưởng phòng',
      description: 'Quản lý chỉ tiêu đơn vị, nhận xét đánh giá cán bộ cấp dưới và chủ trì họp tập thể',
      dataScope: DataScopeType.DEPARTMENT_AND_CHILDREN,
    },
    {
      code: RoleType.DEPT_DEPUTY,
      name: 'Phó Trưởng phòng / Cấp phó',
      description: 'Hỗ trợ quản lý đơn vị, tham gia cho ý kiến nhận xét',
      dataScope: DataScopeType.DEPARTMENT_ONLY,
    },
    {
      code: RoleType.EMPLOYEE,
      name: 'Cán bộ / Chuyên viên / Nhân viên',
      description: 'Tự đánh giá, nộp báo cáo kết quả công việc, tham gia góp ý tập thể',
      dataScope: DataScopeType.SELF_ONLY,
    },
    {
      code: RoleType.COUNCIL_MEMBER,
      name: 'Thành viên Hội đồng Thi đua Khen thưởng',
      description: 'Thẩm định hồ sơ, rà soát tỷ lệ khống chế HTXSNV (20%) trước khi trình Lãnh đạo',
      dataScope: DataScopeType.ALL,
    },
  ];

  const rolesMap = new Map();
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description, dataScope: r.dataScope },
      create: r,
    });
    rolesMap.set(r.code, role);
  }

  // 3. Khởi tạo Cây đơn vị tổ chức (Department Hierarchy)
  // Cấp 1: Cơ quan Bộ / Tập đoàn
  const deptRoot = await prisma.department.upsert({
    where: { code: 'BKH-01' },
    update: {},
    create: {
      code: 'BKH-01',
      name: 'Cơ quan Bộ Tác nghiệp & Điều hành Trung ương',
      level: 1,
      levelName: 'Cơ quan Bộ / Tập đoàn',
      path: '/BKH-01',
      operatingMode: OperatingMode.HYBRID,
      description: 'Cơ quan đầu não quản lý điều hành chiến lược chung',
      headcount: 120,
    },
  });

  // Cấp 2: Khối Chuyển đổi số (Gov / Tech)
  const deptTech = await prisma.department.upsert({
    where: { code: 'KCDS-02' },
    update: {},
    create: {
      code: 'KCDS-02',
      name: 'Cục Chuyển đổi số & Tác nghiệp CNTT',
      level: 2,
      levelName: 'Cục / Khối Nghiệp vụ',
      parentId: deptRoot.id,
      path: `${deptRoot.path}/KCDS-02`,
      operatingMode: OperatingMode.GOVERNMENT,
      description: 'Chịu trách nhiệm kiến tạo hạ tầng số, các hệ thống tác nghiệp và dữ liệu',
      headcount: 45,
    },
  });

  // Cấp 2: Khối Doanh nghiệp / Trung tâm Dịch vụ số (Doanh nghiệp)
  const deptEnterprise = await prisma.department.upsert({
    where: { code: 'TTDV-02' },
    update: {},
    create: {
      code: 'TTDV-02',
      name: 'Trung tâm Phát triển Dịch vụ Số & Khai thác Dữ liệu',
      level: 2,
      levelName: 'Trung tâm Sự nghiệp có thu / Doanh nghiệp',
      parentId: deptRoot.id,
      path: `${deptRoot.path}/TTDV-02`,
      operatingMode: OperatingMode.ENTERPRISE,
      description: 'Hoạt động theo cơ chế thị trường, áp dụng OKR/KPI và gắn quỹ lương thưởng',
      headcount: 35,
    },
  });

  // Cấp 3: Phòng ban thuộc Cục Chuyển đổi số
  const deptSoftware = await prisma.department.upsert({
    where: { code: 'PPM-03' },
    update: {},
    create: {
      code: 'PPM-03',
      name: 'Phòng Phát triển Phần mềm & Ứng dụng nghiệp vụ',
      level: 3,
      levelName: 'Phòng ban chuyên môn',
      parentId: deptTech.id,
      path: `${deptTech.path}/PPM-03`,
      operatingMode: OperatingMode.GOVERNMENT,
      description: 'Nghiên cứu, phát triển và triển khai các hệ thống phần mềm tác nghiệp',
      headcount: 20,
    },
  });

  // 4. Khởi tạo Vị trí chức danh (Positions)
  const posMinister = await prisma.position.upsert({
    where: { code: 'POS-MINISTER' },
    update: {},
    create: {
      code: 'POS-MINISTER',
      name: 'Thứ trưởng / Phó Tổng Giám đốc phụ trách',
      isLeadership: true,
      departmentId: deptRoot.id,
      description: 'Lãnh đạo cấp cao kiêm Người đứng đầu quyết định xếp loại',
    },
  });

  const posDirector = await prisma.position.upsert({
    where: { code: 'POS-DIRECTOR' },
    update: {},
    create: {
      code: 'POS-DIRECTOR',
      name: 'Cục trưởng / Giám đốc Trung tâm',
      isLeadership: true,
      departmentId: deptTech.id,
      description: 'Cán bộ lãnh đạo cấp Cục',
    },
  });

  const posHead = await prisma.position.upsert({
    where: { code: 'POS-HEAD' },
    update: {},
    create: {
      code: 'POS-HEAD',
      name: 'Trưởng phòng Chuyên môn',
      isLeadership: true,
      departmentId: deptSoftware.id,
      description: 'Trưởng phòng quản lý chuyên môn trực tiếp',
    },
  });

  const posSeniorOfficer = await prisma.position.upsert({
    where: { code: 'POS-SENIOR-OFFICER' },
    update: {},
    create: {
      code: 'POS-SENIOR-OFFICER',
      name: 'Chuyên viên chính / Kiến trúc sư Hệ thống',
      isLeadership: false,
      departmentId: deptSoftware.id,
      description: 'Công chức chuyên môn kỹ thuật cao cấp',
    },
  });

  const posOfficer = await prisma.position.upsert({
    where: { code: 'POS-OFFICER' },
    update: {},
    create: {
      code: 'POS-OFFICER',
      name: 'Chuyên viên / Kỹ sư Phần mềm',
      isLeadership: false,
      departmentId: deptSoftware.id,
      description: 'Công chức / Viên chức trực tiếp thực thi nhiệm vụ',
    },
  });

  // 5. Khởi tạo Người dùng mẫu (Users)
  const defaultPassword = hashPassword('MatKhau@2026!');

  // User 1: Người đứng đầu (Thứ trưởng Nguyễn Văn An)
  const userHead = await prisma.user.upsert({
    where: { username: 'lanhdao.an' },
    update: {},
    create: {
      username: 'lanhdao.an',
      email: 'lanhdao.an@kpi.gov.vn',
      fullName: 'Nguyễn Văn An',
      passwordHash: defaultPassword,
      phone: '0901234567',
      departmentId: deptRoot.id,
      positionId: posMinister.id,
    },
  });

  // User 2: Trưởng phòng (Lê Hoàng Minh)
  const userManager = await prisma.user.upsert({
    where: { username: 'truongphong.minh' },
    update: {},
    create: {
      username: 'truongphong.minh',
      email: 'minh.lh@kpi.gov.vn',
      fullName: 'Lê Hoàng Minh',
      passwordHash: defaultPassword,
      phone: '0902345678',
      departmentId: deptSoftware.id,
      positionId: posHead.id,
    },
  });

  // User 3: Chuyên viên chính (Trần Đức Thắng)
  const userOfficer1 = await prisma.user.upsert({
    where: { username: 'chuyenvien.thang' },
    update: {},
    create: {
      username: 'chuyenvien.thang',
      email: 'thang.td@kpi.gov.vn',
      fullName: 'Trần Đức Thắng',
      passwordHash: defaultPassword,
      phone: '0903456789',
      departmentId: deptSoftware.id,
      positionId: posSeniorOfficer.id,
    },
  });

  // User 4: Chuyên viên đồng nghiệp (Hoàng Thị Mai)
  const userOfficer2 = await prisma.user.upsert({
    where: { username: 'chuyenvien.mai' },
    update: {},
    create: {
      username: 'chuyenvien.mai',
      email: 'mai.ht@kpi.gov.vn',
      fullName: 'Hoàng Thị Mai',
      passwordHash: defaultPassword,
      phone: '0904567890',
      departmentId: deptSoftware.id,
      positionId: posOfficer.id,
    },
  });

  // Gán Roles cho Users
  const userRolesData = [
    { userId: userHead.id, roleId: rolesMap.get(RoleType.HEAD_OF_AGENCY)!.id },
    { userId: userHead.id, roleId: rolesMap.get(RoleType.SUPER_ADMIN)!.id },
    { userId: userManager.id, roleId: rolesMap.get(RoleType.DEPT_HEAD)!.id },
    { userId: userOfficer1.id, roleId: rolesMap.get(RoleType.EMPLOYEE)!.id },
    { userId: userOfficer2.id, roleId: rolesMap.get(RoleType.EMPLOYEE)!.id },
  ];

  for (const ur of userRolesData) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: ur.userId, roleId: ur.roleId } },
      update: {},
      create: ur,
    });
  }

  // Cập nhật managerId cho các đơn vị
  await prisma.department.update({ where: { id: deptRoot.id }, data: { managerId: userHead.id } });
  await prisma.department.update({ where: { id: deptSoftware.id }, data: { managerId: userManager.id } });

  // 6. Khởi tạo Kỳ đánh giá mẫu (Assessment Periods)
  // Kỳ 1: Cơ quan Nhà nước - Đánh giá xếp loại cán bộ công chức năm 2026 (NĐ 90/2020 & NĐ 48/2023)
  const periodGov = await prisma.assessmentPeriod.upsert({
    where: { code: 'PERIOD-GOV-2026' },
    update: {},
    create: {
      code: 'PERIOD-GOV-2026',
      name: 'Đánh giá, xếp loại chất lượng Cán bộ, Công chức, Viên chức năm 2026',
      periodType: PeriodType.ANNUAL,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2026-12-31T23:59:59Z'),
      evaluationDeadline: new Date('2026-11-30T23:59:59Z'),
      status: PeriodStatus.EVALUATING,
      operatingMode: OperatingMode.GOVERNMENT,
      rulesConfig: {
        maxExcellentPercentage: 20, // Khống chế tỷ lệ HTXSNV không quá 20% theo NĐ 48/2023/NĐ-CP
        quotaPolicy: 'WARNING_WITH_JUSTIFICATION',
        allowSelfRating: true,
        requireCollectiveMeetingMinutes: true, // Bắt buộc đính kèm biên bản họp tập thể
      },
      weightMatrix: {
        SELF: 0, // Theo NĐ 90, tự nhận xét không nhân trọng số cộng dồn mà là tham khảo
        DIRECT_MANAGER: 50,
        COLLECTIVE_PEER: 50,
      },
    },
  });

  // Kỳ 2: Doanh nghiệp - Đánh giá KPI & Hiệu suất Quý 4/2026
  const periodEnterprise = await prisma.assessmentPeriod.upsert({
    where: { code: 'PERIOD-CORP-2026-Q4' },
    update: {},
    create: {
      code: 'PERIOD-CORP-2026-Q4',
      name: 'Đánh giá KPI & Hiệu suất Công việc Quý IV/2026',
      periodType: PeriodType.QUARTERLY,
      startDate: new Date('2026-10-01T00:00:00Z'),
      endDate: new Date('2026-12-31T23:59:59Z'),
      evaluationDeadline: new Date('2026-12-25T23:59:59Z'),
      status: PeriodStatus.EVALUATING,
      operatingMode: OperatingMode.ENTERPRISE,
      rulesConfig: {
        gradingThresholds: {
          GRADE_A_PLUS: { minScore: 110, multiplier: 1.5, name: 'Xuất sắc vượt trội (A+)' },
          GRADE_A: { minScore: 100, multiplier: 1.2, name: 'Xuất sắc đạt chỉ tiêu (A)' },
          GRADE_B: { minScore: 85, multiplier: 1.0, name: 'Hoàn thành tốt (B)' },
          GRADE_C: { minScore: 70, multiplier: 0.7, name: 'Cần nỗ lực cải thiện (C)' },
          GRADE_D: { minScore: 0, multiplier: 0.0, name: 'Không đạt yêu cầu (D)' },
        },
      },
      weightMatrix: {
        SELF: 10,
        DIRECT_MANAGER: 60,
        COLLECTIVE_PEER: 20,
        SUBORDINATE: 10,
      },
    },
  });

  // 7. Khởi tạo Mẫu Tiêu chí Đánh giá (Criteria Template)
  // Mẫu theo Nghị định 90/2020 cho Chuyên viên không giữ chức vụ lãnh đạo
  const templateGovOfficer = await prisma.criteriaTemplate.upsert({
    where: { code: 'TMPL-GOV-OFFICER-2026' },
    update: {},
    create: {
      code: 'TMPL-GOV-OFFICER-2026',
      name: 'Bộ tiêu chí đánh giá Chuyên viên, Công chức theo Nghị định 90/2020/NĐ-CP',
      operatingMode: OperatingMode.GOVERNMENT,
      targetAudience: 'NON_LEADERSHIP',
      periodId: periodGov.id,
      description: 'Gồm 5 tiêu chí: Chính trị tư tưởng; Đạo đức lối sống; Tác phong lề lối; Ý thức kỷ luật; Kết quả thực hiện nhiệm vụ',
      items: {
        create: [
          {
            code: 'TC-01',
            name: 'Chính trị, tư tưởng',
            groupName: 'Tiêu chuẩn chung',
            description: 'Chấp hành chủ trương, đường lối của Đảng, chính sách, pháp luật của Nhà nước và các nguyên tắc tổ chức, kỷ luật của Đảng',
            weight: 15,
            scoringType: 'SCORE_SCALE',
            minScore: 0,
            maxScore: 15,
            sortOrder: 1,
          },
          {
            code: 'TC-02',
            name: 'Đạo đức, lối sống',
            groupName: 'Tiêu chuẩn chung',
            description: 'Không tham nhũng, quan liêu, cơ hội, vụ lợi; có tinh thần đoàn kết, tương trợ đồng chí, đồng nghiệp',
            weight: 15,
            scoringType: 'SCORE_SCALE',
            minScore: 0,
            maxScore: 15,
            sortOrder: 2,
          },
          {
            code: 'TC-03',
            name: 'Tác phong, lề lối làm việc',
            groupName: 'Tiêu chuẩn chung',
            description: 'Có trách nhiệm với công việc; năng động, sáng tạo, dám nghĩ, dám làm, linh hoạt trong thực hiện nhiệm vụ',
            weight: 10,
            scoringType: 'SCORE_SCALE',
            minScore: 0,
            maxScore: 10,
            sortOrder: 3,
          },
          {
            code: 'TC-04',
            name: 'Ý thức tổ chức kỷ luật',
            groupName: 'Tiêu chuẩn chung',
            description: 'Chấp hành sự phân công của tổ chức; thực hiện các quy định, quy chế, nội quy của cơ quan, đơn vị',
            weight: 10,
            scoringType: 'SCORE_SCALE',
            minScore: 0,
            maxScore: 10,
            sortOrder: 4,
          },
          {
            code: 'TC-05',
            name: 'Kết quả thực hiện chức trách, nhiệm vụ được giao',
            groupName: 'Kết quả công tác',
            description: 'Tiến độ và chất lượng thực hiện các công việc được giao theo kế hoạch công tác hoặc theo phân công đột xuất',
            weight: 50,
            scoringType: 'SCORE_SCALE',
            minScore: 0,
            maxScore: 50,
            sortOrder: 5,
          },
        ],
      },
    },
  });

  // 8. Khởi tạo Bản ghi Đánh giá Mẫu (Evaluation Record)
  const evalThang = await prisma.evaluationRecord.upsert({
    where: { periodId_userId: { periodId: periodGov.id, userId: userOfficer1.id } },
    update: {},
    create: {
      periodId: periodGov.id,
      userId: userOfficer1.id,
      departmentId: deptSoftware.id,
      operatingMode: OperatingMode.GOVERNMENT,
      status: EvaluationStatus.COLLECTIVE_REVIEW,
      selfScore: 94.5,
      selfAssessmentText: 'Trong năm 2026, bản thân luôn giữ vững lập trường tư tưởng chính trị, hoàn thành xuất sắc 100% nhiệm vụ xây dựng hệ thống phần mềm tác nghiệp trọng điểm của Bộ đúng tiến độ, không để xảy ra sai sót kỹ thuật nào.',
      isLocked: false,
    },
  });

  // 9. Khởi tạo Ghi vết Kiểm toán ban đầu (Audit Log)
  await prisma.auditLog.create({
    data: {
      userId: userOfficer1.id,
      username: userOfficer1.username,
      action: AuditAction.SUBMIT,
      entityName: 'EvaluationRecord',
      entityId: evalThang.id,
      newValues: {
        status: EvaluationStatus.COLLECTIVE_REVIEW,
        selfScore: 94.5,
      },
      reason: 'Cán bộ nộp phiếu tự đánh giá chất lượng năm 2026 để xin ý kiến tập thể đơn vị',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
  });

  console.log('✅ Hoàn thành khởi tạo dữ liệu mẫu seed thành công!');
  console.log('📌 Tài khoản mẫu:');
  console.log('   - Người đứng đầu: lanhdao.an / MatKhau@2026!');
  console.log('   - Trưởng phòng:   truongphong.minh / MatKhau@2026!');
  console.log('   - Chuyên viên:    chuyenvien.thang / MatKhau@2026!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi khởi tạo dữ liệu seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
