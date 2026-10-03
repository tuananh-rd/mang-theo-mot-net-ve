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
  category?: 'craft' | 'food';
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
      sourceRef: 'proposal:page-25',
      updatedAt: null,
      publicApproval: 'pending',
    },
    plannedQuantity: {
      value: 30,
      unit: 'bộ bán dự kiến',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-25',
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
    category: 'craft',
    notes: 'Giá tham khảo trong đề xuất. Dự kiến trong 40 phôi chuẩn bị, 10 chiếc để lại Mái ấm.',
  },
  {
    id: 'moc-khoa',
    name: 'Móc khóa Lăng Kính',
    description: 'Móc khóa lưu niệm nhóm sinh viên Lăng Kính chuẩn bị và hoàn thiện theo kế hoạch.',
    referencePrice: {
      value: 10000,
      unit: 'đ/chiếc',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-26',
      updatedAt: null,
      publicApproval: 'pending',
    },
    plannedQuantity: {
      value: 100,
      unit: 'chiếc dự kiến',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-26',
      updatedAt: null,
      publicApproval: 'pending',
    },
    planNotes:
      'Nhóm sinh viên Lăng Kính chuẩn bị và hoàn thiện mẫu theo kế hoạch; mẫu và nguồn trang trí chưa chốt. Quyền sở hữu và sử dụng hình ảnh tách biệt, chưa có sự đồng ý hợp lệ thì không dùng tranh trẻ em.',
    actualStock: null,
    saleStatus: 'unconfirmed',
    originText: 'Nhóm Lăng Kính chuẩn bị và hoàn thiện mẫu',
    originVerification: 'confirmed',
    assetId: null,
    category: 'craft',
    notes: 'Giá tham khảo trong kịch bản đề xuất (trang 26). Nhóm tự chuẩn bị và hoàn thiện mẫu.',
  },
  {
    id: 'set-do-an',
    name: 'Set đồ ăn gây quỹ',
    description: 'Set đồ ăn kết hợp món ăn vặt phục vụ gây quỹ theo kế hoạch đề xuất.',
    referencePrice: {
      value: 79000,
      unit: 'đ/set',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-24',
      updatedAt: null,
      publicApproval: 'pending',
    },
    plannedQuantity: {
      value: null,
      unit: 'set',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-12',
      updatedAt: null,
      publicApproval: 'pending',
    },
    planNotes:
      'Mục tiêu ẩm thực là con số giả định trong đề xuất (trang 18), chưa có bảng phân bổ số lượng từng loại và còn khoảng chênh đối chiếu so với số lượng set giả định. Chỉ triển khai sau khi chốt địa điểm, quy trình an toàn và lịch nhận; hiện tại chưa mở bán.',
    actualStock: null,
    saleStatus: 'unconfirmed',
    originText: 'Đề xuất kế hoạch ẩm thực sinh viên',
    originVerification: 'unverified',
    assetId: null,
    category: 'food',
    notes:
      'Giá tham khảo trong đề xuất (trang 24). Mục tiêu đồ ăn giả định trong hồ sơ chưa có cơ cấu phân bổ chi tiết giữa các món.',
  },
  {
    id: 'combo-nem-gion',
    name: 'Combo 5 nem vỏ giòn',
    description: 'Phần 5 nem rán vỏ giòn chế biến nóng giòn theo đề xuất ẩm thực gây quỹ.',
    referencePrice: {
      value: 40000,
      unit: 'đ/set',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-24',
      updatedAt: null,
      publicApproval: 'pending',
    },
    plannedQuantity: {
      value: null,
      unit: 'set',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-24',
      updatedAt: null,
      publicApproval: 'pending',
    },
    planNotes:
      'Giá tham khảo trong đề xuất. Chưa có phân bổ số lượng bán cụ thể; chỉ triển khai khi có quy trình an toàn thực phẩm.',
    actualStock: null,
    saleStatus: 'unconfirmed',
    originText: 'Đề xuất ẩm thực gây quỹ',
    originVerification: 'unverified',
    assetId: null,
    category: 'food',
    notes: 'Giá tham khảo trong đề xuất (trang 24).',
  },
  {
    id: 'combo-nem-xu',
    name: 'Combo 5 nem xù',
    description: 'Phần 5 nem tẩm bột xù chiên giòn phục vụ trong kế hoạch gây quỹ.',
    referencePrice: {
      value: 40000,
      unit: 'đ/set',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-24',
      updatedAt: null,
      publicApproval: 'pending',
    },
    plannedQuantity: {
      value: null,
      unit: 'set',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-24',
      updatedAt: null,
      publicApproval: 'pending',
    },
    planNotes:
      'Giá tham khảo trong đề xuất. Chưa có phân bổ số lượng bán cụ thể.',
    actualStock: null,
    saleStatus: 'unconfirmed',
    originText: 'Đề xuất ẩm thực gây quỹ',
    originVerification: 'unverified',
    assetId: null,
    category: 'food',
    notes: 'Giá tham khảo trong đề xuất (trang 24).',
  },
  {
    id: 'combo-nem-pho-mai',
    name: 'Combo 5 nem phô mai',
    description: 'Phần 5 nem phô mai béo ngậy theo thực đơn gây quỹ sinh viên.',
    referencePrice: {
      value: 60000,
      unit: 'đ/set',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-24',
      updatedAt: null,
      publicApproval: 'pending',
    },
    plannedQuantity: {
      value: null,
      unit: 'set',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-24',
      updatedAt: null,
      publicApproval: 'pending',
    },
    planNotes:
      'Giá tham khảo trong đề xuất. Chưa có phân bổ số lượng bán cụ thể.',
    actualStock: null,
    saleStatus: 'unconfirmed',
    originText: 'Đề xuất ẩm thực gây quỹ',
    originVerification: 'unverified',
    assetId: null,
    category: 'food',
    notes: 'Giá tham khảo trong đề xuất (trang 24).',
  },
  {
    id: 'banh-su-kem',
    name: 'Bánh su kem',
    description: 'Hộp bánh su kem tráng miệng ngọt ngào phục vụ hoạt động gây quỹ.',
    referencePrice: {
      value: 20000,
      unit: 'đ/hộp',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-24',
      updatedAt: null,
      publicApproval: 'pending',
    },
    plannedQuantity: {
      value: null,
      unit: 'hộp',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-24',
      updatedAt: null,
      publicApproval: 'pending',
    },
    planNotes:
      'Giá tham khảo trong đề xuất. Chưa có phân bổ số lượng bán cụ thể.',
    actualStock: null,
    saleStatus: 'unconfirmed',
    originText: 'Đề xuất ẩm thực gây quỹ',
    originVerification: 'unverified',
    assetId: null,
    category: 'food',
    notes: 'Giá tham khảo trong đề xuất (trang 24).',
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

export interface FinanceOverview {
  plannedExpenseTotal: number;
  craftPlannedRevenue: number;
  foodPlannedRevenueAssumption: QuantitativeFact;
  plannedRevenueScenario: number;
  unfundedProjectedBalance: number;
  actualStatusNotice: string;
  actualCashBalance: number | null;
  actualInKindLedger: string | null;
  disclaimer: string;
  foodHypotheticalSets: number | null;
}

export const FINANCE_OVERVIEW: FinanceOverview = {
  plannedExpenseTotal: 4935000,
  craftPlannedRevenue: 2200000,
  foodPlannedRevenueAssumption: {
    value: 4500000,
    unit: 'đ',
    kind: 'planned',
    verification: 'unverified',
    sourceRef: 'proposal:page-18',
    updatedAt: null,
    publicApproval: 'pending',
  },
  foodHypotheticalSets: 50,
  plannedRevenueScenario: 6700000,
  unfundedProjectedBalance: 1765000,
  actualStatusNotice: 'Chưa có số liệu thực tế được xác nhận.',
  actualCashBalance: null,
  actualInKindLedger: null,
  disclaimer:
    'Các con số trên thuộc dự toán ban đầu trong đề xuất dự án (tháng 10/2026). Doanh thu đồ ăn là con số mục tiêu giả định trong hồ sơ đề xuất (trang 18), chưa có bảng phân bổ số lượng bán từng món. Báo cáo sau đối soát, biên tập và được phép công bố sẽ được cập nhật sau khi hoàn thành.',
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
      'Nhóm phụ trách chuẩn bị và hoàn thiện các sản phẩm lưu niệm gây quỹ; trong đó móc khóa do nhóm chuẩn bị và hoàn thiện, chuồn chuồn có nguồn gốc trang trí chờ xác nhận. Tuyệt đối không giao chỉ tiêu sản xuất cho các em nhỏ.',
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
      'Chuẩn bị nguồn phôi chuồn chuồn tre, hoàn thiện các mẫu móc khóa lưu niệm và chuẩn bị phương án ẩm thực gây quỹ theo kế hoạch.',
    note: 'Nhóm chuẩn bị và hoàn thiện sản phẩm theo kế hoạch đề xuất.',
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
      'Các mức giá (40.000đ/bộ chuồn chuồn, 10.000đ/chiếc móc khóa, thực đơn đồ ăn 20.000đ–79.000đ) chỉ là giá tham khảo trong đề xuất ban đầu. Giá bán chính thức và số lượng phát hành sẽ được thông báo khi kế hoạch được phê duyệt.',
  },
  {
    question: 'Sản phẩm gây quỹ do ai làm và hoàn thiện?',
    answer:
      'Móc khóa lưu niệm do nhóm sinh viên Lăng Kính chuẩn bị và hoàn thiện mẫu theo kế hoạch. Chuồn chuồn tre sử dụng phôi tre mộc, nguồn gốc trang trí chưa được xác nhận; trong 40 phôi chuẩn bị có 10 chiếc để lại Mái ấm làm quà. Hoạt động tô tượng là trải nghiệm vui chơi tại chỗ, sản phẩm để lại Mái ấm, không phải hàng hoá mang bán.',
  },
  {
    question: 'Kế hoạch gây quỹ qua đồ ăn được triển khai như thế nào?',
    answer:
      'Mục tiêu doanh thu ẩm thực là con số giả định trong đề xuất dự án (trang 18), chưa có bảng phân bổ số lượng bán cụ thể cho từng loại món. Khi đối chiếu với số lượng set giả định trong hồ sơ, kế hoạch vẫn còn khoảng chênh chưa có bảng phân bổ số lượng và đơn giá từng món. Kế hoạch này chỉ được xem xét triển khai khi đã chốt địa điểm, người phụ trách, quy trình an toàn thực phẩm và phương thức nhận; hiện tại website chưa mở bán và chưa nhận đặt hàng hay tiền ủng hộ.',
  },
  {
    question: 'Khi nào mở bán và có thể đặt mua qua kênh nào?',
    answer:
      'Hiện tại trạng thái mở bán chưa được xác nhận. Bản xem trước nhằm lấy ý kiến đóng góp cho đề xuất dự án. Kênh tiếp nhận đăng ký chính thức sẽ được công bố sau khi mẫu mã, mức giá, quy trình an toàn và kế hoạch mở bán được phê duyệt.',
  },
  {
    question: 'Doanh thu từ các sản phẩm được sử dụng như thế nào?',
    answer:
      'Doanh thu dự kiến khác số dư sau chi phí. Theo kế hoạch, nguồn thu góp phần trang trải chi phí nguyên liệu, vật tư và vận hành; tiền và hiện vật được ghi nhận riêng biệt. Toàn bộ số dư tiền (nếu có sau đối soát) dự kiến dùng hỗ trợ hiện vật đúng nhu cầu thực tế của Mái ấm.',
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
  // Nhóm 1: Nguyên liệu gây quỹ — trang 24 (Tổng 2.245.000đ)
  {
    id: 'nem-tran-cong-chau',
    category: 'Nguyên liệu gây quỹ',
    title: 'Nem Trần Công Châu',
    calculationText: '300 × 3.200đ',
    amount: {
      value: 960000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-24',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Theo dự toán nguyên liệu ẩm thực (trang 24)',
    isEstimated: false,
  },
  {
    id: 'bot-chien-xu',
    category: 'Nguyên liệu gây quỹ',
    title: 'Bột chiên xù',
    calculationText: '10 × 12.000đ',
    amount: {
      value: 120000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-24',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Theo dự toán nguyên liệu (trang 24)',
    isEstimated: false,
  },
  {
    id: 'hop-dung-thuc-an',
    category: 'Nguyên liệu gây quỹ',
    title: 'Hộp đựng thức ăn',
    calculationText: '2 túi × 20.000đ/túi 50 chiếc',
    amount: {
      value: 40000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-24',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Bao bì đựng thức ăn hợp vệ sinh (trang 24)',
    isEstimated: false,
  },
  {
    id: 'xien-que',
    category: 'Nguyên liệu gây quỹ',
    title: 'Xiên que',
    calculationText: '5 túi × 12.000đ',
    amount: {
      value: 60000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-24',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Xiên que phục vụ món ăn (trang 24)',
    isEstimated: false,
  },
  {
    id: 'pho-mai',
    category: 'Nguyên liệu gây quỹ',
    title: 'Phô mai',
    calculationText: '1kg × 140.000đ/kg',
    amount: {
      value: 140000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-24',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Nguyên liệu làm nem phô mai (trang 24)',
    isEstimated: false,
  },
  {
    id: 'khoai-tay',
    category: 'Nguyên liệu gây quỹ',
    title: 'Khoai tây',
    calculationText: '25.000đ/kg, mua nhiều đợt, chưa chốt số kg',
    amount: {
      value: 75000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-24',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Số lượng mua nhiều đợt chưa chốt trong đề xuất, không tự gán số kg (trang 24)',
    isEstimated: true,
  },
  {
    id: 'dau-an',
    category: 'Nguyên liệu gây quỹ',
    title: 'Dầu ăn',
    calculationText: '10 × 25.000đ',
    amount: {
      value: 250000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-24',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Dầu ăn chế biến (trang 24)',
    isEstimated: false,
  },
  {
    id: 'nuoc-uong-tang-them',
    category: 'Nguyên liệu gây quỹ',
    title: 'Nước uống tặng thêm',
    calculationText: '50 × 4.000đ',
    amount: {
      value: 200000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-24',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Nước uống kèm phần ăn theo đề xuất (trang 24)',
    isEstimated: false,
  },
  {
    id: 'banh-su-kem-nhap',
    category: 'Nguyên liệu gây quỹ',
    title: 'Bánh su kem',
    calculationText: '50 hộp × 8.000đ/hộp',
    amount: {
      value: 400000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-24',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Chi phí chuẩn bị bánh su kem theo đề xuất (trang 24)',
    isEstimated: false,
  },

  // Nhóm 2: Chuồn chuồn, đế, tượng, bóng, màu, móc khóa, bánh kẹo — trang 25 (Tổng 1.560.000đ)
  {
    id: 'chuon-chuon-tre-12cm',
    category: 'Vật tư workshop & quà tặng',
    title: 'Chuồn chuồn tre 12cm',
    calculationText: '40 × 10.000đ',
    amount: {
      value: 400000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-25',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Dự kiến trong 40 phôi chuẩn bị, 30 bộ bán và 10 chiếc để lại Mái ấm làm quà (trang 25)',
    isEstimated: false,
  },
  {
    id: 'chan-de',
    category: 'Vật tư workshop & quà tặng',
    title: 'Chân đế',
    calculationText: '30 × 10.000đ',
    amount: {
      value: 300000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-25',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Dự kiến 30 chân đế kèm chuồn chuồn bán gây quỹ (trang 25)',
    isEstimated: false,
  },
  {
    id: 'tuong-to-10cm',
    category: 'Vật tư workshop & quà tặng',
    title: 'Tượng tô 10cm',
    calculationText: '20 × 4.000đ',
    amount: {
      value: 80000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-25',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Hoạt động vui chơi trải nghiệm tại chỗ, sản phẩm để lại cơ sở, không phải hàng bán (trang 25)',
    isEstimated: false,
  },
  {
    id: 'bong-cho-tro-choi',
    category: 'Vật tư workshop & quà tặng',
    title: 'Bóng cho trò chơi',
    calculationText: '2 × 10.000đ',
    amount: {
      value: 20000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-25',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Bóng phục vụ hoạt động trò chơi tương tác (trang 25)',
    isEstimated: false,
  },
  {
    id: 'mau-ve-sau-mau',
    category: 'Vật tư workshop & quà tặng',
    title: 'Màu vẽ sáu màu',
    calculationText: '6 × 20.000đ',
    amount: {
      value: 120000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-25',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Họa cụ màu vẽ an toàn cho hoạt động sáng tạo tại Mái ấm (trang 25)',
    isEstimated: false,
  },
  {
    id: 'moc-khoa-phoi',
    category: 'Vật tư workshop & quà tặng',
    title: 'Móc khóa',
    calculationText: '100 × 3.000đ',
    amount: {
      value: 300000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-25',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Kế hoạch 100 móc khóa lưu niệm do nhóm hoàn thiện (trang 25)',
    isEstimated: false,
  },
  {
    id: 'banh-keo-qua',
    category: 'Vật tư workshop & quà tặng',
    title: 'Bánh kẹo/quà',
    calculationText: 'Kế hoạch tổng',
    amount: {
      value: 340000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-25',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Kế hoạch tổng, chưa phân bổ theo người nhận (trang 25)',
    isEstimated: false,
  },

  // Nhóm 3: Truyền thông và di chuyển — trang 26 (Tổng 1.130.000đ)
  {
    id: 'truyen-thong-truc-tiep',
    category: 'Truyền thông & Di chuyển',
    title: 'Truyền thông trực tiếp (standee, bánh kẹo tặng)',
    calculationText: '2 × 30.000đ',
    amount: {
      value: 60000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-26',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Khoản dự kiến theo đề xuất trang 26, chưa xác nhận triển khai',
    isEstimated: false,
  },
  {
    id: 'di-chuyen-buoi-1-thue-xe',
    category: 'Truyền thông & Di chuyển',
    title: 'Di chuyển buổi 1 — thuê xe',
    calculationText: '1 × 750.000đ',
    amount: {
      value: 750000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-26',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Phương tiện di chuyển buổi 1 theo đề xuất (trang 26)',
    isEstimated: false,
  },
  {
    id: 'di-chuyen-buoi-2-xe-may',
    category: 'Truyền thông & Di chuyển',
    title: 'Di chuyển buổi 2 — xe máy',
    calculationText: '4 × 80.000đ',
    amount: {
      value: 320000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-26',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Phương tiện di chuyển buổi 2 bằng xe máy theo đề xuất (trang 26)',
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
    title: 'Kịch bản cơ sở (chưa tính tài trợ)',
    description:
      'Không có hiện vật thay chi; chi tiền theo toàn bộ dự toán 4.935.000đ. Doanh thu kịch bản giả định (thủ công 2.200.000đ + đồ ăn giả định 4.500.000đ) đạt 6.700.000đ; số dư giả định là +1.765.000đ.',
    inKindReplacement: {
      value: 0,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal:page-27',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: '0đ (tham số kịch bản cơ sở, chưa tính tài trợ)',
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
      'Tiền mặt và hiện vật luôn được ghi nhận trong hai sổ theo dõi riêng biệt, tuyệt đối không gộp chung. Mọi khoản thu chi bằng tiền đều được hai thành viên đối soát chéo độc lập và có chứng từ lưu trữ. Nhóm không tuyên bố 100% doanh thu là tiền ủng hộ hay nhận tiền/đơn khi chưa có kênh liên hệ và phê duyệt chính thức.',
  },
];

export interface TransparencyFaq {
  question: string;
  answer: string;
}

export const TRANSPARENCY_FAQS: TransparencyFaq[] = [
  {
    question: 'Doanh thu kịch bản và dự toán chi phí được tính toán như thế nào?',
    answer:
      'Dự toán chi phí kế hoạch gồm 19 khoản mục theo đề xuất (trang 24, 25, 26). Doanh thu kịch bản kết hợp từ khoản thủ công và mục tiêu ẩm thực giả định (trang 18). Khi đối chiếu mục tiêu ẩm thực với số lượng set đồ ăn giả định, hồ sơ còn khoảng chênh chưa có bảng phân bổ số lượng × giá từng món. Toàn bộ là mô phỏng kế hoạch trong đề xuất, không phải số liệu thực tế.',
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

