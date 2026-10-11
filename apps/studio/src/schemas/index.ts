/**
 * Định nghĩa Schema, Trình kiểm thực (Validators) và Dữ liệu hạt giống (Seed Data)
 * cho toàn bộ 8 phân hệ Content Studio trực tuyến (Task C17)
 */

import type { ModuleKey, PublicationSnapshot } from '../types.js';

// ==========================================
// 1. Phân hệ Dự án (Project Narrative)
// ==========================================
export interface ProjectProgressData {
  currentWeek: number;
  totalWeeks: number;
  updatedAt: string;
  currentStageIndex: number;
}

export interface PlannedSessionData {
  id: string;
  title: string;
  date: string;
  time: string;
  weekday: string;
  description: string;
}

export interface OfficialContactPerson {
  name: string;
  role: string;
  phone: string;
  phoneE164: string;
}

export interface OfficialContactData {
  status: string;
  people: OfficialContactPerson[];
  fanpageUrl: string;
  sourceRef: string;
  updatedAt: string;
}

export interface ProjectModuleData {
  slug: string;
  title: string;
  slogan: string;
  summary: string;
  location: string;
  executionStatus: 'unknown' | 'in_progress' | 'completed';
  statusNotice: string;
  previewNotice: string;
  activities: Array<{
    id: string;
    title: string;
    description: string;
    badge: string;
    note?: string;
  }>;
  plannedStages: Array<{
    step: string;
    title: string;
    description: string;
  }>;
  needs: Array<{
    title: string;
    description: string;
  }>;
  safetyPractices: string[];
  progress?: ProjectProgressData;
  plannedSessions?: PlannedSessionData[];
  contacts?: OfficialContactData;
}

export function validateProjectData(data: unknown): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Dữ liệu phân hệ Dự án phải là một đối tượng JSON.'] };
  }
  const p = data as Partial<ProjectModuleData>;
  if (!p.title || typeof p.title !== 'string' || !p.title.trim()) {
    errors.push('Tiêu đề dự án không được để trống.');
  }
  if (!p.summary || typeof p.summary !== 'string' || !p.summary.trim()) {
    errors.push('Tóm tắt dự án không được để trống.');
  }
  if (!['unknown', 'in_progress', 'completed'].includes(p.executionStatus || '')) {
    errors.push('Trạng thái thực hiện (executionStatus) không hợp lệ.');
  }
  if (!Array.isArray(p.activities) || p.activities.length === 0) {
    errors.push('Dự án phải có ít nhất một hoạt động.');
  }
  if (!Array.isArray(p.plannedStages) || p.plannedStages.length === 0) {
    errors.push('Dự án phải có danh sách các giai đoạn triển khai.');
  }
  if (p.progress) {
    if (typeof p.progress.currentWeek !== 'number' || typeof p.progress.totalWeeks !== 'number') {
      errors.push('Tiến độ dự án (progress) phải có currentWeek và totalWeeks dạng số.');
    }
  }
  return { isValid: errors.length === 0, errors };
}

// ==========================================
// 2. Phân hệ Nhật ký (Journal)
// ==========================================
export interface JournalArticle {
  slug: string;
  title: string;
  summary: string;
  category: 'ke-hoach' | 'chuan-bi' | 'hoat-dong' | 'ban-giao';
  categoryLabel?: string;
  publishedAt: string;
  eventDate?: string | null;
  eventStatus?: 'planned' | 'in_progress' | 'completed' | 'cancelled' | null;
  status: 'draft' | 'published';
  coverImage?: {
    src: string;
    alt: string;
    caption: string;
    creditName?: string;
    creditSource?: string;
    creditUrl?: string;
  };
  content: Array<{
    type: 'paragraph' | 'heading' | 'callout' | 'quote' | 'list' | 'image';
    level?: number;
    text?: string;
    items?: string[];
    src?: string;
    alt?: string;
    caption?: string;
    creditName?: string;
    creditSource?: string;
    creditUrl?: string;
  }>;
}

export function validateJournalModuleData(data: unknown): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!Array.isArray(data)) {
    return { isValid: false, errors: ['Dữ liệu nhật ký phải là mảng các bài viết.'] };
  }
  const seenSlugs = new Set<string>();
  data.forEach((article: any, index) => {
    const num = index + 1;
    if (!article.slug || typeof article.slug !== 'string') {
      errors.push(`Bài viết [${num}]: Thiếu slug.`);
    } else if (seenSlugs.has(article.slug)) {
      errors.push(`Bài viết [${num}]: Slug '${article.slug}' bị trùng.`);
    } else {
      seenSlugs.add(article.slug);
    }
    if (!article.title || typeof article.title !== 'string') {
      errors.push(`Bài viết [${num}]: Tiêu đề không được để trống.`);
    }
    if (!article.summary || typeof article.summary !== 'string') {
      errors.push(`Bài viết [${num}]: Tóm tắt không được để trống.`);
    }
    if (!['ke-hoach', 'chuan-bi', 'hoat-dong', 'ban-giao'].includes(article.category)) {
      errors.push(`Bài viết [${num}]: Danh mục '${article.category}' không hợp lệ.`);
    }
    if (!article.publishedAt || !/^\d{4}-\d{2}-\d{2}$/.test(article.publishedAt)) {
      errors.push(`Bài viết [${num}]: Ngày công bố '${article.publishedAt}' không hợp lệ (YYYY-MM-DD).`);
    }
    if (!Array.isArray(article.content) || article.content.length === 0) {
      errors.push(`Bài viết [${num}]: Nội dung phải có ít nhất 1 khối.`);
    }
  });
  return { isValid: errors.length === 0, errors };
}

// ==========================================
// 3. Phân hệ Sản phẩm & Mở bán (Products)
// ==========================================
export interface ProductConfigItem {
  saleStatus: 'unconfirmed' | 'open' | 'closed';
  officialPrice: number | null;
  stockAvailable: number | null;
  salesChannel: string;
  returnPolicy: string | null;
  publicApproval: 'pending' | 'approved';
}

export type ProductsModuleData = Record<string, ProductConfigItem>;

export function validateProductsModuleData(data: unknown): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { isValid: false, errors: ['Dữ liệu sản phẩm phải là một đối tượng JSON.'] };
  }
  const obj = data as Record<string, Partial<ProductConfigItem>>;
  for (const [id, item] of Object.entries(obj)) {
    if (!['unconfirmed', 'open', 'closed'].includes(item.saleStatus || '')) {
      errors.push(`Sản phẩm '${id}': Trạng thái '${item.saleStatus}' không hợp lệ.`);
    }
    if (!['pending', 'approved'].includes(item.publicApproval || '')) {
      errors.push(`Sản phẩm '${id}': Phê duyệt '${item.publicApproval}' không hợp lệ.`);
    }
    if (item.saleStatus === 'open') {
      if (typeof item.officialPrice !== 'number' || item.officialPrice <= 0) {
        errors.push(`Sản phẩm '${id}': Mở bán bắt buộc phải có giá niêm yết > 0.`);
      }
      if (typeof item.stockAvailable !== 'number' || item.stockAvailable < 0) {
        errors.push(`Sản phẩm '${id}': Mở bán bắt buộc phải có số lượng tồn kho >= 0.`);
      }
      if (item.publicApproval !== 'approved') {
        errors.push(`Sản phẩm '${id}': Mở bán bắt buộc phải có publicApproval là 'approved'.`);
      }
    }
  }
  return { isValid: errors.length === 0, errors };
}

// ==========================================
// 4. Phân hệ Tài chính & Minh bạch (Finance)
// ==========================================
export interface DonationEntry {
  date: string;
  amount: number;
  donor: string;
  reference: string | null;
}

export interface DonationAccountData {
  status: 'pending' | 'active';
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
  qrImage: string | null;
  transferPrefix: string;
  goalAmount: number | null;
}

export interface LedgerProcessStep {
  title: string;
  description: string;
}

export interface FinanceModuleData {
  reconciled: boolean;
  reconciledAt: string | null;
  publicApproval: 'pending' | 'approved';
  reconciledBy: string[];
  entries: DonationEntry[];
  overview: {
    plannedExpenseTotal: number;
    craftPlannedRevenue: number;
    foodPlannedRevenue: number;
    plannedRevenueScenario: number;
    unfundedProjectedBalance: number;
    actualStatusNotice: string;
    disclaimer: string;
  };
  donationAccount?: DonationAccountData;
  ledgerProcess?: LedgerProcessStep[];
}

export function validateFinanceModuleData(data: unknown): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Dữ liệu tài chính phải là một đối tượng JSON.'] };
  }
  const f = data as Partial<FinanceModuleData>;
  if (typeof f.reconciled !== 'boolean') {
    errors.push('Trường reconciled phải là boolean.');
  }
  if (f.reconciled) {
    if (!f.reconciledAt || !/^\d{4}-\d{2}-\d{2}$/.test(f.reconciledAt)) {
      errors.push('reconciledAt phải là ngày hợp lệ YYYY-MM-DD khi đã đối soát.');
    }
    if (f.publicApproval !== 'approved') {
      errors.push('publicApproval phải là "approved" khi đã đối soát.');
    }
    if (!Array.isArray(f.reconciledBy) || f.reconciledBy.length === 0) {
      errors.push('reconciledBy phải có ít nhất một người/vai trò đối soát.');
    }
  } else {
    if (f.publicApproval !== 'pending') {
      errors.push('publicApproval phải là "pending" khi chưa đối soát xong.');
    }
    // Ghi chú: Trong bản nháp riêng tư (private draft), entries được phép chứa các giao dịch chuẩn bị / nhập từ CSV trước khi đối soát.
    // Việc lọc rỗng entries khi chưa đối soát sẽ do bộ làm sạch bản chiếu công khai (sanitizeFinanceForPublic) đảm trách.
  }
  if (!Array.isArray(f.entries)) {
    errors.push('entries phải là mảng danh sách giao dịch.');
  } else {
    // Kiểm tra định dạng cơ bản của từng giao dịch trong bản nháp
    for (let i = 0; i < f.entries.length; i++) {
      const e = f.entries[i];
      if (!e || typeof e !== 'object') {
        errors.push(`Giao dịch thứ ${i + 1} phải là một đối tượng.`);
        continue;
      }
      if (!e.date || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) {
        errors.push(`Giao dịch thứ ${i + 1} thiếu ngày hợp lệ YYYY-MM-DD.`);
      }
      if (typeof e.amount !== 'number' || e.amount <= 0 || !Number.isInteger(e.amount)) {
        errors.push(`Giao dịch thứ ${i + 1} số tiền phải là số nguyên dương.`);
      }
    }
  }
  return { isValid: errors.length === 0, errors };
}

// ==========================================
// 5. Phân hệ Nhóm, FAQ & SEO (Team)
// ==========================================
export interface TeamMemberData {
  name: string;
  role: string;
  photo: string;
  description: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface TeamModuleData {
  info: {
    name: string;
    description: string;
    course: string;
    classId: string;
    size: number;
  };
  principles: Array<{
    title: string;
    description: string;
  }>;
  areas: Array<{
    title: string;
    members: number;
    description: string;
  }>;
  members?: TeamMemberData[];
  productFaqs?: FaqItem[];
  supportFaqs?: FaqItem[];
  transparencyFaqs?: FaqItem[];
  faqs?: FaqItem[];
  siteMeta: {
    siteTitle: string;
    siteDescription: string;
    ogImage: string;
  };
}

export function validateTeamModuleData(data: unknown): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Dữ liệu nhóm phải là một đối tượng JSON.'] };
  }
  const t = data as Partial<TeamModuleData>;
  if (!t.info?.name) errors.push('Tên nhóm không được để trống.');
  if (!Array.isArray(t.principles) || t.principles.length === 0) {
    errors.push('Phải có danh sách nguyên tắc hoạt động.');
  }
  if (!Array.isArray(t.areas) || t.areas.length === 0) {
    errors.push('Phải có danh sách phân công mảng việc.');
  }
  return { isValid: errors.length === 0, errors };
}

// ==========================================
// Seed Data mặc định khởi tạo ban đầu
// ==========================================
export const DEFAULT_PROJECT_DATA: ProjectModuleData = {
  slug: 'mang-theo-mot-net-ve',
  title: 'Mang Theo Một Nét Vẽ',
  slogan: 'Một buổi chơi phù hợp, một món quà đúng nhu cầu.',
  summary:
    'Bảy sinh viên Đại học FPT Hà Nội sẽ tổ chức một buổi vui chơi sáng tạo cho các em tại Mái ấm Thánh Tâm Xuy Xá, và gây quỹ để tặng những vật phẩm Mái ấm đang cần.',
  location: 'Mái ấm Thánh Tâm Xuy Xá (Mỹ Đức, Hà Nội) & Campus FPT Hòa Lạc',
  executionStatus: 'in_progress',
  statusNotice: 'Đang triển khai · tuần 1',
  previewNotice: 'Bản xem trước — nội dung theo đề xuất Final, chờ xác nhận.',
  activities: [
    {
      id: 'chuon-chuon-tre',
      title: 'Chuồn chuồn tre và vẽ tranh',
      description: 'Trang trí những cánh chuồn chuồn tre thăng bằng và vẽ tranh tự do với màu sắc theo sở thích.',
      badge: 'Góc tạo hình',
      note: 'Người tham gia có quyền lựa chọn vẽ tranh, trang trí, quan sát hoặc nghỉ ngơi.',
    },
    {
      id: 'to-tuong',
      title: 'Tô tượng sắc màu',
      description: 'Thỏa sức phối màu trên các mẫu tượng thạch cao đa dạng hình dáng và kích cỡ (10 cm).',
      badge: 'Góc tô màu',
      note: 'Hoạt động vui chơi trải nghiệm tại chỗ, không gắn với sản phẩm gây quỹ.',
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
        'Tiếp nhận ủng hộ qua chuyển khoản và dự kiến bán quà lưu niệm. Hai nguồn được ghi riêng; khoản ủng hộ được công bố sau đối soát.',
    },
    {
      step: '03',
      title: 'Buổi chơi tại Mái ấm',
      description:
        '14:00 Thứ Bảy 24/10/2026 (dự kiến). Bốn góc hoạt động, có hai lần nghỉ; có thể rút ngắn theo ý Mái ấm.',
    },
    {
      step: '04',
      title: 'Đối soát và trao quà',
      description:
        '14:00 Thứ Bảy 31/10/2026 (dự kiến). Chốt quỹ, mua vật phẩm theo danh mục Mái ấm xác nhận và trao tặng.',
    },
  ],
  needs: [
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
  ],
  safetyPractices: [
    'Chuồn chuồn mài nhẵn, màu gốc nước, tượng không cạnh nhọn.',
    'Chia nhóm nhỏ theo lượt, luôn có góc nghỉ.',
    'Trò chơi vận động nhẹ, có thể chơi khi ngồi, không loại người chơi.',
    'Chỉ ghi hình trong phạm vi Mái ấm cho phép.',
  ],
  progress: {
    currentWeek: 1,
    totalWeeks: 5,
    updatedAt: '2026-10-09',
    currentStageIndex: 0,
  },
  plannedSessions: [
    {
      id: 'buoi-choi',
      title: 'Buổi chơi tại Mái ấm',
      date: '2026-10-24',
      time: '14:00',
      weekday: 'Thứ Bảy',
      description: 'Bốn góc hoạt động, khoảng 180 phút, có hai lần nghỉ.',
    },
    {
      id: 'trao-qua',
      title: 'Gặp lại và trao quà',
      date: '2026-10-31',
      time: '14:00',
      weekday: 'Thứ Bảy',
      description: 'Trao vật phẩm theo danh mục Mái ấm xác nhận, khoảng 30–45 phút.',
    },
  ],
  contacts: {
    status: 'confirmed',
    people: [
      { name: 'Nguyễn Chí Trung', role: 'Trưởng dự án', phone: '0984 441 726', phoneE164: '+84984441726' },
      { name: 'Lê Tuấn Anh', role: 'Đại diện đối ngoại', phone: '0343 999 199', phoneE164: '+84343999199' },
    ],
    fanpageUrl: 'https://www.facebook.com/mangtheomotnetve',
    sourceRef: 'supplement-c07:muc-6',
    updatedAt: '2026-10-09',
  },
};

export const DEFAULT_JOURNAL_DATA: JournalArticle[] = [
  {
    slug: 'ke-hoach-bon-goc-choi',
    title: 'Kế hoạch bốn góc chơi có lựa chọn tại Mái ấm Thánh Tâm',
    summary: 'Bốn góc hoạt động được nhóm chuẩn bị vừa sức, ưu tiên an toàn và quyền tự do tham gia, đổi lượt, quan sát hoặc nghỉ ngơi của các em.',
    category: 'ke-hoach',
    categoryLabel: 'Kế hoạch',
    publishedAt: '2026-10-11',
    eventDate: '2026-10-24',
    eventStatus: 'planned',
    status: 'published',
    coverImage: {
      src: '/images/illustrations/a01.webp',
      alt: 'Bảng màu nước và cọ vẽ cho hoạt động tạo hình và tô màu',
      caption: 'Ảnh minh họa họa cụ — kế hoạch góc trải nghiệm, chưa phải ảnh thực tế của buổi chơi.',
      creditName: 'Pavel Danilyuk',
      creditSource: 'Pexels',
      creditUrl: 'https://www.pexels.com/photo/watercolors-and-paintbrushes-6925031/',
    },
    content: [
      {
        type: 'paragraph',
        text: 'Tại Mái ấm Thánh Tâm Xuy Xá (Mỹ Đức, Hà Nội), nhóm sinh viên Lăng Kính dự kiến tổ chức một buổi vui chơi sáng tạo trong khoảng 180 phút vào chiều Thứ Bảy 24/10/2026. Để buổi chơi thực sự mang lại niềm vui vừa sức, nhóm xây dựng kế hoạch gồm bốn góc hoạt động với hai lượt chơi tại bàn chuồn chuồn và tô tượng xen kẽ trò chơi chung và nghỉ giải lao theo lịch trình dự kiến, cho phép các em tự do chọn góc chơi hoặc nghỉ ngơi.',
      },
      {
        type: 'heading',
        level: 2,
        text: 'Bốn góc trải nghiệm theo kế hoạch',
      },
      {
        type: 'list',
        items: [
          'Góc tạo hình: Trang trí những chú chuồn chuồn tre thăng bằng và vẽ tranh tự do theo sở thích.',
          'Góc tô màu: Thỏa sức phối màu trên các mẫu tượng thạch cao đa dạng hình dáng và kích cỡ (10 cm).',
          'Góc âm nhạc: Giao lưu hát cùng nhau với các giai điệu thiếu nhi gần gũi, ấm áp và không áp lực biểu diễn.',
          'Góc vận động nhẹ: Các trò chơi tương tác vừa sức gồm bowling mini, chuyền bóng nhẹ nhàng và thẻ màu ghép hình.',
        ],
      },
      {
        type: 'callout',
        text: 'Nguyên tắc hàng đầu của nhóm: Mỗi em nhỏ có quyền tự do lựa chọn góc hoạt động yêu thích, đổi lượt, quan sát hoặc nghỉ ngơi bất kỳ lúc nào; tuyệt đối không giao chỉ tiêu hoàn thành sản phẩm cho các em.',
      },
      {
        type: 'heading',
        level: 2,
        text: 'Chuẩn bị an toàn và phối hợp cùng Mái ấm',
      },
      {
        type: 'paragraph',
        text: 'Theo nguyên tắc an toàn của nhóm, toàn bộ vật liệu trước buổi chơi đều được lên kế hoạch kiểm tra kỹ lưỡng, ưu tiên màu vẽ gốc nước dễ rửa sạch và tránh các chi tiết cạnh nhọn sắc theo quy chuẩn bảo vệ an toàn cho trẻ. Kế hoạch tổ chức, khung giờ chi tiết và cách thức hỗ trợ cần được thống nhất và duyệt trước với Mái ấm trước khi triển khai.',
      },
      {
        type: 'quote',
        text: 'Đồ các em làm ra trong buổi chơi hoàn toàn thuộc về các em giữ lại làm kỷ niệm. Nhóm Lăng Kính tuyệt đối không thu lại bất kỳ sản phẩm nào để bán hay gây quỹ.',
      },
    ],
  },
  {
    slug: 'gioi-thieu-qua-luu-niem-gay-quy',
    title: 'Giới thiệu hai món quà lưu niệm gây quỹ và kế hoạch mở bán',
    summary: 'Chuồn chuồn tre mộc và móc khóa Lăng Kính do nhóm sinh viên Lăng Kính chuẩn bị theo kế hoạch gây quỹ cho buổi chơi và vật phẩm tặng Mái ấm.',
    category: 'ke-hoach',
    categoryLabel: 'Kế hoạch',
    publishedAt: '2026-10-11',
    eventDate: null,
    eventStatus: null,
    status: 'published',
    coverImage: {
      src: '/images/san-pham/chuon-chuon-tre.webp',
      alt: 'Những chú chuồn chuồn tre sơn nhiều màu đặt trên khay mây, có chân đế',
      caption: 'Ảnh chuồn chuồn tre do nhóm cung cấp để tham khảo; hiện sản phẩm đang ở trạng thái chờ mở bán.',
    },
    content: [
      {
        type: 'paragraph',
        text: 'Để chuẩn bị kinh phí tổ chức buổi chơi và gửi tặng Mái ấm Thánh Tâm những vật phẩm thiết thực theo đúng danh mục Mái ấm xác nhận, nhóm sinh viên Lăng Kính đã lên kế hoạch chuẩn bị hai sản phẩm quà lưu niệm thủ công nhỏ mang ý nghĩa của dự án.',
      },
      {
        type: 'heading',
        level: 2,
        text: 'Hai sản phẩm quà lưu niệm dự kiến',
      },
      {
        type: 'list',
        items: [
          'Chuồn chuồn tre kèm đế: Kế hoạch chuẩn bị 50 phôi tre mộc 12 cm theo đề xuất, trong đó 30 bộ có đế dự kiến bán gây quỹ với giá tham khảo 40.000đ/bộ; 20 chiếc để lại Mái ấm theo lựa chọn của cơ sở.',
          'Móc khóa Lăng Kính: Dự kiến 100 chiếc móc khóa Lăng Kính với giá tham khảo 10.000đ/chiếc. Tranh vẽ của các em chỉ được in khi có sự đồng ý phù hợp từ Mái ấm và người giám hộ.',
        ],
      },
      {
        type: 'callout',
        text: 'Trạng thái hiện tại: Chưa mở bán. Website hiện chưa nhận đơn đặt hàng hoặc thanh toán sản phẩm. Kế hoạch mở bán dự kiến diễn ra tại khuôn viên Đại học FPT Hòa Lạc sau khi nhóm hoàn tất chuẩn bị mẫu và được phê duyệt.',
      },
      {
        type: 'heading',
        level: 2,
        text: 'Nguyên tắc minh bạch và hạch toán độc lập',
      },
      {
        type: 'paragraph',
        text: 'Tiền bán quà lưu niệm được nhóm ghi sổ riêng, hoàn toàn tách biệt với các khoản ủng hộ qua tài khoản chuyển khoản. Theo kế hoạch, nguồn thu này dùng để bù đắp chi phí nguyên liệu và tổ chức; phần thặng dư nếu có được dùng trực tiếp cho buổi chơi và quà tặng Mái ấm.',
      },
    ],
  },
];

export const DEFAULT_PRODUCTS_DATA: ProductsModuleData = {
  'chuon-chuon-tre-kem-de': {
    saleStatus: 'unconfirmed',
    officialPrice: null,
    stockAvailable: null,
    salesChannel: 'FPT Hòa Lạc',
    returnPolicy: null,
    publicApproval: 'pending',
  },
  'moc-khoa': {
    saleStatus: 'unconfirmed',
    officialPrice: null,
    stockAvailable: null,
    salesChannel: 'FPT Hòa Lạc',
    returnPolicy: null,
    publicApproval: 'pending',
  },
};

export const DEFAULT_FINANCE_DATA: FinanceModuleData = {
  reconciled: false,
  reconciledAt: null,
  publicApproval: 'pending',
  reconciledBy: [],
  entries: [],
  overview: {
    plannedExpenseTotal: 5470000,
    craftPlannedRevenue: 2200000,
    foodPlannedRevenue: 4950000,
    plannedRevenueScenario: 7150000,
    unfundedProjectedBalance: 1680000,
    actualStatusNotice: 'Chưa có số liệu thực tế được xác nhận.',
    disclaimer:
      'Các con số trên thuộc dự toán ban đầu trong đề xuất dự án Final (tháng 10/2026). Báo cáo sau đối soát, biên tập và được phép công bố sẽ được cập nhật sau khi hoàn thành.',
  },
  donationAccount: {
    status: 'active',
    bankName: 'Techcombank',
    accountNumber: '999927052006',
    accountHolder: 'LE TUAN ANH',
    qrImage: '/images/ung-ho/qr-ung-ho-techcombank.png',
    transferPrefix: 'MTMNV',
    goalAmount: 3000000,
  },
  ledgerProcess: [
    {
      title: 'Một tài khoản riêng cho dự án',
      description: 'Mọi khoản ủng hộ chuyển vào tài khoản Techcombank đã công bố, nội dung bắt đầu bằng MTMNV để dễ nhận diện.',
    },
    {
      title: 'Hai người đối chiếu',
      description: 'Thành viên tài chính và một thành viên khác cùng đối chiếu từng khoản với sao kê ngân hàng trước khi ghi sổ.',
    },
    {
      title: 'Ghi sổ tối thiểu',
      description: 'Mỗi dòng gồm ngày, số tiền, mã giao dịch rút gọn và tên người ủng hộ đồng ý hiển thị; không ghi tên thì để Ẩn danh.',
    },
    {
      title: 'Chỉ công bố sau đối soát',
      description: 'Sổ được cập nhật lên website định kỳ sau mỗi lần đối soát, kèm ngày đối soát thật. Website không kết nối tự động với ngân hàng.',
    },
    {
      title: 'Xử lý nhầm, trùng, hoàn tiền',
      description: 'Mỗi mã giao dịch chỉ ghi một lần. Khoản chuyển nhầm được hoàn lại theo yêu cầu và không tính vào tổng; chỉnh sửa được ghi chú ở lần cập nhật sau.',
    },
    {
      title: 'Tôn trọng riêng tư',
      description: 'Không công khai số tài khoản, ngân hàng hay thông tin cá nhân của người gửi; chứng từ chỉ công bố bản đã che thông tin.',
    },
  ],
};

export const DEFAULT_TEAM_DATA: TeamModuleData = {
  info: {
    name: 'Lăng Kính',
    description:
      'Lăng Kính là nhóm gồm 7 sinh viên lớp AI2015, học phần SSG105 (Kỹ năng làm việc nhóm), Đại học FPT Hà Nội. Nhóm xây dựng dự án để kết nối một buổi vui chơi có lựa chọn với việc hỗ trợ hiện vật theo nhu cầu thực tế tại Mái ấm Thánh Tâm Xuy Xá.',
    course: 'Học phần SSG105 — Đại học FPT Hà Nội',
    classId: 'AI2015',
    size: 7,
  },
  principles: [
    {
      title: 'Các em được chọn',
      description: 'Chơi, đổi hoạt động, ngồi xem hay nghỉ đều được tôn trọng; không giao chỉ tiêu hoàn thành sản phẩm cho các em.',
    },
    {
      title: 'An toàn trước hết',
      description: 'Vật liệu được kiểm tra an toàn; trò chơi vừa sức; mọi hoạt động tại Mái ấm cần được Mái ấm thống nhất và duyệt trước.',
    },
    {
      title: 'Nhóm tự chuẩn bị sản phẩm gây quỹ',
      description: 'Sản phẩm gây quỹ do nhóm chuẩn bị và hoàn thiện. Hoạt động tại Mái ấm hoàn toàn là vui chơi sáng tạo.',
    },
    {
      title: 'Minh bạch từng khoản',
      description: 'Thành viên tài chính cùng một thành viên khác đối soát thu chi; tiền và hiện vật ghi riêng; kết quả công khai sau dự án.',
    },
    {
      title: 'Giữ riêng tư cho các em',
      description: 'Không dùng hoàn cảnh hay hình ảnh của các em để bán hàng; chỉ đăng ảnh khi được Mái ấm cho phép.',
    },
  ],
  areas: [
    { title: 'Điều phối', members: 1, description: 'Lên lịch, theo dõi tiến độ và kết nối các mảng việc của nhóm.' },
    { title: 'Tài chính', members: 1, description: 'Giữ sổ thu chi, hóa đơn, đối soát sau mỗi đợt bán và mua quà theo danh mục.' },
    { title: 'Hậu cần và chương trình', members: 2, description: 'Chuẩn bị vật tư, đạo cụ, quầy quà lưu niệm và di chuyển cho buổi chơi.' },
    { title: 'Nội dung và truyền thông', members: 2, description: 'Thiết kế ấn phẩm, viết bài và lưu trữ hình ảnh đúng phạm vi cho phép.' },
    { title: 'Đối ngoại', members: 1, description: 'Làm việc với Mái ấm và các đơn vị hỗ trợ.' },
  ],
  members: [
    { name: 'Nguyễn Chí Trung', role: 'Trưởng dự án', photo: '/images/thanh-vien/nguyen-chi-trung.webp', description: 'Lên lịch, theo dõi tiến độ và điều phối hoạt động của nhóm.' },
    { name: 'Nguyễn Ngọc Khoa', role: 'Tài chính', photo: '/images/thanh-vien/nguyen-ngoc-khoa.webp', description: 'Giữ sổ ủng hộ, đối chiếu sao kê và mua quà theo danh mục.' },
    { name: 'Nguyễn Như Huy', role: 'Hậu cần', photo: '/images/thanh-vien/nguyen-nhu-huy.webp', description: 'Chuẩn bị vật tư, đạo cụ và chương trình buổi chơi.' },
    { name: 'Trịnh Hiển Lân', role: 'Truyền thông', photo: '/images/thanh-vien/trinh-hien-lan.webp', description: 'Viết bài, quản lý lịch đăng và hình ảnh đúng phạm vi cho phép.' },
    { name: 'Trần Bình Trọng', role: 'Thiết kế', photo: '/images/thanh-vien/tran-binh-trong.webp', description: 'Thiết kế ấn phẩm, poster và nhận diện của dự án.' },
    { name: 'Lê Tuấn Anh', role: 'Đối ngoại', photo: '/images/thanh-vien/le-tuan-anh.webp', description: 'Làm việc với Mái ấm và các đơn vị hỗ trợ.' },
    { name: 'Nguyễn Anh Khoa', role: 'Hậu cần', photo: '/images/thanh-vien/nguyen-anh-khoa.webp', description: 'Chuẩn bị quà lưu niệm, quầy và di chuyển.' },
  ],
  productFaqs: [
    {
      question: 'Giá trên trang có phải giá bán chính thức?',
      answer: 'Chưa. Đây là giá tham khảo trong kế hoạch. Giá, mẫu và số lượng chính thức sẽ được công bố khi mở bán.',
    },
    {
      question: 'Ai làm các sản phẩm này?',
      answer:
        'Toàn bộ sản phẩm gây quỹ do nhóm Lăng Kính chuẩn bị và hoàn thiện. Hoạt động tại Mái ấm hoàn toàn là vui chơi sáng tạo, không gắn với sản xuất hàng bán; các em giữ lại sản phẩm do mình làm ra. Tranh của các em chỉ được in lên móc khóa khi có sự đồng ý phù hợp.',
    },
    {
      question: 'Khi nào có thể đặt mua?',
      answer: 'Khi kế hoạch bán được duyệt, nhóm sẽ công bố cách đặt hàng tại trang này. Hiện website chưa nhận đơn đặt hàng hoặc thanh toán sản phẩm.',
    },
    {
      question: 'Tiền bán hàng được dùng thế nào?',
      answer:
        'Trước hết bù chi phí nguyên liệu và tổ chức. Phần còn lại dùng mua vật phẩm theo danh mục Mái ấm xác nhận, có hóa đơn và biên bản bàn giao.',
    },
  ],
  supportFaqs: [
    {
      question: 'Làm sao để tên tôi xuất hiện trong sao kê?',
      answer:
        'Ghi nội dung chuyển khoản theo mẫu MTMNV và tên bạn muốn hiển thị. Nếu không ghi tên hoặc ghi “An danh”, khoản ủng hộ hiển thị là Ẩn danh. Website không hiển thị số tài khoản hay thông tin ngân hàng của người gửi.',
    },
    {
      question: 'Khi nào khoản ủng hộ của tôi được cập nhật?',
      answer:
        'Sau mỗi lần thành viên tài chính cùng một thành viên khác đối chiếu với sao kê ngân hàng. Website không kết nối tự động với ngân hàng; khi sổ được công bố, ngày đối soát gần nhất sẽ hiển thị ở đầu bảng. Khoản ủng hộ được cập nhật định kỳ sau khi đối soát xong.',
    },
    {
      question: 'Tôi chuyển nhầm số tiền hoặc chuyển trùng thì sao?',
      answer:
        'Hãy liên hệ một trong hai số điện thoại của nhóm kèm thời gian và mã giao dịch. Nhóm đối chiếu với sao kê và hoàn lại nếu bạn yêu cầu; khoản đã hoàn không được tính vào tổng ủng hộ.',
    },
    {
      question: 'Tiền ủng hộ được dùng vào việc gì?',
      answer:
        'Cho vật tư buổi chơi, quà cho các em và di chuyển; phần còn lại mua vật phẩm theo danh mục Mái ấm xác nhận, có hóa đơn và biên bản bàn giao.',
    },
    {
      question: 'Tôi có thể cùng đến Mái ấm không?',
      answer: 'Chỉ khi Mái ấm đồng ý trước. Nhóm không tuyển người tự do đến Mái ấm, để bảo đảm an toàn và riêng tư cho các em.',
    },
  ],
  transparencyFaqs: [
    {
      question: 'Vì sao tổng ủng hộ đang ghi “Chưa cập nhật”?',
      answer:
        'Tổng chỉ được tính từ sổ đã đối chiếu với sao kê ngân hàng. Khi nhóm chưa công bố sổ đã đối soát chính thức, website không hiển thị con số (kể cả 0đ) để tránh hiểu lầm là chưa nhận được khoản ủng hộ nào.',
    },
    {
      question: 'Tiền bán quà lưu niệm có cộng vào tổng ủng hộ không?',
      answer: 'Không. Thanh tiến độ chỉ tính các khoản ủng hộ qua tài khoản dự án đã đối soát. Tiền bán quà được ghi riêng.',
    },
    {
      question: 'Trường hợp số tiền ủng hộ vượt mục tiêu 3.000.000đ thì xử lý thế nào?',
      answer:
        'Website vẫn ghi đúng tổng thực tế đã đối soát. Phần vượt mục tiêu sẽ được dùng mua thêm vật phẩm theo danh mục Mái ấm xác nhận và ghi rõ trong báo cáo tổng kết.',
    },
    {
      question: 'Khi nào nhóm công bố báo cáo tổng kết dự án?',
      answer:
        'Sau buổi trao quà và khi thành viên tài chính cùng một thành viên khác hoàn tất đối soát. Chứng từ chỉ công bố bản đã che thông tin riêng tư.',
    },
  ],
  faqs: [
    {
      question: 'Giá trên trang có phải giá bán chính thức?',
      answer: 'Chưa. Đây là giá tham khảo trong kế hoạch. Giá, mẫu và số lượng chính thức sẽ được công bố khi mở bán.',
    },
    {
      question: 'Ai làm các sản phẩm này?',
      answer:
        'Toàn bộ sản phẩm gây quỹ do nhóm Lăng Kính chuẩn bị và hoàn thiện. Hoạt động tại Mái ấm hoàn toàn là vui chơi sáng tạo, các em giữ lại sản phẩm mình làm ra.',
    },
  ],
  siteMeta: {
    siteTitle: 'Mang Theo Một Nét Vẽ | Dự án thiện nguyện sinh viên FPT',
    siteDescription: 'Một buổi chơi phù hợp, một món quà đúng nhu cầu cho các em tại Mái ấm Thánh Tâm Xuy Xá.',
    ogImage: '/images/illustrations/a01.webp',
  },
};

/** Lấy dữ liệu mặc định ban đầu theo mã phân hệ */
export function getDefaultModuleData(moduleKey: ModuleKey): unknown {
  switch (moduleKey) {
    case 'project':
      return DEFAULT_PROJECT_DATA;
    case 'journal':
      return DEFAULT_JOURNAL_DATA;
    case 'products':
      return DEFAULT_PRODUCTS_DATA;
    case 'finance':
      return DEFAULT_FINANCE_DATA;
    case 'team':
      return DEFAULT_TEAM_DATA;
    default:
      return {};
  }
}

/** Xác thực dữ liệu theo phân hệ */
export function validateModuleData(moduleKey: ModuleKey, data: unknown): { isValid: boolean; errors: string[] } {
  switch (moduleKey) {
    case 'project':
      return validateProjectData(data);
    case 'journal':
      return validateJournalModuleData(data);
    case 'products':
      return validateProductsModuleData(data);
    case 'finance':
      return validateFinanceModuleData(data);
    case 'team':
      return validateTeamModuleData(data);
    default:
      return { isValid: false, errors: [`Phân hệ '${moduleKey}' không hợp lệ hoặc không được hỗ trợ.`] };
  }
}
