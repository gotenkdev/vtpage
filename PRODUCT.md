# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Người sáng tạo nội dung tại Việt Nam muốn nhận donate từ người hâm mộ (fan). Nhóm chính là streamer/gamer livestream, nhận donate trực tiếp khi đang live và hiện thông báo lên overlay trên màn hình stream. Trang phải đủ rộng cho mọi loại nhà sáng tạo (KOL, artist, podcaster, blogger) dùng trang cá nhân để nhận donate, không nhất thiết livestream. Việc cần làm: tạo trang nhận donate nhanh, không cần code, tiền về thẳng tài khoản của mình.

## Product Purpose

VT Page là nền tảng kỹ thuật số giúp tạo trang cá nhân, mở cửa hàng online, nhận donate và booking. Điểm bán chính hiện tại là tạo trang nhận donate trong 5 giây, miễn phí cho người mới. Thành công là nhà sáng tạo đăng ký và tạo được username `vtpage.com/<username>` ngay.

## Positioning

Cổng thanh toán gắn trên trang donate là tài khoản của chính nhà sáng tạo. VT Page đứng ngoài dòng tiền, chỉ nhận tín hiệu "đã thanh toán" để bắn thông báo lên màn hình. Tiền chưa từng đi qua tài khoản VT Page nên nền tảng không thể giữ tiền. Đối thủ mô hình ví trung gian không thể nói đúng điều này: không số dư chờ, không mốc rút tối thiểu, không phí rút, không lịch đối soát.

## Operating Context

Ngôn ngữ giao diện: tiếng Việt (một số nhãn đăng nhập giữ tiếng Anh: Sign in, Sign up, Continue with Google/Apple, Email, Password). Đơn vị tiền VND. Đăng ký/đăng nhập hiện là bản demo lưu trong localStorage, không có backend thật (xem `auth.js`). Trang tĩnh HTML/CSS/JS thuần, triển khai dạng static (có `.nojekyll`).

## Capabilities and Constraints

- Ba trang hiện có: `index.html` (trang chủ), `sign-in.html`, `sign-up.html`. Dùng chung `style.css` và `auth.js`.
- Toàn bộ nội dung chữ phải giữ nguyên khi thiết kế lại. Chỉ được đổi hình thức, không đổi lời.
- Mọi icon dùng SVG (không emoji, không ký tự thay icon). Cần favicon riêng.
- Phải giữ hành vi của `auth.js`: hiện/ẩn mật khẩu, kiểm tra form, lưu phiên, header đã đăng nhập (chat, thông báo, avatar, đăng xuất).
- Cột "PHÁP LÝ" ở footer hiện chưa có nội dung: chưa được bịa liên kết pháp lý.
- Hai icon mạng xã hội ở footer: Facebook và Discord (đã xác nhận). Chưa có URL thật.

## Brand Commitments

Tên "VT Page". Pháp nhân: CÔNG TY TNHH VT ESPORTS. Không có màu, logo hay typeface nào bị người dùng ràng buộc; nhận diện thị giác hiện tại chỉ là bằng chứng, không phải cam kết.

## Evidence on Hand

Các số liệu hiện có trên trang là **dữ liệu minh hoạ chưa xác thực**, người dùng sẽ thay bằng số thật: "+15.000 nhà sáng tạo", ví dụ 100.000 VND lúc 21:04:37 về lúc 21:04:39, "Vietcombank · **** 8842", "Miễn phí trọn đời". Giữ nguyên chữ nhưng không thêm claim, khách hàng, lời chứng thực, benchmark hay giá mới. Chưa có ảnh khách hàng, logo đối tác hay ảnh chụp sản phẩm thật.

## Product Principles

1. Tiền về thẳng tài khoản của nhà sáng tạo là điều duy nhất nền tảng khác không thể nói thật; mọi bề mặt phải làm điều đó thấy được, không chỉ được nói ra.
2. Nhanh là lời hứa: 5 giây, 30 giây, "ngay lập tức". Giao diện phải cảm giác nhanh và ít bước.
3. Không bịa bằng chứng. Dữ liệu minh hoạ được phép làm vật liệu thiết kế nhưng phải là dữ liệu minh hoạ.
4. Nội dung chữ là chân lý sản phẩm; hình thức phục vụ nội dung, không viết lại nó.

## Accessibility & Inclusion

Chưa có tiêu chuẩn bắt buộc riêng. Áp dụng mặc định của web: tương phản đủ, focus rõ ràng, `prefers-reduced-motion` được tôn trọng, dùng được bằng bàn phím, đọc được trên điện thoại.
