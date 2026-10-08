/**
 * Hợp đồng dữ liệu và nội dung bản xem trước (C06 - Final PDF)
 * Tuân thủ docs/task-specs/C06.md, docs/final-pdf-intake.md và docs/evidence/C06/source-calculations.json.
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
  isBaseRevenueItem?: boolean;
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
    'Nhóm Lăng Kính dự kiến mang chuồn chuồn tre, sắc màu, vẽ tranh và những trò chơi nhẹ đến Mái ấm Thánh Tâm Xuy Xá, để mỗi người tham gia có thể chọn cách vui chơi phù hợp với mình.',
  location: 'Mái ấm Thánh Tâm Xuy Xá (Mỹ Đức, Hà Nội) & Campus FPT Hòa Lạc',
  executionStatus: 'unknown',
  statusNotice: 'Trạng thái thực tế chưa được xác nhận',
  previewNotice: 'Bản xem trước — nội dung theo đề xuất Final, chờ xác nhận.',
  activities: [
    {
      id: 'chuon-chuon-tre',
      title: 'Chuồn chuồn tre & Vẽ tranh',
      description: 'Trang trí những cánh chuồn chuồn tre thăng bằng và vẽ tranh tự do với màu sắc theo sở thích.',
      badge: 'Góc tạo hình',
      note: 'Người tham gia có quyền lựa chọn vẽ tranh, trang trí, quan sát hoặc nghỉ ngơi.',
    },
    {
      id: 'to-tuong',
      title: 'Tô tượng sắc màu',
      description: 'Thỏa sức phối màu trên các mẫu tượng thạch cao đa dạng hình dáng và kích cỡ (10 cm).',
      badge: 'Góc tô màu',
      note: 'Hoạt động vui chơi trải nghiệm tại chỗ, không phải hàng hoá gây quỹ.',
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
      title: 'Xác nhận và chuẩn bị nguồn lực (Tuần 5)',
      description:
        'Làm việc cùng đại diện Mái ấm để làm rõ nhu cầu vật tư thiết yếu; chuẩn bị phôi chuồn chuồn tre, tượng và họa cụ an toàn.',
    },
    {
      step: '02',
      title: 'Chuẩn bị và gây quỹ (Tuần 6–8)',
      description:
        'Nhóm sinh viên chuẩn bị nguyên liệu, triển khai gây quỹ ẩm thực và hoàn thiện các sản phẩm lưu niệm thủ công theo kế hoạch.',
    },
    {
      step: '03',
      title: 'Buổi chơi tại Mái ấm (Tuần 8)',
      description:
        'Tổ chức không gian vui chơi có 4 góc hoạt động tại Mái ấm Thánh Tâm Xuy Xá (dự kiến 180 phút với 2 lần nghỉ 15 phút; quyền rút ngắn/nghỉ theo cơ sở).',
    },
    {
      step: '04',
      title: 'Đối soát và trao tặng (Tuần 9)',
      description:
        'Buổi 2 tại Mái ấm (dự kiến 30–45 phút) để trao tặng quà đúng danh mục nhu cầu; đối soát độc lập mọi khoản thu chi và công bố báo cáo minh bạch.',
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
      sourceRef: 'proposal-final:page-30',
      updatedAt: null,
      publicApproval: 'pending',
    },
    plannedQuantity: {
      value: 30,
      unit: 'bộ bán dự kiến',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-30',
      updatedAt: null,
      publicApproval: 'pending',
    },
    planNotes:
      'Phôi tre mộc; nguồn gốc trang trí chưa xác nhận. Kế hoạch chuẩn bị 50 phôi (30 bộ bán với giá tham khảo 40.000đ/bộ, 20 chiếc để lại Mái ấm theo lựa chọn của cơ sở).',
    actualStock: null,
    saleStatus: 'unconfirmed',
    originText: 'Phôi tre mộc; nguồn gốc trang trí chưa xác nhận',
    originVerification: 'unverified',
    assetId: null,
    category: 'craft',
    notes: 'Giá tham khảo trong đề xuất (trang 30). Chuẩn bị 50 phôi (30 dành bán, 20 để lại Mái ấm).',
    isBaseRevenueItem: true,
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
      sourceRef: 'proposal-final:page-30',
      updatedAt: null,
      publicApproval: 'pending',
    },
    plannedQuantity: {
      value: 100,
      unit: 'chiếc dự kiến',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-30',
      updatedAt: null,
      publicApproval: 'pending',
    },
    planNotes:
      'Nhóm sinh viên Lăng Kính chuẩn bị và hoàn thiện mẫu theo kế hoạch. Dự kiến in tranh chỉ khi có quyền và đồng ý phù hợp; nhóm chịu trách nhiệm hàng bán, không giao sản lượng cho các em nhỏ.',
    actualStock: null,
    saleStatus: 'unconfirmed',
    originText: 'Nhóm Lăng Kính chuẩn bị và hoàn thiện mẫu',
    originVerification: 'confirmed',
    assetId: null,
    category: 'craft',
    notes: 'Giá tham khảo trong đề xuất (trang 30). Nhóm tự chuẩn bị và hoàn thiện mẫu.',
    isBaseRevenueItem: true,
  },
  {
    id: 'set-do-an',
    name: 'Set đồ ăn gây quỹ',
    description: 'Set đồ ăn gồm 2 nem giòn, 2 nem xù, 2 nem phô mai, kèm dưa chuột, khoai tây và nước uống theo đề xuất.',
    referencePrice: {
      value: 79000,
      unit: 'đ/set',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-29',
      updatedAt: null,
      publicApproval: 'pending',
    },
    plannedQuantity: {
      value: 50,
      unit: 'set dự kiến',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-29',
      updatedAt: null,
      publicApproval: 'pending',
    },
    planNotes:
      'Khẩu phần đề xuất gồm 6 nem (2 nem giòn + 2 nem xù + 2 nem phô mai), khoai tây, dưa chuột và nước uống tặng thêm. Kế hoạch gây quỹ 50 set (doanh thu dự kiến 3.950.000đ). Chỉ triển khai sau khi chốt địa điểm, quy trình an toàn và lịch nhận; hiện tại chưa mở bán.',
    actualStock: null,
    saleStatus: 'unconfirmed',
    originText: 'Đề xuất kế hoạch ẩm thực sinh viên',
    originVerification: 'unverified',
    assetId: null,
    category: 'food',
    notes:
      'Giá tham khảo trong đề xuất (trang 29). Kế hoạch 50 set phục vụ gây quỹ ẩm thực.',
    isBaseRevenueItem: true,
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
      sourceRef: 'proposal-final:page-29',
      updatedAt: null,
      publicApproval: 'pending',
    },
    plannedQuantity: {
      value: 60,
      unit: 'suất đề xuất',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-29',
      updatedAt: null,
      publicApproval: 'pending',
    },
    planNotes:
      'Hồ sơ ghi số lượng đề xuất 60 suất nhưng không gộp vào doanh thu cơ sở; cần làm rõ là bán bổ sung hay thay thế cho 50 set (nguyên liệu nem 300 chiếc chỉ đủ cho 50 set × 6 nem).',
    actualStock: null,
    saleStatus: 'unconfirmed',
    originText: 'Đề xuất ẩm thực gây quỹ',
    originVerification: 'unverified',
    assetId: null,
    category: 'food',
    notes: 'Giá tham khảo trong đề xuất (trang 29). Loại khỏi doanh thu kịch bản cơ sở.',
    isBaseRevenueItem: false,
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
      sourceRef: 'proposal-final:page-29',
      updatedAt: null,
      publicApproval: 'pending',
    },
    plannedQuantity: {
      value: 60,
      unit: 'suất đề xuất',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-29',
      updatedAt: null,
      publicApproval: 'pending',
    },
    planNotes:
      'Hồ sơ ghi số lượng đề xuất 60 suất nhưng không gộp vào doanh thu cơ sở; cần làm rõ là bán bổ sung hay thay thế cho 50 set.',
    actualStock: null,
    saleStatus: 'unconfirmed',
    originText: 'Đề xuất ẩm thực gây quỹ',
    originVerification: 'unverified',
    assetId: null,
    category: 'food',
    notes: 'Giá tham khảo trong đề xuất (trang 29). Loại khỏi doanh thu kịch bản cơ sở.',
    isBaseRevenueItem: false,
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
      sourceRef: 'proposal-final:page-29',
      updatedAt: null,
      publicApproval: 'pending',
    },
    plannedQuantity: {
      value: 60,
      unit: 'suất đề xuất',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-29',
      updatedAt: null,
      publicApproval: 'pending',
    },
    planNotes:
      'Hồ sơ ghi số lượng đề xuất 60 suất nhưng không gộp vào doanh thu cơ sở; cần làm rõ là bán bổ sung hay thay thế cho 50 set.',
    actualStock: null,
    saleStatus: 'unconfirmed',
    originText: 'Đề xuất ẩm thực gây quỹ',
    originVerification: 'unverified',
    assetId: null,
    category: 'food',
    notes: 'Giá tham khảo trong đề xuất (trang 29). Loại khỏi doanh thu kịch bản cơ sở.',
    isBaseRevenueItem: false,
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
      sourceRef: 'proposal-final:page-29',
      updatedAt: null,
      publicApproval: 'pending',
    },
    plannedQuantity: {
      value: 50,
      unit: 'hộp dự kiến',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-29',
      updatedAt: null,
      publicApproval: 'pending',
    },
    planNotes:
      'Kế hoạch 50 hộp su kem gây quỹ (doanh thu dự kiến 1.000.000đ). Chi phí mua bánh (400.000đ) đã nằm trong nhóm nguyên liệu gây quỹ; không trừ hai lần.',
    actualStock: null,
    saleStatus: 'unconfirmed',
    originText: 'Đề xuất ẩm thực gây quỹ',
    originVerification: 'unverified',
    assetId: null,
    category: 'food',
    notes: 'Giá tham khảo trong đề xuất (trang 29). Kế hoạch 50 hộp.',
    isBaseRevenueItem: true,
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
  foodPlannedRevenue: number;
  plannedRevenueScenario: number;
  unfundedProjectedBalance: number;
  actualStatusNotice: string;
  actualCashBalance: number | null;
  actualInKindLedger: string | null;
  disclaimer: string;
  foodHypotheticalSets: number | null;
  foodSuKemQuantity: number | null;
  foodProfitQuote: number;
  foodRevenueMinusListedCosts: number;
  foodProfitGap: number;
  craftProfitQuote: number;
  craftRevenueMinusWorkshopCosts: number;
  craftProfitGap: number;
}

export const FINANCE_OVERVIEW: FinanceOverview = {
  plannedExpenseTotal: 5470000,
  craftPlannedRevenue: 2200000,
  foodPlannedRevenueAssumption: {
    value: 4950000,
    unit: 'đ',
    kind: 'planned',
    verification: 'unverified',
    sourceRef: 'proposal-final:page-29',
    updatedAt: null,
    publicApproval: 'pending',
  },
  foodPlannedRevenue: 4950000,
  foodHypotheticalSets: 50,
  foodSuKemQuantity: 50,
  plannedRevenueScenario: 7150000,
  unfundedProjectedBalance: 1680000,
  actualStatusNotice: 'Chưa có số liệu thực tế được xác nhận.',
  actualCashBalance: null,
  actualInKindLedger: null,
  disclaimer:
    'Các con số trên thuộc dự toán ban đầu trong đề xuất dự án Final (tháng 10/2026). Doanh thu cơ sở tính trên giả định bán đủ 30 bộ chuồn chuồn tre, 100 móc khóa, 50 set đồ ăn và 50 hộp bánh su kem. Ba combo món ăn trong đề xuất chưa tính vào kịch bản cơ sở do cần đối chiếu số lượng nguyên liệu bổ sung hay thay thế. Báo cáo sau đối soát, biên tập và được phép công bố sẽ được cập nhật sau khi hoàn thành.',
  foodProfitQuote: 2070000,
  foodRevenueMinusListedCosts: 2470000,
  foodProfitGap: 400000,
  craftProfitQuote: 740000,
  craftRevenueMinusWorkshopCosts: 340000,
  craftProfitGap: 400000,
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
    role: 'Điều phối & Trưởng dự án',
    scope:
      'Lên lịch trình, tổ chức họp tuần, theo dõi tiến độ tổng thể, làm việc cùng giảng viên và điều phối hoạt động chung của nhóm.',
    note: 'Mô tả nhiệm vụ trong đề xuất học phần (trang 26), không phải chức danh nhân sự công khai.',
  },
  {
    role: 'Tài chính & Thủ quỹ',
    scope:
      'Quản lý sổ thu chi, hóa đơn chứng từ, đối soát cuối mỗi ca bán hàng gây quỹ, lập báo cáo công khai và mua quà theo đúng danh mục nhu cầu.',
    note: 'Thực hiện cơ chế đối soát độc lập theo kế hoạch đề xuất (trang 26).',
  },
  {
    role: 'Hậu cần & Vận hành ẩm thực',
    scope:
      'Quản lý đơn đặt hàng, kiểm đếm tồn kho, chuẩn bị chế biến ẩm thực an toàn, vận chuyển vật tư và dựng quầy gây quỹ.',
    note: 'Bảo đảm an toàn vệ sinh thực phẩm và quản lý nguyên liệu chặt chẽ (trang 26).',
  },
  {
    role: 'Nội dung & Thiết kế truyền thông',
    scope:
      'Phụ trách thiết kế slide, poster, infographic, lịch đăng bài, báo cáo số liệu truyền thông và lưu trữ hình ảnh tư liệu có nguồn, ngày giờ.',
    note: 'Tuân thủ nguyên tắc bản quyền và bảo vệ quyền riêng tư (trang 26).',
  },
  {
    role: 'Đối ngoại & Phối hợp Mái ấm',
    scope:
      'Đầu mối liên hệ đại diện Mái ấm và nhà tài trợ; làm việc về địa điểm, duyệt bài hát/trò chơi và danh mục quà tặng thiết yếu.',
    note: 'Mọi hoạt động tại cơ sở phụ thuộc vào sự đồng ý của Mái ấm (trang 26).',
  },
];

export const PRODUCT_FAQS: ProductFaq[] = [
  {
    question: 'Giá ghi trên website có phải là giá bán chính thức không?',
    answer:
      'Các mức giá (40.000đ/bộ chuồn chuồn tre, 10.000đ/chiếc móc khóa, thực đơn đồ ăn 20.000đ–79.000đ) là giá tham khảo trong đề xuất Final (trang 29, 30). Giá bán chính thức và số lượng phát hành sẽ được thông báo khi kế hoạch mở bán được phê duyệt.',
  },
  {
    question: 'Sản phẩm gây quỹ do ai làm và hoàn thiện?',
    answer:
      'Nhóm sinh viên Lăng Kính chịu trách nhiệm chuẩn bị và hoàn thiện mẫu theo kế hoạch. Chuồn chuồn tre sử dụng phôi tre mộc (chuẩn bị 50 phôi, trong đó 30 bộ bán và 20 chiếc để lại Mái ấm làm quà); móc khóa in tranh chỉ khi có sự đồng ý hợp lệ; nhóm chịu trách nhiệm hàng bán, không giao sản lượng cho các em nhỏ. Hoạt động tô tượng là vui chơi trải nghiệm tại chỗ, sản phẩm để lại Mái ấm.',
  },
  {
    question: 'Kế hoạch gây quỹ qua đồ ăn được tính toán như thế nào?',
    answer:
      'Kế hoạch ẩm thực cơ sở gồm 50 set đồ ăn (79.000đ/set) và 50 hộp bánh su kem (20.000đ/hộp) với tổng doanh thu dự kiến 4.950.000đ, đã làm rõ cơ cấu so với dự toán cũ. Ba combo món ăn (60 suất/món theo đề xuất) chưa tính vào doanh thu cơ sở do cần đối chiếu số lượng nguyên liệu bổ sung hay thay thế (nguyên liệu nem chỉ đủ cho 50 set × 6 nem). Kế hoạch chỉ triển khai khi có địa điểm, người phụ trách và quy trình an toàn thực phẩm; hiện tại website chưa mở bán.',
  },
  {
    question: 'Khi nào mở bán và có thể đặt mua qua kênh nào?',
    answer:
      'Hiện tại trạng thái mở bán chưa được xác nhận. Bản xem trước nhằm lấy ý kiến đóng góp cho đề xuất dự án. Kênh tiếp nhận chính thức sẽ được công bố sau khi các điều kiện an toàn và phê duyệt hoàn tất.',
  },
  {
    question: 'Doanh thu từ các sản phẩm được sử dụng như thế nào?',
    answer:
      'Nguồn thu dự kiến trước hết trang trải chi phí nguyên liệu và vận hành (dự toán 24 khoản chi). Toàn bộ số dư tiền thực tế (nếu có sau đối soát đầy đủ) dự kiến dùng mua quà tặng và hiện vật thiết yếu bàn giao cho Mái ấm theo danh mục nhu cầu xác nhận.',
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
  // Nhóm 1: Nguyên liệu gây quỹ — trang 29 (14 khoản, Tổng 2.480.000đ)
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
      sourceRef: 'proposal-final:page-29',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Theo dự toán nguyên liệu ẩm thực (trang 29)',
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
      sourceRef: 'proposal-final:page-29',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Quy cách đơn vị cần xác nhận (trang 29)',
    isEstimated: false,
  },
  {
    id: 'hop-dung-thuc-an',
    category: 'Nguyên liệu gây quỹ',
    title: 'Hộp đựng thức ăn',
    calculationText: '2 túi × 20.000đ/50 chiếc',
    amount: {
      value: 40000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-29',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Bao bì đựng thức ăn hợp vệ sinh (trang 29)',
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
      sourceRef: 'proposal-final:page-29',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Xiên que phục vụ món ăn (trang 29)',
    isEstimated: false,
  },
  {
    id: 'pho-mai',
    category: 'Nguyên liệu gây quỹ',
    title: 'Phô mai',
    calculationText: '1 kg × 140.000đ',
    amount: {
      value: 140000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-29',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Nguyên liệu làm nem phô mai (trang 29)',
    isEstimated: false,
  },
  {
    id: 'khoai-tay',
    category: 'Nguyên liệu gây quỹ',
    title: 'Khoai tây',
    calculationText: '3 kg × 25.000đ',
    amount: {
      value: 75000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-29',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Hồ sơ ghi 3kg/3 đợt; đối chiếu cách chia đợt (trang 29)',
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
      sourceRef: 'proposal-final:page-29',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Quy cách đơn vị cần xác nhận (trang 29)',
    isEstimated: false,
  },
  {
    id: 'nuoc-uong',
    category: 'Nguyên liệu gây quỹ',
    title: 'Nước uống tặng thêm',
    calculationText: '50 × 4.000đ',
    amount: {
      value: 200000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-29',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Nước uống tặng thêm kèm phần ăn theo đề xuất (trang 29)',
    isEstimated: false,
  },
  {
    id: 'banh-su-kem',
    category: 'Nguyên liệu gây quỹ',
    title: 'Bánh su kem',
    calculationText: '50 hộp × 8.000đ',
    amount: {
      value: 400000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-29',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Khoản này đã nằm trong tổng nguyên liệu; không trừ hai lần (trang 29)',
    isEstimated: false,
  },
  {
    id: 'dua-chuot',
    category: 'Nguyên liệu gây quỹ',
    title: 'Dưa chuột',
    calculationText: '3 kg × 20.000đ',
    amount: {
      value: 60000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-29',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Hồ sơ ghi 3kg/3 đợt (trang 29)',
    isEstimated: false,
  },
  {
    id: 'tui-nilon-thuong',
    category: 'Nguyên liệu gây quỹ',
    title: 'Túi nilon thường',
    calculationText: '2 kg × 30.000đ',
    amount: {
      value: 60000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-29',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Bao bì túi nilon thường (trang 29)',
    isEstimated: false,
  },
  {
    id: 'tui-nilon-chu-t',
    category: 'Nguyên liệu gây quỹ',
    title: 'Túi nilon chữ T',
    calculationText: '2 kg × 20.000đ',
    amount: {
      value: 40000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-29',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Bao bì túi nilon chữ T (trang 29)',
    isEstimated: false,
  },
  {
    id: 'coc-nhua',
    category: 'Nguyên liệu gây quỹ',
    title: 'Cốc nhựa',
    calculationText: '1 túi × 15.000đ/50 chiếc',
    amount: {
      value: 15000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-29',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Cốc nhựa phục vụ nước uống (trang 29)',
    isEstimated: false,
  },
  {
    id: 'vo-bo-pia',
    category: 'Nguyên liệu gây quỹ',
    title: 'Vỏ bò pía',
    calculationText: '3 tệp × 20.000đ',
    amount: {
      value: 60000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-29',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Vỏ bò pía cuốn nem rán (trang 29)',
    isEstimated: false,
  },

  // Nhóm 2: Vật tư workshop & quà tặng — trang 30 (7 khoản, Tổng 1.860.000đ)
  {
    id: 'chuon-chuon-tre',
    category: 'Vật tư workshop & quà tặng',
    title: 'Chuồn chuồn tre 12 cm',
    calculationText: '50 × 10.000đ',
    amount: {
      value: 500000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-30',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: '30 dành bán, 20 để lại Mái ấm theo lựa chọn và sắp xếp của cơ sở (trang 30)',
    isEstimated: false,
  },
  {
    id: 'chan-de',
    category: 'Vật tư workshop & quà tặng',
    title: 'Chân đế chuồn chuồn',
    calculationText: '50 × 10.000đ',
    amount: {
      value: 500000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-30',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: '30 bộ dành bán với giá tham khảo 40.000đ/bộ (trang 30)',
    isEstimated: false,
  },
  {
    id: 'tuong-to',
    category: 'Vật tư workshop & quà tặng',
    title: 'Tượng tô loại 10 cm',
    calculationText: '20 × 4.000đ',
    amount: {
      value: 80000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-30',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Hoạt động chơi tại chỗ, không phải hàng gây quỹ (trang 30)',
    isEstimated: false,
  },
  {
    id: 'bong',
    category: 'Vật tư workshop & quà tặng',
    title: 'Bóng',
    calculationText: '2 × 10.000đ',
    amount: {
      value: 20000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-30',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Dụng cụ trò chơi tương tác (trang 30)',
    isEstimated: false,
  },
  {
    id: 'mau-ve',
    category: 'Vật tư workshop & quà tặng',
    title: 'Màu vẽ (6 màu cơ bản)',
    calculationText: '6 × 20.000đ',
    amount: {
      value: 120000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-30',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Vẽ tranh, trang trí chuồn chuồn, tô tượng (trang 30)',
    isEstimated: false,
  },
  {
    id: 'moc-khoa',
    category: 'Vật tư workshop & quà tặng',
    title: 'Móc khóa',
    calculationText: '100 × 3.000đ',
    amount: {
      value: 300000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-30',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Nhóm hoàn thiện; dùng tranh chỉ khi có quyền và đồng ý phù hợp (trang 30)',
    isEstimated: false,
  },
  {
    id: 'banh-keo',
    category: 'Vật tư workshop & quà tặng',
    title: 'Bánh, kẹo',
    calculationText: '17 × 20.000đ',
    amount: {
      value: 340000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-30',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Dự toán quà theo đề xuất, không phải đã mua/trao; không dùng quà để tạo áp lực tham gia (trang 30)',
    isEstimated: false,
  },

  // Nhóm 3: Truyền thông & Di chuyển — trang 31 (3 khoản, Tổng 1.130.000đ)
  {
    id: 'truyen-thong-offline',
    category: 'Truyền thông & Di chuyển',
    title: 'Truyền thông offline',
    calculationText: '2 × 30.000đ',
    amount: {
      value: 60000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-31',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Hồ sơ ghi bộ standee đã mượn, khoản này cho đồ tặng; chờ đối soát thực tế (trang 31)',
    isEstimated: false,
  },
  {
    id: 'di-chuyen-buoi-1',
    category: 'Truyền thông & Di chuyển',
    title: 'Di chuyển buổi 1 – thuê xe',
    calculationText: '1 × 750.000đ',
    amount: {
      value: 750000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-31',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Kế hoạch có tình nguyện viên tham dự, chưa phải booking (trang 31)',
    isEstimated: false,
  },
  {
    id: 'di-chuyen-buoi-2',
    category: 'Truyền thông & Di chuyển',
    title: 'Di chuyển buổi 2 – xe máy',
    calculationText: '4 × 80.000đ',
    amount: {
      value: 320000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-31',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: 'Nội bộ nhóm di chuyển xe máy, dự toán (trang 31)',
    isEstimated: false,
  },
];

export interface FinanceScenario {
  id: string;
  title: string;
  description: string;
  inKindReplacement: QuantitativeFact;
  note: string;
  allocationPending?: boolean;
}

export const FINANCE_SCENARIOS: FinanceScenario[] = [
  {
    id: 'chua-tinh-tai-tro',
    title: 'Kịch bản cơ sở (chưa tính tài trợ)',
    description:
      'Không có hiện vật thay chi; chi tiền theo toàn bộ dự toán 5.470.000đ. Doanh thu kịch bản cơ sở (thủ công 2.200.000đ + đồ ăn 4.950.000đ) đạt 7.150.000đ; số dư giả định trước quà là +1.680.000đ.',
    inKindReplacement: {
      value: 0,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-32',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: '0đ (tham số kịch bản cơ sở, chưa tính tài trợ)',
    allocationPending: false,
  },
  {
    id: 'tai-tro-qua-tang-500k',
    title: 'Tài trợ hiện vật quà tặng (500.000đ)',
    description:
      'Giả định nhận tài trợ 500.000đ hiện vật quà tặng thay chi tiền. Chi tiền còn lại là 4.970.000đ; số dư giả định là +2.180.000đ. Lưu ý: Danh mục chi chỉ có bánh kẹo (340k) + quà tặng (60k) = 400k, còn 100k chưa có hạng mục thay thế cụ thể.',
    inKindReplacement: {
      value: 500000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-32',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: '500.000đ hiện vật thay chi (cần xác nhận hạng mục; chưa có cam kết)',
    allocationPending: true,
  },
  {
    id: 'tai-tro-nguyen-lieu-do-an',
    title: 'Tài trợ nguyên liệu ẩm thực (2.480.000đ)',
    description:
      'Giả định toàn bộ 14 khoản nguyên liệu gây quỹ (2.480.000đ) được tài trợ hiện vật thay chi tiền. Chi tiền còn lại là 2.990.000đ; số dư giả định là +4.160.000đ.',
    inKindReplacement: {
      value: 2480000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-32',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: '2.480.000đ hiện vật thay chi (chưa có cam kết)',
    allocationPending: false,
  },
  {
    id: 'tai-tro-vat-tu-workshop',
    title: 'Tài trợ vật tư workshop & quà tặng (1.860.000đ)',
    description:
      'Giả định toàn bộ 7 khoản vật tư workshop và quà tặng (1.860.000đ) được tài trợ hiện vật. Chi tiền còn lại là 3.610.000đ; số dư giả định là +3.540.000đ.',
    inKindReplacement: {
      value: 1860000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-32',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: '1.860.000đ hiện vật thay chi (chưa có cam kết)',
    allocationPending: false,
  },
  {
    id: 'tai-tro-truyen-thong-di-chuyen',
    title: 'Tài trợ truyền thông & di chuyển (1.130.000đ)',
    description:
      'Giả định toàn bộ 3 khoản truyền thông và di chuyển (1.130.000đ) được tài trợ thay chi tiền. Chi tiền còn lại là 4.340.000đ; số dư giả định là +2.810.000đ.',
    inKindReplacement: {
      value: 1130000,
      unit: 'đ',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: 'proposal-final:page-32',
      updatedAt: null,
      publicApproval: 'pending',
    },
    note: '1.130.000đ tài trợ thay chi (chưa có cam kết)',
    allocationPending: false,
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
      'Việc đến thăm và tham gia buổi chơi tại Mái ấm phụ thuộc hoàn toàn vào sự chấp thuận của ban quản lý cơ sở và danh sách nhân sự được phê duyệt trước. Nhóm không tổ chức tuyển người tham gia tự do đến Mái ấm; điều kiện an toàn, sự đồng thuận của cơ sở và việc bảo vệ quyền riêng tư cho các em nhỏ quyết định việc tham dự.',
  },
  {
    question: 'Các em nhỏ tại Mái ấm có bắt buộc phải tham gia tất cả các góc hoạt động không?',
    answer:
      'Không. Nguyên tắc hàng đầu của buổi chơi là tôn trọng quyền lựa chọn của từng em. Các em có thể tự do tham gia vẽ tranh, trang trí chuồn chuồn tre, tô tượng, hát cùng nhau, chơi trò chơi nhẹ, hoặc chỉ ngồi quan sát và nghỉ ngơi mà không làm ảnh hưởng đến bất kỳ chỉ tiêu nào.',
  },
  {
    question: 'Các khoản đóng góp tiền mặt và hiện vật được quản lý như thế nào?',
    answer:
      'Theo đề xuất, nhóm dự kiến quản lý tiền mặt và hiện vật trong hai sổ theo dõi riêng biệt, không gộp chung khi triển khai. Mọi khoản thu chi bằng tiền theo kế hoạch dự kiến được hai thành viên đối soát độc lập và lưu trữ chứng từ khi thực hiện. Nhóm không tuyên bố 100% doanh thu là tiền ủng hộ hay nhận tiền/đơn khi chưa có kênh liên hệ và phê duyệt chính thức. Các gói tài trợ logo trong hồ sơ đề xuất (trang 15) chưa được xem là quyền lợi đã cam kết chính thức.',
  },
  {
    question: 'Nguyên tắc vận động nguồn lực của nhóm tuân thủ những quy định nào?',
    answer:
      'Theo đề xuất học phần (trang 15), nguồn lực dự kiến chỉ huy động từ các nguồn bên ngoài được phê duyệt hợp lệ. Thành viên nhóm không tạm ứng tiền cá nhân, không vận động từ gia đình, người thân, cán bộ nhân viên hay giảng viên FPT. Các gói tài trợ gắn logo trong hồ sơ đề xuất đang chờ phê duyệt và chưa phải cam kết quyền lợi chính thức.',
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
      'Dự toán chi phí kế hoạch gồm 24 khoản mục theo đề xuất Final (trang 29–31) với tổng kinh phí 5.470.000đ qua 3 nhóm: Nguyên liệu gây quỹ (14 khoản, 2.480.000đ), Vật tư workshop & quà tặng (7 khoản, 1.860.000đ), Truyền thông & di chuyển (3 khoản, 1.130.000đ). Doanh thu cơ sở bán đủ hàng đạt 7.150.000đ (thủ công 2.200.000đ + đồ ăn 4.950.000đ), cho số dư dự kiến trước quà là 1.680.000đ. Toàn bộ là mô phỏng kế hoạch trong đề xuất, không phải số liệu thực tế.',
  },
  {
    question: 'Doanh thu từ sản phẩm có phải 100% dành mua quà cho các em không?',
    answer:
      'Không. Nguồn thu bán sản phẩm trước hết nhằm trang trải chi phí nguyên vật liệu và tổ chức buổi chơi. Số dư tiền thực tế (nếu có sau khi đối soát tất cả các khoản chi) dự kiến sẽ được dùng để hỗ trợ hiện vật đúng theo danh mục nhu cầu của Mái ấm.',
  },
  {
    question: 'Số dư tiền thực tế và quỹ khả dụng được tính toán theo nguyên tắc nào?',
    answer:
      'Quỹ khả dụng trước mua quà = Thu tiền thực tế − Chi tiền đã trả − Chi tiền còn phải trả − Tiền khách đã trả cho các đơn chưa hoàn tất. Số dư sau bàn giao = Thu tiền thực tế − Toàn bộ chi phí thực tế (gồm cả quà tặng) − Nghĩa vụ tài chính còn lại. Hàng tồn kho và hiện vật tài trợ được theo dõi trong sổ riêng biệt, không coi hàng tồn hay đơn chưa thanh toán là tiền thực nhận.',
  },
  {
    question: 'Các kịch bản tài trợ hiện vật được hiểu như thế nào?',
    answer:
      'Tài trợ hiện vật thay chi tiền chỉ làm giảm chi phí tiền mặt còn lại, không cộng vào doanh thu tiền. Đề xuất nêu các giả định tài trợ từng nhóm chi phí (500k quà tặng, 2.480k đồ ăn, 1.860k workshop, 1.130k di chuyển); các kịch bản này độc lập và chưa có cam kết tài trợ thực tế. Riêng kịch bản 500k quà tặng cần đối chiếu vì danh mục chi chỉ có 400k (340k bánh kẹo + 60k quà truyền thông).',
  },
  {
    question: 'Khi nào báo cáo tài chính và chứng từ thực tế được công bố?',
    answer:
      'Sau khi chiến dịch kết thúc, hai thành viên tài chính sẽ đối soát độc lập toàn bộ hóa đơn, chứng từ. Nhóm sẽ biên tập che thông tin cá nhân nhạy cảm và công bố báo cáo công khai tại trang này sau khi được phê duyệt.',
  },
];
