# HƯỚNG DẪN THIẾT KẾ & QUY CHUẨN GIAO DIỆN (UI/UX GUIDELINES)
**Hệ thống Quản lý Đánh giá KPI & Hiệu suất Công tác**  
*Phiên bản: 2.5 (Refactor) • Áp dụng cho Cơ quan Nhà nước (NĐ 90/2020 & 48/2023) & Khối Doanh nghiệp*

---

## 1. NGUYÊN TẮC CỐT LÕI (CORE PRINCIPLES)

1. **Thống nhất toàn hệ thống**: Tuyệt đối không viết CSS riêng lẻ hoặc chèn style inline bừa bãi. Mọi màn hình phải sử dụng bộ component dùng chung (`src/components/ui` và `src/components/common`) và tokens trong `src/styles/design-tokens.css`.
2. **Hỗ trợ song song hai chế độ**:
   - **Chế độ Cơ quan Nhà nước**: Đánh giá theo Nghị định 90/2020/NĐ-CP và NĐ 48/2023/NĐ-CP, khống chế tỷ lệ Xuất sắc $\le 20\%$, thuật ngữ "cán bộ, công chức, viên chức", "tự nhận xét", "góp ý tập thể".
   - **Chế độ Doanh nghiệp**: Đo lường BSC/KPI/OKR, đường cong chuông Bell Curve, gắn lương thưởng, đánh giá 360 độ.
3. **Typography & Số liệu KPI**: Sử dụng font tiếng Việt chuẩn (*Be Vietnam Pro* hoặc *Inter*), mọi trường số liệu tiến độ, điểm số, trọng số bắt buộc áp dụng `tabular-nums` để chống nhảy số khi căn chỉnh cột.

---

## 2. HỆ THỐNG DESIGN TOKENS

### 2.1. Bảng màu (Color Palette)

| Loại token | Biến CSS | Mã màu Light | Mã màu Dark | Ứng dụng |
| :--- | :--- | :--- | :--- | :--- |
| **Primary** | `--color-primary-600` | `#1d4ed8` | `#3b82f6` | Nút chính, liên kết, thanh nhấn active sidebar |
| **Primary Light** | `--color-primary-50` | `#eff6ff` | `#172554` | Nền mục được chọn, chip thông tin |
| **Neutral Slate** | `slate-50` $\to$ `slate-950` | `#f8fafc` $\to$ `#0f172a` | `#020617` $\to$ `#f8fafc` | Nền body, viền card, màu văn bản |
| **Success** | `--color-success` | `#059669` | `#10b981` | Đạt chỉ tiêu ($\ge 90\%$), duyệt hồ sơ, đã xác nhận |
| **Warning** | `--color-warning` | `#d97706` | `#f59e0b` | Cần đôn đốc ($< 90\%$), chờ duyệt, sắp đến hạn |
| **Danger** | `--color-danger` | `#dc2626` | `#ef4444` | Quá hạn, từ chối, xóa dữ liệu, cảnh báo trần |
| **Info** | `--color-info` | `#0284c7` | `#38bdf8` | Thông tin hướng dẫn, tích hợp hệ thống |

### 2.2. Bảng màu Xếp loại Cố định Toàn Hệ thống (Mandatory)
*Quy định màu sắc xếp loại cố định, tuyệt đối không thay đổi giữa các màn hình:*

| Mức xếp loại | CSS Class / Token | Mã màu Solid | Mã màu Nền (Badge) |
| :--- | :--- | :--- | :--- |
| **Hoàn thành xuất sắc** (Loại A) | `--rank-excellent-solid` | `#7c3aed` (Tím) | `bg-purple-100 text-purple-800` |
| **Hoàn thành tốt** (Loại B) | `--rank-good-solid` | `#059669` (Xanh lục) | `bg-emerald-100 text-emerald-800` |
| **Hoàn thành nhiệm vụ** (Loại C) | `--rank-completed-solid` | `#2563eb` (Xanh dương) | `bg-blue-100 text-blue-800` |
| **Không hoàn thành** (Loại D) | `--rank-failed-solid` | `#dc2626` (Đỏ) | `bg-rose-100 text-rose-800` |

### 2.3. Typography & Spacing
- **Font gia đình**: `'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.
- **Thang cỡ chữ**:
  - `12px` (`text-xs`): Nhãn phụ, caption, breadcrumbs, ngày tháng.
  - `14px` (`text-sm`): Nội dung bảng biểu, nhãn form, văn bản chính.
  - `16px` (`text-base`): Tiêu đề mục con, nút bấm tiêu chuẩn.
  - `20px` (`text-xl`): Tiêu đề card, tiêu đề nhóm.
  - `24px` (`text-2xl`): Tiêu đề trang (`PageHeader`).
  - `32px` (`text-3xl` / `text-4xl`): Số liệu thống kê lớn (`StatCard`).
- **Spacing**: Tuân thủ nghiêm ngặt bội số 4px (`gap-1` = 4px, `gap-2` = 8px, `gap-3` = 12px, `gap-4` = 16px, `gap-6` = 24px, `gap-8` = 32px).
- **Bo góc (Border Radius)**: `8px` (`rounded-lg`) cho input/button, `12px` (`rounded-xl`) cho card, `16px` (`rounded-2xl`) cho modal lớn.
- **Viền**: Mảnh `1px` với `border-slate-200 dark:border-slate-800`.

---

## 3. QUY CHUẨN BỐ CỤC KHUNG (LAYOUT CONVENTIONS)

### 3.1. Sidebar (Điều hướng bên trái)
- **Kích thước**: Rộng cố định `260px` khi mở rộng; thu gọn còn `72px` khi bấm icon thu nhỏ.
- **Mobile**: Tự động chuyển thành Drawer trượt ra từ bên trái kèm backdrop overlay mờ `bg-slate-950/60`.
- **Nhóm chức năng**: Menu phân thành 4 nhóm rõ ràng:
  1. `TỔNG QUAN`: Bảng điều khiển Tổng quan.
  2. `QUẢN TRỊ TỔ CHỨC & CHỈ TIÊU`: Cơ cấu cán bộ, Thư viện KPI / Tiêu chí.
  3. `ĐÁNH GIÁ & THỰC HIỆN`: Phiếu của tôi, Đánh giá & Duyệt Nhóm (360°), Báo cáo & Xếp loại.
  4. `HỆ THỐNG & CÔNG CỤ`: Nhật ký kiểm toán, SSO, UI Kit (/dev/ui-kit).
- **Trạng thái Active**: Có nền `bg-primary-50 dark:bg-primary-950/60`, chữ đậm màu `text-primary-700`, và **thanh nhấn dọc (accent bar) rộng 4px ở mép trái**.
- **Chống vỡ chữ**: Luôn áp dụng `truncate` và thuộc tính `title` để hiển thị tooltip native khi tên mục dài.

### 3.2. Header (Thanh đỉnh)
- **Chiều cao**: Cố định `64px` (`h-16`).
- **Bên trái**: Nút Hamburger (trên mobile), Breadcrumb phân cấp, và Tiêu đề màn hình hiện hành.
- **Ở giữa/phải**:
  - **Công tắc chế độ**: `SegmentedControl` rõ ràng (Cơ quan Nhà nước vs Doanh nghiệp), không dùng badge nhỏ.
  - **Dropdown chọn kỳ đánh giá**.
  - **Nút Tìm kiếm nhanh (Ctrl+K)**.
  - **Chuông thông báo**: Có badge đỏ đếm số chưa đọc và popover xem danh sách thông báo.
  - **Nút chuyển đổi Giao diện Tối/Sáng (Dark/Light)**.
  - **Menu Công cụ demo**: Gom "Reset dữ liệu", "Chuyển nhanh tài khoản mẫu" vào dropdown Dev Tools.
  - **Menu người dùng**: Avatar, tên, vai trò, bảo mật 2FA, đổi mật khẩu, đăng xuất.

### 3.3. Vùng nội dung (Content Area)
- Container tối đa: `max-w-[1440px] w-full mx-auto`.
- Padding bao quanh: `p-6` (`24px`).
- Khoảng cách giữa các Card hoặc Section: `space-y-6` (`24px`).

---

## 4. DANH MỤC THƯ VIỆN COMPONENT DÙNG CHUNG

### 4.1. Components Nguyên Thủy (`src/components/ui/`)
- `Button`: Hỗ trợ các biến thể `primary`, `secondary`, `outline`, `ghost`, `danger`, `success`; kích cỡ `sm`, `md`, `lg`, `icon`; prop `loading` hiển thị spinner quay tròn.
- `Badge`: Gắn nhãn trạng thái và xếp loại (`excellent`, `good`, `completed`, `failed`), prop `dot` bật chấm tròn.
- `Card`: Gồm `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`. Padding chuẩn 24px.
- `Input`: Tích hợp icon trái/phải, thông báo lỗi `error`, hỗ trợ dark mode mượt mà.
- `Select`: Dropdown styled với icon `ChevronDown`.
- `SegmentedControl`: Chuyển đổi trạng thái dạng tab trượt viên thuốc (Pill Slider), có hiệu ứng chuyển động.
- `Skeleton`: Placeholder nạp dữ liệu động (text, avatar, card).

### 4.2. Components Nghiệp Vụ & Dùng Chung (`src/components/common/`)
- `PageHeader`: Breadcrumb link, Tiêu đề `<h1>`, phụ đề mô tả, badge trạng thái và cụm action buttons.
- `StatCard`: Thẻ thống kê 4 cột: nhãn chỉ số, số liệu lớn `tabular-nums`, đơn vị, xu hướng tăng/giảm (+/- %) có màu ngữ nghĩa, icon đại diện và ghi chú kỳ so sánh.
- `SectionCard`: Thẻ khối chức năng có tiêu đề, mô tả và vùng hành động (action header slot).
- `StatusBadge`: Map tự động từ các enum hệ thống sang nhãn tiếng Việt và màu sắc chuẩn (DRAFT, SUBMITTED, APPROVED, REJECTED, IN_PROGRESS, OVERDUE, LOCKED...).
- `ProgressBar`: Thanh tiến độ KPI tự động chuyển màu theo ngưỡng:
  - $< 50\%$: Đỏ (nguy cơ chậm trễ).
  - $50\% - 79\%$: Cam/vàng (cần đôn đốc).
  - $80\% - 100\%$: Xanh lục (đạt yêu cầu).
  - $> 100\%$: Tím (vượt kế hoạch).
- `DataTable`: Bảng dữ liệu dựa trên tiêu chuẩn TanStack Table:
  - Sticky Header khi cuộn.
  - Sắp xếp cột đa chiều (Sorting).
  - Tìm kiếm và lọc toàn văn bản (Search filter).
  - Bật/tắt ẩn hiện cột (Column visibility picker).
  - Phân trang chuẩn với lựa chọn số dòng trên trang (Pagination).
  - Tích hợp sẵn Skeleton khi tải, EmptyState khi rỗng và ErrorState khi có lỗi.
- `EmptyState`: Trạng thái rỗng với icon minh họa, tiêu đề, hướng dẫn và nút thao tác chính.
- `ErrorState`: Trạng thái lỗi với icon cảnh báo và nút "Thử lại".
- `ConfirmDialog`: Hộp thoại xác nhận hành động nguy hiểm (xóa, duyệt, khóa), hỗ trợ phím `Escape`.
- `FormField`: Bao bọc ô nhập liệu với nhãn, dấu sao bắt buộc (`*`), mô tả gợi ý và thông báo lỗi validation.
- `UserAvatarCell`: Hiển thị ảnh đại diện tròn, họ tên in đậm, chức danh và phòng ban trực thuộc.
- `DateText`: Luôn định dạng ngày tháng theo chuẩn Việt Nam `dd/MM/yyyy` (kèm giờ phút nếu yêu cầu).
- `NumberText`: Luôn định dạng số theo chuẩn `vi-VN` (phân tách hàng nghìn bằng dấu chấm `.`).
- `QuickSearchModal`: Cửa sổ tìm kiếm nhanh toàn hệ thống kích hoạt bằng phím tắt **Ctrl + K**.

---

## 5. TIÊU CHUẨN TIẾP CẬN (ACCESSIBILITY - WCAG AA) & RESPONSIVE

1. **Độ tương phản**: Mọi cặp màu chữ và màu nền đều đạt tỷ lệ tương phản tối thiểu **4.5:1** theo chuẩn WCAG AA.
2. **Focus Ring**: Tất cả các thành phần tương tác (Button, Input, Select, Link) bắt buộc có viền focus rõ ràng:
   `focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`.
3. **Thao tác Bàn phím**:
   - `Ctrl + K`: Mở nhanh thanh tìm kiếm chức năng / cán bộ / KPI.
   - `Esc`: Đóng toàn bộ Modal, Drawer, QuickSearch hoặc Popover đang mở.
   - `Arrow Up / Down` và `Enter`: Di chuyển và chọn trong danh sách tìm kiếm.
4. **Hỗ trợ Screen Reader**: Mọi button chỉ chứa icon (như nút thu gọn sidebar, đóng modal, ba chấm) bắt buộc phải có thuộc tính `aria-label` và `title`.
5. **Điểm ngắt Responsive (Breakpoints)**:
   - **375px (Mobile)**: 1 cột duy nhất, ẩn nhãn text phụ, chuyển sidebar thành drawer, hiển thị thẻ cuộn ngang.
   - **768px (Tablet)**: Grid 2 cột cho StatCards, hiển thị segmented control rút gọn.
   - **1280px (Laptop)**: Grid 4 cột cho StatCards, bố cục 2/3 biểu đồ cột + 1/3 biểu đồ donut.
   - **1920px (Desktop / 4K)**: Giới hạn nội dung chính trong container `max-w-[1440px]` để chống giãn trải quá rộng làm mỏi mắt người dùng.

---

## 6. KIỂM THỬ TRỰC QUAN (DEV UI-KIT)
Toàn bộ các component, biến thể và trạng thái được trình diễn trực quan tại màn hình:
👉 **Menu Hệ thống $\to$ UI Kit & Thư viện Component (Dev)** (Route / Mode: `ui-kit`).
Kiểm tra tại đây để đối chiếu trước khi phát triển các Phase tiếp theo.
