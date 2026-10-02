/**
 * Hợp đồng dữ liệu và nội dung bản xem trước (T01)
 * Tuân thủ docs/architecture.md, docs/data-and-finance.md và docs/ui-reference.md.
 * Lưu ý: Số liệu thực tế chưa có để null, không gán 0 hoặc số kế hoạch làm thành tích.
 */

export interface QuantitativeFact {
  value: number | null;
  unit: string;
  kind: 'planned' | 'actual';
  verification: 'unverified' | 'confirmed';
  sourceRef: string | null;
  updatedAt: string | null;
  publicApproval: 'pending' | 'approved';
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  badge: string;
  note?: string;
}

export interface PlannedStage {
  step: string;
  title: string;
  description: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  referencePrice: QuantitativeFact;
  plannedQuantity: QuantitativeFact;
  actualStock: number | null;
  saleStatus: 'unconfirmed' | 'open' | 'closed';
  originText: string;
  originVerification: 'unverified' | 'confirmed';
  assetId: string | null;
  notes: string;
}

export interface Project {
  slug: string;
  title: string;
  slogan: string;
  summary: string;
  location: string;
  executionStatus: 'unknown' | 'in_progress' | 'completed';
  statusNotice: string;
  previewNotice: string;
  activities: Activity[];
  plannedStages: PlannedStage[];
}

export interface SupportMethod {
  id: string;
  title: string;
  description: string;
  statusText: string;
}

export const CAMPAIGN_PROJECT: Project = {
  slug: 'mang-theo-mot-net-ve',
  title: 'Mang Theo Một Nét Vẽ',
  slogan: 'Một buổi chơi phù hợp, một món quà đúng nhu cầu.',
  summary:
    'Nhóm Lăng Kính dự kiến mang chuồn chuồn tre, sắc màu và những trò chơi nhẹ đến Mái ấm Thánh Tâm Xuy Xá, để mỗi người tham gia có thể chọn cách vui chơi phù hợp với mình.',
  location: 'Mái ấm Thánh Tâm Xuy Xá (Mỹ Đức, Hà Nội) & Campus FPT Hòa Lạc',
  executionStatus: 'unknown',
  statusNotice: 'Trạng thái thực tế chưa được xác nhận',
  previewNotice: 'Bản xem trước — nội dung theo đề xuất, chờ xác nhận.',
  activities: [
    {
      id: 'chuon-chuon-tre',
      title: 'Chuồn chuồn tre',
      description: 'Trang trí những cánh chuồn chuồn tre thăng bằng với màu sắc tự do theo sở thích.',
      badge: 'Góc tạo hình',
      note: 'Người tham gia có quyền lựa chọn làm, quan sát hoặc nghỉ ngơi.',
    },
    {
      id: 'to-tuong',
      title: 'Tô tượng sắc màu',
      description: 'Thỏa sức phối màu trên các mẫu tượng thạch cao đa dạng hình dáng và kích cỡ.',
      badge: 'Góc tô màu',
      note: 'Hoạt động vui chơi trải nghiệm, không phải hàng hoá gây quỹ.',
    },
    {
      id: 'hat-cung-nhau',
      title: 'Hát cùng nhau',
      description: 'Không gian văn nghệ kết nối, cùng hòa giọng trong những giai điệu thiếu nhi gần gũi.',
      badge: 'Góc âm nhạc',
      note: 'Tạo không khí ấm áp, vui tươi và không áp lực biểu diễn.',
    },
    {
      id: 'tro-choi-nhe',
      title: 'Trò chơi tương tác nhẹ',
      description: 'Các trò chơi tương tác vừa sức: bowling mini, chuyền bóng nhẹ nhàng và thẻ màu ghép hình.',
      badge: 'Góc vận động',
      note: 'Mỗi em nhỏ tự quyết định mức độ tham gia phù hợp thể trạng.',
    },
  ],
  plannedStages: [
    {
      step: '01',
      title: 'Xác nhận và chuẩn bị nguồn lực',
      description:
        'Làm việc cùng đại diện Mái ấm để làm rõ nhu cầu vật tư thiết yếu; chuẩn bị phôi chuồn chuồn tre, tượng và họa cụ an toàn.',
    },
    {
      step: '02',
      title: 'Buổi chơi tại Mái ấm',
      description:
        'Tổ chức không gian vui chơi có nhiều góc hoạt động tại Mái ấm Thánh Tâm Xuy Xá, tôn trọng quyền lựa chọn của từng em.',
    },
    {
      step: '03',
      title: 'Hoàn thiện và gây quỹ',
      description:
        'Nhóm hoàn thiện các sản phẩm lưu niệm thủ công; mở tiếp nhận sự quan tâm ủng hộ sau khi chốt mẫu và giá chính thức.',
    },
    {
      step: '04',
      title: 'Đối soát và trao tặng',
      description:
        'Đối soát công khai mọi khoản thu chi, tài trợ; bàn giao hiện vật và quà tặng đúng danh mục nhu cầu của Mái ấm.',
    },
  ],
};

export const PRODUCTS: Product[] = [
  {
    id: 'chuon-chuon-tre-kem-de',
    name: 'Chuồn chuồn tre 12 cm kèm đế',
    description: 'Phôi tre mộc mạc cân bằng trên mỏ, đi kèm chân đế trưng bày trang nhã.',
    referencePrice: {
      value: 40000,
      unit: 'đ/bộ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:budget-scenario',
      updatedAt: null,
      publicApproval: 'pending',
    },
    plannedQuantity: {
      value: 30,
      unit: 'bộ bán dự kiến',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:inventory-plan',
      updatedAt: null,
      publicApproval: 'pending',
    },
    actualStock: null,
    saleStatus: 'unconfirmed',
    originText: 'Phôi tre mộc; nguồn gốc trang trí chưa xác nhận',
    originVerification: 'unverified',
    assetId: null,
    notes: 'Giá tham khảo trong đề xuất. Dự kiến trong 40 phôi chuẩn bị, 10 chiếc để lại Mái ấm.',
  },
  {
    id: 'tui-but',
    name: 'Túi bút',
    description: 'Túi đựng bút nhỏ gọn, tiện dụng phục vụ học tập và ghi chép hàng ngày.',
    referencePrice: {
      value: 55000,
      unit: 'đ/chiếc',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:budget-scenario',
      updatedAt: null,
      publicApproval: 'pending',
    },
    plannedQuantity: {
      value: 20,
      unit: 'chiếc dự kiến',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:inventory-plan',
      updatedAt: null,
      publicApproval: 'pending',
    },
    actualStock: null,
    saleStatus: 'unconfirmed',
    originText: 'Nhóm Lăng Kính hoàn thiện',
    originVerification: 'confirmed',
    assetId: null,
    notes: 'Giá tham khảo trong đề xuất. Nhóm tự chuẩn bị và hoàn thiện mẫu.',
  },
  {
    id: 'tui-vai',
    name: 'Túi vải',
    description: 'Túi vải diện tích chứa rộng rãi cho sách vở và đồ dùng.',
    referencePrice: {
      value: 75000,
      unit: 'đ/chiếc',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:budget-scenario',
      updatedAt: null,
      publicApproval: 'pending',
    },
    plannedQuantity: {
      value: 8,
      unit: 'chiếc dự kiến',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:inventory-plan',
      updatedAt: null,
      publicApproval: 'pending',
    },
    actualStock: null,
    saleStatus: 'unconfirmed',
    originText: 'Số lượng nhỏ theo đơn đặt trước',
    originVerification: 'unverified',
    assetId: null,
    notes: 'Giá tham khảo trong đề xuất. Sản xuất số lượng nhỏ theo đơn, mẫu chưa chốt.',
  },
];

export const SUPPORT_METHODS: SupportMethod[] = [
  {
    id: 'vat-tu',
    title: 'Hỗ trợ vật tư thiết yếu',
    description: 'Đồng hành thông qua vật phẩm và dụng cụ nằm trong danh mục xác nhận giữa nhóm và Mái ấm.',
    statusText: 'Danh mục nhu cầu đang được đối chiếu xác nhận',
  },
  {
    id: 'san-pham',
    title: 'Quan tâm sản phẩm gây quỹ',
    description: 'Khi mở bán, nhóm sẽ công bố kênh tiếp nhận đăng ký các sản phẩm thủ công gây quỹ.',
    statusText: 'Kênh tiếp nhận sẽ được thông báo khi mở bán',
  },
  {
    id: 'truyen-thong',
    title: 'Kết nối và hỗ trợ truyền thông',
    description: 'Lan tỏa thông điệp vui chơi an toàn và ý nghĩa của chiến dịch trong cộng đồng sinh viên.',
    statusText: 'Trong phạm vi nội dung đã được nhóm phê duyệt',
  },
];

export const TEAM_INFO = {
  name: 'Lăng Kính',
  description:
    'Lăng Kính là nhóm gồm 7 sinh viên lớp AI2015, học phần SSG105 (Kỹ năng làm việc nhóm), Đại học FPT Hà Nội. Nhóm xây dựng dự án để kết nối một buổi vui chơi có lựa chọn với việc hỗ trợ hiện vật theo nhu cầu thực tế tại Mái ấm Thánh Tâm Xuy Xá.',
  course: 'Học phần SSG105 — Đại học FPT Hà Nội',
  classId: 'AI2015',
  size: 7,
};

export const FINANCE_OVERVIEW = {
  plannedExpenseTotal: 3120000,
  plannedRevenueScenario: 2900000,
  unfundedDeficitScenario: -220000,
  actualStatusNotice: 'Chưa có số liệu thực tế được xác nhận.',
  actualCashBalance: null,
  actualInKindLedger: null,
  disclaimer:
    'Các con số trên thuộc dự toán ban đầu trong đề xuất dự án. Báo cáo sau đối soát, biên tập và được phép công bố sẽ được cập nhật sau khi hoàn thành.',
};

export interface TeamPrinciple {
  title: string;
  description: string;
}

export interface CoordinationArea {
  role: string;
  scope: string;
  note: string;
}

export interface ProductFaq {
  question: string;
  answer: string;
}

export const TEAM_PRINCIPLES: TeamPrinciple[] = [
  {
    title: 'Tôn trọng quyền lựa chọn',
    description:
      'Người tham gia tại Mái ấm hoàn toàn tự do chọn góc hoạt động phù hợp, ngồi quan sát hoặc nghỉ ngơi; không tạo áp lực hay bắt buộc tham gia.',
  },
  {
    title: 'Chuẩn bị an toàn và chu đáo',
    description:
      'Tất cả phôi chuồn chuồn, tượng thạch cao, họa cụ và vật liệu màu nước đều được nhóm kiểm tra tính an toàn trước khi mang tới buổi trải nghiệm.',
  },
  {
    title: 'Sản phẩm do nhóm hoàn thiện',
    description:
      'Nhóm sinh viên trực tiếp chuẩn bị và hoàn thiện các sản phẩm lưu niệm gây quỹ; tuyệt đối không giao chỉ tiêu sản xuất cho các em nhỏ.',
  },
  {
    title: 'Đối soát rõ ràng và độc lập',
    description:
      'Mọi khoản dự toán thu chi, tài trợ hiện vật và chi phí vật tư đều được ghi chép độc lập bởi hai thành viên đối soát theo đề xuất.',
  },
  {
    title: 'Bảo vệ quyền riêng tư',
    description:
      'Giữ kín thông tin cá nhân, tình trạng sức khỏe và hình ảnh riêng tư của các em nhỏ; chỉ công bố hình ảnh sau khi có sự đồng ý hợp lệ.',
  },
];

export const TEAM_COORDINATION: CoordinationArea[] = [
  {
    role: 'Điều phối và Đối ngoại',
    scope:
      'Trao đổi với đại diện Mái ấm để làm rõ nhu cầu vật tư thiết yếu, thống nhất kế hoạch tổ chức và điều phối chung.',
    note: 'Mô tả nhiệm vụ trong đề xuất, không phải chức danh nhân sự công khai.',
  },
  {
    role: 'Nội dung và Chuẩn bị góc chơi',
    scope:
      'Lên kịch bản chi tiết cho 4 góc hoạt động (tô tượng, âm nhạc, trò chơi tương tác), chuẩn bị đạo cụ và hỗ trợ các em.',
    note: 'Hướng đến không gian vui chơi thoải mái, không áp lực biểu diễn.',
  },
  {
    role: 'Chuẩn bị và Hoàn thiện sản phẩm',
    scope:
      'Tìm nguồn phôi chuồn chuồn tre mộc mạc và trực tiếp may, hoàn thiện các mẫu túi bút lưu niệm gây quỹ.',
    note: 'Nhóm sinh viên tự tay thực hiện việc hoàn thiện sản phẩm.',
  },
  {
    role: 'Hậu cần và Quản lý vật tư',
    scope:
      'Đóng gói, kiểm đếm số lượng quà tặng, bảo quản dụng cụ workshop và hỗ trợ di chuyển an toàn giữa các địa điểm.',
    note: 'Đảm bảo đầy đủ vật phẩm theo danh mục cần thiết.',
  },
  {
    role: 'Tài chính và Đối soát độc lập',
    scope:
      'Quản lý ghi chép thu chi theo dự toán, đối soát chéo giữa hai thành viên phụ trách và tổng hợp báo cáo sau chiến dịch.',
    note: 'Thực hiện cơ chế hai người đối soát theo đề xuất.',
  },
];

export const PRODUCT_FAQS: ProductFaq[] = [
  {
    question: 'Giá ghi trên website có phải là giá bán chính thức không?',
    answer:
      'Các mức giá (40.000đ/bộ chuồn chuồn, 55.000đ/túi bút, 75.000đ/túi vải) chỉ là giá tham khảo trong dự toán ban đầu của đề xuất. Giá bán và số lượng phát hành chính thức sẽ được công bố khi kế hoạch được phê duyệt.',
  },
  {
    question: 'Sản phẩm gây quỹ do ai làm và hoàn thiện?',
    answer:
      'Túi bút do chính các bạn sinh viên trong nhóm tự tay chuẩn bị và hoàn thiện. Chuồn chuồn tre có nguồn gốc phôi tre mộc; trong 40 phôi chuẩn bị có 10 chiếc dự kiến để lại Mái ấm làm quà. Hoạt động tô tượng tại Mái ấm là góc chơi giải trí tại chỗ cho các em, không phải hàng hoá mang đi bán.',
  },
  {
    question: 'Khi nào mở bán và có thể đặt mua qua kênh nào?',
    answer:
      'Hiện tại trạng thái mở bán chưa được xác nhận. Bản xem trước này nhằm mục đích lấy ý kiến đóng góp cho đề xuất dự án. Kênh tiếp nhận đăng ký chính thức sẽ được thông báo cụ thể sau khi hoàn tất đối soát và được cơ sở đồng ý.',
  },
  {
    question: 'Doanh thu từ các sản phẩm được sử dụng như thế nào?',
    answer:
      'Doanh thu dự kiến khác với số dư sau chi phí. Trong dự toán, doanh thu sẽ ưu tiên bù đắp chi phí vật tư và vận hành thực tế. Phần số dư (nếu có sau khi đối soát hoặc nhận thêm tài trợ hiện vật) sẽ được chuyển toàn bộ thành các phần quà thiết yếu gửi tặng Mái ấm theo đúng danh mục nhu cầu thực tế.',
  },
];
