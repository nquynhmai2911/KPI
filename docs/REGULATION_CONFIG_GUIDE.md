# HƯỚNG DẪN CẤU HÌNH QUY CHẾ ĐÁNH GIÁ (REGULATION CONFIGURATION GUIDE)
**Áp dụng cho Chế độ Nhà nước (NĐ 90/2020 & NĐ 48/2023) và Doanh nghiệp (BSC/OKR)**

---

## 1. CƠ SỞ PHÁP LÝ & QUY CHUẨN NHÀ NƯỚC

Hệ thống được thiết kế đáp ứng chặt chẽ các văn bản pháp luật hiện hành của Chính phủ Việt Nam:
1. **Nghị định số 90/2020/NĐ-CP** ngày 13/8/2020 của Chính phủ về đánh giá, xếp loại chất lượng cán bộ, công chức, viên chức.
2. **Nghị định số 48/2023/NĐ-CP** ngày 17/7/2023 của Chính phủ sửa đổi, bổ sung một số điều của Nghị định số 90/2020/NĐ-CP.
3. **Thông tư số 08/2013/TT-BNV** của Bộ Nội vụ hướng dẫn thực hiện chế độ nâng bậc lương thường xuyên và nâng bậc lương trước thời hạn đối với cán bộ, công chức, viên chức.

---

## 2. NGUYÊN TẮC XẾP LOẠI 4 MỨC CHUẨN QUỐC GIA

### 2.1. Bốn mức xếp loại chất lượng
1. **Hoàn thành xuất sắc nhiệm vụ (Loại A):**
   - Đạt $100\%$ chỉ tiêu nhiệm vụ theo kế hoạch, trong đó có ít nhất $50\%$ chỉ tiêu hoàn thành vượt mức hoặc có sáng kiến, giải pháp đổi mới được cấp thẩm quyền công nhận.
   - Điểm số tổng hợp: $\ge 90$ điểm.
2. **Hoàn thành tốt nhiệm vụ (Loại B):**
   - Đạt $100\%$ chỉ tiêu nhiệm vụ theo tiến độ và chất lượng yêu cầu.
   - Điểm số tổng hợp: Từ $80$ đến dưới $90$ điểm.
3. **Hoàn thành nhiệm vụ (Loại C):**
   - Các chỉ tiêu cơ bản hoàn thành; khối lượng công việc chưa hoàn thành hoặc chậm trễ không vượt quá $20\%$.
   - Điểm số tổng hợp: Từ $65$ đến dưới $80$ điểm.
4. **Không hoàn thành nhiệm vụ (Loại D):**
   - Có từ $20\%$ chỉ tiêu nhiệm vụ trở lên không đạt yêu cầu hoặc chậm tiến độ nghiêm trọng.
   - Hoặc bị xử lý kỷ luật trong kỳ đánh giá.
   - Điểm số tổng hợp: Dưới $65$ điểm.

---

## 3. CÁC QUY TẮC RÀNG BUỘC PHÁP LÝ BẮT BUỘC

### 3.1. Khống chế Trần Tỷ lệ Hoàn thành Xuất sắc $\le 20\%$ (Điều 20 NĐ 90/2020)
- **Quy tắc:** Tỷ lệ cán bộ, công chức, viên chức được xếp loại "Hoàn thành xuất sắc nhiệm vụ" không được vượt quá $20\%$ tổng số người được xếp loại "Hoàn thành tốt nhiệm vụ" trở lên trong cùng cơ quan, đơn vị.
- **Cấu hình trên hệ thống:**
  ```typescript
  quotaPolicy: 'WARNING_WITH_JUSTIFICATION' | 'STRICT_BLOCK'
  ```
  - *Chế độ Cảnh báo (Mặc định):* Cho phép gửi kèm giải trình nếu có thành tích đặc biệt xuất sắc đột xuất.
  - *Chế độ Chặn cứng:* Khóa nút Duyệt nếu tỷ lệ vượt quá $20.0\%$.

### 3.2. Đánh giá Người đứng đầu theo Kết quả Đơn vị
- **Quy tắc:** Mức xếp loại của người đứng đầu không được cao hơn mức xếp loại của cơ quan, tổ chức, đơn vị do mình phụ trách trực tiếp.
- **Công thức tính điểm kết hợp:**
  $$\text{Điểm tổng hợp} = (\text{Điểm cá nhân} \times 30\%) + (\text{Tỷ lệ hoàn thành đơn vị} \times 70\%)$$

### 3.3. Điều kiện Loại trừ do Xử lý Kỷ luật
- Cán bộ, công chức, viên chức bị kỷ luật khiển trách, cảnh cáo: **Tuyệt đối không được xếp loại Xuất sắc hoặc Tốt**; hệ thống tự động khóa trần ở mức "Hoàn thành nhiệm vụ".
- Cán bộ bị kỷ luật cách chức, buộc thôi việc: Hệ thống tự động chuyển sang mức "Không hoàn thành nhiệm vụ".

---

## 4. QUY CHẾ CHẾ ĐỘ DOANH NGHIỆP (ENTERPRISE KPI/BSC/OKR)

### 4.1. Thẻ điểm Cân bằng (Balanced Scorecard - BSC)
Hệ thống hỗ trợ phân bổ trọng số 4 nhóm mục tiêu:
1. **Tài chính (Financial):** Doanh thu, lợi nhuận, chi phí, dòng tiền (Trọng số gợi ý: $30\% - 40\%$).
2. **Khách hàng (Customer):** CSAT, NPS, tỷ lệ giữ chân khách hàng (Trọng số gợi ý: $20\% - 25\%$).
3. **Quy trình nội bộ (Internal Process):** Thời gian SLA, tỷ lệ lỗi, tiến độ dự án (Trọng số gợi ý: $20\% - 25\%$).
4. **Học hỏi & Phát triển (Learning & Growth):** Đào tạo, chứng chỉ, văn hóa đổi mới (Trọng số gợi ý: $10\% - 15\%$).

### 4.2. Hệ số Lương thưởng KPI ($K_{KPI}$)
Kết quả đánh giá xếp loại cuối kỳ được liên kết trực tiếp với quỹ thưởng:
- **Xếp loại A (Xuất sắc, $\ge 90$ điểm):** $K_{KPI} = 1.50$ ($150\%$ mức thưởng định biên).
- **Xếp loại B (Tốt, $80 - 89$ điểm):** $K_{KPI} = 1.20$ ($120\%$ mức thưởng định biên).
- **Xếp loại C (Hoàn thành, $65 - 79$ điểm):** $K_{KPI} = 1.00$ ($100\%$ mức thưởng định biên).
- **Xếp loại D (Không hoàn thành, $< 65$ điểm):** $K_{KPI} = 0.00$ ($0\%$ thưởng).
