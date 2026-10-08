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

export interface TeamRole {
  role: string;
  scope: string;
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

/**
 * Bảy vai trò theo bảng nhân sự trong đề xuất Final (trang 26).
 * Hồ sơ có danh sách tên; website chỉ hiển thị vai trò cho tới khi từng thành viên đồng ý công bố tên/ảnh.
 */
export const TEAM_ROLES: TeamRole[] = [
  {
    role: 'Trưởng dự án',
    scope: 'Lịch, họp tuần, theo dõi tiến độ, làm việc với giảng viên và điều phối hoạt động nhóm.',
  },
  {
    role: 'Tài chính, thủ quỹ',
    scope: 'Sổ thu chi, hóa đơn, đối soát cuối mỗi ca, báo cáo công khai và mua quà theo danh mục.',
  },
  {
    role: 'Hậu cần, phụ trách chương trình',
    scope: 'Đơn đặt hàng, tồn kho, chế biến, vận chuyển, dựng quầy và an toàn thực phẩm.',
  },
  {
    role: 'Hậu cần, bán hàng gây quỹ',
    scope: 'Đơn đặt hàng, tồn kho, chế biến, vận chuyển, dựng quầy và an toàn thực phẩm.',
  },
  {
    role: 'Thiết kế, nội dung',
    scope: 'Slide, poster, infographic; lưu ảnh và video kèm nguồn, ngày giờ.',
  },
  {
    role: 'Truyền thông, nội dung',
    scope: 'Lịch đăng bài, viết bài, báo cáo số liệu truyền thông và duyệt hình ảnh.',
  },
  {
    role: 'Đối ngoại, thiết kế',
    scope: 'Đầu mối với Mái ấm và nhà hỗ trợ; thiết kế poster, infographic.',
  },
];

export interface PartnerRole {
  partner: string;
  responsibility: string;
}

/** Vai trò phê duyệt/phối hợp ngoài nhóm (trang 26). */
export const PARTNER_ROLES: PartnerRole[] = [
  {
    partner: 'Mái ấm Thánh Tâm',
    responsibility:
      'Duyệt lịch, chỗ chơi, bài hát, người chăm sóc, từng trò chơi và vật liệu, danh mục quà, quyền sử dụng sản phẩm và hình ảnh.',
  },
  {
    partner: 'Giảng viên hướng dẫn',
    responsibility:
      'Duyệt phạm vi đi lại, nguồn quỹ, hình thức minh chứng và mọi thay đổi quan trọng của dự án học phần.',
  },
  {
    partner: 'Nhà cung cấp',
    responsibility: 'Báo giá và mẫu chuồn chuồn 12 cm, chân đế, tượng và móc khóa trước khi nhóm đặt hàng.',
  },
  {
    partner: 'Nhà hỗ trợ bên ngoài',
    responsibility:
      'Ưu tiên hỗ trợ vật tư workshop hoặc di chuyển trước khi nhóm đặt hàng; không dùng danh nghĩa nhà trường để kêu gọi.',
  },
];

export interface ProjectNeed {
  title: string;
  description: string;
}

/** Ba nhu cầu chính nhóm xác định sau trao đổi với Mái ấm (trang 5). */
export const PROJECT_NEEDS: ProjectNeed[] = [
  {
    title: 'Một buổi chơi linh hoạt',
    description: 'Có thời gian nghỉ và nhiều cách tham gia, vì các em ở nhiều độ tuổi và mức hỗ trợ khác nhau.',
  },
  {
    title: 'Mái ấm giữ quyền quyết định',
    description: 'Về số người tham gia, vật liệu, hình ảnh và danh mục hỗ trợ.',
  },
  {
    title: 'Hỗ trợ thiết thực, minh bạch',
    description: 'Chuyển nguồn quỹ thành hiện vật đúng danh mục Mái ấm xác nhận, có chứng từ và biên bản.',
  },
];

/** Thực hành an toàn đề xuất (trang 7, 11, 20 và phụ lục A trang 33). */
export const SAFETY_PRACTICES: string[] = [
  'Chuồn chuồn được kiểm thân, cánh nhẵn, trục chắc; màu gốc nước; tượng không cạnh nhọn.',
  'Chia nhóm nhỏ 5–7 trẻ mỗi lượt, có góc nghỉ; được đổi hoặc dừng hoạt động bất cứ lúc nào.',
  'Bowling bằng bóng mềm, chốt lớn, có thể chơi khi ngồi; chuyền bóng không loại người chơi. Bỏ trò bịt mắt.',
  'Hỏi trước về dị ứng, việc trẻ có thể đưa đồ vào miệng, nơi rửa tay và nơi phơi sản phẩm.',
  'Nếu cơ sở thấy vật liệu hoặc trò chơi chưa phù hợp, nhóm thay bằng giấy, thẻ màu hoặc hoạt động ngồi.',
  'Ghi hình chỉ trong phạm vi Mái ấm cho phép; tách riêng quyền giữ sản phẩm, quyền bán và quyền đăng ảnh.',
];

export interface AgendaItem {
  time: string;
  content: string;
}

/** Agenda dự kiến buổi 1 tại Mái ấm (trang 12–13). Có thể rút ngắn nếu Mái ấm thấy các em mệt. */
export const WORKSHOP_AGENDA: AgendaItem[] = [
  { time: '0–15 phút', content: 'Đón các em, giới thiệu vật mẫu và chỗ nghỉ.' },
  { time: '15–30 phút', content: 'Chào hỏi, hát mở đầu và hướng dẫn chọn hoạt động.' },
  { time: '30–60 phút', content: 'Lượt thủ công 1: trang trí chuồn chuồn và tô tượng tại hai bàn.' },
  { time: '60–75 phút', content: 'Nghỉ lần 1: rửa tay, uống nước theo nếp cơ sở; đổi lượt.' },
  { time: '75–105 phút', content: 'Lượt thủ công 2: đổi bàn hoặc tiếp tục sản phẩm đã chọn.' },
  { time: '105–125 phút', content: 'Bowling theo lượt; các bàn tạm ngừng tô để tập trung hỗ trợ.' },
  { time: '125–140 phút', content: 'Nghỉ lần 2, trò chuyện nhẹ; sắp xếp sản phẩm khô.' },
  { time: '140–155 phút', content: 'Chuyền bóng theo nhạc trong vòng nhỏ, có tín hiệu nhìn thấy.' },
  { time: '155–170 phút', content: 'Giao lưu hát, trò chuyện, trao phần bánh kẹo theo hướng dẫn người chăm sóc.' },
  { time: '170–180 phút', content: 'Kết thúc, bàn giao sản phẩm của các em lại cho Mái ấm, thu dọn.' },
];

export interface EvaluationCriterion {
  title: string;
  method: string;
}

/** Cách đánh giá kết quả dự kiến (trang 22–25). Chưa có dữ liệu thì ghi “chưa đủ cơ sở đánh giá”. */
export const EVALUATION_CRITERIA: EvaluationCriterion[] = [
  {
    title: 'Mỗi em có ít nhất một cách tham gia phù hợp',
    method: 'Đối chiếu danh sách có mặt với lựa chọn đã giới thiệu; em chọn quan sát hoặc nghỉ vẫn được tôn trọng.',
  },
  {
    title: 'Mức độ phù hợp, thoải mái và an toàn',
    method: 'Phiếu của người chăm sóc theo thang 1–5; mục tiêu tối thiểu 80% phiếu hợp lệ ở mức tích cực.',
  },
  {
    title: 'Quà đúng danh mục Mái ấm xác nhận',
    method: 'Đối chiếu vật phẩm bàn giao với danh mục và xác nhận tiếp nhận của đại diện Mái ấm.',
  },
  {
    title: 'Thu chi đầy đủ, có đối soát',
    method: '100% khoản thu chi được ghi nhận và đối chiếu; chênh lệch được làm rõ trong báo cáo.',
  },
];

/** Chỉ tiêu học phần và truyền thông dự kiến (trang 8–9, 14, 24). Không phải thành tích. */
export const COURSE_TARGETS: string[] = [
  'Tối thiểu 8 bài truyền thông về dự án; bài menu hoặc thông báo đơn hàng thống kê riêng.',
  '300 người theo dõi kênh và 200 lượt tương tác trên các bài thuộc danh sách đánh giá.',
  'Lượt tiếp cận: tối thiểu 3.000, phấn đấu 4.000. Đây là tổng lượt, có thể trùng người, không phải số người.',
  'Buổi trải nghiệm thủ công tại campus 45–60 phút cho 25 sinh viên ngoài nhóm, chỉ tổ chức khi được duyệt.',
  'Báo cáo tổng kết, video recap và bộ ảnh được phép sử dụng, hoàn thành không muộn hơn tuần 9.',
];

/** Kế hoạch bán hàng (trang 14). Website chưa mở nhận đơn. */
export const SALES_PLAN: string[] = [
  'Người mua dự kiến là sinh viên tại Hòa Lạc; nhận đơn qua biểu mẫu và quầy ở sảnh Delta khi được phép.',
  'Mở đặt trước từ tuần 6, bán chính tuần 7–8, hoàn tất giao hàng trước buổi trao quà.',
  'Đồ ăn chia hai đợt, tối đa 25 set mỗi đợt, chỉ bán khi đáp ứng điều kiện an toàn thực phẩm và quy định học phần.',
  'Nhóm làm hàng theo đơn và nguồn tiền đã có; không mặc định toàn bộ số lượng sẽ bán hết.',
];

/** Quy tắc vận động và tiếp nhận hỗ trợ (trang 15). */
export const SUPPORT_RULES: string[] = [
  'Không dùng tiền cá nhân của thành viên; không kêu gọi từ gia đình, người thân, cán bộ hay giảng viên trường.',
  'Thống nhất loại hỗ trợ, số lượng, thời điểm và cách ghi nhận trước khi nhận.',
  'Tiền và hiện vật theo dõi riêng; hiện vật chỉ giảm đúng khoản chi nó thay thế, không cộng thành tiền.',
  'Không tính lời hứa tài trợ hoặc tiền mua hàng gây quỹ vào tổng hỗ trợ.',
];

export const PRODUCT_FAQS: ProductFaq[] = [
  {
    question: 'Giá trên website có phải giá bán chính thức không?',
    answer:
      'Chưa. Đây là giá tham khảo trong đề xuất Final (trang 29–31). Giá, mẫu, số lượng phát hành và lịch nhận hàng chỉ được công bố khi kế hoạch mở bán được duyệt.',
  },
  {
    question: 'Ai làm các sản phẩm bán gây quỹ?',
    answer:
      'Nhóm Lăng Kính chuẩn bị và hoàn thiện hàng bán. Các em tại Mái ấm không có chỉ tiêu sản phẩm; đồ các em làm trong buổi chơi, kể cả tượng tô, được để lại cho các em và Mái ấm. Tranh của các em chỉ được in lên móc khóa khi có sự đồng ý phù hợp.',
  },
  {
    question: 'Vì sao ba combo nem không tính vào doanh thu cơ sở?',
    answer:
      'Hồ sơ ghi 60 suất cho mỗi combo nhưng chưa nói rõ là bán thêm hay thay cho 50 set đồ ăn. Lượng nem trong dự toán (300 chiếc) vừa khớp 50 set × 6 nem, nên website chỉ tính 50 set và 50 hộp su kem cho tới khi nhóm xác nhận.',
  },
  {
    question: 'Khi nào có thể đặt mua?',
    answer:
      'Chưa mở bán. Theo kế hoạch, nhóm mở đặt trước từ tuần 6 và bán chính tuần 7–8 của học phần, khi có kênh nhận đơn được duyệt và đáp ứng điều kiện an toàn thực phẩm. Website hiện không nhận đơn hay tiền.',
  },
  {
    question: 'Tiền bán hàng được dùng thế nào?',
    answer:
      'Trước hết bù chi phí nguyên liệu và tổ chức theo dự toán. Phần còn lại sau đối soát dùng mua hiện vật theo danh mục Mái ấm xác nhận, có hóa đơn và biên bản bàn giao.',
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
      'Giả định nhận tài trợ 500.000đ hiện vật quà tặng thay chi tiền. Chi tiền còn lại là 4.970.000đ; số dư giả định là +2.180.000đ. Bảng chi chỉ có bánh kẹo 340.000đ và đồ tặng truyền thông 60.000đ; danh mục thay chi đủ 500.000đ chưa được xác định.',
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
    question: 'Tôi có thể cùng đến Mái ấm tham gia buổi chơi không?',
    answer:
      'Không mặc định. Cộng tác viên chỉ tham gia khi Mái ấm đồng ý và được phổ biến quy tắc trước. Nhóm không tuyển người tự do đến Mái ấm.',
  },
  {
    question: 'Khi nào nhóm bắt đầu nhận hiện vật?',
    answer:
      'Sau khi Mái ấm xác nhận danh mục nhu cầu và nhóm công bố kênh liên hệ chính thức. Như vậy món đồ được gửi đến đúng thứ Mái ấm cần.',
  },
  {
    question: 'Nhà hỗ trợ được ghi nhận như thế nào?',
    answer:
      'Đề xuất có ba mức ghi nhận logo theo tổng hỗ trợ (từ 500.000đ, 1.000.000đ và 2.000.000đ), nhưng chỉ áp dụng khi giảng viên hướng dẫn đồng ý vì hướng dẫn học phần hiện giới hạn logo. Đây chưa phải quyền lợi đã cam kết.',
  },
  {
    question: 'Tiền và hiện vật được quản lý ra sao?',
    answer:
      'Ghi trong hai sổ riêng, có hai thành viên đối soát. Hiện vật chỉ giảm đúng khoản chi nó thay thế và không được cộng vào tiền mặt. Kết quả công bố sau khi đối soát và che thông tin riêng tư.',
  },
];

export interface TransparencyFaq {
  question: string;
  answer: string;
}

export const TRANSPARENCY_FAQS: TransparencyFaq[] = [
  {
    question: 'Có phải toàn bộ doanh thu dùng để mua quà?',
    answer:
      'Không. Doanh thu trước hết bù chi phí nguyên liệu, vật tư và di chuyển. Chỉ phần quỹ còn lại sau đối soát mới dùng mua hiện vật cho Mái ấm. Số 1.680.000đ là kịch bản bán đủ hàng, không phải số tiền chắc chắn có.',
  },
  {
    question: 'Tài trợ hiện vật được tính thế nào?',
    answer:
      'Hiện vật chỉ làm giảm khoản chi mà nó thay thế, không cộng vào doanh thu hay tiền mặt. Các kịch bản tài trợ trong bảng là giả định riêng lẻ, chưa có cam kết nào.',
  },
  {
    question: 'Nếu bán chậm hoặc chưa có tài trợ trước buổi 1 thì sao?',
    answer:
      'Theo đề xuất, nhóm chỉ chi trong số tiền thực có, sản xuất theo đơn đặt trước, giảm vật liệu và xin điều chỉnh. Thành viên không ứng tiền cá nhân.',
  },
  {
    question: 'Khi nào có số liệu thực tế và chứng từ?',
    answer:
      'Sau khi hoạt động kết thúc và hai thành viên tài chính đối soát xong. Báo cáo dự kiến hoàn thành trong tuần 9 của học phần; chứng từ chỉ công bố bản đã che thông tin riêng tư và được phép.',
  },
];
