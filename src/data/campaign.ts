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
  quantityPrefix?: string;
  planNotes?: string;
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
    planNotes:
      'Phôi tre mộc; nguồn gốc trang trí chưa xác nhận. Dự kiến trong 40 phôi chuẩn bị, 10 chiếc để lại Mái ấm làm quà.',
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
    planNotes: 'Nhóm sinh viên Lăng Kính chuẩn bị và hoàn thiện mẫu; phục vụ học tập và ghi chép.',
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
      unit: 'chiếc',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:inventory-plan',
      updatedAt: null,
      publicApproval: 'pending',
    },
    quantityPrefix: 'Tối đa ',
    planNotes: 'Sản xuất số lượng nhỏ theo đơn đặt trước trong kế hoạch; mẫu và mức giá cuối chưa chốt.',
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
      'Kế hoạch chuẩn bị phôi chuồn chuồn, tượng thạch cao, họa cụ và vật liệu màu nước đều hướng đến tính an toàn cho người tham gia.',
  },
  {
    title: 'Sản phẩm do nhóm hoàn thiện',
    description:
      'Nhóm phụ trách chuẩn bị và hoàn thiện các sản phẩm lưu niệm gây quỹ; trong đó túi bút do nhóm hoàn thiện, chuồn chuồn có nguồn gốc trang trí chờ xác nhận. Tuyệt đối không giao chỉ tiêu sản xuất cho các em nhỏ.',
  },
  {
    title: 'Đối soát rõ ràng và độc lập',
    description:
      'Dự toán thu chi, tài trợ hiện vật và chi phí vật tư dự kiến được ghi chép độc lập bởi hai thành viên đối soát theo đề xuất.',
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
      'Tìm nguồn phôi chuồn chuồn tre mộc mạc và chuẩn bị, hoàn thiện các mẫu túi bút lưu niệm gây quỹ theo kế hoạch.',
    note: 'Nhóm chuẩn bị và hoàn thiện túi bút theo nguồn đề xuất.',
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
      'Túi bút do nhóm sinh viên chuẩn bị và hoàn thiện. Chuồn chuồn tre có nguồn gốc phôi tre mộc, nguồn gốc trang trí chưa được xác nhận; trong 40 phôi chuẩn bị có 10 chiếc dự kiến để lại Mái ấm làm quà. Hoạt động tô tượng tại Mái ấm là trải nghiệm vui chơi tại chỗ cho các em, không phải hàng hoá mang đi bán.',
  },
  {
    question: 'Khi nào mở bán và có thể đặt mua qua kênh nào?',
    answer:
      'Hiện tại trạng thái mở bán chưa được xác nhận. Bản xem trước này nhằm mục đích lấy ý kiến đóng góp cho đề xuất dự án. Kênh tiếp nhận đăng ký chính thức sẽ được thông báo cụ thể sau khi mẫu mã, mức giá, nguồn gốc và kế hoạch mở bán được phê duyệt.',
  },
  {
    question: 'Doanh thu từ các sản phẩm được sử dụng như thế nào?',
    answer:
      'Doanh thu dự kiến khác số dư sau chi phí. Theo kế hoạch, nguồn thu góp phần trang trải chi phí vật tư và vận hành; tiền và hiện vật được ghi nhận riêng biệt. Số dư tiền (nếu có sau đối soát) dự kiến dùng hỗ trợ hiện vật đúng nhu cầu của Mái ấm.',
  },
];

export interface PlannedExpenseItem {
  id: string;
  category: string;
  title: string;
  calculationText: string;
  amount: QuantitativeFact;
  note: string;
  isEstimated: boolean;
}

export const PLANNED_EXPENSES: PlannedExpenseItem[] = [
  {
    id: 'chuon-chuon',
    category: 'Vật tư góc chơi',
    title: '40 phôi chuồn chuồn tre',
    calculationText: '40 chuồn chuồn × 13.500đ',
    amount: {
      value: 540000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:budget-scenario',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Phôi theo dự toán, không tồn kho thực tế',
    isEstimated: false,
  },
  {
    id: 'chan-de',
    category: 'Vật tư góc chơi',
    title: '30 chân đế chuồn chuồn',
    calculationText: '30 chân đế × 18.000đ',
    amount: {
      value: 540000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:budget-scenario',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Theo dự toán',
    isEstimated: false,
  },
  {
    id: 'to-tuong',
    category: 'Vật tư góc chơi',
    title: '20 tượng thạch cao',
    calculationText: '20 tượng × 14.000đ',
    amount: {
      value: 280000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:budget-scenario',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Giá giả định; hoạt động chơi, không hàng bán',
    isEstimated: true,
  },
  {
    id: 'hoa-cu',
    category: 'Vật tư góc chơi',
    title: 'Màu vẽ, cọ, mút xốp, bóng, chốt',
    calculationText: 'Màu, cọ/mút, bóng/chốt',
    amount: {
      value: 300000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:budget-scenario',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Chi phí giả định',
    isEstimated: true,
  },
  {
    id: 'tui-but-vai',
    category: 'Sản phẩm gây quỹ',
    title: 'Phôi túi bút và túi vải',
    calculationText: '20 túi bút × 20.000đ + 8 túi vải × 35.000đ',
    amount: {
      value: 680000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:budget-scenario',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Kế hoạch chuẩn bị, không số đã sản xuất',
    isEstimated: false,
  },
  {
    id: 'van-hanh',
    category: 'Hậu cần & Vận hành',
    title: 'Gói hàng, mẫu và di chuyển',
    calculationText: 'Gói hàng 80.000đ + mẫu 100.000đ + di chuyển 600.000đ',
    amount: {
      value: 780000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:budget-scenario',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Theo dự toán',
    isEstimated: false,
  },
];

export interface FinanceScenario {
  id: string;
  title: string;
  description: string;
  inKindReplacement: QuantitativeFact;
  note: string;
}

export const FINANCE_SCENARIOS: FinanceScenario[] = [
  {
    id: 'chua-tinh-tai-tro',
    title: 'Chưa tính tài trợ',
    description: 'Không có hiện vật thay chi; chi tiền theo toàn bộ dự toán 3.120.000đ, doanh thu giả định bán đủ hàng còn thiếu 220.000đ.',
    inKindReplacement: {
      value: 0,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:scenario-1',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: '0đ (tham số kịch bản cơ sở, chưa tính tài trợ)',
  },
  {
    id: 'thay-mot-phan',
    title: 'Hiện vật thay một phần chi',
    description: 'Tiếp nhận tài trợ hiện vật thay thế cho một phần chi phí vật tư.',
    inKindReplacement: {
      value: 500000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:scenario-2',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Hiện vật thay đúng khoản chi phí tương đương trong dự toán',
  },
  {
    id: 'thay-chi-workshop',
    title: 'Hiện vật thay chi workshop',
    description: 'Giả định tiếp nhận tài trợ hiện vật thay thế 3 khoản vật tư góc chơi (phôi chuồn chuồn, tượng thạch cao và màu vẽ).',
    inKindReplacement: {
      value: 1120000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:scenario-3',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Hiện vật thay thế 3 khoản vật tư góc chơi: 540.000đ (phôi chuồn chuồn) + 280.000đ (tượng) + 300.000đ (màu vẽ)',
  },
];

export interface ActualFinanceReport {
  actualCashReceived: QuantitativeFact;
  actualCashSpent: QuantitativeFact;
  actualCashBalance: QuantitativeFact;
  actualInKindReceived: QuantitativeFact;
  actualInKindDelivered: QuantitativeFact;
  vouchersCount: number | null;
  statusNotice: string;
  disclaimer: string;
}

export const ACTUAL_FINANCE: ActualFinanceReport = {
  actualCashReceived: {
    value: null,
    unit: 'đ',
    kind: 'actual',
    verification: 'unverified',
    sourceRef: null,
    updatedAt: null,
    publicApproval: 'pending',
  },
  actualCashSpent: {
    value: null,
    unit: 'đ',
    kind: 'actual',
    verification: 'unverified',
    sourceRef: null,
    updatedAt: null,
    publicApproval: 'pending',
  },
  actualCashBalance: {
    value: null,
    unit: 'đ',
    kind: 'actual',
    verification: 'unverified',
    sourceRef: null,
    updatedAt: null,
    publicApproval: 'pending',
  },
  actualInKindReceived: {
    value: null,
    unit: 'món',
    kind: 'actual',
    verification: 'unverified',
    sourceRef: null,
    updatedAt: null,
    publicApproval: 'pending',
  },
  actualInKindDelivered: {
    value: null,
    unit: 'món',
    kind: 'actual',
    verification: 'unverified',
    sourceRef: null,
    updatedAt: null,
    publicApproval: 'pending',
  },
  vouchersCount: null,
  statusNotice: 'Chưa có số liệu thực tế được xác nhận.',
  disclaimer:
    'Số liệu thực tế sẽ được cập nhật sau khi hoàn tất đối soát chéo độc lập, biên tập bảo vệ riêng tư và được cấp quyền công bố.',
};

export interface OfficialContact {
  email: string | null;
  phone: string | null;
  representative: string | null;
  status: 'unconfirmed' | 'confirmed';
  notice: string;
}

export const OFFICIAL_CONTACT: OfficialContact = {
  email: null,
  phone: null,
  representative: null,
  status: 'unconfirmed',
  notice: 'Kênh liên hệ chính thức chưa được xác nhận. Thông tin sẽ được cập nhật sau khi được phép công bố.',
};

export interface SupportWorkflowStep {
  step: string;
  title: string;
  description: string;
}

export const SUPPORT_WORKFLOW: SupportWorkflowStep[] = [
  {
    step: '01',
    title: 'Làm rõ nhu cầu thực tế',
    description:
      'Trao đổi trực tiếp cùng đại diện Mái ấm Thánh Tâm Xuy Xá để xác định chính xác danh mục vật phẩm, đồ dùng học tập hoặc đồ chơi còn thiếu.',
  },
  {
    step: '02',
    title: 'Thống nhất phương thức & Bàn giao',
    description:
      'Thống nhất số lượng, quy cách, thời gian và địa điểm tiếp nhận vật phẩm đảm bảo thuận tiện và an toàn cho các bên.',
  },
  {
    step: '03',
    title: 'Đối soát & Cập nhật công khai',
    description:
      'Ghi chép độc lập vào sổ theo dõi hiện vật; công bố thông tin minh bạch trong báo cáo tổng kết sau khi được sự đồng ý của nhà đồng hành.',
  },
];

export interface SupportFaq {
  question: string;
  answer: string;
}

export const SUPPORT_FAQS: SupportFaq[] = [
  {
    question: 'Khi nào dự án bắt đầu tiếp nhận hiện vật hỗ trợ?',
    answer:
      'Nhóm chỉ tiếp nhận vật phẩm sau khi danh mục nhu cầu thực tế được đại diện Mái ấm xác nhận và kênh liên hệ chính thức được công bố. Điều này giúp tránh lãng phí và đảm bảo mọi sự đóng góp đều đúng nhu cầu thiết yếu.',
  },
  {
    question: 'Cá nhân hoặc nhóm ngoài có thể cùng đến Mái ấm tham gia buổi chơi không?',
    answer:
      'Việc đến thăm và tham gia buổi chơi tại Mái ấm chỉ được thực hiện khi có sự đồng ý của ban quản lý cơ sở và sự điều phối thống nhất từ trước. Nhóm không tuyển người tham gia tự do đến Mái ấm.',
  },
  {
    question: 'Các em nhỏ tại Mái ấm có bắt buộc phải tham gia tất cả các góc hoạt động không?',
    answer:
      'Không. Nguyên tắc hàng đầu của buổi chơi là tôn trọng quyền lựa chọn của từng em. Các em có thể tự do tham gia góc vẽ, góc tô tượng, hát cùng nhau, chơi trò chơi nhẹ, hoặc chỉ ngồi quan sát và nghỉ ngơi.',
  },
  {
    question: 'Các khoản đóng góp tiền mặt và hiện vật được quản lý như thế nào?',
    answer:
      'Tiền mặt và hiện vật luôn được ghi nhận trong hai sổ theo dõi riêng biệt, tuyệt đối không gộp chung. Mọi khoản thu chi bằng tiền đều được hai thành viên đối soát chéo độc lập và có chứng từ lưu trữ.',
  },
];

export interface TransparencyFaq {
  question: string;
  answer: string;
}

export const TRANSPARENCY_FAQS: TransparencyFaq[] = [
  {
    question: 'Tại sao dự toán chi (3.120.000đ) lại lớn hơn doanh thu kịch bản bán đủ hàng (2.900.000đ)?',
    answer:
      'Dự toán 3.120.000đ bao gồm toàn bộ vật tư góc chơi, sản phẩm gây quỹ và chi phí vận hành. Kịch bản bán đủ hàng mang lại 2.900.000đ, dẫn đến chênh lệch thiếu 220.000đ nếu không có tài trợ. Đây là lý do nhóm xây dựng các kịch bản tiếp nhận tài trợ hiện vật để bù đắp chi phí vật tư.',
  },
  {
    question: 'Doanh thu từ sản phẩm có phải 100% dành mua quà cho các em không?',
    answer:
      'Không. Nguồn thu bán sản phẩm trước hết nhằm trang trải chi phí nguyên vật liệu và tổ chức buổi chơi. Số dư tiền thực tế (nếu có sau khi đối soát tất cả các khoản chi) dự kiến sẽ được dùng để hỗ trợ hiện vật đúng theo danh mục nhu cầu của Mái ấm.',
  },
  {
    question: 'Số dư tiền thực tế được tính toán theo nguyên tắc nào?',
    answer:
      'Số dư tiền thực tế = Số dư đầu kỳ + Doanh thu thực nhận + Tài trợ tiền thực nhận − Chi tiền thực trả. Hàng tồn kho và hiện vật tài trợ được theo dõi trong sổ riêng biệt, không coi hàng tồn hay đơn chưa thanh toán là tiền thực nhận.',
  },
  {
    question: 'Khi nào báo cáo tài chính và chứng từ thực tế được công bố?',
    answer:
      'Sau khi chiến dịch kết thúc, hai thành viên tài chính sẽ đối soát độc lập toàn bộ hóa đơn, chứng từ. Nhóm sẽ biên tập che thông tin cá nhân nhạy cảm và công bố báo cáo công khai tại trang này sau khi được phê duyệt.',
  },
];

