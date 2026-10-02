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
    name: 'Túi bút vải',
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
    name: 'Túi vải canvas',
    description: 'Túi vải canvas diện tích chứa rộng rãi cho sách vở và đồ dùng.',
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
    description: 'Đăng ký quan tâm các sản phẩm thủ công gây quỹ khi mẫu, giá và lịch giao được công bố chính thức.',
    statusText: 'Trạng thái mở bán chưa được xác nhận; bản xem trước chưa nhận đơn/tiền',
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
