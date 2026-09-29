/*
 * Ngôn ngữ website (Tiếng Việt / English). Tiếng Việt là bản gốc trong HTML/JS; khi chọn English, chữ được thay NGAY trên trang
 * theo từ điển bên dưới (khớp nguyên câu, hoặc theo mẫu có số), kể cả chữ do code thêm vào sau. Chữ chưa có trong từ điển giữ
 * nguyên tiếng Việt. Không bao giờ dịch nội dung người dùng: vùng có [data-i18n-skip], ô nhập, textarea.
 *
 * Chọn ngôn ngữ: nút VI/EN cạnh nút tạm dừng chuyển động (nhớ trong trình duyệt). Chưa chọn thì theo Quốc gia trong Hồ sơ cá
 * nhân (khác Việt Nam → English); còn lại là Tiếng Việt.
 */
(function () {
  'use strict';
  const KEY = 'vtp-lang';
  const AUTO_KEY = 'vtp-lang-auto';

  // ---- Từ điển: câu tiếng Việt (đã gộp khoảng trắng, bỏ đầu/cuối) → English ----
  const EN = {
    // Thanh đầu trang, chung
    'Tạm dừng chuyển động': 'Pause motion',
    'Bật chuyển động': 'Play motion',
    'Đăng nhập': 'Sign in',
    'Đăng ký': 'Sign up',
    'Đăng xuất': 'Sign out',
    'Tin nhắn': 'Messages',
    'Thông báo': 'Notifications',
    'Tài khoản': 'Account',
    'Ẩn thông báo': 'Dismiss',
    'Đóng': 'Close',
    'Đang xử lý...': 'Processing...',
    'Đã sao chép': 'Copied',
    'Sao chép': 'Copy',
    'Chỉnh sửa': 'Edit',
    'Thay đổi': 'Change',
    'Xoá': 'Delete',
    'Bạn:': 'You:',
    'Chưa có tin nhắn': 'No messages yet',
    'Xem tất cả': 'See all',
    'Chưa có thông báo': 'No notifications',
    'Không tải được. Hãy tải lại trang.': 'Could not load. Please reload the page.',


    // Menu tài khoản, thanh bên thiết lập
    'Menu tài khoản': 'Account menu',
    'Chưa có cuộc trò chuyện nào.': 'No conversations yet.',
    'Xem tất cả tin nhắn': 'See all messages',
    'Chưa có thông báo nào từ hệ thống.': 'No system notifications yet.',
    'Cá nhân': 'Personal',
    'Trang': 'Page',
    'Hoạt động cá nhân': 'My activity',
    'Đơn hàng': 'Orders',
    'Hồ sơ cá nhân': 'Profile',
    'Tài khoản & bảo mật': 'Account & security',
    'Thiết lập trang donate': 'Donation page settings',
    'Trang của bạn': 'Your page',
    'Đang tải…': 'Loading…',
    'Hồ sơ trang': 'Page profile',
    'Lịch sử donate': 'Donation history',
    'Cài đặt Donate': 'Donation settings',
    'Xem trang donate': 'View donation page',
    'Chưa có trang': 'No page yet',
    'Tạo hồ sơ để nhận donate': 'Create a profile to receive donations',
    'Thiết lập': 'Settings',
    'Nhóm thiết lập': 'Settings groups',
    'Menu thiết lập': 'Settings menu',
    'Tài khoản của bạn': 'Your account',
    'sắp có': 'coming soon',
    'Bảng xếp hạng Donate': 'Donation leaderboard',
    'Đơn hàng của trang': 'Page orders',
    'Đơn hàng cá nhân': 'My orders',
    'Tên hiển thị, ảnh đại diện và lời giới thiệu hiện trên trang donate của bạn.':
      'The display name, avatar and bio shown on your donation page.',
    'Quản lý các kênh nhận donate. Tài khoản ngân hàng đầu tiên dùng được ngay; đổi tài khoản khác thì cần được duyệt.':
      'Manage how you receive donations. Your first bank account works right away; switching to another account needs approval.',
    'Các khoản donate đã nhận. Duyệt hoặc ẩn khoản cần xem trước khi hiện lên stream.':
      'Donations you have received. Approve or hide flagged ones before they appear on stream.',
    'Top người ủng hộ theo ngày, tháng, tất cả và widget hiển thị trên live.':
      'Top supporters by day, month and all time, plus a widget for your stream.',
    'Mọi lệnh donate đã tạo và khoản đã nhận: tìm kiếm, xem chi tiết, xuất dữ liệu.':
      'Every donation order and payment received: search, view details, export data.',
    'Toàn bộ công cụ tương tác trên live: thông báo donate, âm thanh, giọng đọc, ghi âm, phát nhạc, mục tiêu.':
      'All your live interaction tools: donation alerts, sounds, text-to-speech, voice messages, music and goals.',
    'Một hồ sơ nhất quán cho mọi hoạt động của bạn trên VT Pay.': 'One consistent profile for everything you do on VT Pay.',
    'Các lệnh donate bạn đã tạo: tìm kiếm, xem trạng thái và chi tiết.': 'Donation orders you created: search, check status and details.',
    'Trò chuyện giữa bạn và các trang, hoặc người xem nhắn cho trang của bạn.':
      'Chats between you and pages, or viewers messaging your page.',
    'Các trang bạn đang theo dõi.': 'Pages you follow.',
    'Xác thực 2 lớp, đổi mật khẩu và email đăng nhập.': 'Two-factor authentication, password and sign-in email.',
    'VT Pay — Nhận donate trong 5 giây': 'VT Pay — Get donations in 5 seconds',
    'Hãy thử': 'Try to',
    'gửi lại liên kết': 'resend the link',
    'đăng ký lại': 'sign up again',
    'Minh donate 50.000 đ': 'Minh donated 50.000 đ',
    'CÔNG TY TNHH VT ESPORTS': 'VT ESPORTS COMPANY LIMITED',
    'Liên kết đã dùng hoặc hết hạn. Hãy': 'The link was already used or has expired. Please',

    // Trang chủ
    'Nhận donate trong': 'Get donations in',
    '5 GIÂY': '5 SECONDS',
    'Tạo trang nhận donate': 'Create your donation page in',
    '5 giây': '5 seconds',
    '. Không cần code, miễn phí cho người mới.': '. No code needed, free to start.',
    'Bắt đầu ngay': 'Get started',
    'Xem Demo': 'View demo',
    'nhà sáng tạo': 'creators',
    'Nền tảng donate cho NHÀ SÁNG TẠO': 'The donation platform for CREATORS',
    'Fan donate cho bạn,': 'Fans donate to you,',
    'tiền về thẳng tài khoản': 'money goes straight to your account',
    'Cổng thanh toán gắn trên trang donate là tài khoản của chính bạn. VT Pay đứng ngoài dòng tiền — chỉ nhận tín hiệu "đã thanh toán" để bắn thông báo lên màn hình.':
      'The payment method on your donation page is your own bank account. VT Pay never touches the money — it only receives a "paid" signal to show the alert on your stream.',
    'KHÁC BIỆT LỚN NHẤT': 'THE BIGGEST DIFFERENCE',
    'Về tài khoản ngay lập tức': 'Arrives in your account instantly',
    'Ngân hàng báo biến động số dư cùng lúc overlay hiện thông báo cho fan.':
      'Your bank notifies you of the deposit at the same moment the overlay shows the alert to your fans.',
    'Không có ví trung gian': 'No middleman wallet',
    'Không số dư chờ, không mốc rút tối thiểu, không phí rút, không lịch đối soát.':
      'No pending balance, no minimum payout, no withdrawal fees, no settlement schedule.',
    'Chìa khoá nằm trong tay bạn': 'You hold the keys',
    'Bạn tự gắn tài khoản nhận tiền và gỡ ra bất cứ lúc nào trong phần Cài đặt thanh toán.':
      'You add your receiving account yourself and can remove it any time in Payment settings.',
    'VT Pay không thể giữ tiền của bạn': 'VT Pay cannot hold your money',
    'Không phải lời hứa — tiền chưa từng đi qua tài khoản VT Pay nên không có gì để giữ.':
      'Not a promise — the money never passes through a VT Pay account, so there is nothing to hold.',
    'CÙNG MỘT KHOẢN': 'THE SAME DONATION',
    'Đối chiếu': 'Compare',
    'MÔ HÌNH CÓ VÍ': 'WALLET MODEL',
    'Fan trả': 'Fan pays',
    'Nằm trong ví nền tảng': 'Sits in the platform wallet',
    'chờ đối soát': 'awaiting settlement',
    'Đủ mốc mới rút được': 'Withdraw only after a minimum',
    'phải bấm yêu cầu rút': 'you must request a payout',
    'Trừ phí rút': 'Withdrawal fee deducted',
    'tuỳ nền tảng': 'depends on the platform',
    'Sau vài ngày · đã trừ phí rút': 'After a few days · minus fees',
    'Vào thẳng tài khoản của bạn': 'Straight into your account',
    'Hết chặng — không còn bước nào': 'Done — no more steps',
    'Đã về lúc 21:04:39': 'Arrived at 21:04:39',
    'Hướng dẫn cho người xem': 'Guide for viewers',
    'Donate cho streamer': 'Donate to a streamer',
    'chỉ với một lần quét': 'with a single scan',
    'Không cần tài khoản, không cần cài thêm gì. Mở app ngân hàng bạn đang dùng, quét mã QR trên trang donate — số tiền và nội dung đã điền sẵn.':
      'Nothing extra to install. Open your banking app and scan the QR code on the donation page — the amount and transfer note are filled in for you.',
    'Mở trang donate của streamer': "Open the streamer's donation page",
    'Vào vtpay.vn/tên-streamer, chọn số tiền, nhập tên và lời nhắn rồi bấm tạo lệnh.':
      'Go to vtpay.vn/streamer-name, pick an amount, add your message and create the order.',
    'Quét mã QR bằng app ngân hàng': 'Scan the QR code with your banking app',
    'Mở app ngân hàng hoặc ví, chọn Quét QR và đưa camera vào mã trên màn hình.':
      'Open your banking or wallet app, choose Scan QR and point the camera at the code on screen.',
    'Kiểm tra số tiền và nội dung': 'Check the amount and note',
    'Mọi thứ đã điền sẵn. Giữ nguyên nội dung chuyển khoản — đó là mã để hệ thống nhận ra donate của bạn.':
      'Everything is prefilled. Keep the transfer note unchanged — it is the code that identifies your donation.',
    'Xác nhận — donate hiện lên stream': 'Confirm — your donation shows up on stream',
    'Tiền vào thẳng tài khoản streamer, lời nhắn của bạn bật lên màn hình livestream sau vài giây.':
      "The money goes straight to the streamer's account and your message pops up on the livestream within seconds.",
    'Chúc stream vui nha!': 'Have a great stream!',
    'Ngân hàng của bạn': 'Your bank',
    'Số dư': 'Balance',
    'Quét QR': 'Scan QR',
    'Chuyển tiền': 'Transfer',
    'Thanh toán': 'Payments',
    'Tiết kiệm': 'Savings',
    'Đưa mã QR vào khung': 'Place the QR code in the frame',
    'Xác nhận chuyển khoản': 'Confirm transfer',
    'Người nhận': 'Recipient',
    'Số tiền': 'Amount',
    'Nội dung': 'Note',
    'Xác nhận': 'Confirm',
    'Chuyển khoản thành công': 'Transfer successful',
    'Sẵn sàng bắt đầu?': 'Ready to start?',
    'Tham gia cùng cộng đồng nhà sáng tạo ngay hôm nay. Chỉ mất 30 giây để bắt đầu.':
      'Join the creator community today. It only takes 30 seconds to get started.',
    'Tạo ngay': 'Create now',
    'Không cần thẻ tín dụng': 'No credit card required',
    'Miễn phí trọn đời': 'Free forever',
    'VT Pay là nền tảng kỹ thuật số. Giúp bạn nhanh chóng tạo trang cá nhân, mở cửa hàng online, nhận donate và booking dễ dàng.':
      'VT Pay is a digital platform that helps you quickly create a personal page, open an online store, and receive donations and bookings with ease.',
    'Mã số thuế: 0319668560.': 'Tax code: 0319668560.',
    'Trụ sở công ty: Phường Bến Thành, Quận 1, Thành phố Hồ Chí Minh.':
      'Head office: Ben Thanh Ward, District 1, Ho Chi Minh City, Vietnam.',
    'PHÁP LÝ': 'LEGAL',
    'Về chúng tôi': 'About us',
    'Điều khoản sử dụng': 'Terms of Service',
    'Chính sách bảo mật': 'Privacy Policy',
    'Chính sách giao nhận': 'Delivery Policy',
    'Chính sách thanh toán': 'Payment Policy',
    'Quy trình khiếu nại': 'Complaint Process',

    // Đăng nhập / đăng ký / mật khẩu
    'Chào mừng bạn quay lại VT Pay.': 'Welcome back to VT Pay.',
    'Lần đầu đăng nhập bằng Google sẽ tạo tài khoản mới; tiếp tục nghĩa là bạn đồng ý':
      'Signing in with Google for the first time creates a new account; by continuing you agree to the',
    'và': 'and',
    'Quên mật khẩu?': 'Forgot password?',
    'Mã xác thực (2FA)': 'Verification code (2FA)',
    '123456 hoặc mã khôi phục': '123456 or a recovery code',
    'Không cầm điện thoại? Gửi mã về email': "Don't have your phone? Email me a code",
    'Chưa có tài khoản?': "Don't have an account?",
    'Tạo tài khoản VT Pay miễn phí.': 'Create a free VT Pay account.',
    'Tiếp tục bằng Google nghĩa là bạn đồng ý': 'By continuing with Google you agree to the',
    'Tôi đã đọc và đồng ý': 'I have read and agree to the',
    'của VT Pay.': 'of VT Pay.',
    'Gửi liên kết xác nhận': 'Send confirmation link',
    'Đã gửi liên kết xác nhận tới email bạn vừa nhập. Mở email đó và bấm vào liên kết để đặt mật khẩu và hoàn tất đăng ký.':
      'We sent a confirmation link to the email you entered. Open it and click the link to set your password and finish signing up.',
    'Liên kết có hiệu lực trong 1 giờ. Không thấy thư? Kiểm tra thư mục Spam, hoặc':
      "The link is valid for 1 hour. Can't find it? Check your Spam folder, or",
    'thử lại với email khác': 'try another email',
    'Đã có tài khoản?': 'Already have an account?',
    'Quên mật khẩu': 'Forgot password',
    'Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.':
      "Enter your account email and we'll send you a password reset link.",
    'Gửi liên kết đặt lại': 'Send reset link',
    'Nếu email này có tài khoản, một liên kết đặt lại mật khẩu đã được gửi tới. Liên kết có hiệu lực trong 30 phút.':
      'If this email has an account, a password reset link has been sent. The link is valid for 30 minutes.',
    'Không thấy thư? Kiểm tra thư mục Spam, hoặc': "Can't find it? Check your Spam folder, or",
    'thử lại': 'try again',
    'Nhớ ra mật khẩu rồi?': 'Remembered your password?',
    'Đặt lại mật khẩu': 'Reset password',
    'Nhập mật khẩu mới cho tài khoản của bạn.': 'Enter a new password for your account.',
    'Mật khẩu mới': 'New password',
    'Nhập lại mật khẩu mới': 'Confirm new password',
    'Đã đặt lại mật khẩu. Mọi thiết bị đang đăng nhập đều đã bị đăng xuất — hãy đăng nhập lại bằng mật khẩu mới.':
      'Your password has been reset. All signed-in devices were signed out — please sign in again with your new password.',
    'Đặt mật khẩu': 'Set password',
    'Bước cuối để hoàn tất đăng ký VT Pay.': 'The last step to finish signing up for VT Pay.',
    'Mật khẩu': 'Password',
    'Nhập lại mật khẩu': 'Confirm password',
    'Hoàn tất đăng ký': 'Finish sign-up',
    'Xác nhận đổi email': 'Confirm email change',
    'Đang xác nhận...': 'Confirming...',
    'Đã đổi email. Mọi thiết bị đang đăng nhập đều đã bị đăng xuất — hãy đăng nhập lại bằng email mới.':
      'Your email has been changed. All signed-in devices were signed out — please sign in again with your new email.',
    'Bạn đã hủy đăng nhập bằng Google.': 'You cancelled Google sign-in.',
    'Phiên đăng nhập Google đã hết hạn, hãy thử lại.': 'The Google sign-in session expired, please try again.',
    'Không xác minh được đăng nhập Google, hãy thử lại.': 'Could not verify Google sign-in, please try again.',
    'Email Google của bạn chưa được xác minh.': 'Your Google email is not verified.',
    'Tài khoản này đang bị khóa.': 'This account is suspended.',
    'Thao tác quá nhiều lần, hãy chờ một lát rồi thử lại.': 'Too many attempts, please wait a moment and try again.',
    'VT Pay đang tạm ngưng nhận đăng ký tài khoản mới.': 'VT Pay is temporarily not accepting new sign-ups.',
    'Đăng nhập bằng Google không thành công.': 'Google sign-in failed.',
    'Hãy đọc và tích ô đồng ý Điều khoản sử dụng và Chính sách bảo mật.':
      'Please read and tick the box to agree to the Terms of Service and Privacy Policy.',
    'Nhập mã 6 số vừa gửi về email của bạn.': 'Enter the 6-digit code we just emailed you.',
    'Mã 6 số trong email': '6-digit code from email',
    'Nhập mã từ ứng dụng xác thực (hoặc một mã khôi phục).': 'Enter the code from your authenticator app (or a recovery code).',
    'Liên kết không hợp lệ hoặc thiếu mã xác nhận.': 'The link is invalid or missing its confirmation code.',
    'Hai mật khẩu chưa khớp nhau.': 'The two passwords do not match.',
    'Liên kết không hợp lệ hoặc đã hết hạn': 'The link is invalid or has expired',
    'Không xác nhận được.': 'Could not confirm.',
    'Hoàn tất đăng nhập (2FA)': 'Finish sign-in (2FA)',

    // Trang donate công khai
    'Không tìm thấy trang này': 'Page not found',
    'Không có streamer nào dùng địa chỉ này, hoặc họ chưa tạo hồ sơ.':
      "No streamer uses this address, or they haven't created a profile yet.",
    'Về trang chủ VT Pay': 'Back to VT Pay home',
    'Nhắn tin': 'Message',
    'Theo dõi': 'Follow',
    'Đang theo dõi': 'Following',
    'Thông tin': 'About',
    'Đã xác minh': 'Verified',
    'Giới thiệu': 'Bio',
    'Streamer chưa viết giới thiệu.': "The streamer hasn't written a bio yet.",
    'Mạng xã hội': 'Social links',
    'Chưa có liên kết mạng xã hội.': 'No social links yet.',
    'Streamer này chưa sẵn sàng nhận donate lúc này. Hãy quay lại sau.':
      "This streamer isn't ready to receive donations right now. Please come back later.",
    'Streamer đang tạm ngưng nhận donate. Hãy quay lại sau.': 'The streamer has paused donations. Please come back later.',
    'Phát nhạc': 'Music',
    'Mục tiêu': 'Goal',
    'Mọi khoản donate (kể cả yêu cầu phát nhạc) đều được cộng vào mục tiêu.':
      'Every donation (including music requests) counts toward the goal.',
    'Loại ủng hộ': 'Support type',
    'Loại tiền': 'Currency',
    'Số tiền (VND)': 'Amount (VND)',
    'Số tiền (USD)': 'Amount (USD)',
    'Tên hiển thị': 'Display name',
    'Đăng nhập để hiện tên của bạn': 'Sign in to show your name',
    'Chưa đặt tên hiển thị': 'No display name set',
    'Bạn chưa đặt tên hiển thị. Bấm': "You haven't set a display name. Click",
    'để đặt trong Hồ sơ cá nhân, tên này sẽ hiện trên live khi bạn donate.':
      'to set it in your Profile; this name appears on stream when you donate.',
    'Ẩn tên của tôi (hiện là "Ẩn danh" trên live và bảng xếp hạng)':
      'Hide my name (shown as "Anonymous" on stream and the leaderboard)',
    'Ẩn danh': 'Anonymous',
    'Lời nhắn (không bắt buộc)': 'Message (optional)',
    'Yêu cầu phát nhạc (link YouTube)': 'Music request (YouTube link)',
    'Ghi âm lời nhắn': 'Record a voice message',
    '● Ghi âm': '● Record',
    '■ Dừng (': '■ Stop (',
    'Tạo lệnh donate': 'Create donation',
    'Gửi yêu cầu phát nhạc': 'Send music request',
    'Bạn cần': 'You need to',
    'đăng nhập': 'sign in',
    'để tạo lệnh donate.': 'to create a donation.',
    'Chuyển khoản để hoàn tất': 'Transfer to complete',
    'Mã QR chuyển khoản': 'Transfer QR code',
    'Quét bằng app ngân hàng hoặc ví điện tử — hoặc chuyển khoản thủ công bên dưới.':
      'Scan with your banking or e-wallet app — or transfer manually using the details below.',
    'Ngân hàng': 'Bank',
    'Số tài khoản': 'Account number',
    'Chủ tài khoản': 'Account holder',
    'NỘI DUNG CHUYỂN KHOẢN (bắt buộc đúng nguyên văn)': 'TRANSFER NOTE (must match exactly)',
    'Đang chờ chuyển khoản...': 'Waiting for your transfer...',
    'Đã nhận donate! Cảm ơn bạn 🎉': 'Donation received! Thank you 🎉',
    'Quay lại ngay': 'Go back now',
    'Đơn đã hết hạn.': 'This order has expired.',
    'Nếu bạn đã chuyển khoản trước khi hết hạn, giao dịch vẫn được ghi nhận trong vòng 24 giờ sau đó — trang này sẽ không tự cập nhật thêm, không cần chờ ở đây.':
      "If you transferred before it expired, the payment will still be recorded within 24 hours — this page won't update any more, so there's no need to wait here.",
    'Tạo đơn mới': 'Create a new order',
    'Bảng xếp hạng': 'Leaderboard',
    'Khoảng thời gian': 'Time range',
    'Ngày': 'Day',
    'Tháng': 'Month',
    'Tổng': 'All time',
    'Chưa có ai trong khoảng thời gian này.': 'No one in this time range yet.',
    'Gần đây': 'Recent',
    'Chưa có donate nào. Hãy là người đầu tiên!': 'No donations yet. Be the first!',
    'với lời nhắn': 'with a message',
    '🎙 Có lời nhắn ghi âm': '🎙 Includes a voice message',
    'vừa xong': 'just now',
    'Không mở được micro. Hãy cho phép trình duyệt dùng micro.': "Couldn't open the microphone. Please allow microphone access.",
    'Không gửi được bản ghi âm.': "Couldn't upload the recording.",
    'Hãy đặt tên hiển thị trong Hồ sơ cá nhân trước khi donate (bấm Thay đổi).':
      'Please set a display name in your Profile before donating (click Change).',
    'Nhập số tiền USD từ $1, tối đa 2 số lẻ (vd 9,99).': 'Enter a USD amount from $1, up to 2 decimals (e.g. 9.99).',
    '. Bạn thanh toán bằng VND; số USD là giá trị quy đổi để hiển thị trên live.':
      '. You pay in VND; the USD amount is a converted value shown on stream.',

    // Thông báo lỗi từ máy chủ (api.js)
    'Vui lòng nhập email.': 'Please enter your email.',
    'Email không hợp lệ.': 'Invalid email.',
    'Email quá dài.': 'Email is too long.',
    'Vui lòng nhập mật khẩu.': 'Please enter your password.',
    'Mật khẩu quá dài.': 'Password is too long.',
    'Mật khẩu cần ít nhất 10 ký tự.': 'Password must be at least 10 characters.',
    'Mật khẩu quá đơn giản, hãy dùng nhiều ký tự khác nhau hơn.': 'Password is too simple, use more varied characters.',
    'Mật khẩu không được trùng với email.': 'Password must not match your email.',
    'Mật khẩu này đã từng bị lộ trong các vụ rò rỉ dữ liệu khác. Hãy chọn mật khẩu khác.':
      'This password has appeared in data breaches. Please choose another one.',
    'Liên kết không hợp lệ.': 'Invalid link.',
    'Vui lòng nhập mã xác thực.': 'Please enter the verification code.',
    'Mã xác thực không hợp lệ.': 'Invalid verification code.',
    'Mã xác thực không đúng.': 'Incorrect verification code.',
    'Email hoặc mật khẩu không đúng.': 'Incorrect email or password.',
    'Vui lòng nhập tên hiển thị.': 'Please enter a display name.',
    'Tên hiển thị không hợp lệ (1-50 ký tự, không chứa ký tự lạ).': 'Invalid display name (1-50 characters, no special characters).',
    'Email của bạn chưa được xác minh.': 'Your email is not verified.',
    'Cần hoàn tất đăng nhập hai lớp trước.': 'Please complete two-factor sign-in first.',
    'Cần xác minh lại để tiếp tục.': 'Please verify again to continue.',
    'Vui lòng nhập số tiền.': 'Please enter an amount.',
    'Số tiền tối thiểu là 1.000đ.': 'The minimum amount is 1,000 VND.',
    'Tối thiểu 1.000đ': 'Minimum 1,000 VND',
    'Số tiền tối đa là 50.000.000đ.': 'The maximum amount is 50,000,000 VND.',
    'Vui lòng nhập tên.': 'Please enter a name.',
    'Tên không hợp lệ (tối đa 50 ký tự, không chứa ký tự lạ).': 'Invalid name (up to 50 characters, no special characters).',
    'Lời nhắn không hợp lệ.': 'Invalid message.',
    'Lời nhắn không hợp lệ (một dòng, tối đa 200 ký tự, không chứa ký tự lạ).':
      'Invalid message (single line, up to 200 characters, no special characters).',
    'Số tiền thấp hơn mức tối thiểu streamer đặt.': "The amount is below the streamer's minimum.",
    'Streamer không nhận donate bằng USD. Hãy chọn VND.': "The streamer doesn't accept USD donations. Please choose VND.",
    'Số tiền USD sau quy đổi nằm ngoài giới hạn cho phép.': 'The converted USD amount is outside the allowed range.',
    'Số tiền USD tối thiểu là $1.': 'The minimum USD amount is $1.',
    'Số tiền USD tối đa là $1.900.': 'The maximum USD amount is $1,900.',
    'Bản ghi âm không dùng được (số tiền chưa đủ để gửi ghi âm, hoặc bản ghi đã hết hạn).':
      "The recording can't be used (amount too low for voice messages, or the recording expired).",
    'Bản ghi âm quá dài.': 'The recording is too long.',
    'Streamer đã tắt ghi âm.': 'The streamer has turned off voice messages.',
    'Định dạng ghi âm không được hỗ trợ.': 'Unsupported recording format.',
    'Streamer đang tắt yêu cầu phát nhạc.': 'The streamer has turned off music requests.',
    'Số tiền chưa đủ để yêu cầu phát nhạc.': 'The amount is too low for a music request.',
    'Link YouTube không hợp lệ.': 'Invalid YouTube link.',
    'Video này không phát được (riêng tư, đã bị gỡ hoặc chủ kênh chặn nhúng).':
      "This video can't be played (private, removed, or embedding disabled).",
    'Link quá dài.': 'The link is too long.',
    'Hãy đặt tên hiển thị trong Hồ sơ cá nhân trước khi donate.': 'Please set a display name in your Profile before donating.',
    'Đây là trang của bạn, không thể tự nhắn tin cho mình.': "This is your own page; you can't message yourself.",
    'Trang này không nhận tin nhắn từ bạn nữa.': 'This page no longer accepts messages from you.',
    'Hãy nhập nội dung tin nhắn.': 'Please type a message.',
    'Tin nhắn dài quá 1000 ký tự.': 'The message is longer than 1000 characters.',
    'Tin nhắn có ký tự không được phép.': 'The message contains characters that are not allowed.',
    'VT Pay đang tạm ngưng nhận đăng ký tài khoản mới. Hãy quay lại sau.':
      'VT Pay is temporarily not accepting new sign-ups. Please come back later.',
    'Hệ thống đang tạm dừng nhận donate. Hãy quay lại sau.': 'Donations are temporarily paused. Please come back later.',
    'Tạm thời chưa lấy được tỷ giá USD. Hãy donate bằng VND hoặc thử lại sau ít phút.':
      "The USD exchange rate isn't available right now. Please donate in VND or try again in a few minutes.",
    'Streamer chưa sẵn sàng nhận donate lúc này. Hãy quay lại sau.':
      "This streamer isn't ready to receive donations right now. Please come back later.",
    'Email này đã có người dùng.': 'This email is already in use.',
    'Dữ liệu chưa hợp lệ, vui lòng kiểm tra lại.': 'Some data is invalid, please check again.',
    'Không kết nối được tới máy chủ. Kiểm tra lại mạng và thử lại.':
      "Couldn't reach the server. Check your connection and try again.",
  };

  // Từ điển các trang thiết lập (i18n-app.js, nạp trước tệp này trên những trang đó).
  if (window.VTI18N_EXTRA) Object.assign(EN, window.VTI18N_EXTRA);

  // Câu có số/biến: [mẫu tiếng Việt, hàm dựng câu English].
  const rateEn = (t) =>
    t.replace(/tỷ giá quốc tế/g, 'international rate').replace(/tỷ giá niêm yết/g, 'posted rate').replace(/tỷ giá /g, '');
  const PATTERNS = [
    [/^Đã gửi mã 6 số tới (.+)\. Mã hết hạn sau 10 phút\.$/, (m) => `A 6-digit code was sent to ${m[1]}. It expires in 10 minutes.`],
    [/^Tự quay lại trang donate sau (\d+) giây…$/, (m) => `Returning to the donation page in ${m[1]} seconds…`],
    [/^Tối đa (\d+) giây, donate từ (.+)\.$/, (m) => `Up to ${m[1]} seconds, for donations from ${m[2]}.`],
    [
      /^≈ (.+) theo (.+)\. Bạn thanh toán bằng VND; số chính xác chốt lúc tạo lệnh\.$/,
      (m) => `≈ ${m[1]} at the ${rateEn(m[2])} rate. You pay in VND; the exact amount is locked when you create the order.`,
    ],
    [
      /^Nhập từ \$1, tối đa 2 số lẻ \(vd 9,99\)\. Quy đổi theo (.+)\.$/,
      (m) => `Enter from $1, up to 2 decimals (e.g. 9.99). Converted at the ${rateEn(m[1])} rate.`,
    ],
    [/^\((.+), (\d\d:\d\d \d\d\/\d\d)\) = $/, (m) => `(${rateEn(m[1])}, ${m[2]}) = `],
    [/^([\d.]+) người theo dõi$/, (m) => `${m[1]} follower${m[1] === '1' ? '' : 's'}`],
    [/^([\d.]+) lượt ủng hộ$/, (m) => `${m[1]} donation${m[1] === '1' ? '' : 's'}`],
    [/^(\d+) phút trước$/, (m) => `${m[1]} min ago`],
    [/^(\d+) giờ trước$/, (m) => `${m[1]} h ago`],
    [/^(\d+) ngày trước$/, (m) => `${m[1]} day${m[1] === '1' ? '' : 's'} ago`],
    [
      /^Donate từ (.+) để chọn bài; mỗi bài phát tối đa 3 phút 30 giây, ai donate trước phát trước\.$/,
      (m) => `Donate from ${m[1]} to pick a song; each song plays up to 3 min 30 s, first come first served.`,
    ],
    [/^Thiết lập · (.+)$/, (m) => `Settings · ${tr(m[1]) || m[1]}`],
    [/^Tối thiểu ([\d.]+)đ$/, (m) => `Minimum ${m[1].replace(/\./g, ',')} VND`],
    [/^Cổ điển (\d+)$/, (m) => `Classic ${m[1]}`],
    [/^Âm thanh (\d+)$/, (m) => `Sound ${m[1]}`],
    [/^VIP (\d+) trở lên$/, (m) => `VIP ${m[1]} or higher`],
    [/^Chọn ảnh có sẵn (\S+)$/, (m) => `Choose built-in image ${m[1]}`],
    [/^Hạng (\d+)$/, (m) => `Rank ${m[1]}`],
    [/^Chi tiết đơn (\S+)$/, (m) => `Order details ${m[1]}`],
    [/^Bỏ chặn (.+)$/, (m) => `Unblock ${m[1]}`],
    [/^(\d+) kết quả · Trang (\d+) \/ (\d+)$/, (m) => `${m[1]} result${m[1] === '1' ? '' : 's'} · Page ${m[2]} / ${m[3]}`],
    [/^(.+) · gửi lúc (.+)$/, (m) => `${m[1]} · submitted ${m[2]}`],
    [/^Đã kết nối · API Key ••••(\S*) · (.+)$/, (m) => `Connected · API key ••••${m[1]} · ${tr(m[2]) || m[2]}`],
    [/^Đã nhận (.+) · (\d+) lượt$/, (m) => `Received ${m[1]} · ${m[2]} donation${m[2] === '1' ? '' : 's'}`],
    [/^Giao diện: (.+)$/, (m) => `Theme: ${m[1]}`],
    [/^(\d+) chưa đọc$/, (m) => `${m[1]} unread`],
    [/^(\d+) đã chọn$/, (m) => `${m[1]} selected`],
    [/^Lý do: (.+)$/, (m) => `Reason: ${m[1]}`],
    [/^Đổi sang (.+) •••• (\d+): chờ duyệt$/, (m) => `Switch to ${m[1]} •••• ${m[2]}: pending approval`],
    [/^Đã kết nối · API Key ••••(\S*) ·$/, (m) => `Connected · API key ••••${m[1]} ·`],
    [/^Token overlay đã tạo lúc (.+)\.$/, (m) => `Overlay token created at ${m[1]}.`],
    [/^(Tắt|Huỷ) tài khoản (.+)\?$/, (m) => `${m[1] === 'Tắt' ? 'Turn off' : 'Cancel'} account ${m[2]}?`],
    [/^Chặn "(.+)"\? Donate của tên này vẫn được ghi nhận nhưng không hiện lên live, không vào Gần đây và Bảng xếp hạng\.$/,
      (m) => `Block "${m[1]}"? Donations from this name are still recorded but won't appear on stream, in Recent or on the Leaderboard.`],
    [/^Đã tải (.+)$/, (m) => `Loaded ${m[1].replace(/(\d+) giây trước/, '$1 s ago').replace(/(\d+) phút trước/, '$1 min ago')}`],
    [/^(\d+) đơn$/, (m) => `${m[1]} order${m[1] === '1' ? '' : 's'}`],
    [/^Tin nhắn \((\d+) chưa đọc\)$/, (m) => `Messages (${m[1]} unread)`],
    [/^(.+) - VT Pay$/, (m) => `${tr(m[1]) || m[1]} - VT Pay`],
    [/^Donate (.+) với lời nhắn$/, (m) => `Donated ${m[1]} with a message`],
  ];
  // Tiêu đề tab.
  Object.assign(EN, {
    'Donate': 'Donate',
    'Hồ sơ cá nhân': 'Profile',
    'Quên mật khẩu - VT Pay': 'Forgot password - VT Pay',
  });

  function tr(text) {
    if (Object.prototype.hasOwnProperty.call(EN, text)) return EN[text];
    for (const [re, fn] of PATTERNS) {
      const m = re.exec(text);
      if (m) return fn(m);
    }
    return null;
  }

  // ---- Chọn ngôn ngữ ----
  const read = (k, store) => {
    try {
      return store.getItem(k);
    } catch {
      return null;
    }
  };
  const write = (k, v, store) => {
    try {
      if (v === null) store.removeItem(k);
      else store.setItem(k, v);
    } catch {
      // trình duyệt chặn lưu: chỉ áp dụng cho trang hiện tại
    }
  };
  let lang = read(KEY, localStorage) || read(AUTO_KEY, sessionStorage) || 'vi';
  if (lang !== 'en') lang = 'vi';

  // ---- Áp dụng lên trang ----
  const origText = new WeakMap(); // text node → câu tiếng Việt gốc
  const origAttr = new WeakMap(); // element → { attr: gốc }
  const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
  let busy = false;

  const skipped = (el) =>
    !el ||
    el.closest('script,style,textarea,[data-i18n-skip],[contenteditable="true"]') !== null;
  // Thuộc tính (gợi ý, nhãn) của ô nhập/textarea vẫn dịch; chỉ nội dung người dùng gõ là không.
  const skippedAttrs = (el) => !el || el.closest('[data-i18n-skip],[contenteditable="true"]') !== null;

  function doText(node) {
    const parent = node.parentElement;
    if (!parent || skipped(parent)) return;
    const raw = node.nodeValue;
    if (lang === 'vi') {
      const o = origText.get(node);
      if (o !== undefined && o !== raw) {
        const t = tr(o.trim());
        // Code đã tự đổi chữ (không phải bản dịch của mình): giữ chữ mới.
        if (t !== null && raw.trim() === t) node.nodeValue = o;
      }
      origText.delete(node);
      return;
    }
    const key = raw.replace(/\s+/g, ' ').trim();
    if (!key || !/[A-Za-zÀ-ỹđĐ]/.test(key)) return;
    const prev = origText.get(node);
    if (prev !== undefined && tr(prev.replace(/\s+/g, ' ').trim()) === key) return; // đã là bản dịch
    const t = tr(key);
    if (t === null) return;
    origText.set(node, raw);
    const lead = raw.match(/^\s*/)[0];
    const trail = raw.match(/\s*$/)[0];
    node.nodeValue = lead + t + trail;
  }
  function doAttrs(el) {
    if (skippedAttrs(el)) return;
    let saved = origAttr.get(el);
    for (const a of ATTRS) {
      if (!el.hasAttribute(a)) continue;
      const v = el.getAttribute(a);
      if (lang === 'vi') {
        if (saved && saved[a] !== undefined) {
          if (tr(saved[a]) === v) el.setAttribute(a, saved[a]);
          delete saved[a];
        }
        continue;
      }
      if (saved && saved[a] !== undefined && tr(saved[a]) === v) continue;
      const t = tr(v.trim());
      if (t === null) continue;
      if (!saved) {
        saved = {};
        origAttr.set(el, saved);
      }
      saved[a] = v;
      el.setAttribute(a, t);
    }
  }
  function walk(root) {
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1) return;
    if (root.tagName === 'SCRIPT' || root.tagName === 'STYLE') return;
    doAttrs(root);
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let n = tw.nextNode();
    while (n) {
      if (n.nodeType === 3) doText(n);
      else doAttrs(n);
      n = tw.nextNode();
    }
  }
  function doTitle() {
    const el = document.querySelector('title');
    if (el) walk(el);
  }
  function applyAll() {
    busy = true;
    document.documentElement.lang = lang;
    walk(document.documentElement);
    busy = false;
    updateButton();
  }

  new MutationObserver((records) => {
    if (busy) return;
    busy = true;
    for (const r of records) {
      if (r.type === 'childList') r.addedNodes.forEach(walk);
      else if (r.type === 'characterData') doText(r.target);
      else if (r.type === 'attributes') doAttrs(r.target);
    }
    busy = false;
    placeButton();
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ATTRS,
  });
  document.documentElement.lang = lang;

  // ---- Nút VI/EN cạnh nút tạm dừng chuyển động ----
  let btn = null;
  function updateButton() {
    if (!btn) return;
    btn.textContent = lang === 'en' ? 'EN' : 'VI';
    const label = lang === 'en' ? 'Language: English — switch to Tiếng Việt' : 'Ngôn ngữ: Tiếng Việt — chuyển sang English';
    btn.setAttribute('aria-label', label);
    btn.title = label;
  }
  function placeButton() {
    if (btn && btn.isConnected) return;
    const motion = document.getElementById('motionToggle');
    if (!motion) return;
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'motion-toggle lang-toggle';
    btn.id = 'langToggle';
    btn.setAttribute('data-i18n-skip', '');
    btn.addEventListener('click', () => setLang(lang === 'en' ? 'vi' : 'en', true));
    motion.after(btn);
    updateButton();
  }
  function setLang(next, manual) {
    if (next !== 'en' && next !== 'vi') return;
    if (manual) write(KEY, next, localStorage);
    lang = next;
    applyAll();
  }

  // Chưa tự chọn: theo Quốc gia trong Hồ sơ cá nhân (một lần mỗi phiên trình duyệt).
  if (!read(KEY, localStorage) && !read(AUTO_KEY, sessionStorage)) {
    fetch('/api/v1/me/account-profile', { credentials: 'same-origin', headers: { accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const c = d && d.account && d.account.country;
        const auto = c && c !== 'VN' ? 'en' : 'vi';
        write(AUTO_KEY, auto, sessionStorage);
        if (auto !== lang && !read(KEY, localStorage)) setLang(auto, false);
      })
      .catch(() => undefined);
  }

  // Hộp thoại của trình duyệt (confirm/alert/prompt) không nằm trong trang: dịch câu hỏi trước khi hiện.
  for (const fn of ['confirm', 'alert', 'prompt']) {
    const orig = window[fn];
    if (typeof orig !== 'function') continue;
    window[fn] = function (msg, ...rest) {
      const text = typeof msg === 'string' && lang === 'en' ? tr(msg.trim()) || msg : msg;
      return orig.call(window, text, ...rest);
    };
  }

  Object.assign(EN, {
    'Không phụ phí': 'No fee',
    'Chưa có người ủng hộ': 'No supporters yet',
    // Khung trang pháp lý (nội dung có bản English riêng trong trang)
    'Pháp lý': 'Legal',
    'VT Pay · Pháp lý': 'VT Pay · Legal',
    'Cập nhật lần cuối: 27/09/2026': 'Last updated: 27/09/2026',
    'MST 0319668560 · Phường Bến Thành, Quận 1, Thành phố Hồ Chí Minh':
      'Tax code 0319668560 · Ben Thanh Ward, District 1, Ho Chi Minh City',
    '· MST 0319668560 · Phường Bến Thành, Quận 1, Thành phố Hồ Chí Minh':
      '· Tax code 0319668560 · Ben Thanh Ward, District 1, Ho Chi Minh City',
  });

  window.VTI18n = {
    get lang() {
      return lang;
    },
    t: (text) => (lang === 'en' ? tr(text) || text : text),
    // Hồ sơ cá nhân: đổi Quốc gia thì đổi ngôn ngữ theo (khác Việt Nam → English).
    followCountry(country) {
      write(AUTO_KEY, null, sessionStorage);
      setLang(country && country !== 'VN' ? 'en' : 'vi', true);
    },
    set: (next) => setLang(next, true),
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyAll);
  else applyAll();
})();
