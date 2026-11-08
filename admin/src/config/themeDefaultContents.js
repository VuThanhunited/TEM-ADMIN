// Cấu hình Nội dung Mặc định & Schema Trình Soạn Thảo cho 8 Giao diện Tem Ngành Hàng

export const THEME_LIST = [
  {
    key: 'appliance',
    aliases: ['default', 'appliance', 'warranty', 'warranty_solution'],
    name: '1. Giao diện Bảo hành & Tiêu chuẩn',
    shortName: 'Bảo hành / Tiêu chuẩn',
    subtitle: 'Giao diện xác thực bảo hành điện tử, mã sở hữu, mã chống giả, NSX, NPP & giấy công bố',
    color: '#0d47a1',
    bgLight: 'rgba(13, 71, 161, 0.12)',
    badge: 'Bảo hành & Mặc định'
  },
  {
    key: 'functional_food',
    aliases: ['functional_food', 'food'],
    name: '2. Giao diện Thực phẩm chức năng (TPCN)',
    shortName: 'Thực phẩm chức năng',
    subtitle: 'Giao diện xanh lá chuẩn TPCN, 8 nút chức năng, kích hoạt mã mở khóa công bố & tích điểm',
    color: '#16a34a',
    bgLight: 'rgba(22, 163, 74, 0.12)',
    badge: 'TPCN'
  },
  {
    key: 'staycool',
    aliases: ['staycool', 'vyphyto'],
    name: '3. Giao diện TPCN Nhập khẩu (StayCool / Vyphyto)',
    shortName: 'TPCN Nhập khẩu / Vyphyto',
    subtitle: 'Giao diện cam/trắng nhập khẩu Châu Âu, 3 nút tròn, 6 ô thông tin & cam kết độc quyền',
    color: '#ea580c',
    bgLight: 'rgba(234, 88, 12, 0.12)',
    badge: 'Nhập khẩu'
  },
  {
    key: 'honey',
    aliases: ['honey'],
    name: '4. Giao diện Mật Ong / Đặc sản (3 Ngôn ngữ & 6 Tab)',
    shortName: 'Mật Ong / 3 Ngôn ngữ',
    subtitle: 'Giao diện 3 ngôn ngữ (Việt - Anh - Trung), 6 Tab bài viết chuyên sâu & điểm phân phối',
    color: '#15803d',
    bgLight: 'rgba(21, 128, 61, 0.12)',
    badge: 'Đa ngôn ngữ'
  },
  {
    key: 'ocop',
    aliases: ['ocop'],
    name: '5. Giao diện Sản phẩm OCOP',
    shortName: 'Sản phẩm OCOP',
    subtitle: 'Giao diện chứng nhận OCOP, thông tin chủ thể HTX, 8 nút truy xuất & cam kết chủ thể',
    color: '#b45309',
    bgLight: 'rgba(180, 83, 9, 0.12)',
    badge: 'OCOP Quốc gia'
  },
  {
    key: 'medical',
    aliases: ['medical'],
    name: '6. Giao diện Dược phẩm & Y tế (GMP-WHO)',
    shortName: 'Dược phẩm & Y tế',
    subtitle: 'Giao diện chuẩn dược phẩm, 4 thông số SĐK/Bào chế, cảnh báo kê đơn, liều dùng & bảo quản',
    color: '#00897b',
    bgLight: 'rgba(0, 137, 123, 0.12)',
    badge: 'Y tế / GMP'
  },
  {
    key: 'agriculture',
    aliases: ['agriculture'],
    name: '7. Giao diện Nông sản & Nông nghiệp VietGAP',
    shortName: 'Nông sản VietGAP',
    subtitle: 'Giao diện nông sản sạch, mã vùng trồng, ngày thu hoạch, HTX & chứng nhận VietGAP',
    color: '#15803d',
    bgLight: 'rgba(21, 128, 61, 0.12)',
    badge: 'Nông nghiệp'
  },
  {
    key: 'cosmetics',
    aliases: ['cosmetics'],
    name: '8. Giao diện Mỹ phẩm & Làm đẹp',
    shortName: 'Mỹ phẩm & Làm đẹp',
    subtitle: 'Giao diện mỹ phẩm cao cấp, thông số loại da, hạn mở nắp (PAO), thành phần & kiểm nghiệm',
    color: '#be185d',
    bgLight: 'rgba(190, 24, 93, 0.12)',
    badge: 'Mỹ phẩm'
  }
];

export const DEFAULT_THEME_CONTENTS = {
  // =====================================================================
  // 1. GIAO DIỆN BẢO HÀNH & TIÊU CHUẨN (appliance / default)
  // =====================================================================
  appliance: {
    verifyTitle: 'Sản phẩm chính hãng',
    verifySubtitle: 'Thông tin truy xuất nguồn gốc đã được xác thực',
    warningTitlePrefix: 'Cảnh báo lượt quét',
    warningSubtitle: 'Sản phẩm đã được quét nhiều lần. Vui lòng kiểm tra kỹ tem niêm phong và nguồn gốc.',
    activationCodeLabel: 'Mã kích hoạt',
    categoryLabel: 'Danh mục',
    scanCountLabel: 'Lần quét',
    firstScanLabel: 'Quét lần đầu',
    nsxSectionTitle: 'Thông tin Nhà sản xuất (NSX)',
    brandOwnerLabel: 'Chủ sở hữu nhãn hiệu:',
    nppSectionTitle: 'Thông tin Nhà phân phối (Nhà PP)',
    nppDefaultText: 'Sản phẩm chính hãng được phân phối và lưu hành thông qua hệ thống đại lý trên toàn quốc.',
    ownerCodeLabel: 'Mã sở hữu sản phẩm',
    antiCounterfeitLabel: 'Mã chống giả',
    verifiedBadgeText: 'ĐÃ XÁC THỰC',
    unactivatedOwnerNote: 'Mã sở hữu sẽ được cập nhật khi đại lý xuất bán cho khách hàng.',
    certSectionTitle: 'Phần giấy tờ & Bản công bố sản phẩm',
    certNumberLabel: 'Số tiếp nhận công bố',
    certGuideText: 'Giấy tờ chứng nhận / công bố chất lượng sản phẩm (chạm vào ảnh để xem rõ hơn):',
    ownerCardTitle: 'THÔNG TIN KH SỞ HỮU SẢN PHẨM',
    ownerNameLabel: 'Tên NPP / cá nhân:',
    ownerAddressLabel: 'Địa chỉ:',
    ownerPhoneLabel: 'Số điện thoại:',
    activatedSerialLabel: 'Serial đã được kích hoạt:',
    relatedSectionTitle: 'Sản phẩm liên quan',
    // Cấu hình mở rộng cho mẫu Bảo hành Điện tử (Vinsumi / Appliance Poster)
    warrantyBannerSubtitle: 'Sản phẩm đã được kích hoạt bảo hành điện tử chính hãng',
    warrantyBadgeText: 'ĐÃ KÍCH HOẠT BẢO HÀNH CHÍNH HÃNG',
    warrantyPolicySectionTitle: 'CHÍNH SÁCH & ĐIỀU KIỆN BẢO HÀNH',
    warrantyCol1Label: 'Thời gian bảo hành',
    warrantyCol1Value: '24 tháng',
    warrantyCol2Label: 'Hình thức bảo hành',
    warrantyCol2Value: 'Toàn quốc',
    warrantyCol3Label: 'Điều kiện bảo hành',
    warrantyCol3Value: 'Sản phẩm còn nguyên tem, không rách, không tẩy xóa',
    warrantyCol4Label: 'Hotline hỗ trợ',
    warrantyCol4Value: '1900 1234',
    warrantyFooterNote: 'Vui lòng liên hệ trung tâm bảo hành gần nhất để được hỗ trợ nhanh chóng.'
  },

  // =====================================================================
  // 2. GIAO DIỆN THỰC PHẨM CHỨC NĂNG (functional_food / food)
  // =====================================================================
  functional_food: {
    headerTitle: 'SẢN PHẨM CHÍNH HÃNG',
    headerSubtitle: 'Nguồn gốc minh bạch – An tâm sử dụng',
    activatedBannerTitle: 'Đã kích hoạt mã – Xem đầy đủ thông tin',
    activatedBannerDesc: 'Sản phẩm đã được kích hoạt hợp lệ, mở khóa Giấy công bố & thông tin Điểm bán',
    unactivatedBannerTitle: 'Tem chưa kích hoạt mã',
    unactivatedBannerDesc: 'Bạn hiện chỉ xem được Thông tin sản phẩm. Hãy kích hoạt mã để xem Giấy công bố & đầy đủ thông tin.',
    categoryTagText: 'THỰC PHẨM CHỨC NĂNG',
    viewDetailBtnText: 'Xem chi tiết sản phẩm →',
    makerPrefixLabel: 'Nhà sản xuất:',
    activateBoxTitle: 'KÍCH HOẠT MÃ ĐỂ XEM GIẤY CÔNG BỐ & ĐẦY ĐỦ THÔNG TIN',
    activateBoxDesc: 'Hiện tại bạn chỉ xem được thông tin sản phẩm. Vui lòng nhập mã kích hoạt (Serial trên tem) để xem Giấy công bố sản phẩm và toàn bộ thông tin truy xuất.',
    activateBtnText: 'Kích hoạt ngay',
    storeSectionTitle: 'THÔNG TIN ĐIỂM BÁN / PHÂN PHỐI CHÍNH HÃNG',
    btn1Label: 'Thông tin sản phẩm',
    btn2Label: 'Công Bố',
    btn3Label: 'Nhà Sản Xuất',
    btn4Label: 'Nhà Phân Phối',
    btn5Label: 'Thông tin tem',
    btn6Label: 'Thư Viện SP',
    btn7Label: 'Bao bì',
    btn8Label: 'Tích điểm',
    certSectionTitle: 'GIẤY CÔNG BỐ SẢN PHẨM',
    relatedSectionTitle: 'SẢN PHẨM LIÊN QUAN',
    supportTitle: 'TƯ VẤN & HỖ TRỢ',
    supportDesc: 'Nếu bạn cần hỗ trợ thêm thông tin về sản phẩm, vui lòng liên hệ',
    supportBtnText: 'Liên hệ ngay',
    footerThankYou: 'Cảm ơn bạn đã tin tưởng sử dụng sản phẩm chính hãng!',
    rewardModalTitle: 'TÍCH ĐIỂM ĐỔI QUÀ - TRI ÂN KHÁCH HÀNG',
    rewardModalSubtitle: 'Chương trình khách hàng thân thiết',
    rewardPointsText: '+100 điểm thưởng',
    rewardModalDesc: 'Mỗi mã tem quét thành công được ghi nhận +100 điểm thưởng. Tích lũy điểm để nhận voucher mua hàng, quà tặng chăm sóc sức khỏe và tham gia quay số may mắn.',
    brandStoryContent: 'Bao bì sản phẩm được thiết kế theo tiêu chuẩn nhận diện chính hãng, in sắc nét, tích hợp tem QR chống hàng giả niêm phong nguyên vẹn.'
  },

  // =====================================================================
  // 3. GIAO DIỆN TPCN NHẬP KHẨU (staycool / vyphyto)
  // =====================================================================
  staycool: {
    pillBanner1Activated: 'SẢN PHẨM CHÍNH HÃNG - ĐÃ KÍCH HOẠT MÃ',
    pillBanner1Unactivated: 'THÔNG TIN SẢN PHẨM (CHƯA KÍCH HOẠT MÃ)',
    pillBanner2Text: '',
    unactivatedBoxTitle: 'TEM CHƯA KÍCH HOẠT MÃ',
    unactivatedBoxDesc: 'Hiện tại bạn chỉ xem được Thông tin sản phẩm. Vui lòng kích hoạt mã (hoặc để Điểm bán quét xuất hàng) để xem Giấy công bố sản phẩm và đầy đủ thông tin truy xuất.',
    storeSectionTitle: 'THÔNG TIN ĐIỂM BÁN / PHÂN PHỐI CHÍNH HÃNG',
    actionPill1Label: 'Kích hoạt',
    actionPill2Label: 'Kiểm tra',
    actionPill3Label: 'Tích điểm',
    gridBtn1Label: 'Thông tin sản phẩm',
    gridBtn2Label: 'Nhà sản xuất',
    gridBtn3Label: 'Độc quyền P.Phối',
    gridBtn4Label: 'Thông tin tem',
    gridBtn5Label: 'NHẬN DIỆN THƯƠNG HIỆU',
    gridBtn6Label: 'CÔNG BỐ',
    certSectionTitle: 'GIẤY CÔNG BỐ SẢN PHẨM',
    relatedSectionPrefix: 'SẢN PHẨM',
    relatedSectionSuffix: 'PHÂN PHỐI',
    consultTitle: 'TƯ VẤN SẢN PHẨM TRỰC TUYẾN',
    consultDesc: 'Chọn câu hỏi để nhận tư vấn tự động từ Chatbot',
    consultBtnText: '💬 Tư vấn ngay',
    footerSubnote: 'Giải Pháp Truy Xuất Nguồn Gốc Thông Minh',
    // Nội dung Popup Nhà sản xuất & Độc quyền phân phối
    mfgDefaultTitle: 'VYPHYTO LABORATORIES (FRANCE)',
    mfgDefaultSubtitle: 'Viện Nghiên Cứu & Sản Xuất Dược Phẩm Sinh Học Cộng Hòa Pháp',
    mfgDefaultDesc: 'VYPHYTO LABORATORIES là viện nghiên cứu và sản xuất các dòng thực phẩm bảo vệ sức khỏe, vitamin và khoáng chất hàng đầu tại Pháp, dựa trên công nghệ sinh học và chiết xuất hữu cơ tự nhiên đạt chuẩn Châu Âu.',
    mfgDefaultOrigin: 'Cộng hòa Pháp (Made in France) 🇫🇷',
    mfgDefaultStandard: 'cGMP - WHO, ISO 22000, HACCP Châu Âu',
    mfgDefaultSlogan: 'Tinh Hoa Pháp – Sức Khỏe Bạn',
    mfgDefaultWebsite: 'vyphyto.com',
    mfgCommitmentText: '100% nguyên liệu đều trải qua quy trình kiểm nghiệm nghiêm ngặt của Liên minh Châu Âu (EU) trước khi đưa vào sản xuất và đóng gói.',
    distModalTitle: 'ĐẠI DIỆN NHẬP KHẨU & PHÂN PHỐI ĐỘC QUYỀN',
    distModalSubtitle: 'Đối tác phân phối độc quyền chính thức tại Việt Nam',
    distModalDesc: 'Các sản phẩm chính hãng được nhập khẩu và phân phối độc quyền, có đầy đủ giấy phép lưu hành và giấy tiếp nhận đăng ký bản công bố của Cục An Toàn Thực Phẩm – Bộ Y Tế Việt Nam.',
    distCommitmentText: '100% sản phẩm phân phối ra thị trường đều dán tem niêm phong chống giả thông minh tích hợp công nghệ QR Trace. Phát hiện hàng giả cam kết đền bù gấp 10 lần giá trị sản phẩm.',
    rewardClubName: 'Chương trình thành viên VIP VYPHYTO Club'
  },

  // =====================================================================
  // 4. GIAO DIỆN MẬT ONG / ĐẶC SẢN 3 NGÔN NGỮ (honey)
  // =====================================================================
  honey: {
    // Tiếng Việt (VI)
    headerTitle_vi: 'TEM TRUY XUẤT NGUỒN GỐC',
    lblProduct_vi: 'SẢN PHẨM:',
    lblProducer_vi: 'ĐƠN VỊ SẢN XUẤT:',
    lblAddress_vi: 'ĐỊA CHỈ:',
    lblContact_vi: 'LIÊN HỆ:',
    defaultProductName_vi: 'Mật Ong Hoa Bạc Hà',
    defaultProducerName_vi: 'Hộ Kinh Doanh Hoàng Bách',
    defaultAddress_vi: 'Thôn Xín Chải, Xã Sơn Vĩ, Tỉnh Tuyên Quang',
    defaultContact_vi: '0866.603.589 - 0812.838.589',
    verifiedLabel_vi: 'Chính hãng Hoàng Bách',
    tab1Label_vi: 'Giới thiệu',
    tab2Label_vi: 'Đặc sắc',
    tab3Label_vi: 'Cách dùng',
    tab4Label_vi: 'Các điểm phân phối',
    tab5Label_vi: 'Thổ nhưỡng',
    tab6Label_vi: 'Giống ong',
    region1Label_vi: 'Đồng Văn',
    region2Label_vi: 'Mèo Vạc',
    region3Label_vi: 'Yên Minh',
    // Bài viết Tab 1: Giới thiệu (VI)
    introTitle_vi: 'GIỚI THIỆU MẬT ONG HOA BẠC HÀ HOÀNG BÁCH',
    introSubtitle_vi: 'Tinh hoa mật quý từ Công viên Địa chất Toàn cầu Cao nguyên đá Đồng Văn - Hà Giang',
    introLead_vi: 'Mật Ong Hoa Bạc Hà Hoàng Bách là sản phẩm đặc sản trứ danh được khai thác hoàn toàn tự nhiên từ những cánh rừng hoa bạc hà tím biếc nở rộ trên độ cao 1.000m – 1.600m tại Cao nguyên đá Hà Giang vào dịp cuối thu đầu đông (tháng 10 đến tháng 1 năm sau).',
    introSec1Heading_vi: '1. Nguồn gốc thiên nhiên thuần khiết 100%',
    introSec1Body_vi: 'Cây bạc hà dại trên Cao nguyên đá là loài thảo dược mọc tự nhiên trên các triền núi đá tai mèo hiểm trở. Mỗi năm hoa chỉ nở duy nhất một vụ kéo dài từ 2,5 đến 3 tháng. Đàn ong nội bản địa hút mật trực tiếp từ nhụy hoa bạc hà tạo nên dòng mật có màu vàng chanh ánh xanh lục đặc trưng, sánh đặc tự nhiên và hương thơm thanh mát dịu nhẹ không lẫn với bất kỳ loại mật nào khác.',
    introSec2Heading_vi: '2. Quy trình khai thác & kiểm định nghiêm ngặt',
    introSec2Body_vi: 'Hộ Kinh Doanh Hoàng Bách liên kết trực tiếp với các hợp tác xã và hộ nuôi ong lâu năm tại Đồng Văn, Mèo Vạc, Lũng Cú, Yên Minh. Mật được quay khai thác khi cầu mật đã vít nắp chín tự nhiên tối thiểu 90%, lọc tĩnh loại bỏ sáp vụn hoàn toàn thủ công, không qua xử lý nhiệt công nghiệp nhằm giữ trọn vẹn hệ enzyme, vitamin và khoáng chất quý giá.',
    introSec3Heading_vi: '3. Cam kết chất lượng từ Hoàng Bách',
    introSec3Bullets_vi: '100% mật ong hoa bạc hà nguyên chất khai thác đúng vụ tại Cao nguyên đá.\nKhông pha trộn đường, không chất bảo quản, không hương liệu hay phẩm màu nhân tạo.\nMỗi sản phẩm đều gắn tem QR truy xuất nguồn gốc minh bạch từng lô thu hoạch.\nĐạt tiêu chuẩn An toàn vệ sinh thực phẩm và chứng nhận đặc sản vùng cao.',
    // Bài viết Tab 2: Đặc sắc (VI)
    featuredTitle_vi: 'ĐẶC SẮC CỦA MẬT ONG HOA BẠC HÀ',
    featuredSubtitle_vi: 'Những giá trị độc bản tạo nên danh tiếng "Vàng lỏng" vùng Cao nguyên đá',
    featuredLead_vi: 'Mật ong hoa bạc hà sở hữu sắc - hương - vị và hàm lượng dinh dưỡng vượt trội nhờ sự giao thoa kỳ diệu giữa cây dược liệu bạc hà núi đá và giống ong nội bản địa.',
    featuredSec1Heading_vi: '1. Màu sắc & Hương vị độc nhất vô nhị',
    featuredSec1Body_vi: 'Mật có màu vàng chanh óng ả pha chút ánh xanh oliu dịu mắt, độ kết dính cao, khi rót tạo dòng chảy mềm mại không đứt đoạn. Vị ngọt thanh tao, mát dịu nơi đầu lưỡi và đọng lại hậu vị the mát thoảng hương hoa bạc hà rừng tự nhiên, hoàn toàn không ngọt gắt như các loại mật thông thường.',
    featuredSec2Heading_vi: '2. Giá trị dược tính & Chăm sóc sức khỏe',
    featuredSec2Bullets_vi: 'Hỗ trợ làm dịu cổ họng, giảm ho khan, ho có đờm, viêm họng và bảo vệ đường hô hấp hiệu quả khi thời tiết giao mùa.\nBồi bổ cơ thể, tăng cường sức đề kháng tự nhiên nhờ hàm lượng cao các axit amin, enzyme tự nhiên (Diastase, Invertase), Vitamin B1, B2, B6, C và khoáng chất (Canxi, Sắt, Kẽm, Magie).\nHỗ trợ hệ tiêu hóa khỏe mạnh, làm dịu niêm mạc dạ dày và cải thiện giấc ngủ sâu.\nLàm đẹp da từ bên trong nhờ hoạt chất chống oxy hóa tự nhiên dồi dào.',
    featuredSec3Heading_vi: '3. Dấu hiệu nhận biết mật ong hoa bạc hà chuẩn Hoàng Bách',
    featuredSec3Body_vi: 'Mật ong hoa bạc hà chuẩn có hàm lượng thủy phần thấp (< 20%), sánh đặc tự nhiên, để lâu năm vẫn giữ hương thơm dịu và màu sắc tươi sáng, không bị chua hay lên ga khi bảo quản đúng cách.',
    // Bài viết Tab 3: Cách dùng (VI)
    usageTitle_vi: 'HƯỚNG DẪN SỬ DỤNG & BẢO QUẢN ĐÚNG CÁCH',
    usageSubtitle_vi: 'Phát huy tối đa dưỡng chất quý giá từ Mật Ong Hoa Bạc Hà',
    usageLead_vi: 'Sử dụng mật ong hoa bạc hà đúng thời điểm và đúng nhiệt độ giúp cơ thể hấp thu trọn vẹn các enzyme sinh học và hoạt chất thảo dược tự nhiên.',
    usageSec1Heading_vi: '1. Cách dùng hàng ngày tốt nhất cho sức khỏe',
    usageSec1Bullets_vi: 'Pha uống buổi sáng: Pha 1–2 thìa cà phê (10–15ml) mật ong hoa bạc hà với 150–200ml nước ấm (nhiệt độ lý tưởng 40°C – 50°C, không dùng nước sôi trên 60°C để tránh làm mất enzyme quý). Uống trước bữa sáng 20–30 phút giúp thanh lọc cơ thể và bảo vệ dạ dày.\nGiảm ho, dịu họng: Ngậm trực tiếp 1 thìa nhỏ mật ong nguyên chất hoặc chưng cách thủy cùng quất (tắc), chanh đào, gừng tươi, lá hẹ dùng 2–3 lần/ngày.\nKết hợp thảo dược & ẩm thực: Pha cùng trà hoa cúc, trà thảo mộc, saffron (nhụy hoa nghệ tây), nước cam chanh hoặc dùng kèm sữa chua, bánh mì, salad trái cây.',
    usageSec2Heading_vi: '2. Đối tượng sử dụng & Lưu ý quan trọng',
    usageSec2Bullets_vi: 'Phù hợp cho người lớn, người cao tuổi, người suy nhược cơ thể, người làm việc căng thẳng và trẻ em trên 1 tuổi.\nLưu ý: Không dùng mật ong cho trẻ sơ sinh dưới 12 tháng tuổi.\nNên dùng thìa gỗ, sứ hoặc nhựa sạch để lấy mật; hạn chế ngâm thìa kim loại lâu trong hũ mật.',
    usageSec3Heading_vi: '3. Hướng dẫn bảo quản',
    usageSec3Body_vi: 'Đậy kín nắp sau khi sử dụng, đặt ở nơi khô ráo, thoáng mát (nhiệt độ phòng 20°C – 28°C), tránh ánh nắng mặt trời chiếu trực tiếp. Không cần bảo quản trong ngăn mát tủ lạnh vì nhiệt độ thấp dễ làm mật ong tự nhiên kết tinh đường glucose.',
    // Bài viết Tab 5: Thổ nhưỡng (VI)
    soilTitle_vi: 'THỔ NHƯỠNG & KHÍ HẬU VÙNG CAO NGUYÊN ĐÁ',
    soilSubtitle_vi: 'Hệ sinh thái núi đá vôi hàng trăm triệu năm tuổi tạo nên loài hoa bạc hà độc bản',
    soilLead_vi: 'Cao nguyên đá Đồng Văn (bao gồm 4 huyện Quản Bạ, Yên Minh, Đồng Văn, Mèo Vạc) được UNESCO công nhận là Công viên Địa chất Toàn cầu với địa hình hơn 80% là núi đá vôi tai mèo dựng đứng ở độ cao 1.000m – 1.600m so với mực nước biển.',
    soilSec1Heading_vi: '1. Địa chất đá vôi giàu khoáng chất tự nhiên',
    soilSec1Body_vi: 'Trải qua hàng trăm triệu năm kiến tạo địa chất, lớp đất mùn tích tụ trong các hốc đá tai mèo cực kỳ giàu khoáng chất vi lượng (Canxi, Magie, Kali, Silic). Cây bạc hà dại (Elsholtzia ciliata / Mentha arvensis bản địa) bám rễ sâu vào các khe đá khô cằn để hút dưỡng chất và sương núi, giúp tinh dầu trong cánh hoa và mật hoa đậm đặc gấp nhiều lần vùng đồng bằng.',
    soilSec2Heading_vi: '2. Khí hậu khắc nghiệt hun đúc tinh hoa',
    soilSec2Body_vi: 'Vào mùa hoa bạc hà nở (từ tháng 10 đến tháng 12 âm lịch), vùng cao nguyên có biên độ nhiệt ngày và đêm rất lớn: ban ngày nắng hanh vàng rực rỡ, ban đêm sương mù bao phủ và nhiệt độ hạ thấp 8°C – 15°C. Chính sự khắc nghiệt này kích thích cây bạc hà tiết ra lượng mật hoa cô đặc nhất, giàu đường tự nhiên và tinh dầu thơm mát để thu hút đàn ong.',
    soilSec3Heading_vi: '3. Môi trường sinh thái nguyên sơ',
    soilSec3Bullets_vi: 'Hoàn toàn tách biệt khỏi khu công nghiệp, khói bụi đô thị và hóa chất nông nghiệp.\nCây bạc hà mọc hoang dã tự nhiên trên sườn núi đá, không sử dụng phân bón hóa học hay thuốc bảo vệ thực vật.\nNguồn nước sương núi trong lành tạo nên độ tinh khiết tuyệt đối cho từng giọt mật.',
    // Bài viết Tab 6: Giống ong (VI)
    beeTitle_vi: 'GIỐNG ONG NỘI BẢN ĐỊA CAO NGUYÊN ĐÁ',
    beeSubtitle_vi: 'Những "nghệ nhân" cần mẫn vượt gió sương núi đá thu lượm mật quý',
    beeLead_vi: 'Mật Ong Hoa Bạc Hà Hoàng Bách được tạo nên bởi giống Ong Nội địa bản xứ (Apis cerana) đã thích nghi hàng ngàn năm với địa hình hiểm trở và khí hậu lạnh giá của vùng núi cao cực Bắc.',
    beeSec1Heading_vi: '1. Đặc điểm sinh học vượt trội của giống Ong Nội vùng cao',
    beeSec1Body_vi: 'Khác với các giống ong ngoại nhập khẩu, ong nội bản địa Cao nguyên đá có kích thước cơ thể nhỏ gọn, đôi cánh khỏe, cực kỳ nhanh nhẹn và có khả năng chịu rét, chịu sương mù xuất sắc. Nhờ vòi hút mật mảnh và sự linh hoạt, ong nội dễ dàng len lỏi sâu vào từng đài hoa bạc hà nhỏ li ti mọc sát vách đá tai mèo để lấy trọn giọt mật tinh túy nhất.',
    beeSec2Heading_vi: '2. Quá trình luyện mật kỳ công trong tổ',
    beeSec2Body_vi: 'Mỗi ngày, hàng vạn ong thợ bay hàng cây số qua các triền đá để thu gom mật hoa. Khi mang về tổ, đàn ong truyền mật qua nhau, tiết thêm hệ enzyme tự nhiên từ tuyến hầu và quạt cánh liên tục suốt ngày đêm để làm bay hơi nước tự nhiên. Chỉ khi hàm lượng nước giảm xuống dưới 19–20%, ong mới dùng sáp trắng vít kín nắp lỗ tổ (mật chín tự nhiên).',
    beeSec3Heading_vi: '3. Phương thức nuôi ong truyền thống bền vững',
    beeSec3Bullets_vi: 'Thùng ong được làm từ gỗ tự nhiên khô thoáng, đặt dọc theo các thung lũng và sườn núi đá nơi có thảm hoa bạc hà dày đặc nhất.\nTuyệt đối không cho ong ăn đường trong suốt vụ thu hoạch mật hoa bạc hà.\nKhông sử dụng kháng sinh trong mật thương phẩm, bảo tồn quần thể ong bản địa và hệ sinh thái tự nhiên.',
    // English (EN) & Chinese (ZH) Header overrides
    headerTitle_en: 'ORIGIN TRACEABILITY STAMP',
    defaultProductName_en: 'Wild Mint Flower Honey (Mật Ong Hoa Bạc Hà)',
    defaultProducerName_en: 'Hoang Bach Business Household',
    defaultAddress_en: 'Xin Chai Village, Son Vi Commune, Tuyen Quang Province, Vietnam',
    verifiedLabel_en: 'Authentic Hoang Bach',
    headerTitle_zh: '原产地溯源防伪标签',
    defaultProductName_zh: '野生薄荷花蜂蜜 (Mật Ong Hoa Bạc Hà)',
    defaultProducerName_zh: '黄百蜂蜜经营户 (Hoàng Bách)',
    defaultAddress_zh: '越南宣光省山尾社新寨村',
    verifiedLabel_zh: '黄百正品认证',
    // Hình ảnh giao diện Mật Ong
    rightLogoUrl: '',
    midBannerUrl: '/images/honey/honey_Banner.png',
    footerBannerUrl: '/images/honey/honey_footer_banner.png'
  },

  // =====================================================================
  // 5. GIAO DIỆN SẢN PHẨM OCOP (ocop)
  // =====================================================================
  ocop: {
    certSublabel: 'Sản phẩm đã được cấp:',
    defaultCertText: 'CHỨNG NHẬN OCOP',
    ownerSublabel: 'Đơn vị sở hữu:',
    ownerBoxTitle: 'THÔNG TIN CHỦ THỂ',
    btn1Label: 'Thông tin sản phẩm',
    btn2Label: 'Thông tin chủ thể',
    btn3Label: 'Chứng nhận',
    btn4Label: 'Nhận Diện Thương Hiệu',
    btn5Label: 'Hệ thống phân phối',
    btn6Label: 'Tích điểm',
    btn7Label: 'Quy trình sản xuất',
    btn8Label: 'Nguồn gốc xuất xứ',
    congBoSectionTitle: 'HỒ SƠ CÔNG BỐ SẢN PHẨM',
    congBoSectionSub: 'Giấy tiếp nhận bản công bố đã được cơ quan có thẩm quyền thẩm định',
    relatedSectionTitle: 'SẢN PHẨM LIÊN QUAN',
    commitmentTitle: 'CAM KẾT TỪ CHỦ THỂ',
    commitmentDesc: 'Chúng tôi cam kết sản phẩm đạt chuẩn OCOP, đảm bảo chất lượng, nguồn gốc rõ ràng và an toàn cho người tiêu dùng.',
    reportBtnText: 'BÁO CÁO VI PHẠM'
  },

  // =====================================================================
  // 6. GIAO DIỆN DƯỢC PHẨM & Y TẾ (medical)
  // =====================================================================
  medical: {
    trustBannerTitle: 'SẢN PHẨM DƯỢC PHẨM & Y TẾ CHÍNH HÃNG',
    trustBannerSubtitle: 'Đã kiểm định chất lượng & cấp phép lưu hành Bộ Y Tế',
    rxBadgeText: 'THUỐC KÊ ĐƠN / DƯỢC PHẨM CHÍNH HÃNG',
    gmpBadgeText: 'ĐẠT CHUẨN GMP-WHO',
    producerPrefix: 'Đơn vị sản xuất:',
    spec1Label: 'Số đăng ký (SĐK):',
    spec1DefaultVal: 'VD-35281-21',
    spec2Label: 'Dạng bào chế:',
    spec2DefaultVal: 'Viên nén bao phim',
    spec3Label: 'Quy cách đóng gói:',
    spec3DefaultVal: 'Hộp 3 vỉ x 10 viên',
    spec4Label: 'Số lô & HSD:',
    spec4DefaultVal: 'Lô: 240812 | HSD: 12/08/2027',
    detailBtnText: 'Chi tiết thành phần & liều dùng',
    warningTitle: 'LƯU Ý QUAN TRỌNG KHI SỬ DỤNG THUỐC & DƯỢC PHẨM',
    warningDesc: 'Đọc kỹ hướng dẫn sử dụng trước khi dùng. Thuốc dùng theo đơn hoặc chỉ định từ Bác sĩ/Dược sĩ chuyên khoa. Để xa tầm tay trẻ em.',
    btn1Label: 'Mã tem & QR',
    btn2Label: 'Lịch sử quét',
    btn3Label: 'Nhà sản xuất GMP',
    btn4Label: 'Hệ thống nhà thuốc',
    btn5Label: 'Thành phần dược chất',
    btn6Label: 'Chỉ định & Liều dùng',
    btn7Label: 'Chứng nhận GMP/Bộ Y Tế',
    btn8Label: 'Thận trọng & Bảo quản',
    storageSectionTitle: 'THÔNG TIN SẢN XUẤT & BẢO QUẢN DƯỢC PHẨM',
    storage1Label: 'Nhiệt độ bảo quản:',
    storage1Val: 'Nơi khô ráo, dưới 30°C',
    storage2Label: 'Ánh sáng:',
    storage2Val: 'Tránh ánh nắng trực tiếp',
    storage3Label: 'Hạn sử dụng tem:',
    storage4Label: 'Tiêu chuẩn áp dụng:',
    storage4Val: 'Dược điển Việt Nam V',
    // Nội dung Popup Thành phần, Liều dùng, Thận trọng
    ingredientsLabel1: 'Thành phần chính:',
    ingredientsVal1: 'Paracetamol (500mg), Phụ liệu vừa đủ 1 viên',
    ingredientsLabel2: 'Tác dụng dược lý:',
    ingredientsVal2: 'Giảm đau, hạ sốt nhanh chóng và an toàn',
    ingredientsLabel3: 'Độ tinh khiết:',
    ingredientsVal3: 'Đạt 99.8% chuẩn Dược điển VN V',
    dosageLabel1: 'Người lớn:',
    dosageVal1: '1-2 viên / lần, mỗi 4-6 giờ (Tối đa 8 viên/ngày)',
    dosageLabel2: 'Trẻ em (7-12 tuổi):',
    dosageVal2: '1/2 - 1 viên / lần (Theo chỉ định bác sĩ)',
    dosageLabel3: 'Cách dùng:',
    dosageVal3: 'Uống sau khi ăn với 150ml nước lọc',
    cautionLabel1: 'Chống chỉ định:',
    cautionVal1: 'Mẫn cảm với các thành phần của thuốc, suy gan nặng',
    cautionLabel2: 'Bảo quản:',
    cautionVal2: 'Khu vực khô ráo, dưới 30°C, tránh ánh sáng'
  },

  // =====================================================================
  // 7. GIAO DIỆN NÔNG SẢN & NÔNG NGHIỆP VIETGAP (agriculture)
  // =====================================================================
  agriculture: {
    bannerTitle: 'NÔNG SẢN VIỆT CHÍNH HÃNG - TRUY XUẤT NGUỒN GỐC',
    bannerSubtitle: 'Đạt chuẩn VietGAP / GlobalGAP - Nông nghiệp xanh',
    tag1Label: 'Mã vùng trồng:',
    tag1Val: 'PUC-VN-882',
    tag2Label: 'Ngày thu hoạch:',
    tag2Val: 'Gần nhất',
    tag3Label: 'Hợp tác xã:',
    btn1Label: 'Thông tin tem',
    btn2Label: 'Nhật ký quét',
    btn3Label: 'Vùng trồng/HTX',
    btn4Label: 'Chứng nhận VietGAP',
    relatedSectionTitle: 'SẢN PHẨM LIÊN QUAN'
  },

  // =====================================================================
  // 8. GIAO DIỆN MỸ PHẨM & LÀM ĐẸP (cosmetics)
  // =====================================================================
  cosmetics: {
    bannerTitle: 'MỸ PHẨM CHÍNH HÃNG - BẢO VỆ LÀN DA VIỆT',
    bannerSubtitle: 'Đã qua kiểm nghiệm da liễu & An toàn cho mọi loại da',
    brandPrefix: 'Thương hiệu:',
    spec1Label: 'Loại da:',
    spec1Val: 'Mọi loại da',
    spec2Label: 'PAO (Mở nắp):',
    spec2Val: '12 Tháng',
    spec3Label: 'Số công bố:',
    spec3Val: 'CB-8834/22',
    btn1Label: 'Thông tin tem',
    btn2Label: 'Lịch sử quét',
    btn3Label: 'Thành phần',
    btn4Label: 'Nhà sản xuất',
    relatedSectionTitle: 'SẢN PHẨM LIÊN QUAN',
    ingredientsLabel1: 'Thành phần dưỡng chất:',
    ingredientsVal1: 'Hyaluronic Acid, Niacinamide, Chiết xuất thiên nhiên lành tính',
    ingredientsLabel2: 'Công dụng chính:',
    ingredientsVal2: 'Cấp ẩm chuyên sâu, phục hồi hàng rào bảo vệ da và dưỡng sáng tự nhiên',
    ingredientsLabel3: 'Kiểm nghiệm an toàn:',
    ingredientsVal3: 'Không Paraben, không cồn khô, đạt chuẩn CGMP-ASEAN'
  }
};

// Cấu trúc phân nhóm trường soạn thảo (Editor Sections) cho từng giao diện trong Admin
export const THEME_EDITOR_SECTIONS = {
  appliance: [
    {
      title: '1. Banner Xác Thực & Cảnh Báo Quét',
      fields: [
        { key: 'verifyTitle', label: 'Tiêu đề xác thực chính hãng', type: 'text' },
        { key: 'verifySubtitle', label: 'Mô tả xác thực phụ', type: 'text' },
        { key: 'warningTitlePrefix', label: 'Tiêu đề cảnh báo khi quét nhiều lần', type: 'text' },
        { key: 'warningSubtitle', label: 'Nội dung cảnh báo khi quét nhiều lần', type: 'textarea' }
      ]
    },
    {
      title: '2. Khối Thẻ Sản Phẩm & Thống Kê Quét',
      fields: [
        { key: 'activationCodeLabel', label: 'Nhãn dòng Mã kích hoạt', type: 'text' },
        { key: 'categoryLabel', label: 'Nhãn dòng Danh mục', type: 'text' },
        { key: 'scanCountLabel', label: 'Nhãn ô Số lần quét', type: 'text' },
        { key: 'firstScanLabel', label: 'Nhãn ô Quét lần đầu', type: 'text' }
      ]
    },
    {
      title: '3. Khối Nhà Sản Xuất (NSX) & Nhà Phân Phối (NPP)',
      fields: [
        { key: 'nsxSectionTitle', label: 'Tiêu đề khối Nhà sản xuất (NSX)', type: 'text' },
        { key: 'brandOwnerLabel', label: 'Nhãn Chủ sở hữu nhãn hiệu', type: 'text' },
        { key: 'nppSectionTitle', label: 'Tiêu đề khối Nhà phân phối (Nhà PP)', type: 'text' },
        { key: 'nppDefaultText', label: 'Câu mô tả mặc định khi chưa có đại lý riêng', type: 'textarea' }
      ]
    },
    {
      title: '4. Khung Xanh Xác Thực (Mã Sở Hữu & Mã Chống Giả)',
      fields: [
        { key: 'ownerCodeLabel', label: 'Nhãn dòng 1 (Mã sở hữu sản phẩm - Cột 2 Excel)', type: 'text' },
        { key: 'antiCounterfeitLabel', label: 'Nhãn dòng 2 (Mã chống giả - Cột 1 Excel)', type: 'text' },
        { key: 'verifiedBadgeText', label: 'Chữ trên huy hiệu xác thực góc phải', type: 'text' },
        { key: 'unactivatedOwnerNote', label: 'Ghi chú khi chưa có mã sở hữu', type: 'text' }
      ]
    },
    {
      title: '5. Khối Giấy Tờ Công Bố & Thông Tin KH Sở Hữu (Cuối trang)',
      fields: [
        { key: 'certSectionTitle', label: 'Tiêu đề khối Giấy tờ & Bản công bố', type: 'text' },
        { key: 'certNumberLabel', label: 'Nhãn Số tiếp nhận công bố', type: 'text' },
        { key: 'certGuideText', label: 'Câu hướng dẫn xem ảnh công bố', type: 'text' },
        { key: 'ownerCardTitle', label: 'Tiêu đề khối Thông tin KH sở hữu sản phẩm', type: 'text' },
        { key: 'ownerNameLabel', label: 'Nhãn Tên NPP / cá nhân', type: 'text' },
        { key: 'ownerAddressLabel', label: 'Nhãn Địa chỉ KH', type: 'text' },
        { key: 'ownerPhoneLabel', label: 'Nhãn Số điện thoại KH', type: 'text' },
        { key: 'activatedSerialLabel', label: 'Nhãn dòng cuối (Serial đã được kích hoạt)', type: 'text' }
      ]
    },
    {
      title: '6. Khối Chính Sách Bảo Hành 4 Ô (Dành cho mẫu Bảo hành Mở rộng)',
      fields: [
        { key: 'warrantyBannerSubtitle', label: 'Mô tả dưới tiêu đề Banner Bảo hành', type: 'text' },
        { key: 'warrantyBadgeText', label: 'Huy hiệu Đã kích hoạt bảo hành', type: 'text' },
        { key: 'warrantyPolicySectionTitle', label: 'Tiêu đề khối Chính sách bảo hành', type: 'text' },
        { key: 'warrantyCol1Label', label: 'Ô 1 - Nhãn (Thời gian BH)', type: 'text' },
        { key: 'warrantyCol1Value', label: 'Ô 1 - Giá trị (VD: 24 tháng)', type: 'text' },
        { key: 'warrantyCol2Label', label: 'Ô 2 - Nhãn (Hình thức BH)', type: 'text' },
        { key: 'warrantyCol2Value', label: 'Ô 2 - Giá trị (VD: Toàn quốc)', type: 'text' },
        { key: 'warrantyCol3Label', label: 'Ô 3 - Nhãn (Điều kiện BH)', type: 'text' },
        { key: 'warrantyCol3Value', label: 'Ô 3 - Giá trị điều kiện', type: 'text' },
        { key: 'warrantyCol4Label', label: 'Ô 4 - Nhãn (Hotline hỗ trợ)', type: 'text' },
        { key: 'warrantyCol4Value', label: 'Ô 4 - Số Hotline', type: 'text' },
        { key: 'warrantyFooterNote', label: 'Ghi chú cuối khối bảo hành', type: 'textarea' }
      ]
    }
  ],

  functional_food: [
    {
      title: '1. Đầu Trang (Header) & Trạng Thái Kích Hoạt Mã',
      fields: [
        { key: 'headerTitle', label: 'Tiêu đề chính đầu trang', type: 'text' },
        { key: 'headerSubtitle', label: 'Khẩu hiệu (Slogan) dưới tiêu đề', type: 'text' },
        { key: 'activatedBannerTitle', label: 'Tiêu đề Banner khi ĐÃ kích hoạt mã', type: 'text' },
        { key: 'activatedBannerDesc', label: 'Mô tả Banner khi ĐÃ kích hoạt mã', type: 'textarea' },
        { key: 'unactivatedBannerTitle', label: 'Tiêu đề Banner khi CHƯA kích hoạt mã', type: 'text' },
        { key: 'unactivatedBannerDesc', label: 'Mô tả Banner khi CHƯA kích hoạt mã', type: 'textarea' }
      ]
    },
    {
      title: '2. Thẻ Sản Phẩm & Khung Nhập Mã Kích Hoạt',
      fields: [
        { key: 'categoryTagText', label: 'Nhãn danh mục trên tên sản phẩm', type: 'text' },
        { key: 'viewDetailBtnText', label: 'Chữ nút Xem chi tiết sản phẩm', type: 'text' },
        { key: 'makerPrefixLabel', label: 'Nhãn Nhà sản xuất', type: 'text' },
        { key: 'activateBoxTitle', label: 'Tiêu đề khung Nhập mã kích hoạt', type: 'text' },
        { key: 'activateBoxDesc', label: 'Hướng dẫn trong khung Nhập mã kích hoạt', type: 'textarea' },
        { key: 'activateBtnText', label: 'Chữ trên nút Kích hoạt', type: 'text' },
        { key: 'storeSectionTitle', label: 'Tiêu đề khối Thông tin Điểm bán chính hãng', type: 'text' }
      ]
    },
    {
      title: '3. Nhãn 8 Nút Chức Năng Truy Xuất',
      fields: [
        { key: 'btn1Label', label: 'Nút 1 (Thông tin sản phẩm)', type: 'text' },
        { key: 'btn2Label', label: 'Nút 2 (Công Bố)', type: 'text' },
        { key: 'btn3Label', label: 'Nút 3 (Nhà Sản Xuất)', type: 'text' },
        { key: 'btn4Label', label: 'Nút 4 (Nhà Phân Phối)', type: 'text' },
        { key: 'btn5Label', label: 'Nút 5 (Thông tin tem)', type: 'text' },
        { key: 'btn6Label', label: 'Nút 6 (Thư Viện SP)', type: 'text' },
        { key: 'btn7Label', label: 'Nút 7 (Bao bì)', type: 'text' },
        { key: 'btn8Label', label: 'Nút 8 (Tích điểm)', type: 'text' }
      ]
    },
    {
      title: '4. Nội Dung Popup Tích Điểm, Bao Bì & Chân Trang',
      fields: [
        { key: 'certSectionTitle', label: 'Tiêu đề khối Giấy công bố sản phẩm', type: 'text' },
        { key: 'relatedSectionTitle', label: 'Tiêu đề khối Sản phẩm liên quan', type: 'text' },
        { key: 'rewardModalTitle', label: 'Popup Tích điểm - Tiêu đề', type: 'text' },
        { key: 'rewardModalSubtitle', label: 'Popup Tích điểm - Tiêu đề phụ', type: 'text' },
        { key: 'rewardPointsText', label: 'Số điểm cộng mỗi lần quét (VD: +100 điểm thưởng)', type: 'text' },
        { key: 'rewardModalDesc', label: 'Popup Tích điểm - Mô tả thể lệ', type: 'textarea' },
        { key: 'brandStoryContent', label: 'Popup Bao bì / Nhận diện - Nội dung mô tả', type: 'textarea' },
        { key: 'supportTitle', label: 'Tiêu đề khối Tư vấn & Hỗ trợ', type: 'text' },
        { key: 'supportDesc', label: 'Mô tả khối Tư vấn & Hỗ trợ', type: 'text' },
        { key: 'supportBtnText', label: 'Chữ trên nút Liên hệ tư vấn', type: 'text' },
        { key: 'footerThankYou', label: 'Lời cảm ơn ở chân trang (Footer)', type: 'text' }
      ]
    }
  ],

  staycool: [
    {
      title: '1. Thanh Tiêu Đề Cam (Pill Banners) & Khung Kích Hoạt',
      fields: [
        { key: 'pillBanner1Activated', label: 'Chữ trên Thanh Cam 1 (Khi ĐÃ kích hoạt mã)', type: 'text' },
        { key: 'pillBanner1Unactivated', label: 'Chữ trên Thanh Cam 1 (Khi CHƯA kích hoạt mã)', type: 'text' },
        { key: 'pillBanner2Text', label: 'Chữ trên Thanh Cam 2 (Để trống sẽ tự lấy theo tên DN/SP)', type: 'text' },
        { key: 'unactivatedBoxTitle', label: 'Tiêu đề khung Chưa kích hoạt mã', type: 'text' },
        { key: 'unactivatedBoxDesc', label: 'Nội dung hướng dẫn khi chưa kích hoạt mã', type: 'textarea' },
        { key: 'storeSectionTitle', label: 'Tiêu đề khối Thông tin Điểm bán', type: 'text' }
      ]
    },
    {
      title: '2. Nhãn 3 Nút Tròn & 6 Ô Chức Năng Chính',
      fields: [
        { key: 'actionPill1Label', label: 'Nút tròn 1 (Kích hoạt)', type: 'text' },
        { key: 'actionPill2Label', label: 'Nút tròn 2 (Kiểm tra)', type: 'text' },
        { key: 'actionPill3Label', label: 'Nút tròn 3 (Tích điểm)', type: 'text' },
        { key: 'gridBtn1Label', label: 'Ô 1 (Thông tin sản phẩm)', type: 'text' },
        { key: 'gridBtn2Label', label: 'Ô 2 (Nhà sản xuất)', type: 'text' },
        { key: 'gridBtn3Label', label: 'Ô 3 (Độc quyền P.Phối)', type: 'text' },
        { key: 'gridBtn4Label', label: 'Ô 4 (Thông tin tem)', type: 'text' },
        { key: 'gridBtn5Label', label: 'Ô 5 (NHẬN DIỆN THƯƠNG HIỆU)', type: 'text' },
        { key: 'gridBtn6Label', label: 'Ô 6 (CÔNG BỐ)', type: 'text' }
      ]
    },
    {
      title: '3. Nội Dung Popup Nhà Sản Xuất Quốc Tế',
      fields: [
        { key: 'mfgDefaultTitle', label: 'Tên Viện / Nhà sản xuất mặc định', type: 'text' },
        { key: 'mfgDefaultSubtitle', label: 'Tiêu đề phụ Nhà sản xuất', type: 'text' },
        { key: 'mfgDefaultDesc', label: 'Đoạn giới thiệu Viện / Nhà sản xuất', type: 'textarea' },
        { key: 'mfgDefaultOrigin', label: 'Quốc gia xuất xứ mặc định', type: 'text' },
        { key: 'mfgDefaultStandard', label: 'Tiêu chuẩn nhà máy (cGMP, ISO, HACCP...)', type: 'text' },
        { key: 'mfgDefaultSlogan', label: 'Định hướng phát triển / Slogan', type: 'text' },
        { key: 'mfgDefaultWebsite', label: 'Website hãng sản xuất', type: 'text' },
        { key: 'mfgCommitmentText', label: 'Đoạn Cam kết chất lượng Châu Âu / Quốc tế', type: 'textarea' }
      ]
    },
    {
      title: '4. Nội Dung Popup Độc Quyền Phân Phối & Tư Vấn Trực Tuyến',
      fields: [
        { key: 'distModalTitle', label: 'Popup Nhà phân phối - Tiêu đề chính', type: 'text' },
        { key: 'distModalSubtitle', label: 'Popup Nhà phân phối - Tiêu đề phụ', type: 'text' },
        { key: 'distModalDesc', label: 'Popup Nhà phân phối - Đoạn giới thiệu giấy phép Bộ Y Tế', type: 'textarea' },
        { key: 'distCommitmentText', label: 'Popup Nhà phân phối - Cam kết vàng chống giả', type: 'textarea' },
        { key: 'rewardClubName', label: 'Popup Tích điểm - Tên CLB thành viên', type: 'text' },
        { key: 'consultTitle', label: 'Tiêu đề khối Tư vấn sản phẩm trực tuyến', type: 'text' },
        { key: 'consultDesc', label: 'Mô tả khối Tư vấn trực tuyến', type: 'text' },
        { key: 'consultBtnText', label: 'Chữ trên nút Tư vấn ngay', type: 'text' },
        { key: 'footerSubnote', label: 'Dòng ghi chú chân trang', type: 'text' }
      ]
    }
  ],

  honey: [
    {
      title: '1. Thông Tin Đầu Trang & Hình Ảnh Giao Diện (Tiếng Việt)',
      fields: [
        { key: 'headerTitle_vi', label: 'Tiêu đề lớn trên cùng (Tiếng Việt)', type: 'text' },
        { key: 'lblProduct_vi', label: 'Nhãn dòng 1 (SẢN PHẨM:)', type: 'text' },
        { key: 'defaultProductName_vi', label: 'Tên sản phẩm mặc định (nếu SP chưa đặt tên)', type: 'text' },
        { key: 'lblProducer_vi', label: 'Nhãn dòng 2 (ĐƠN VỊ SẢN XUẤT:)', type: 'text' },
        { key: 'defaultProducerName_vi', label: 'Tên đơn vị sản xuất hiển thị', type: 'text' },
        { key: 'lblAddress_vi', label: 'Nhãn dòng 3 (ĐỊA CHỈ:)', type: 'text' },
        { key: 'defaultAddress_vi', label: 'Địa chỉ sản xuất hiển thị', type: 'text' },
        { key: 'lblContact_vi', label: 'Nhãn dòng 4 (LIÊN HỆ:)', type: 'text' },
        { key: 'defaultContact_vi', label: 'Số điện thoại liên hệ hiển thị', type: 'text' },
        { key: 'verifiedLabel_vi', label: 'Huy hiệu xác thực (VD: Chính hãng Hoàng Bách)', type: 'text' },
        { key: 'rightLogoUrl', label: 'Ảnh Logo khung bên phải (Để trống dùng logo mặc định)', type: 'text' },
        { key: 'midBannerUrl', label: 'Ảnh Banner phong cảnh giữa trang (URL)', type: 'text' },
        { key: 'footerBannerUrl', label: 'Ảnh Banner chân trang (URL)', type: 'text' }
      ]
    },
    {
      title: '2. Tên 6 Tab Menu & 3 Vùng Phân Phối (Tiếng Việt)',
      fields: [
        { key: 'tab1Label_vi', label: 'Tên Tab 1 (Giới thiệu)', type: 'text' },
        { key: 'tab2Label_vi', label: 'Tên Tab 2 (Đặc sắc)', type: 'text' },
        { key: 'tab3Label_vi', label: 'Tên Tab 3 (Cách dùng)', type: 'text' },
        { key: 'tab4Label_vi', label: 'Tên Tab 4 (Các điểm phân phối)', type: 'text' },
        { key: 'tab5Label_vi', label: 'Tên Tab 5 (Thổ nhưỡng)', type: 'text' },
        { key: 'tab6Label_vi', label: 'Tên Tab 6 (Giống ong)', type: 'text' },
        { key: 'region1Label_vi', label: 'Tên Vùng phân phối 1 (Đồng Văn)', type: 'text' },
        { key: 'region2Label_vi', label: 'Tên Vùng phân phối 2 (Mèo Vạc)', type: 'text' },
        { key: 'region3Label_vi', label: 'Tên Vùng phân phối 3 (Yên Minh)', type: 'text' }
      ]
    },
    {
      title: '3. Nội Dung Bài Viết Tab 1: GIỚI THIỆU',
      fields: [
        { key: 'introTitle_vi', label: 'Tiêu đề bài viết Giới thiệu', type: 'text' },
        { key: 'introSubtitle_vi', label: 'Tiêu đề phụ', type: 'text' },
        { key: 'introLead_vi', label: 'Đoạn mở đầu (Lead)', type: 'textarea' },
        { key: 'introSec1Heading_vi', label: 'Mục 1 - Tiêu đề', type: 'text' },
        { key: 'introSec1Body_vi', label: 'Mục 1 - Nội dung', type: 'textarea' },
        { key: 'introSec2Heading_vi', label: 'Mục 2 - Tiêu đề', type: 'text' },
        { key: 'introSec2Body_vi', label: 'Mục 2 - Nội dung', type: 'textarea' },
        { key: 'introSec3Heading_vi', label: 'Mục 3 - Tiêu đề', type: 'text' },
        { key: 'introSec3Bullets_vi', label: 'Mục 3 - Danh sách ý (Mỗi dòng 1 ý)', type: 'textarea' }
      ]
    },
    {
      title: '4. Nội Dung Bài Viết Tab 2: ĐẶC SẮC',
      fields: [
        { key: 'featuredTitle_vi', label: 'Tiêu đề bài viết Đặc sắc', type: 'text' },
        { key: 'featuredSubtitle_vi', label: 'Tiêu đề phụ', type: 'text' },
        { key: 'featuredLead_vi', label: 'Đoạn mở đầu (Lead)', type: 'textarea' },
        { key: 'featuredSec1Heading_vi', label: 'Mục 1 - Tiêu đề', type: 'text' },
        { key: 'featuredSec1Body_vi', label: 'Mục 1 - Nội dung', type: 'textarea' },
        { key: 'featuredSec2Heading_vi', label: 'Mục 2 - Tiêu đề', type: 'text' },
        { key: 'featuredSec2Bullets_vi', label: 'Mục 2 - Danh sách ý (Mỗi dòng 1 ý)', type: 'textarea' },
        { key: 'featuredSec3Heading_vi', label: 'Mục 3 - Tiêu đề', type: 'text' },
        { key: 'featuredSec3Body_vi', label: 'Mục 3 - Nội dung', type: 'textarea' }
      ]
    },
    {
      title: '5. Nội Dung Bài Viết Tab 3: CÁCH DÙNG',
      fields: [
        { key: 'usageTitle_vi', label: 'Tiêu đề bài viết Cách dùng', type: 'text' },
        { key: 'usageSubtitle_vi', label: 'Tiêu đề phụ', type: 'text' },
        { key: 'usageLead_vi', label: 'Đoạn mở đầu (Lead)', type: 'textarea' },
        { key: 'usageSec1Heading_vi', label: 'Mục 1 - Tiêu đề', type: 'text' },
        { key: 'usageSec1Bullets_vi', label: 'Mục 1 - Danh sách cách dùng (Mỗi dòng 1 ý)', type: 'textarea' },
        { key: 'usageSec2Heading_vi', label: 'Mục 2 - Tiêu đề', type: 'text' },
        { key: 'usageSec2Bullets_vi', label: 'Mục 2 - Lưu ý (Mỗi dòng 1 ý)', type: 'textarea' },
        { key: 'usageSec3Heading_vi', label: 'Mục 3 - Tiêu đề', type: 'text' },
        { key: 'usageSec3Body_vi', label: 'Mục 3 - Nội dung bảo quản', type: 'textarea' }
      ]
    },
    {
      title: '6. Nội Dung Bài Viết Tab 5: THỔ NHƯỠNG & Tab 6: GIỐNG ONG',
      fields: [
        { key: 'soilTitle_vi', label: 'Tab Thổ nhưỡng - Tiêu đề chính', type: 'text' },
        { key: 'soilSubtitle_vi', label: 'Tab Thổ nhưỡng - Tiêu đề phụ', type: 'text' },
        { key: 'soilLead_vi', label: 'Tab Thổ nhưỡng - Đoạn mở đầu', type: 'textarea' },
        { key: 'soilSec1Heading_vi', label: 'Tab Thổ nhưỡng - Mục 1 Tiêu đề', type: 'text' },
        { key: 'soilSec1Body_vi', label: 'Tab Thổ nhưỡng - Mục 1 Nội dung', type: 'textarea' },
        { key: 'soilSec2Heading_vi', label: 'Tab Thổ nhưỡng - Mục 2 Tiêu đề', type: 'text' },
        { key: 'soilSec2Body_vi', label: 'Tab Thổ nhưỡng - Mục 2 Nội dung', type: 'textarea' },
        { key: 'soilSec3Heading_vi', label: 'Tab Thổ nhưỡng - Mục 3 Tiêu đề', type: 'text' },
        { key: 'soilSec3Bullets_vi', label: 'Tab Thổ nhưỡng - Mục 3 Danh sách ý (Mỗi dòng 1 ý)', type: 'textarea' },
        { key: 'beeTitle_vi', label: 'Tab Giống ong - Tiêu đề chính', type: 'text' },
        { key: 'beeSubtitle_vi', label: 'Tab Giống ong - Tiêu đề phụ', type: 'text' },
        { key: 'beeLead_vi', label: 'Tab Giống ong - Đoạn mở đầu', type: 'textarea' },
        { key: 'beeSec1Heading_vi', label: 'Tab Giống ong - Mục 1 Tiêu đề', type: 'text' },
        { key: 'beeSec1Body_vi', label: 'Tab Giống ong - Mục 1 Nội dung', type: 'textarea' },
        { key: 'beeSec2Heading_vi', label: 'Tab Giống ong - Mục 2 Tiêu đề', type: 'text' },
        { key: 'beeSec2Body_vi', label: 'Tab Giống ong - Mục 2 Nội dung', type: 'textarea' },
        { key: 'beeSec3Heading_vi', label: 'Tab Giống ong - Mục 3 Tiêu đề', type: 'text' },
        { key: 'beeSec3Bullets_vi', label: 'Tab Giống ong - Mục 3 Danh sách ý (Mỗi dòng 1 ý)', type: 'textarea' }
      ]
    },
    {
      title: '7. Tùy Chỉnh Bản Dịch Tiếng Anh (EN) & Tiếng Trung (ZH)',
      fields: [
        { key: 'headerTitle_en', label: 'Tiêu đề trên cùng (English)', type: 'text' },
        { key: 'defaultProductName_en', label: 'Tên sản phẩm (English)', type: 'text' },
        { key: 'defaultProducerName_en', label: 'Đơn vị sản xuất (English)', type: 'text' },
        { key: 'defaultAddress_en', label: 'Địa chỉ (English)', type: 'text' },
        { key: 'verifiedLabel_en', label: 'Huy hiệu xác thực (English)', type: 'text' },
        { key: 'headerTitle_zh', label: 'Tiêu đề trên cùng (中文)', type: 'text' },
        { key: 'defaultProductName_zh', label: 'Tên sản phẩm (中文)', type: 'text' },
        { key: 'defaultProducerName_zh', label: 'Đơn vị sản xuất (中文)', type: 'text' },
        { key: 'defaultAddress_zh', label: 'Địa chỉ (中文)', type: 'text' },
        { key: 'verifiedLabel_zh', label: 'Huy hiệu xác thực (中文)', type: 'text' }
      ]
    }
  ],

  ocop: [
    {
      title: '1. Khối Chứng Nhận OCOP & Thông Tin Chủ Thể',
      fields: [
        { key: 'certSublabel', label: 'Nhãn trên dòng chứng nhận (Sản phẩm đã được cấp:)', type: 'text' },
        { key: 'defaultCertText', label: 'Dòng chữ chứng nhận màu đỏ (VD: CHỨNG NHẬN OCOP 4 SAO)', type: 'text' },
        { key: 'ownerSublabel', label: 'Nhãn Đơn vị sở hữu', type: 'text' },
        { key: 'ownerBoxTitle', label: 'Tiêu đề khối Thông tin chủ thể', type: 'text' }
      ]
    },
    {
      title: '2. Nhãn 8 Nút Chức Năng OCOP',
      fields: [
        { key: 'btn1Label', label: 'Nút 1 (Thông tin sản phẩm)', type: 'text' },
        { key: 'btn2Label', label: 'Nút 2 (Thông tin chủ thể)', type: 'text' },
        { key: 'btn3Label', label: 'Nút 3 (Chứng nhận)', type: 'text' },
        { key: 'btn4Label', label: 'Nút 4 (Nhận Diện Thương Hiệu)', type: 'text' },
        { key: 'btn5Label', label: 'Nút 5 (Hệ thống phân phối)', type: 'text' },
        { key: 'btn6Label', label: 'Nút 6 (Tích điểm)', type: 'text' },
        { key: 'btn7Label', label: 'Nút 7 (Quy trình sản xuất)', type: 'text' },
        { key: 'btn8Label', label: 'Nút 8 (Nguồn gốc xuất xứ)', type: 'text' }
      ]
    },
    {
      title: '3. Khối Hồ Sơ Công Bố & Cam Kết Từ Chủ Thể',
      fields: [
        { key: 'congBoSectionTitle', label: 'Tiêu đề khối Hồ sơ công bố sản phẩm', type: 'text' },
        { key: 'congBoSectionSub', label: 'Mô tả phụ dưới tiêu đề Hồ sơ công bố', type: 'text' },
        { key: 'relatedSectionTitle', label: 'Tiêu đề khối Sản phẩm liên quan', type: 'text' },
        { key: 'commitmentTitle', label: 'Tiêu đề khối Cam kết chân trang', type: 'text' },
        { key: 'commitmentDesc', label: 'Nội dung cam kết từ chủ thể OCOP', type: 'textarea' },
        { key: 'reportBtnText', label: 'Chữ trên nút Báo cáo vi phạm', type: 'text' }
      ]
    }
  ],

  medical: [
    {
      title: '1. Banner Đầu Trang & 4 Thông Số Dược Phẩm',
      fields: [
        { key: 'rxBadgeText', label: 'Huy hiệu trái (THUỐC KÊ ĐƠN / DƯỢC PHẨM CHÍNH HÃNG)', type: 'text' },
        { key: 'gmpBadgeText', label: 'Huy hiệu phải (ĐẠT CHUẨN GMP-WHO)', type: 'text' },
        { key: 'producerPrefix', label: 'Nhãn Đơn vị sản xuất', type: 'text' },
        { key: 'spec1Label', label: 'Thông số 1 - Nhãn (Số đăng ký SĐK)', type: 'text' },
        { key: 'spec1DefaultVal', label: 'Thông số 1 - Giá trị mặc định', type: 'text' },
        { key: 'spec2Label', label: 'Thông số 2 - Nhãn (Dạng bào chế)', type: 'text' },
        { key: 'spec2DefaultVal', label: 'Thông số 2 - Giá trị', type: 'text' },
        { key: 'spec3Label', label: 'Thông số 3 - Nhãn (Quy cách đóng gói)', type: 'text' },
        { key: 'spec3DefaultVal', label: 'Thông số 3 - Giá trị', type: 'text' },
        { key: 'spec4Label', label: 'Thông số 4 - Nhãn (Số lô & HSD)', type: 'text' },
        { key: 'spec4DefaultVal', label: 'Thông số 4 - Giá trị', type: 'text' },
        { key: 'detailBtnText', label: 'Chữ nút Chi tiết thành phần & liều dùng', type: 'text' }
      ]
    },
    {
      title: '2. Khối Cảnh Báo Thuốc & 8 Nút Chức Năng Y Tế',
      fields: [
        { key: 'warningTitle', label: 'Tiêu đề khung Cảnh báo sử dụng thuốc', type: 'text' },
        { key: 'warningDesc', label: 'Nội dung Cảnh báo sử dụng thuốc', type: 'textarea' },
        { key: 'btn1Label', label: 'Nút 1 (Mã tem & QR)', type: 'text' },
        { key: 'btn2Label', label: 'Nút 2 (Lịch sử quét)', type: 'text' },
        { key: 'btn3Label', label: 'Nút 3 (Nhà sản xuất GMP)', type: 'text' },
        { key: 'btn4Label', label: 'Nút 4 (Hệ thống nhà thuốc)', type: 'text' },
        { key: 'btn5Label', label: 'Nút 5 (Thành phần dược chất)', type: 'text' },
        { key: 'btn6Label', label: 'Nút 6 (Chỉ định & Liều dùng)', type: 'text' },
        { key: 'btn7Label', label: 'Nút 7 (Chứng nhận GMP/Bộ Y Tế)', type: 'text' },
        { key: 'btn8Label', label: 'Nút 8 (Thận trọng & Bảo quản)', type: 'text' }
      ]
    },
    {
      title: '3. Nội Dung Popup: Thành Phần, Liều Dùng, Thận Trọng & Bảo Quản',
      fields: [
        { key: 'ingredientsLabel1', label: 'Popup Thành phần - Nhãn dòng 1', type: 'text' },
        { key: 'ingredientsVal1', label: 'Popup Thành phần - Giá trị dòng 1', type: 'text' },
        { key: 'ingredientsLabel2', label: 'Popup Thành phần - Nhãn dòng 2', type: 'text' },
        { key: 'ingredientsVal2', label: 'Popup Thành phần - Giá trị dòng 2', type: 'text' },
        { key: 'ingredientsLabel3', label: 'Popup Thành phần - Nhãn dòng 3', type: 'text' },
        { key: 'ingredientsVal3', label: 'Popup Thành phần - Giá trị dòng 3', type: 'text' },
        { key: 'dosageLabel1', label: 'Popup Liều dùng - Nhãn dòng 1 (Người lớn)', type: 'text' },
        { key: 'dosageVal1', label: 'Popup Liều dùng - Giá trị dòng 1', type: 'text' },
        { key: 'dosageLabel2', label: 'Popup Liều dùng - Nhãn dòng 2 (Trẻ em)', type: 'text' },
        { key: 'dosageVal2', label: 'Popup Liều dùng - Giá trị dòng 2', type: 'text' },
        { key: 'dosageLabel3', label: 'Popup Liều dùng - Nhãn dòng 3 (Cách dùng)', type: 'text' },
        { key: 'dosageVal3', label: 'Popup Liều dùng - Giá trị dòng 3', type: 'text' },
        { key: 'cautionLabel1', label: 'Popup Thận trọng - Nhãn dòng 1 (Chống chỉ định)', type: 'text' },
        { key: 'cautionVal1', label: 'Popup Thận trọng - Giá trị dòng 1', type: 'text' },
        { key: 'cautionLabel2', label: 'Popup Thận trọng - Nhãn dòng 2 (Bảo quản)', type: 'text' },
        { key: 'cautionVal2', label: 'Popup Thận trọng - Giá trị dòng 2', type: 'text' },
        { key: 'storageSectionTitle', label: 'Tiêu đề khối Thông tin bảo quản cuối trang', type: 'text' },
        { key: 'storage1Label', label: 'Ô bảo quản 1 - Nhãn', type: 'text' },
        { key: 'storage1Val', label: 'Ô bảo quản 1 - Giá trị', type: 'text' },
        { key: 'storage2Label', label: 'Ô bảo quản 2 - Nhãn', type: 'text' },
        { key: 'storage2Val', label: 'Ô bảo quản 2 - Giá trị', type: 'text' },
        { key: 'storage4Label', label: 'Ô bảo quản 4 - Nhãn (Tiêu chuẩn)', type: 'text' },
        { key: 'storage4Val', label: 'Ô bảo quản 4 - Giá trị', type: 'text' }
      ]
    }
  ],

  agriculture: [
    {
      title: '1. Banner Đầu Trang & Thông Tin Vùng Trồng VietGAP',
      fields: [
        { key: 'bannerTitle', label: 'Tiêu đề Banner Nông sản', type: 'text' },
        { key: 'bannerSubtitle', label: 'Mô tả phụ dưới tiêu đề Banner', type: 'text' },
        { key: 'tag1Label', label: 'Tag 1 - Nhãn (Mã vùng trồng:)', type: 'text' },
        { key: 'tag1Val', label: 'Tag 1 - Giá trị (VD: PUC-VN-882)', type: 'text' },
        { key: 'tag2Label', label: 'Tag 2 - Nhãn (Ngày thu hoạch:)', type: 'text' },
        { key: 'tag2Val', label: 'Tag 2 - Giá trị', type: 'text' },
        { key: 'tag3Label', label: 'Tag 3 - Nhãn (Hợp tác xã:)', type: 'text' }
      ]
    },
    {
      title: '2. Nhãn 4 Nút Truy Xuất Nông Sản',
      fields: [
        { key: 'btn1Label', label: 'Nút 1 (Thông tin tem)', type: 'text' },
        { key: 'btn2Label', label: 'Nút 2 (Nhật ký quét)', type: 'text' },
        { key: 'btn3Label', label: 'Nút 3 (Vùng trồng/HTX)', type: 'text' },
        { key: 'btn4Label', label: 'Nút 4 (Chứng nhận VietGAP)', type: 'text' },
        { key: 'relatedSectionTitle', label: 'Tiêu đề khối Sản phẩm liên quan', type: 'text' }
      ]
    }
  ],

  cosmetics: [
    {
      title: '1. Banner Đầu Trang & 3 Thông Số Mỹ Phẩm',
      fields: [
        { key: 'bannerTitle', label: 'Tiêu đề Banner Mỹ phẩm', type: 'text' },
        { key: 'bannerSubtitle', label: 'Mô tả phụ dưới tiêu đề Banner', type: 'text' },
        { key: 'brandPrefix', label: 'Nhãn Thương hiệu', type: 'text' },
        { key: 'spec1Label', label: 'Thông số 1 - Nhãn (Loại da:)', type: 'text' },
        { key: 'spec1Val', label: 'Thông số 1 - Giá trị (Mọi loại da)', type: 'text' },
        { key: 'spec2Label', label: 'Thông số 2 - Nhãn (PAO Mở nắp:)', type: 'text' },
        { key: 'spec2Val', label: 'Thông số 2 - Giá trị (12 Tháng)', type: 'text' },
        { key: 'spec3Label', label: 'Thông số 3 - Nhãn (Số công bố:)', type: 'text' },
        { key: 'spec3Val', label: 'Thông số 3 - Giá trị (CB-8834/22)', type: 'text' }
      ]
    },
    {
      title: '2. Nhãn 4 Nút Chức Năng & Popup Thành Phần Mỹ Phẩm',
      fields: [
        { key: 'btn1Label', label: 'Nút 1 (Thông tin tem)', type: 'text' },
        { key: 'btn2Label', label: 'Nút 2 (Lịch sử quét)', type: 'text' },
        { key: 'btn3Label', label: 'Nút 3 (Thành phần)', type: 'text' },
        { key: 'btn4Label', label: 'Nút 4 (Nhà sản xuất)', type: 'text' },
        { key: 'ingredientsLabel1', label: 'Popup Thành phần - Nhãn dòng 1', type: 'text' },
        { key: 'ingredientsVal1', label: 'Popup Thành phần - Giá trị dòng 1', type: 'text' },
        { key: 'ingredientsLabel2', label: 'Popup Thành phần - Nhãn dòng 2', type: 'text' },
        { key: 'ingredientsVal2', label: 'Popup Thành phần - Giá trị dòng 2', type: 'text' },
        { key: 'ingredientsLabel3', label: 'Popup Thành phần - Nhãn dòng 3', type: 'text' },
        { key: 'ingredientsVal3', label: 'Popup Thành phần - Giá trị dòng 3', type: 'text' },
        { key: 'relatedSectionTitle', label: 'Tiêu đề khối Sản phẩm liên quan', type: 'text' }
      ]
    }
  ]
};

export function resolveCanonicalThemeKey(rawTheme) {
  const t = String(rawTheme || 'appliance').toLowerCase().trim();
  if (t === 'default' || t === 'appliance' || t === 'warranty' || t === 'warranty_solution') return 'appliance';
  if (t === 'functional_food' || t === 'food') return 'functional_food';
  if (t === 'staycool' || t === 'vyphyto') return 'staycool';
  if (t === 'honey' || t === 'mint_honey' || t === 'hoang_bach') return 'honey';
  if (t === 'ocop') return 'ocop';
  if (t === 'medical') return 'medical';
  if (t === 'agriculture') return 'agriculture';
  if (t === 'cosmetics') return 'cosmetics';
  return 'appliance';
}

export function getMergedThemeContent(rawTheme, customContent = {}) {
  const key = resolveCanonicalThemeKey(rawTheme);
  const baseDefaults = DEFAULT_THEME_CONTENTS[key] || DEFAULT_THEME_CONTENTS.appliance;
  if (!customContent || typeof customContent !== 'object') {
    return { ...baseDefaults };
  }
  const merged = { ...baseDefaults };
  for (const [k, v] of Object.entries(customContent)) {
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      merged[k] = v;
    }
  }
  return merged;
}
