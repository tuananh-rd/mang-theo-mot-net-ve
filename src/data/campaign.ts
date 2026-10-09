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
    'Bảy sinh viên Đại học FPT Hà Nội sẽ tổ chức một buổi vui chơi sáng tạo cho các em tại Mái ấm Thánh Tâm Xuy Xá, và gây quỹ để tặng những vật phẩm Mái ấm đang cần.',
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
      title: 'Xác nhận và chuẩn bị',
      description:
        'Thống nhất với Mái ấm về lịch, hoạt động, vật liệu và danh mục quà; chuẩn bị đạo cụ an toàn.',
    },
    {
      step: '02',
      title: 'Gây quỹ',
      description:
        'Nhận ủng hộ trực tuyến và bán quà lưu niệm thủ công; mọi khoản được ghi sổ và công khai.',
    },
    {
      step: '03',
      title: 'Buổi chơi tại Mái ấm',
      description:
        'Khoảng 180 phút với bốn góc hoạt động và hai lần nghỉ; có thể rút ngắn theo ý Mái ấm.',
    },
    {
      step: '04',
      title: 'Đối soát và trao quà',
      description:
        'Chốt quỹ, mua vật phẩm theo danh mục Mái ấm xác nhận, trao tặng và công bố kết quả.',
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

export interface TeamArea {
  title: string;
  members: number;
  description: string;
}

export interface ProductFaq {
  question: string;
  answer: string;
}

export const TEAM_PRINCIPLES: TeamPrinciple[] = [
  {
    title: 'Các em được chọn',
    description: 'Chơi, đổi hoạt động, ngồi xem hay nghỉ đều được tôn trọng. Không có chỉ tiêu sản phẩm nào cho các em.',
  },
  {
    title: 'An toàn trước hết',
    description: 'Vật liệu được kiểm tra trước; trò chơi vừa sức; mọi hoạt động tại Mái ấm đều được Mái ấm duyệt.',
  },
  {
    title: 'Nhóm tự làm hàng gây quỹ',
    description: 'Sản phẩm bán do nhóm chuẩn bị và hoàn thiện; đồ các em làm trong buổi chơi được giữ lại cho các em.',
  },
  {
    title: 'Minh bạch từng khoản',
    description: 'Hai thành viên đối soát thu chi; tiền và hiện vật ghi riêng; kết quả công khai sau dự án.',
  },
  {
    title: 'Giữ riêng tư cho các em',
    description: 'Không dùng hoàn cảnh hay hình ảnh của các em để bán hàng; chỉ đăng ảnh khi được Mái ấm cho phép.',
  },
];

/** Năm mảng việc, gom từ bảng phân công 7 vai trò trong hồ sơ dự án. Không hiển thị tên khi chưa có đồng ý. */
export const TEAM_AREAS: TeamArea[] = [
  { title: 'Điều phối', members: 1, description: 'Lên lịch, theo dõi tiến độ và kết nối các mảng việc của nhóm.' },
  { title: 'Tài chính', members: 1, description: 'Giữ sổ thu chi, hóa đơn, đối soát sau mỗi đợt bán và mua quà theo danh mục.' },
  { title: 'Hậu cần và chương trình', members: 2, description: 'Chuẩn bị vật tư, đạo cụ, quầy quà lưu niệm và di chuyển cho buổi chơi.' },
  { title: 'Nội dung và truyền thông', members: 2, description: 'Thiết kế ấn phẩm, viết bài và lưu trữ hình ảnh đúng phạm vi cho phép.' },
  { title: 'Đối ngoại', members: 1, description: 'Làm việc với Mái ấm và các đơn vị hỗ trợ.' },
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

/** Thực hành an toàn chính (rút gọn từ kế hoạch và danh mục kiểm tra trước buổi chơi). */
export const SAFETY_PRACTICES: string[] = [
  'Chuồn chuồn mài nhẵn, màu gốc nước, tượng không cạnh nhọn.',
  'Chia nhóm nhỏ theo lượt, luôn có góc nghỉ.',
  'Trò chơi vận động nhẹ, có thể chơi khi ngồi, không loại người chơi.',
  'Chỉ ghi hình trong phạm vi Mái ấm cho phép.',
];

export interface PlayPhase {
  title: string;
  description: string;
}

/** Diễn tiến buổi chơi, rút gọn từ agenda dự kiến 180 phút. */
export const PLAY_FLOW: PlayPhase[] = [
  { title: 'Làm quen', description: 'Đón các em, giới thiệu vật mẫu, hát mở đầu và hướng dẫn chọn hoạt động.' },
  { title: 'Sáng tạo và vận động', description: 'Hai lượt ở bàn chuồn chuồn và tô tượng, xen bowling và chuyền bóng, có hai lần nghỉ.' },
  { title: 'Giao lưu', description: 'Hát, trò chuyện, chia sẻ tranh; các em giữ lại những gì mình đã làm.' },
];

/** Kế hoạch bán quà lưu niệm, viết cho người mua. Website chưa mở nhận đơn. */
export const SALES_PLAN: string[] = [
  'Nhóm mở đặt trước, sau đó bán trực tiếp tại quầy ở FPT Hòa Lạc khi được cho phép.',
  'Mẫu, giá chính thức và lịch nhận hàng sẽ được công bố tại trang này khi mở bán.',
  'Tiền bán quà được ghi sổ cùng các khoản ủng hộ và công khai sau dự án.',
];

/** Nguyên tắc tiếp nhận hỗ trợ. */
export const SUPPORT_RULES: string[] = [
  'Chỉ nhận hỗ trợ theo danh mục đã thống nhất với Mái ấm.',
  'Tiền và hiện vật ghi sổ riêng; hiện vật không quy thành tiền.',
  'Thu chi, hóa đơn và biên bản bàn giao được công khai sau dự án.',
];

export const PRODUCT_FAQS: ProductFaq[] = [
  {
    question: 'Giá trên trang có phải giá bán chính thức?',
    answer: 'Chưa. Đây là giá tham khảo trong kế hoạch. Giá, mẫu và số lượng chính thức sẽ được công bố khi mở bán.',
  },
  {
    question: 'Ai làm các sản phẩm này?',
    answer:
      'Nhóm Lăng Kính chuẩn bị và hoàn thiện toàn bộ hàng bán. Các em ở Mái ấm không phải làm hàng; tranh của các em chỉ được in lên móc khóa khi có sự đồng ý phù hợp.',
  },
  {
    question: 'Khi nào có thể đặt mua?',
    answer: 'Khi kế hoạch bán được duyệt, nhóm sẽ công bố cách đặt hàng tại trang này. Hiện website chưa nhận đơn hay tiền.',
  },
  {
    question: 'Tiền bán hàng được dùng thế nào?',
    answer:
      'Trước hết bù chi phí nguyên liệu và tổ chức. Phần còn lại dùng mua vật phẩm theo danh mục Mái ấm xác nhận, có hóa đơn và biên bản bàn giao.',
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
    note: '',
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
    note: '',
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
    note: '',
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
    note: '',
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
    note: '',
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
    note: '',
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
    note: '',
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
    note: '',
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
    note: '',
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
    note: '',
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
    note: '',
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
      'Trao đổi với Mái ấm để xác định đúng những vật phẩm còn thiếu cho sinh hoạt hằng ngày.',
  },
  {
    step: '02',
    title: 'Thống nhất cách bàn giao',
    description:
      'Thống nhất số lượng, quy cách, thời gian và địa điểm tiếp nhận vật phẩm đảm bảo thuận tiện và an toàn cho các bên.',
  },
  {
    step: '03',
    title: 'Ghi nhận và công khai',
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
    question: 'Làm sao để tên tôi xuất hiện trong bảng sao kê?',
    answer:
      'Ghi nội dung chuyển khoản theo hướng dẫn kèm tên bạn muốn hiển thị. Nếu muốn ẩn danh, ghi “Ẩn danh”. Nhóm chỉ hiển thị tên, số tiền, ngày và mã giao dịch rút gọn, không hiển thị số tài khoản của bạn.',
  },
  {
    question: 'Bao lâu thì khoản ủng hộ được cập nhật?',
    answer: 'Sau mỗi lần hai thành viên tài chính đối chiếu với sao kê ngân hàng. Ngày cập nhật gần nhất luôn ghi ở đầu bảng.',
  },
  {
    question: 'Tiền ủng hộ được dùng vào việc gì?',
    answer:
      'Cho vật tư buổi chơi, quà và di chuyển theo kế hoạch; phần còn lại mua vật phẩm theo danh mục Mái ấm xác nhận. Hóa đơn và biên bản bàn giao được công khai ở trang Minh bạch.',
  },
  {
    question: 'Tôi có thể cùng đến Mái ấm không?',
    answer: 'Chỉ khi Mái ấm đồng ý trước. Nhóm không tuyển người tự do đến Mái ấm, để bảo đảm an toàn và riêng tư cho các em.',
  },
];

export interface TransparencyFaq {
  question: string;
  answer: string;
}

export const TRANSPARENCY_FAQS: TransparencyFaq[] = [
  {
    question: 'Tôi kiểm tra khoản ủng hộ của mình ở đâu?',
    answer: 'Trong bảng sao kê ở trang Ủng hộ. Mỗi dòng có ngày, tên hiển thị, số tiền và mã giao dịch rút gọn để bạn đối chiếu với lịch sử chuyển khoản.',
  },
  {
    question: 'Nếu tiền ủng hộ dư hoặc thiếu so với kế hoạch?',
    answer:
      'Nhóm chỉ chi trong số tiền thực có, không ai ứng tiền cá nhân. Phần dư sau chi phí được dùng mua thêm vật phẩm theo danh mục Mái ấm xác nhận và ghi rõ trong báo cáo cuối.',
  },
  {
    question: 'Khi nào có báo cáo cuối?',
    answer: 'Sau buổi trao quà và khi hai thành viên tài chính đối soát xong. Hóa đơn, chứng từ chỉ công bố bản đã che thông tin riêng tư.',
  },
];


/* ------------------------------------------------------------------
 * Ủng hộ trực tuyến (C07 vòng 3).
 * Chỉ bật khi nhóm điền thông tin tài khoản thật và đặt ảnh QR vào public/.
 * Không tự tạo tài khoản, QR hay người ủng hộ. Mọi dòng sao kê phải đối chiếu
 * với sao kê ngân hàng trước khi thêm vào DONATIONS.
 * ------------------------------------------------------------------ */

export interface DonationAccount {
  /** 'active' chỉ khi đã có đủ thông tin thật và nhóm đồng ý công bố */
  status: 'pending' | 'active';
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
  /** Đường dẫn ảnh QR trong public/, ví dụ '/images/ung-ho/qr.png' */
  qrImage: string | null;
  /** Tiền tố nội dung chuyển khoản để nhận diện khoản ủng hộ dự án */
  transferPrefix: string;
  /** Ngày đối soát sao kê gần nhất, dạng YYYY-MM-DD */
  ledgerUpdatedAt: string | null;
}

export const DONATION_ACCOUNT: DonationAccount = {
  status: 'pending',
  bankName: null,
  accountNumber: null,
  accountHolder: null,
  qrImage: null,
  transferPrefix: 'MTMNV',
  ledgerUpdatedAt: null,
};

export interface DonationEntry {
  /** Ngày nhận theo sao kê ngân hàng, dạng YYYY-MM-DD */
  date: string;
  /** Tên người ủng hộ muốn hiển thị, hoặc 'Ẩn danh' */
  donor: string;
  /** Số tiền VND, số nguyên dương */
  amount: number;
  /** Mã giao dịch rút gọn (vài ký tự cuối) để người ủng hộ tự đối chiếu */
  reference: string | null;
}

/** Sao kê ủng hộ đã đối soát. Để trống cho tới khi có giao dịch thật. */
export const DONATIONS: DonationEntry[] = [];
