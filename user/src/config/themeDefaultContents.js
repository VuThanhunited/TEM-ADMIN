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

  honey: {
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
    introTitle_vi: 'GIỚI THIỆU MẬT ONG HOA BẠC HÀ MÈO VẠC – ĐỒNG VĂN',
    introSubtitle_vi: 'Tinh hoa từ miền đá cổ – Nơi đất trời nuôi dưỡng những mùa hoa bạc hà',
    introLead_vi: 'Giữa vùng núi cao hùng vĩ nơi địa đầu Tổ quốc, Mèo Vạc – Đồng Văn (thuộc Công viên địa chất toàn cầu UNESCO Cao nguyên đá Đồng Văn) hiện lên như một miền di sản thiên nhiên đặc biệt. Mật ong hoa bạc hà Mèo Vạc – Đồng Văn là sự kết tinh của nguồn hoa tự nhiên, môi trường cao nguyên đá và nghề nuôi ong nội truyền thống, mang trong mình bản sắc của miền cực Bắc Việt Nam.',
    introSec1Heading_vi: '1. Tinh hoa từ miền đá cổ & Mùa hoa bạc hà tím',
    introSec1Body_vi: 'Trải qua hàng triệu năm kiến tạo địa chất, những tầng đá vôi cổ đã hình thành nên các dãy núi trùng điệp, những vách đá tai mèo sắc nhọn và những thung lũng ẩn mình giữa đại ngàn. Trong điều kiện tự nhiên ấy, cây bạc hà dại sinh trưởng theo mùa trên những nương đá và sườn núi ở độ cao phổ biến 1.000–1.600 m. Khi mùa thu chuyển dần sang đông (tháng 10 đến tháng 12), những bông hoa bạc hà tím bắt đầu nở, mang theo hương thơm dịu nhẹ giữa không gian cao nguyên, trở thành nguồn hoa quý thu hút đàn ong tìm đến lấy mật.',
    introSec2Heading_vi: '2. Chuỗi giá trị tự nhiên & Di sản nghề nuôi ong bản địa',
    introSec2Body_vi: 'Giá trị của mật ong hoa bạc hà được hình thành từ chuỗi liên kết: Địa chất và thổ nhưỡng → Cây bạc hà dại → Nguồn mật hoa → Đàn ong nội bản địa (Apis cerana) → Kỹ thuật nuôi và thu hoạch → Sản phẩm mật ong. Trong chuỗi đó, thiên nhiên tạo nguồn hoa, còn người dân bản địa đóng vai trò duy trì đàn ong qua nhiều thế hệ, lựa chọn thời điểm khai thác khi mật đạt độ chín và bảo đảm điều kiện vệ sinh, bảo quản.',
    introSec3Heading_vi: '3. Giá trị văn hóa, Chỉ dẫn địa lý & Truy xuất nguồn gốc',
    introSec3Bullets_vi: 'Chỉ dẫn địa lý “Mèo Vạc” cho sản phẩm mật ong đã được đăng ký từ năm 2013, với vùng bảo hộ tại các địa bàn thuộc bốn huyện cũ Mèo Vạc, Đồng Văn, Yên Minh và Quản Bạ.\nMỗi mùa mật là kết quả của một chu kỳ tự nhiên, nơi địa chất, thổ nhưỡng, khí hậu, thực vật và con người gắn bó mật thiết với nhau.\nSản phẩm được kiểm soát nguồn hoa, xác nhận giống ong thực tế và lưu hồ sơ truy xuất nguồn gốc minh bạch trên từng mã QR.\nBảo tồn quần thể cây bạc hà tự nhiên, duy trì thảm thực vật và phát triển sinh kế bền vững cho cộng đồng dân tộc vùng Cao nguyên đá.',
    featuredTitle_vi: 'ĐẶC SẮC MẬT ONG HOA BẠC HÀ CAO NGUYÊN ĐÁ',
    featuredSubtitle_vi: 'Sắc vàng chanh tự nhiên, hương thơm dịu nhẹ và giá trị đặc trưng của miền đá cổ',
    featuredLead_vi: 'Từ những giọt mật hoa bạc hà dại được đàn ong nội bản địa (Apis cerana) thu thập giữa thiên nhiên vùng núi cao và chuyển hóa tự nhiên trong tổ ong, mật ong hoa bạc hà được hình thành với màu sắc, hương thơm và hương vị đặc trưng riêng của miền cao nguyên đá.',
    featuredSec1Heading_vi: '1. Màu sắc, trạng thái và hương vị cảm quan tự nhiên',
    featuredSec1Body_vi: 'Mật ong hoa bạc hà Mèo Vạc – Đồng Văn thường có sắc vàng chanh tự nhiên, dạng lỏng sánh hoặc có thể kết tinh. Mật có hương thơm đặc trưng gắn với nguồn hoa bạc hà dại, vị ngọt dịu và hậu vị thanh mát riêng biệt. Đây là những đặc điểm cảm quan tự nhiên hình thành từ mật hoa và quá trình ong luyện mật, hoàn toàn không bổ sung tinh dầu hay hương liệu bạc hà.',
    featuredSec2Heading_vi: '2. Những giá trị nổi bật tạo nên danh tiếng đặc sản',
    featuredSec2Bullets_vi: 'Gắn với vùng địa lý đặc trưng: Hình thành tại khu vực Công viên địa chất toàn cầu UNESCO Cao nguyên đá Đồng Văn với độ cao phổ biến 1.000–1.600 m.\nMùa hoa có tính thời vụ: Khai thác theo mùa hoa bạc hà dại nở rộ vào cuối thu – đầu đông (tập trung tháng 10 đến tháng 12 hằng năm).\nKết tinh từ đàn ong nội bản địa & kinh nghiệm truyền thống: Sự thích nghi của thực vật trên núi đá kết hợp cùng kỹ thuật nuôi ong truyền thống lâu đời của đồng bào địa phương.\nGiá trị dinh dưỡng tự nhiên: Chứa chủ yếu đường tự nhiên fructose và glucose, giúp bổ sung năng lượng (khoảng 21 kcal / thìa cà phê) và tạo hương vị thơm ngon cho thực phẩm, đồ uống.',
    featuredSec3Heading_vi: '3. Các yếu tố quyết định chất lượng & Nhận diện khoa học',
    featuredSec3Body_vi: 'Màu sắc và trạng thái thực tế của mật ong có thể khác nhau giữa các mẻ thu hoạch do nguồn mật hoa, thời tiết, thời điểm khai thác, độ chín của mật, điều kiện vệ sinh và bảo quản. Không nên dùng một dấu hiệu mùi, màu hoặc độ kết tinh tự nhiên duy nhất để kết luận mật ong thật hay giả.',
    usageTitle_vi: 'CÁCH SỬ DỤNG MẬT ONG HIỆU QUẢ',
    usageSubtitle_vi: 'Hướng dẫn sử dụng mật ong hoa bạc hà Mèo Vạc – Đồng Văn',
    usageLead_vi: 'Mật ong hoa bạc hà chứa chủ yếu fructose và glucose, có thể bổ sung năng lượng và tạo hương vị cho thực phẩm. Để sử dụng hợp lý, cần chú ý lượng dùng, cách pha, thời điểm và tình trạng sức khỏe. Mật ong không phải là thuốc chữa bệnh.',
    usageSec1Heading_vi: '1. Những cách sử dụng mật ong được khuyến nghị',
    usageSec1Bullets_vi: 'Pha với nước ấm: Hòa 1–2 thìa cà phê mật ong (khoảng 7–14 g) vào 150–200 ml nước ấm, khuấy đều. Có thể uống buổi sáng hoặc trong ngày; không có bằng chứng chắc chắn uống lúc bụng đói tốt hơn sau ăn.\nKết hợp với chanh: Pha 1 thìa cà phê mật ong với 150–200 ml nước ấm, thêm 1–2 lát chanh. Có thể tạo thức uống dễ chịu và góp phần làm dịu cổ họng. Người bị trào ngược dạ dày nên cân nhắc lượng chanh.\nKết hợp với gừng: Ngâm vài lát gừng tươi trong nước nóng, để nguội bớt, rồi thêm 1 thìa cà phê mật ong. Điều chỉnh lượng gừng theo khẩu vị.\nDùng cùng thực phẩm: Rưới một thìa cà phê mật ong lên sữa chua không đường, yến mạch, bánh mì hoặc trái cây. Cần tính lượng mật ong vào tổng đường trong khẩu phần.\nThưởng thức nguyên chất: Dùng một thìa nhỏ để cảm nhận hương thơm và hậu vị đặc trưng. Với người từ 1 tuổi trở lên, mật ong có thể giúp làm dịu ho do cảm lạnh; không thay thế điều trị y tế khi cần.',
    usageSec2Heading_vi: '2. Liều lượng và thời điểm sử dụng',
    usageSec2Body_vi: 'Không có liều lượng mật ong tối ưu cho tất cả mọi người. Một thìa cà phê mật ong có khoảng 6 g đường và 21 kcal, được tính vào nhóm đường tự do theo khuyến nghị dinh dưỡng. Có thể dùng vào các thời điểm phù hợp, không cần cố định giờ uống. Gợi ý theo từng đối tượng:',
    usageSec2Bullets_vi: 'Người lớn khỏe mạnh: 1–2 thìa cà phê mỗi lần; cân nhắc tổng lượng đường trong ngày.\nNgười vận động: Có thể dùng lượng nhỏ trong bữa phụ như nguồn carbohydrate.\nNgười cao tuổi: Dùng vừa phải, theo nhu cầu dinh dưỡng và tình trạng sức khỏe.\nTrẻ từ 1 tuổi trở lên: Dùng lượng nhỏ; hạn chế đường bổ sung.\nTrẻ dưới 12 tháng tuổi: Tuyệt đối không sử dụng mật ong.',
    usageSec3Heading_vi: '3. Lưu ý quan trọng & Hướng dẫn bảo quản',
    usageSec3Body_vi: 'Để thưởng thức trọn vẹn hương vị và đảm bảo an toàn sức khỏe (theo khuyến nghị của Tổ chức Y tế Thế giới WHO và Trung tâm Kiểm soát & Phòng ngừa Dịch bệnh Hoa Kỳ CDC), người dùng cần lưu ý:',
    usageSec3Bullets_vi: 'Không cho trẻ dưới 12 tháng tuổi dùng mật ong, kể cả mật ong pha loãng, do nguy cơ ngộ độc botulinum.\nNgười mắc đái tháo đường cần tính lượng mật ong vào tổng carbohydrate và theo dõi đường huyết.\nNgười đã từng dị ứng với mật ong hoặc sản phẩm liên quan đến ong cần thận trọng.\nPha với nước ấm vừa uống; tránh đun sôi mật ong kéo dài nếu muốn giữ hương thơm tự nhiên.\nBảo quản: Đậy kín nắp; đặt nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp và tránh để nước lọt vào lọ.\nMật ong kết tinh tự nhiên không phải là bằng chứng để kết luận thật hay giả. Sản phẩm không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh.',
    soilTitle_vi: 'THỔ NHƯỠNG VÀ ĐIỀU KIỆN TỰ NHIÊN VÙNG CAO NGUYÊN ĐÁ',
    soilSubtitle_vi: 'Đồng Văn – Mèo Vạc | Tinh hoa từ miền đá cổ nuôi dưỡng những mùa hoa bạc hà',
    soilLead_vi: 'Mèo Vạc và Đồng Văn nằm ở cực Bắc Việt Nam (thuộc tỉnh Hà Giang trước đây, nay thuộc tỉnh Tuyên Quang sau sắp xếp đơn vị hành chính năm 2025), là một phần của Công viên địa chất toàn cầu UNESCO Cao nguyên đá Đồng Văn cùng với Quản Bạ và Yên Minh. Khu vực nổi bật với núi đá vôi cổ, cảnh quan karst ở cao độ phổ biến 1.000–1.600 m so với mực nước biển.',
    soilSec1Heading_vi: '1. Đặc điểm địa chất – Nền đá vôi cổ & Thành phần thổ nhưỡng',
    soilSec1Body_vi: 'Nền địa chất gắn với lịch sử trầm tích, vận động kiến tạo và phong hóa lâu dài tạo nên bề mặt karst đá carbonat (đá vôi). Bề mặt bị chia cắt mạnh bởi sườn núi, khe sâu, thung lũng và đá tai mèo. Đất không trải rộng liên tục mà phân bố rời rạc theo các dạng môi trường đất đặc trưng:',
    soilSec1Bullets_vi: 'Đất trên nền đá vôi: Chịu ảnh hưởng bởi vật liệu phong hóa đá mẹ (khoáng carbonat); tầng đất và đặc tính hóa học biến động theo vị trí.\nĐất trong khe nứt, hốc đá: Diện tích nhỏ nhưng tích tụ đất mịn, lá mục và độ ẩm tốt, tạo các vi sinh cảnh giữ ẩm cho cây thân thảo bám rễ.\nĐất trên sườn dốc: Tầng đất mỏng, độ dốc lớn nên nước mưa thấm nhanh qua khe đá hoặc chảy tràn theo độ dốc.\nĐất tích tụ ở thung lũng & dưới cây bụi, đồng cỏ: Tầng đất có xu hướng dày hơn, được bổ sung chất hữu cơ và tầng mùn từ rễ, lá rụng và xác thực vật.',
    soilSec2Heading_vi: '2. Khí hậu vùng núi cao, Nguồn nước & Chu kỳ mùa hoa bạc hà dại',
    soilSec2Body_vi: 'Khí hậu gió mùa miền núi phân hóa rõ rệt theo độ cao và hướng sườn. Ở địa hình karst, nước mưa thấm qua khe đá tạo dòng chảy ngầm. Cây bạc hà dại phát triển trên những nương đá, sườn núi có đất tương đối tơi xốp, thoát nước tốt và sinh cảnh mở theo chu kỳ mùa hoa hằng năm:',
    soilSec2Bullets_vi: 'Tháng 7–9 (Mùa mưa ấm): Sau các đợt mưa, cây bạc hà dại phát triển thân, lá và tích lũy sinh khối.\nTháng 10 (Đầu thu – đông): Nhiệt độ giảm dần, nhiều quần thể bạc hà chuyển sang giai đoạn ra nụ và nở hoa đầu mùa.\nTháng 11–12 (Chính vụ): Mùa hoa bạc hà tím nở rộ và thu hoạch mật chính tại các vùng nguồn mật.\nSau mùa hoa: Nguồn hoa bạc hà giảm, người nuôi ong tiếp tục chăm sóc đàn và theo dõi nguồn thức ăn qua mùa đông lạnh.',
    soilSec3Heading_vi: '3. Đặc điểm vùng nguồn mật Mèo Vạc – Đồng Văn & Bảo tồn Chỉ dẫn địa lý',
    soilSec3Body_vi: 'Sự hiện diện của những lớp đất mỏng trong khe đá, đặc tính thoát nước và khí hậu núi cao đã hình thành môi trường sống đặc thù của cây bạc hà dại. Chỉ dẫn địa lý “Mèo Vạc” cho sản phẩm mật ong đã được đăng ký năm 2013 tại 4 địa bàn Mèo Vạc, Đồng Văn, Yên Minh và Quản Bạ:',
    soilSec3Bullets_vi: 'Vùng Mèo Vạc: Địa hình núi đá hiểm trở, nhiều sườn dốc và vực sâu; đất rời rạc tại khe đá, chân sườn; gắn liền với vùng mật ong chỉ dẫn địa lý Mèo Vạc.\nVùng Đồng Văn: Cao nguyên đá, thung lũng và nương đá xen kẽ; mùa lạnh rõ rệt ở nhiều địa bàn; là bộ phận quan trọng của vùng nguồn mật hoa bạc hà.\nGiá trị văn hóa & sinh thái bền vững: Gắn liền với kinh nghiệm canh tác trên nương đá và nuôi ong truyền thống của đồng bào Mông và cư dân bản địa, chú trọng bảo vệ quần thể bạc hà tự nhiên.',
    beeTitle_vi: 'GIỐNG ONG BẢN ĐỊA VÙNG CAO NGUYÊN ĐÁ',
    beeSubtitle_vi: 'Đồng Văn – Mèo Vạc | Ong nội bản địa Apis cerana – Di sản sống của miền đá cổ',
    beeLead_vi: 'Giống ong truyền thống gắn với nghề khai thác mật ong hoa bạc hà ở vùng Đồng Văn – Mèo Vạc là ong nội bản địa, thuộc loài Apis cerana (trong nhiều tài liệu về vùng mật ong Mèo Vạc được ghi nhận là Apis cerana cerana). Ong nội đã được người dân địa phương, trong đó có đồng bào Mông, nuôi và chăm sóc qua nhiều thế hệ.',
    beeSec1Heading_vi: '1. Thông tin nhận diện giống ong nội bản địa',
    beeSec1Body_vi: 'Giữa những dãy núi đá vôi hùng vĩ của Mèo Vạc – Đồng Văn, đàn ong nội bản địa có khả năng thích nghi cao với điều kiện môi trường vùng núi cao và khai thác nguồn hoa tự nhiên theo mùa:',
    beeSec1Bullets_vi: 'Tên thường gọi: Ong nội, ong mật bản địa.\nTên khoa học: Apis cerana (thường được ghi nhận tại vùng mật ong là Apis cerana cerana).\nĐịa bàn phân bố: Mèo Vạc, Đồng Văn và các địa bàn khác của Cao nguyên đá.\nMôi trường sống: Núi cao, núi đá vôi, khí hậu phân hóa theo mùa.\nNguồn mật nổi bật: Hoa bạc hà dại trong mùa nở hoa (cuối thu chuyển sang đông).\nHình thức nuôi: Nuôi ong trong thùng, chăm sóc theo kinh nghiệm truyền thống địa phương.',
    beeSec2Heading_vi: '2. Đặc điểm và giá trị của ong nội vùng Cao nguyên đá',
    beeSec2Body_vi: 'Sự kết hợp giữa nguồn hoa bản địa, điều kiện tự nhiên cao nguyên đá và kinh nghiệm nuôi ong truyền thống đã góp phần tạo nên danh tiếng của đặc sản mật ong bạc hà Mèo Vạc – Đồng Văn:',
    beeSec2Bullets_vi: 'Khả năng thích nghi: Ong nội có sự thích nghi tốt với môi trường và điều kiện thời tiết địa phương; hoạt động kiếm ăn và sức phát triển đàn phụ thuộc mùa vụ, dịch bệnh và cách chăm sóc.\nKhai thác nguồn hoa tự nhiên: Trong mùa bạc hà nở, đàn ong cần mẫn tìm kiếm mật từ hoa bạc hà dại cùng các nguồn hoa tự nhiên khác trong phạm vi bay kiếm ăn.\nGiá trị truyền thống: Nghề nuôi ong là sinh kế gắn bó mật thiết với cư dân cao nguyên đá qua nhiều thế hệ, góp phần hình thành nét đặc trưng của sản phẩm mật ong hoa bạc hà.',
    beeSec3Heading_vi: '3. Mối liên hệ với mật ong hoa bạc hà & Lưu ý truy xuất',
    beeSec3Body_vi: 'Từ nguồn mật hoa bạc hà dại, qua quá trình tích lũy và chuyển hóa tự nhiên trong tổ ong, mật ong hoa bạc hà được hình thành với sắc vàng chanh, hương thơm và hương vị đặc trưng.',
    beeSec3Bullets_vi: 'Chất lượng tổng hòa: Bên cạnh giống ong, chất lượng sản phẩm còn phụ thuộc thời tiết, thời điểm khai thác, độ chín của mật, vệ sinh và điều kiện bảo quản.\nXác nhận giống & Hồ sơ truy xuất: Cơ sở sản xuất chú trọng xác nhận giống ong thực tế và lưu hồ sơ truy xuất nguồn gốc phù hợp cho từng lô sản phẩm.',
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
    rightLogoUrl: '',
    midBannerUrl: '/images/honey/honey_hero_banner.png',
    footerBannerUrl: '/images/honey/honey_footer_banner.png',
    hasGeographicalIndication: false
  },

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

export const DEFAULT_HONEY_DISTRIBUTORS = [
  {
    id: 'htx_dong_van',
    region: 'dong_van',
    hasGeographicalIndication: true,
    image: '/images/honey/honey_dist_dong_van.png',
    vi: {
      name: 'Hợp tác xã Mật ong Hoa Bạc Hà Đồng Văn',
      address: 'Thị trấn Đồng Văn, huyện Đồng Văn, tỉnh Hà Giang',
      phone: '0987 654 321',
      shortIntro: 'HTX quy tụ các hộ nuôi ong bản địa, khai thác mật ong hoa bạc hà theo phương thức truyền thống trên vùng Cao nguyên đá Đồng Văn.',
      scale: 'Hơn 45 hộ thành viên — 1.200+ đàn ong nội bản địa',
      foragingArea: 'Các sườn núi đá vôi Phố Cáo, Sủng Là, Phố Bảng, Thị trấn Đồng Văn (độ cao 1.200m – 1.500m)',
      cert: 'Chứng nhận OCOP 4 Sao & An toàn thực phẩm Chi cục Quản lý chất lượng Nông lâm sản và Thủy sản',
      fullStory: [
        'Hợp tác xã Mật ong Hoa Bạc Hà Đồng Văn là đơn vị nòng cốt trong mạng lưới liên kết sản xuất và phân phối của Hộ Kinh Doanh Hoàng Bách tại khu vực trung tâm Cao nguyên đá Đồng Văn. Được thành lập bởi những nghệ nhân nuôi ong người Mông, Tày, Giáy có truyền thống lâu đời, HTX hiện quản lý hơn 1.200 đàn ong nội đặt tại các thung lũng hoa bạc hà tự nhiên đẹp nhất vùng lõi công viên địa chất.',
        'Toàn bộ các hộ thành viên trong HTX tuân thủ nghiêm ngặt quy trình nuôi ong sinh thái: chỉ di chuyển đàn ong đến vùng hoa bạc hà tự nhiên từ đầu tháng 10 âm lịch, tuyệt đối không cho ong ăn đường trong mùa khai thác và chỉ quay mật khi cầu ong đã vít nắp sáp trắng chín tự nhiên trên 90%.',
        'Mật sau khi thu hoạch tại từng điểm trại được kiểm tra độ thủy phần bằng khúc xạ kế chuyên dụng, lọc thô qua lưới inox thực phẩm và đóng can niêm phong chuyển về kho bảo quản tiêu chuẩn, đảm bảo giữ nguyên hương vị the mát đặc trưng và màu vàng chanh ánh xanh nguyên bản của vùng đá Đồng Văn.'
      ]
    },
    en: {
      name: 'Dong Van Mint Flower Honey Cooperative',
      address: 'Dong Van Town, Dong Van District, Ha Giang Province',
      phone: '0987 654 321',
      shortIntro: 'The cooperative unites indigenous beekeeping households harvesting wild mint flower honey using traditional methods across the Dong Van Karst Plateau.',
      scale: '45+ member households — 1,200+ native highland bee colonies',
      foragingArea: 'Limestone valleys of Pho Cao, Sung La, Pho Bang, and Dong Van Town (altitude 1,200m – 1,500m)',
      cert: '4-Star OCOP Specialty & Certified Food Hygiene and Safety Standard',
      fullStory: [
        'Dong Van Mint Flower Honey Cooperative is a cornerstone production and distribution partner of Hoang Bach in the heart of the Dong Van Karst Plateau. Founded by experienced local H’Mong, Tay, and Giay beekeepers, the cooperative manages over 1,200 native bee colonies stationed across pristine wild mint valleys.',
        'Every member household adheres strictly to ecological beekeeping protocols: zero sugar feeding during the blossom season and harvesting only when honeycombs are over 90% naturally wax-capped.',
        'Each batch is tested for moisture content via refractometer, cold-filtered through food-grade stainless mesh, and sealed with full origin traceability.'
      ]
    },
    zh: {
      name: '同文薄荷花蜂蜜合作社 (HTX Mật ong Đồng Văn)',
      address: '河江省同文县同文镇',
      phone: '0987 654 321',
      shortIntro: '合作社汇聚当地世居养蜂农户，在同文喀斯特高原采用传统生态方式采酿纯正野生薄荷花蜂蜜。',
      scale: '45+ 合作社成员农户 — 1,200+ 群高原本土中华蜜蜂',
      foragingArea: '副告 (Phố Cáo)、崇喇 (Sủng Là)、副榜 (Phố Bảng) 及同文镇周边海拔 1,200m – 1,500m 石山花谷',
      cert: 'OCOP 四星级特产认证 & 农林水产品质量安全卫生认证',
      fullStory: [
        '同文薄荷花蜂蜜合作社是黄百 (Hoàng Bách) 在同文喀斯特高原核心产区的重要生产与分销网点。合作社由世代养蜂的赫蒙族、岱依族匠人创立，目前管理超过 1,200 群本土蜜蜂，分布在世界地质公园核心区最茂盛的野生薄荷山谷中。',
        '所有成员农户严格执行生态养蜂规范：花期绝不饲喂白糖，坚持只采割自然封盖率达 90% 以上的成熟蜜脾。',
        '采收后的原蜜均经过专业折光仪检测波美度与水分含量，采用食品级滤网物理过滤，确保每一滴蜂蜜都保持同文产区标志性的清凉薄荷花香与柠檬黄绿光泽。'
      ]
    }
  },
  {
    id: 'ho_lung_cu',
    region: 'dong_van',
    hasGeographicalIndication: false,
    image: '/images/honey/honey_dist_lung_cu.png',
    vi: {
      name: 'Hộ sản xuất Mật ong Lũng Cú – Đồng Văn',
      address: 'Thôn Lũng Cú, xã Lũng Cú, huyện Đồng Văn, tỉnh Hà Giang',
      phone: '0369 888 568',
      shortIntro: 'Hộ gia đình có nhiều năm nuôi ong tại Lũng Cú, khai thác mật ong hoa bạc hà tự nhiên, đảm bảo nguyên chất, đậm hương vị vùng cao.',
      scale: '320 đàn ong nội bản địa đặt quanh chân Cột cờ Lũng Cú & thung lũng Thèn Pả',
      foragingArea: 'Thôn Lô Lô Chải, Thèn Pả, Séo Lủng – Xã Lũng Cú (độ cao 1.450m – 1.600m)',
      cert: 'Chứng nhận cơ sở đủ điều kiện An toàn thực phẩm & Truy xuất nguồn gốc QR',
      fullStory: [
        'Nằm ngay dưới chân Cột cờ Quốc gia Lũng Cú – điểm cực Bắc thiêng liêng của Tổ quốc ở độ cao gần 1.500m, Hộ sản xuất Mật ong Lũng Cú là một trong những điểm nuôi ong lâu đời và uy tín nhất tại huyện Đồng Văn. Gia đình sinh sống trong ngôi nhà trình tường đất truyền thống với hàng trăm thùng ong gỗ đặt dọc theo sườn núi đá.',
        'Nhờ vị trí địa lý đặc biệt nơi khí hậu lạnh sâu và sương muối dày vào mùa đông, cây bạc hà dại tại vùng núi đá Lũng Cú có thân thấp, lá dày và hoa tím đậm, tiết ra lượng mật hoa đặc sánh với hàm lượng tinh dầu bạc hà tự nhiên rất cao.',
        'Du khách khi ghé thăm Lũng Cú có thể trực tiếp trải nghiệm quy trình thăm tổ ong, thưởng thức mật ong hoa bạc hà nguyên sáp ngay tại vườn đá và tra cứu tem QR chính hãng Hoàng Bách trên từng sản phẩm.'
      ]
    },
    en: {
      name: 'Lung Cu – Dong Van Honey Production Household',
      address: 'Lung Cu Village, Lung Cu Commune, Dong Van District, Ha Giang Province',
      phone: '0369 888 568',
      shortIntro: 'Long-standing family apiary in Lung Cu harvesting pure natural wild mint honey with rich highland character.',
      scale: '320 native bee colonies around Lung Cu Flag Tower & Then Pa Valley',
      foragingArea: 'Lo Lo Chai, Then Pa, and Seo Lung Villages – Lung Cu Commune (altitude 1,450m – 1,600m)',
      cert: 'Certified Food Safety Household & QR Origin Traceability',
      fullStory: [
        'Located at the foot of the iconic Lung Cu National Flag Tower at Vietnam’s northernmost point (nearly 1,500m elevation), the Lung Cu Honey Production Household has practiced traditional stone-walled courtyard beekeeping for generations.',
        'Because of the colder microclimate and dense mountain mist in Lung Cu, wild mint blossoms here develop deep purple petals with highly concentrated aromatic nectar.',
        'Visitors to Lung Cu can visit the family apiary in person, taste freshly harvested honeycomb, and verify every jar via the Hoang Bach QR traceability stamp.'
      ]
    },
    zh: {
      name: '龙鼓 (Lũng Cú) – 同文养蜂生产户',
      address: '河江省同文县龙鼓社龙鼓村',
      phone: '0369 888 568',
      shortIntro: '在极北龙鼓地区拥有多年养蜂经验的传统农户，采集纯天然野生薄荷花蜜，高原风味浓郁纯正。',
      scale: '320 群本土中华蜜蜂，分布于龙鼓国旗台脚下及山谷地带',
      foragingArea: '倮倮寨 (Lô Lô Chải)、Then Pả、Séo Lủng 村 – 龙鼓社（海拔 1,450m – 1,600m）',
      cert: '食品安全合格生产户认证 & 二维码原产地溯源',
      fullStory: [
        '位于越南极北地标龙鼓国家旗台脚下（海拔近 1,500 米），龙鼓养蜂生产户世代居住在传统的夯土石墙民居中，数百个原木蜂箱整齐排列在石山坡地与花海之间。',
        '得益于龙鼓高海拔严寒与浓雾气候，这里的野生薄荷植株紧凑、花色深紫，分泌出的花蜜尤为浓稠，天然薄荷精油香气极为浓郁。',
        '来到龙鼓的游客可以亲临蜂场参观采蜜过程，品尝新鲜成熟巢蜜，并通过黄百 (Hoàng Bách) 防伪溯源二维码查询每一瓶蜂蜜的完整产地信息。'
      ]
    }
  },
  {
    id: 'htx_meo_vac',
    region: 'meo_vac',
    hasGeographicalIndication: true,
    image: '/images/honey/honey_dist_dong_van.png',
    vi: {
      name: 'Hợp tác xã Ong mật Hoa Bạc Hà Mèo Vạc',
      address: 'Thị trấn Mèo Vạc, huyện Mèo Vạc, tỉnh Hà Giang',
      phone: '0866 603 589',
      shortIntro: 'Đơn vị liên kết khai thác mật ong hoa bạc hà trên các triền núi đá vôi hùng vĩ dọc đèo Mã Pì Lèng và thung lũng Pả Vi, Sín Cái.',
      scale: '38 hộ nuôi ong liên kết — hơn 950 đàn ong nội bản địa',
      foragingArea: 'Khu vực đèo Mã Pì Lèng, Pả Vi, Giàng Chu Phìn, Sủng Trà – Huyện Mèo Vạc',
      cert: 'Chứng nhận Chỉ dẫn địa lý Mật ong Bạc hà Mèo Vạc & OCOP 4 Sao',
      fullStory: [
        'Huyện Mèo Vạc từ lâu được mệnh danh là "thủ phủ" của cây hoa bạc hà dại trên Cao nguyên đá với diện tích hoa mọc tự nhiên rộng lớn trải dài dọc theo sườn đèo Mã Pì Lèng, hẻm vực sông Nho Quế và các xã Pả Vi, Giàng Chu Phìn, Sủng Trà.',
        'Hợp tác xã Ong mật Hoa Bạc Hà Mèo Vạc phối hợp chặt chẽ cùng Hộ Kinh Doanh Hoàng Bách để tuyển chọn những mẻ mật đầu vụ và giữa vụ đạt độ chín hoàn hảo nhất. Mật ong Mèo Vạc nổi tiếng với độ sánh đặc cao, sắc vàng chanh ánh xanh ngọc bích rất đẹp mắt và hương thơm thanh khiết lâu phai.',
        'Tại điểm phân phối Mèo Vạc, khách hàng được tư vấn trực tiếp cách phân biệt mật ong hoa bạc hà thật – giả, kiểm tra độ đặc sóng sánh và hỗ trợ vận chuyển toàn quốc.'
      ]
    },
    en: {
      name: 'Meo Vac Mint Flower Honey Cooperative',
      address: 'Meo Vac Town, Meo Vac District, Ha Giang Province',
      phone: '0866 603 589',
      shortIntro: 'Partner cooperative harvesting wild mint honey along the majestic limestone cliffs of Ma Pi Leng Pass and Pa Vi Valley.',
      scale: '38 partner beekeeping families — 950+ native bee colonies',
      foragingArea: 'Ma Pi Leng Pass, Pa Vi, Giang Chu Phin, and Sung Tra – Meo Vac District',
      cert: 'Geographical Indication Certified & 4-Star OCOP Specialty',
      fullStory: [
        'Meo Vac District is widely celebrated as the heartland of wild highland mint, with vast natural blossom carpets stretching along Ma Pi Leng Pass and the Nho Que River canyon.',
        'Meo Vac Mint Flower Honey Cooperative works closely with Hoang Bach to select peak-season honey harvests renowned for their emerald-tinted golden hue, exceptional viscosity, and long-lasting floral bouquet.',
        'Customers visiting our Meo Vac distribution center can sample authentic mid-season harvests and arrange nationwide delivery.'
      ]
    },
    zh: {
      name: '苗旺 (Mèo Vạc) 薄荷花蜂蜜合作社',
      address: '河江省苗旺县苗旺镇',
      phone: '0866 603 589',
      shortIntro: '在雄伟的马皮凉 (Mã Pì Lèng) 险峰与帕薇山谷地带合作采酿优质高山野生薄荷花蜜。',
      scale: '38 户联合养蜂家庭 — 950+ 群本土中华蜜蜂',
      foragingArea: '马皮凉山口、帕薇 (Pả Vi)、Giàng Chu Phìn、Sủng Trà – 苗旺县产区',
      cert: '地理标志保护产品认证 & OCOP 四星级标准',
      fullStory: [
        '苗旺县素有喀斯特高原“野生薄荷之乡”的美誉，广阔的天然薄荷花海沿着马皮凉大峡谷与儒桂河两岸连绵分布。',
        '苗旺薄荷花蜂蜜合作社与黄百 (Hoàng Bách) 深度合作，严选盛花期自然封盖成熟蜜。苗旺产区的薄荷蜜以极高的浓稠度、迷人的翠绿金黄光泽和持久幽雅的花香而闻名。',
        '分销中心提供现场品鉴、真伪鉴别指导及全国安全配送服务。'
      ]
    }
  },
  {
    id: 'ho_xin_chai_hoang_bach',
    region: 'meo_vac',
    hasGeographicalIndication: true,
    image: '/images/honey/honey_dist_lung_cu.png',
    vi: {
      name: 'Trại Ong Hoàng Bách – Xín Chải, Sơn Vĩ',
      address: 'Thôn Xín Chải, Xã Sơn Vĩ (Khu vực biên giới Thượng Phùng - Sơn Vĩ)',
      phone: '0812 838 589',
      shortIntro: 'Cơ sở sản xuất và đóng gói trung tâm của Hộ Kinh Doanh Hoàng Bách, trực tiếp quản lý đàn ong tại vùng núi cao biên giới.',
      scale: 'Trụ sở chính & Trại ong trung tâm — hơn 600 đàn ong nội',
      foragingArea: 'Thôn Xín Chải, Xã Sơn Vĩ và vùng núi đá giáp ranh Mèo Vạc',
      cert: 'Cơ sở chính chủ Hộ Kinh Doanh Hoàng Bách — Kiểm định chất lượng định kỳ',
      fullStory: [
        'Trại Ong Hoàng Bách tại Thôn Xín Chải, Xã Sơn Vĩ là cơ sở sản xuất gốc và trung tâm kiểm soát chất lượng của thương hiệu Mật Ong Hoa Bạc Hà Hoàng Bách. Nằm ở vùng núi cao nguyên sơ nơi thảm thực vật rừng đá còn giữ nguyên vẻ hoang dã, trại ong thu hoạch những giọt mật tinh khiết nhất từ các triền đá vôi biệt lập.',
        'Mọi lô mật ong trước khi đóng chai thủy tinh và dán tem truy xuất nguồn gốc đều được kiểm tra nghiêm ngặt về độ trong, thủy phần, hương vị và lưu mẫu đối chứng tại cơ sở Xín Chải – Sơn Vĩ.',
        'Quý khách hàng và đại lý có thể liên hệ trực tiếp qua số hotline 0866.603.589 hoặc 0812.838.589 để đặt hàng chính gốc từ cơ sở sản xuất.'
      ]
    },
    en: {
      name: 'Hoang Bach Central Apiary – Xin Chai, Son Vi',
      address: 'Xin Chai Village, Son Vi Commune, Tuyen Quang / Ha Giang Highland Border',
      phone: '0812 838 589',
      shortIntro: 'Central production and packaging facility of Hoang Bach Business Household, directly managing highland apiaries.',
      scale: 'Headquarters & Central Apiary — 600+ native bee colonies',
      foragingArea: 'Xin Chai Village, Son Vi Commune, and surrounding pristine karst ridges',
      cert: 'Official Hoang Bach Production Facility — Periodic Lab Quality Testing',
      fullStory: [
        'Hoang Bach Central Apiary in Xin Chai Village, Son Vi Commune serves as the primary production base and quality control center for Hoang Bach Mint Flower Honey.',
        'Every harvested batch undergoes rigorous testing for clarity, moisture level, and floral aroma before bottling and applying the official QR traceability seal.',
        'Customers and distributors can contact our direct hotline at 0866.603.589 - 0812.838.589 for authentic factory-direct orders.'
      ]
    },
    zh: {
      name: '黄百 (Hoàng Bách) 中心蜂场 – 新寨村, 山尾社',
      address: '山尾社新寨村（高山生态核心产区）',
      phone: '0812 838 589',
      shortIntro: '黄百经营户核心生产与灌装基地，直接管理高山原生态养蜂场与品质检验中心。',
      scale: '总部基地与中心蜂场 — 600+ 群本土蜜蜂',
      foragingArea: '新寨村、山尾社及毗邻苗旺的高山原始石林花海',
      cert: '黄百官方直营生产基地 — 定期实验室理化指标检测',
      fullStory: [
        '位于山尾社新寨村的黄百中心蜂场是“黄百薄荷花蜂蜜”品牌的源头生产基地与质量控制中心。这里地处偏远纯净的高山石林地带，野生薄荷植被茂密且远离人为干扰。',
        '每一批次蜂蜜在灌装贴标前，均在新寨基地经过波美度、纯净度与感官风味的严格检验，并留存批次样品备查。',
        '欢迎广大消费者与合作伙伴拨打官方热线 0866.603.589 或 0812.838.589 直接订购源头正品。'
      ]
    }
  },
  {
    id: 'htx_yen_minh',
    region: 'yen_minh',
    hasGeographicalIndication: true,
    image: '/images/honey/honey_dist_dong_van.png',
    vi: {
      name: 'Tổ hợp tác Nuôi ong Bạc Hà Yên Minh',
      address: 'Thị trấn Yên Minh, huyện Yên Minh, tỉnh Hà Giang',
      phone: '0866 603 589',
      shortIntro: 'Điểm thu hoạch và phân phối mật ong hoa bạc hà tại cửa ngõ Cao nguyên đá Yên Minh – Lao Và Chải – Du Già.',
      scale: '28 hộ nuôi ong truyền thống — hơn 680 đàn ong nội',
      foragingArea: 'Xã Lao Và Chải, Na Khê, Bạch Đích, Du Già – Huyện Yên Minh',
      cert: 'Chứng nhận An toàn vệ sinh thực phẩm & Chuỗi cung ứng Mật ong Cao nguyên đá',
      fullStory: [
        'Tổ hợp tác Nuôi ong Bạc Hà Yên Minh phụ trách vùng nguyên liệu phía Tây và phía Nam của Cao nguyên đá, trải dài từ các sườn núi đá vôi Lao Và Chải, Na Khê, Bạch Đích cho tới vùng rừng núi nguyên sinh Du Già.',
        'Nhờ thảm thực vật phong phú giao thoa giữa rừng thông Yên Minh và các triền đá tai mèo phủ đầy hoa bạc hà tím, mật ong thu hoạch tại khu vực Yên Minh có hương thơm dịu nhẹ quyến rũ, vị ngọt thanh mát rất dễ thưởng thức cho cả người lớn tuổi và trẻ nhỏ.',
        'Điểm phân phối tại Thị trấn Yên Minh là trạm dừng chân tin cậy cho du khách trên cung đường khám phá Hà Giang muốn mua mật ong hoa bạc hà Hoàng Bách chính hãng có tem truy xuất nguồn gốc rõ ràng.'
      ]
    },
    en: {
      name: 'Yen Minh Mint Honey Beekeeping Cooperative Group',
      address: 'Yen Minh Town, Yen Minh District, Ha Giang Province',
      phone: '0866 603 589',
      shortIntro: 'Harvesting and distribution hub at the gateway to the Yen Minh – Lao Va Chai – Du Gia karst region.',
      scale: '28 traditional beekeeping households — 680+ native bee colonies',
      foragingArea: 'Lao Va Chai, Na Khe, Bach Dich, and Du Gia Communes – Yen Minh District',
      cert: 'Certified Food Hygiene & Karst Plateau Honey Supply Chain Partner',
      fullStory: [
        'The Yen Minh Beekeeping Cooperative Group oversees the western and southern foraging zones of the Karst Plateau, spanning from the limestone slopes of Lao Va Chai and Bach Dich to the pristine valleys of Du Gia.',
        'Surrounded by highland pine forests and wild mint limestone ridges, honey harvested in Yen Minh features a remarkably gentle floral aroma and smooth, refreshing sweetness.',
        'Our Yen Minh Town center serves as a trusted stopover for travelers exploring Ha Giang who seek authentic QR-verified Hoang Bach Mint Flower Honey.'
      ]
    },
    zh: {
      name: '安明 (Yên Minh) 薄荷蜜养蜂合作组',
      address: '河江省安明县安明镇',
      phone: '0866 603 589',
      shortIntro: '位于安明 – 劳瓦寨 (Lao Và Chải) – 游嘉 (Du Già) 喀斯特高原门户产区的采收与分销网点。',
      scale: '28 户传统养蜂家庭 — 680+ 群高原本土蜜蜂',
      foragingArea: '劳瓦寨、那溪 (Na Khê)、白迪 (Bạch Đích) 及游嘉自然保护区周边石山',
      cert: '食品安全卫生认证 & 喀斯特高原蜂蜜标准化供应链成员',
      fullStory: [
        '安明薄荷蜜养蜂合作组负责喀斯特高原西南部蜜源产区，涵盖劳瓦寨、那溪、白迪的石灰岩山坡以及游嘉原始生态山谷。',
        '得益于安明高山松林与石山野生薄荷花海交织的微生态，安明产区的薄荷蜜香气柔美清新，口感温润甘甜，老少皆宜。',
        '安明镇分销网点是环游河江高原游客信赖的正品驿站，所有产品均贴有黄百 (Hoàng Bách) 防伪溯源二维码标签。'
      ]
    }
  },
  {
    id: 'ho_du_gia_yen_minh',
    region: 'yen_minh',
    hasGeographicalIndication: false,
    image: '/images/honey/honey_dist_lung_cu.png',
    vi: {
      name: 'Hộ nuôi ong Sinh thái Du Già – Yên Minh',
      address: 'Xã Du Già, huyện Yên Minh, tỉnh Hà Giang',
      phone: '0812 838 589',
      shortIntro: 'Khai thác mật ong hoa bạc hà tự nhiên tại khu vực vùng đệm Vườn Quốc gia Du Già – Cao nguyên đá Đồng Văn.',
      scale: '250 đàn ong nội bản địa nuôi theo mô hình sinh thái rừng đá',
      foragingArea: 'Thung lũng Du Già, Đường Thượng, Lũng Hồ – Huyện Yên Minh',
      cert: 'Sản phẩm OCOP địa phương & Cam kết 100% nguyên chất tự nhiên',
      fullStory: [
        'Nằm trong vùng sinh thái trong lành giáp Vườn Quốc gia Du Già và các xã Đường Thượng, Lũng Hồ, Hộ nuôi ong Sinh thái Du Già sở hữu nguồn hoa bạc hà rừng hoàn toàn tự nhiên mọc xen kẽ trên các dãy núi đá vôi hùng vĩ.',
        'Đàn ong tại đây tận hưởng nguồn nước suối thác tinh khiết và thảm hoa bạc hà nở muộn kéo dài đến tận tháng Chạp âm lịch, tạo nên những giọt mật cuối vụ sánh đặc, giàu khoáng chất và đậm đà hương vị núi rừng.',
        'Sản phẩm được thu gom, kiểm định chất lượng và phân phối chính thức trong hệ thống Mật Ong Hoa Bạc Hà Hoàng Bách.'
      ]
    },
    en: {
      name: 'Du Gia Ecological Beekeeping Household – Yen Minh',
      address: 'Du Gia Commune, Yen Minh District, Ha Giang Province',
      phone: '0812 838 589',
      shortIntro: 'Harvesting wild mint honey in the pristine buffer zone of Du Gia National Park – Dong Van Karst Plateau.',
      scale: '250 native bee colonies managed under forest-karst ecological standards',
      foragingArea: 'Du Gia, Duong Thuong, and Lung Ho Valleys – Yen Minh District',
      cert: 'Local OCOP Specialty & 100% Pure Natural Guarantee',
      fullStory: [
        'Nestled in the unspoiled valleys bordering Du Gia National Park, Duong Thuong, and Lung Ho, the Du Gia Ecological Beekeeping Household benefits from wild mountain mint thriving alongside crystal-clear waterfall streams.',
        'Late-season blossoms here yield a rich, mineral-dense honey with a deep herbal aroma, fully inspected and distributed under the Hoang Bach quality seal.'
      ]
    },
    zh: {
      name: '游嘉 (Du Già) – 安明生态养蜂户',
      address: '河江省安明县游嘉社',
      phone: '0812 838 589',
      shortIntro: '在游嘉国家公园缓冲带与同文喀斯特高原交界处采集纯天然野生薄荷花蜜。',
      scale: '250 群原生态石林放养本土蜜蜂',
      foragingArea: '游嘉山谷、Đường Thượng、Lũng Hồ – 安明县生态产区',
      cert: '地方特色农产品认证 & 100% 纯天然品质保证',
      fullStory: [
        '坐落于毗邻游嘉国家公园的原始山谷中，游嘉生态养蜂户依托清澈的高山溪流与绵延的野生薄荷石山，拥有得天独厚的无污染蜜源环境。',
        '这里的晚花期薄荷蜜质地尤为醇厚、矿物质丰富，经黄百 (Hoàng Bách) 严格检验后统一贴标溯源上市。'
      ]
    }
  }
];

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
    if (Array.isArray(v) || typeof v === 'boolean') {
      merged[k] = v;
    } else if (v !== undefined && v !== null && String(v).trim() !== '') {
      merged[k] = v;
    }
  }
  return merged;
}

