import { test, expect } from '@playwright/test';

test.describe('Dual-Mode KPI System - Comprehensive Workflow Tests', () => {
  const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Wait for the app header to load
    await expect(page.locator('header')).toBeVisible();
  });

  test('TC01: Chuyển đổi linh hoạt giữa 2 chế độ Nhà nước (NĐ 90/2020) và Doanh nghiệp (BSC/OKR)', async ({ page }) => {
    // Check initial mode indicator
    const modeBadge = page.locator('text=Nghị định 90/2020');
    await expect(modeBadge).toBeVisible();

    // Click mode toggle button to switch to Enterprise mode
    const toggleBtn = page.getByRole('button', { name: /Chuyển sang Chế độ Doanh nghiệp|Doanh nghiệp \(KPI\/BSC\)/i });
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      // Should now show Enterprise badge
      await expect(page.locator('text=KPI / OKR / BSC')).toBeVisible();
    }
  });

  test('TC02: Phase 3 - Cập nhật tiến độ & kiểm tra danh sách minh chứng', async ({ page }) => {
    // Navigate to Module 3: Theo dõi
    const trackingNav = page.getByRole('button', { name: /3\. Theo dõi tiến độ/i });
    await trackingNav.click();

    // Verify Module 3 loaded
    await expect(page.locator('text=Theo dõi & Thực hiện KPI')).toBeVisible();
    await expect(page.locator('text=Tiến độ của tôi')).toBeVisible();

    // Switch to "Duyệt số liệu (Quản lý)" tab
    await page.getByRole('tab', { name: /Duyệt số liệu \(Quản lý\)/i }).click();
    await expect(page.locator('text=Phê duyệt & Xác nhận số liệu')).toBeVisible();

    // Switch to "Lịch Check-in 1:1" tab
    await page.getByRole('tab', { name: /Lịch Check-in 1:1/i }).click();
    await expect(page.locator('text=Đặt lịch Check-in mới')).toBeVisible();

    // Switch to "Job nền & Cảnh báo" tab
    await page.getByRole('tab', { name: /Job nền & Cảnh báo/i }).click();
    await expect(page.locator('text=Chạy quét Job ngay')).toBeVisible();
  });

  test('TC03: Phase 4 - Quy trình đánh giá (Workflow & Hội nghị tập thể / 360)', async ({ page }) => {
    // Navigate to Module 4: Đánh giá
    const evalNav = page.getByRole('button', { name: /4\. Đánh giá & Xếp loại/i });
    await evalNav.click();

    await expect(page.locator('text=Quy trình Đánh giá & Xếp loại')).toBeVisible();

    // Test tab navigation
    await page.getByRole('tab', { name: /Duyệt hàng loạt/i }).click();
    await expect(page.locator('text=Duyệt hàng loạt kết quả')).toBeVisible();

    // Check Collective Meeting tab (Government Mode)
    await page.getByRole('tab', { name: /Hội nghị tập thể/i }).click();
    await expect(page.locator('text=Biên bản Hội nghị')).toBeVisible();
  });

  test('TC04: Phase 5 - Báo cáo, Lương thưởng KPI và Quy hoạch cán bộ', async ({ page }) => {
    // Navigate to Module 5: Báo cáo
    const reportNav = page.getByRole('button', { name: /5\. Báo cáo & Dashboard/i });
    await reportNav.click();

    await expect(page.locator('text=Báo cáo & Khai thác kết quả')).toBeVisible();

    // Verify tabs
    await page.getByRole('tab', { name: /Báo cáo chuyên đề/i }).click();
    await expect(page.locator('text=Xuất Excel / CSV')).toBeVisible();

    // Check Salary / Career Planning tab
    await page.getByRole('tab', { name: /Sử dụng kết quả/i }).click();
    await expect(page.locator('text=Hệ số lương thưởng KPI|Quy hoạch & Bổ nhiệm cán bộ')).toBeVisible();

    // Check Mẫu biểu tab
    await page.getByRole('tab', { name: /Mẫu biểu chính thức/i }).click();
    await expect(page.locator('text=Mẫu số 01')).toBeVisible();
  });
});
