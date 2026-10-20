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
  name?: string | null;
  description?: string | null;
  originText?: string | null;
  saleStatus: 'unconfirmed' | 'open' | 'closed';
  officialPrice: number | null;
  stockAvailable: number | null;
  salesChannel: string;
  returnPolicy: string | null;
  publicApproval: 'pending' | 'approved';
  narrative?: string | null;
  mediaKey?: string | null;
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
    if (item.narrative !== undefined && item.narrative !== null && typeof item.narrative !== 'string') {
      errors.push(`Sản phẩm '${id}': Mô tả câu chuyện (narrative) phải là chuỗi ký tự.`);
    }
    if (item.mediaKey !== undefined && item.mediaKey !== null && typeof item.mediaKey !== 'string') {
      errors.push(`Sản phẩm '${id}': Khóa ảnh mediaKey phải là chuỗi ký tự.`);
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

export interface FinanceOverviewData {
  plannedExpenseTotal: number | null;
  craftPlannedRevenue: number | null;
  foodPlannedRevenue: number | null;
  plannedRevenueScenario: number | null;
  unfundedProjectedBalance: number | null;
  actualStatusNotice?: string | null;
  disclaimer?: string | null;
}

export interface FinanceModuleData {
  reconciled: boolean;
  reconciledAt: string | null;
  publicApproval: 'pending' | 'approved';
  reconciledBy: string[];
  entries: DonationEntry[];
  overview: FinanceOverviewData;
  donationAccount?: DonationAccountData;
  ledgerProcess?: LedgerProcessStep[];
  sales?: Array<{
    item: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    channel: string;
  }>;
  expenses?: Array<{
    category: string;
    item: string;
    amount: number;
    isCash: boolean;
    notes?: string;
  }>;
  inKindDonations?: Array<{
    item: string;
    quantity: number;
    estimatedValue: number;
    donorName: string;
  }>;
  firstSigner?: { name: string; role: string; signedAt: string; revisionId?: string; revisionHash?: string } | null;
  secondSigner?: { name: string; role: string; signedAt: string; revisionId?: string; revisionHash?: string } | null;
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
  if (f.overview !== undefined && f.overview !== null) {
    if (typeof f.overview !== 'object' || Array.isArray(f.overview)) {
      errors.push('overview phải là một đối tượng tổng quan tài chính.');
    } else {
      const ov = f.overview;
      const numFields: Array<keyof FinanceOverviewData> = [
        'plannedExpenseTotal',
        'craftPlannedRevenue',
        'foodPlannedRevenue',
        'plannedRevenueScenario',
        'unfundedProjectedBalance',
      ];
      for (const field of numFields) {
        const val = ov[field];
        if (val !== undefined && val !== null) {
          if (typeof val !== 'number' || !Number.isFinite(val) || !Number.isSafeInteger(val)) {
            errors.push(`Trường overview.${field} phải là số nguyên an toàn hoặc null.`);
          } else if (field !== 'unfundedProjectedBalance' && val < 0) {
            errors.push(`Trường overview.${field} không được là số âm.`);
          }
        }
      }
    }
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
  if (f.sales !== undefined && !Array.isArray(f.sales)) {
    errors.push('sales phải là mảng doanh thu bán hàng.');
  }
  if (f.expenses !== undefined && !Array.isArray(f.expenses)) {
    errors.push('expenses phải là mảng khoản chi.');
  }
  if (f.inKindDonations !== undefined && !Array.isArray(f.inKindDonations)) {
    errors.push('inKindDonations phải là mảng tiếp nhận hiện vật.');
  }
  if (f.firstSigner !== undefined && f.firstSigner !== null && typeof f.firstSigner !== 'object') {
    errors.push('firstSigner phải là một đối tượng xác nhận.');
  }
  if (f.secondSigner !== undefined && f.secondSigner !== null && typeof f.secondSigner !== 'object') {
    errors.push('secondSigner phải là một đối tượng xác nhận.');
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

export interface RouteSeoItem {
  title?: string | null;
  description?: string | null;
}

export interface SiteMetaData {
  siteTitle: string;
  siteDescription: string;
  ogImage: string;
  routeSeo?: Record<string, RouteSeoItem>;
}

export const CANONICAL_SEO_ROUTES = [
  '/',
  '/du-an/mang-theo-mot-net-ve',
  '/dong-hanh',
  '/san-pham',
  '/minh-bach',
  '/ve-nhom',
  '/nhat-ky',
] as const;

export function isValidCanonicalRoute(route: string): boolean {
  if (typeof route !== 'string') return false;
  if (!route.startsWith('/') || route.startsWith('//')) return false;
  if (route.includes('..') || route.includes('?') || route.includes('#') || route.includes('\\') || /\s/.test(route)) return false;
  if ((CANONICAL_SEO_ROUTES as readonly string[]).includes(route)) return true;
  if (/^\/nhat-ky\/[a-z0-9-]+$/.test(route) || /^\/san-pham\/[a-z0-9-]+$/.test(route)) return true;
  return false;
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
  siteMeta: SiteMetaData;
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
  if (t.siteMeta !== undefined && t.siteMeta !== null) {
    if (typeof t.siteMeta !== 'object' || Array.isArray(t.siteMeta)) {
      errors.push('siteMeta phải là một đối tượng.');
    } else {
      if (t.siteMeta.siteTitle !== undefined && typeof t.siteMeta.siteTitle !== 'string') {
        errors.push('siteTitle phải là chuỗi ký tự.');
      }
      if (t.siteMeta.siteDescription !== undefined && typeof t.siteMeta.siteDescription !== 'string') {
        errors.push('siteDescription phải là chuỗi ký tự.');
      }
      if (t.siteMeta.ogImage !== undefined && typeof t.siteMeta.ogImage !== 'string') {
        errors.push('ogImage phải là chuỗi ký tự.');
      }
      if (t.siteMeta.routeSeo !== undefined && t.siteMeta.routeSeo !== null) {
        if (typeof t.siteMeta.routeSeo !== 'object' || Array.isArray(t.siteMeta.routeSeo)) {
          errors.push('routeSeo phải là đối tượng cấu hình theo tuyến đường.');
        } else {
          for (const [routeKey, seoVal] of Object.entries(t.siteMeta.routeSeo)) {
            if (!isValidCanonicalRoute(routeKey)) {
              errors.push(`Đường dẫn '${routeKey}' trong routeSeo không hợp lệ hoặc không thuộc danh sách tuyến đường canonical.`);
            }
            if (seoVal !== null && (typeof seoVal !== 'object' || Array.isArray(seoVal))) {
              errors.push(`Cấu hình SEO cho tuyến '${routeKey}' phải là đối tượng hoặc null.`);
            } else if (seoVal) {
              if (seoVal.title !== undefined && seoVal.title !== null && typeof seoVal.title !== 'string') {
                errors.push(`Tiêu đề (title) cho tuyến '${routeKey}' phải là chuỗi ký tự hoặc null.`);
              }
              if (seoVal.description !== undefined && seoVal.description !== null && typeof seoVal.description !== 'string') {
                errors.push(`Mô tả (description) cho tuyến '${routeKey}' phải là chuỗi ký tự hoặc null.`);
              }
            }
          }
        }
      }
    }
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
  statusNotice: 'Đang triển khai · tuần 2',
  previewNotice: 'Bản xem trước — nội dung theo đề xuất V3 (tháng 10/2026), chờ xác nhận.',
  activities: [
    {
      id: 'chuon-chuon-tre',
      title: 'Trang trí chuồn chuồn tre',
      description:
        'Phiên sáng tạo 1 (khoảng 50 phút): các em chọn màu, thêm họa tiết hoặc tô cùng sinh viên; người hỗ trợ giữ phôi khi cần. Em muốn tiếp tục vẫn được làm tiếp ở phiên sau.',
      badge: 'Góc tạo hình',
      note: 'Mỗi em được chọn trang trí, quan sát, đổi hoạt động hoặc nghỉ; sản phẩm của các em được để khô và giữ lại Mái ấm.',
    },
    {
      id: 'to-tuong',
      title: 'Tô tượng và giấy ước mơ',
      description:
        'Phiên sáng tạo 2 (khoảng 50 phút): tô tượng 10 cm trên khay chắc, tô từng vùng cùng sinh viên; có thêm hoạt động giấy ước mơ.',
      badge: 'Góc tô màu',
      note: 'Hoạt động vui chơi tại chỗ, không đặt chỉ tiêu hoàn thành và không gắn với hàng gây quỹ.',
    },
    {
      id: 'hat-cung-nhau',
      title: 'Hát, trò chuyện và chia sẻ',
      description:
        'Hát các bài quen theo gợi ý của Mái ấm và trò chuyện; em nào muốn có thể giới thiệu sản phẩm của mình, hai cụ cùng hát hoặc trò chuyện.',
      badge: 'Góc âm nhạc',
      note: 'Tạo không khí ấm áp, vui tươi và không áp lực biểu diễn.',
    },
    {
      id: 'tro-choi-nhe',
      title: 'Trò chơi tương tác nhẹ',
      description:
        'Bowling bóng mềm rồi chuyền bóng theo nhạc, lượt ngắn và có thể chơi khi ngồi; khi nhạc dừng, em cầm bóng có thể chọn một cử chỉ vui hoặc bỏ lượt. Có trò "Gương vui" nhẹ ở giờ nghỉ.',
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
        'Tiếp nhận ủng hộ qua chuyển khoản và dự kiến bán quà lưu niệm; dự kiến mở đặt trước từ tuần 6 và bán chính ở tuần 7–8. Hai nguồn được ghi riêng; khoản ủng hộ được công bố sau đối soát.',
    },
    {
      step: '03',
      title: 'Buổi chơi tại Mái ấm',
      description:
        '14:00 Thứ Bảy 31/10/2026 (dự kiến). Khoảng 180 phút, bốn hoạt động và hai lần nghỉ chung; có thể rút ngắn theo ý Mái ấm.',
    },
    {
      step: '04',
      title: 'Đối soát và trao quà',
      description:
        '14:00 Thứ Bảy 07/11/2026 (dự kiến). Chốt quỹ, mua vật phẩm theo danh mục Mái ấm xác nhận, gặp lại các em và trao tặng.',
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
    'Trò chơi vận động nhẹ với bóng mềm, có thể chơi khi ngồi, không loại người chơi.',
    'Chỉ ghi hình trong phạm vi Mái ấm cho phép.',
    'Con dấu tích điểm chỉ dùng khi em đồng ý, mực ghi rõ dùng trên da và được Mái ấm chấp thuận.',
  ],
  progress: {
    currentWeek: 2,
    totalWeeks: 5,
    updatedAt: '2026-10-12',
    currentStageIndex: 0,
  },
  plannedSessions: [
    {
      id: 'buoi-choi',
      title: 'Buổi chơi tại Mái ấm',
      date: '2026-10-31',
      time: '14:00',
      weekday: 'Thứ Bảy',
      description: 'Bốn hoạt động, khoảng 180 phút, có hai lần nghỉ chung (dự kiến tuần 8).',
    },
    {
      id: 'trao-qua',
      title: 'Gặp lại và trao quà',
      date: '2026-11-07',
      time: '14:00',
      weekday: 'Thứ Bảy',
      description: 'Gặp lại các em, trao vật phẩm theo danh mục Mái ấm xác nhận, khoảng 30–45 phút (dự kiến tuần 9).',
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
    eventDate: '2026-10-31',
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
        text: 'Tại Mái ấm Thánh Tâm Xuy Xá (Mỹ Đức, Hà Nội), nhóm sinh viên Lăng Kính dự kiến tổ chức một buổi vui chơi sáng tạo trong khoảng 180 phút vào chiều Thứ Bảy 31/10/2026. Để buổi chơi mang lại niềm vui vừa sức, nhóm xây dựng kế hoạch gồm bốn hoạt động: trang trí chuồn chuồn, tô tượng và giấy ước mơ, trò chơi nhẹ, hát và giao lưu, xen hai lần nghỉ chung; các em tự do chọn hoạt động hoặc nghỉ ngơi.',
      },
      {
        type: 'heading',
        level: 2,
        text: 'Bốn góc trải nghiệm theo kế hoạch',
      },
      {
        type: 'list',
        items: [
          'Góc tạo hình: Trang trí chuồn chuồn tre ở phiên sáng tạo 1; các em chọn màu, thêm họa tiết hoặc tô cùng sinh viên, em muốn tiếp tục vẫn được làm tiếp.',
          'Góc tô màu: Tô tượng 10 cm ở phiên sáng tạo 2, kèm hoạt động giấy ước mơ; các em tự tô hoặc chọn màu để sinh viên hỗ trợ.',
          'Góc âm nhạc: Hát các bài quen theo gợi ý của Mái ấm, trò chuyện và chia sẻ sản phẩm, không áp lực biểu diễn.',
          'Góc vận động nhẹ: Bowling bóng mềm và chuyền bóng theo nhạc với lượt ngắn, có thể chơi khi ngồi; khi nhạc dừng, em cầm bóng có thể chọn một cử chỉ vui hoặc bỏ lượt.',
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
          'Móc khóa Lăng Kính: Dự kiến 100 chiếc với giá tham khảo 10.000đ/chiếc, in tranh do nhóm chuẩn bị hoặc có quyền sử dụng, kèm lời cảm ơn ở mặt sau; không dùng tranh của các em trong buổi sinh hoạt.',
        ],
      },
      {
        type: 'callout',
        text: 'Trạng thái hiện tại: Chưa mở bán. Website hiện chưa nhận đơn đặt hàng hoặc thanh toán sản phẩm. Theo kế hoạch, nhóm dự kiến mở đặt trước từ tuần 6 và bán chính ở tuần 7–8 tại khuôn viên Đại học FPT Hòa Lạc, sau khi hoàn tất chuẩn bị mẫu và được phê duyệt.',
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
    name: 'Chuồn chuồn tre 12 cm kèm đế',
    description: 'Phôi tre mộc mạc cân bằng trên mỏ, đi kèm chân đế trưng bày trang nhã.',
    originText: 'Phôi tre mộc; nguồn gốc trang trí chưa xác nhận',
    saleStatus: 'unconfirmed',
    officialPrice: null,
    stockAvailable: null,
    salesChannel: 'FPT Hòa Lạc',
    returnPolicy: null,
    publicApproval: 'pending',
    narrative: null,
    mediaKey: '/images/san-pham/chuon-chuon-tre.webp',
  },
  'moc-khoa': {
    name: 'Móc khóa Lăng Kính',
    description: 'Móc khóa lưu niệm nhóm sinh viên Lăng Kính chuẩn bị và hoàn thiện theo kế hoạch.',
    originText: 'Nhóm Lăng Kính chuẩn bị và hoàn thiện mẫu',
    saleStatus: 'unconfirmed',
    officialPrice: null,
    stockAvailable: null,
    salesChannel: 'FPT Hòa Lạc',
    returnPolicy: null,
    publicApproval: 'pending',
    narrative: null,
    mediaKey: null,
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
      'Các con số trên thuộc dự toán trong đề xuất dự án bản V3 (tháng 10/2026). Doanh thu cơ sở tính trên giả định bán đủ 30 bộ chuồn chuồn tre, 100 móc khóa, 50 set đồ ăn và 50 hộp bánh su kem. Ba combo món ăn có trong bảng giá của đề xuất nhưng không nằm trong sản lượng mục tiêu và chưa tính vào kịch bản cơ sở; nhóm cần xác nhận có bán hay không. Báo cáo sau đối soát, biên tập và được phép công bố sẽ được cập nhật sau khi hoàn thành.',
  },
  donationAccount: {
    status: 'active',
    bankName: 'Techcombank',
    accountNumber: '19077352683012',
    accountHolder: 'NGUYEN CHI TRUNG',
    qrImage: '/images/ung-ho/qr-ung-ho-techcombank-nguyen-chi-trung.png',
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
  sales: [],
  expenses: [],
  inKindDonations: [],
  firstSigner: null,
  secondSigner: null,
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
      description: 'Sản phẩm gây quỹ do nhóm chuẩn bị và hoàn thiện. Hoạt động tại Mái ấm hoàn toàn là vui chơi sáng tạo, các em giữ lại sản phẩm do mình làm ra.',
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
    { title: 'Điều phối', members: 1, description: 'Lịch, họp tuần, theo dõi tiến độ và kết nối các mảng việc của nhóm.' },
    { title: 'Tài chính', members: 1, description: 'Sổ thu chi, hóa đơn, đối soát sau mỗi ca bán và mua quà theo danh mục.' },
    { title: 'Hậu cần và chương trình', members: 2, description: 'Đơn hàng, tồn kho, chế biến, vận chuyển, dựng quầy, an toàn thực phẩm và chương trình buổi chơi.' },
    { title: 'Nội dung và truyền thông', members: 2, description: 'Thiết kế ấn phẩm, viết bài, lịch đăng, báo cáo số liệu và lưu ảnh, video đúng phạm vi cho phép.' },
    { title: 'Đối ngoại', members: 1, description: 'Đầu mối với Mái ấm và nhà tài trợ, thiết kế poster và infographic.' },
  ],
  members: [
    {
      name: 'Nguyễn Chí Trung',
      role: 'Trưởng dự án',
      photo: '/images/thanh-vien/nguyen-chi-trung.webp',
      description: 'Lịch, họp tuần, theo dõi tiến độ, làm việc với giảng viên và điều phối hoạt động nhóm.',
    },
    {
      name: 'Nguyễn Ngọc Khoa',
      role: 'Tài chính, thủ quỹ',
      photo: '/images/thanh-vien/nguyen-ngoc-khoa.webp',
      description: 'Sổ thu chi, hóa đơn, đối soát cuối mỗi ca, báo cáo công khai và mua quà theo danh mục.',
    },
    {
      name: 'Nguyễn Như Huy',
      role: 'Hậu cần, phụ trách chương trình',
      photo: '/images/thanh-vien/nguyen-nhu-huy.webp',
      description: 'Đơn đặt hàng, tồn kho, chế biến, vận chuyển, dựng quầy, an toàn thực phẩm và chương trình buổi chơi.',
    },
    {
      name: 'Trịnh Hiển Lân',
      role: 'Truyền thông, nội dung',
      photo: '/images/thanh-vien/trinh-hien-lan.webp',
      description: 'Lịch đăng bài, viết bài, báo cáo số liệu truyền thông và duyệt hình ảnh đúng phạm vi cho phép.',
    },
    {
      name: 'Trần Bình Trọng',
      role: 'Thiết kế, nội dung',
      photo: '/images/thanh-vien/tran-binh-trong.webp',
      description: 'Slide, poster, infographic; lưu ảnh và video có nguồn, ngày giờ.',
    },
    {
      name: 'Lê Tuấn Anh',
      role: 'Đối ngoại, thiết kế',
      photo: '/images/thanh-vien/le-tuan-anh.webp',
      description: 'Đầu mối với Mái ấm và nhà tài trợ; thiết kế poster, infographic.',
    },
    {
      name: 'Nguyễn Anh Khoa',
      role: 'Hậu cần, bán hàng gây quỹ',
      photo: '/images/thanh-vien/nguyen-anh-khoa.webp',
      description: 'Đơn đặt hàng, tồn kho, chế biến, vận chuyển, dựng quầy, an toàn thực phẩm và bán hàng gây quỹ.',
    },
  ],
  productFaqs: [
    {
      question: 'Giá trên trang có phải giá bán chính thức?',
      answer: 'Chưa. Đây là giá tham khảo trong kế hoạch. Giá, mẫu và số lượng chính thức sẽ được công bố khi mở bán.',
    },
    {
      question: 'Ai làm các sản phẩm này?',
      answer:
        'Toàn bộ sản phẩm gây quỹ do nhóm Lăng Kính chuẩn bị và hoàn thiện. Hoạt động tại Mái ấm hoàn toàn là vui chơi sáng tạo, không gắn với sản xuất hàng bán; các em giữ lại sản phẩm do mình làm ra. Móc khóa in tranh do nhóm chuẩn bị hoặc có quyền sử dụng, không dùng tranh của các em trong buổi sinh hoạt.',
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
    {
      question: 'Quỹ dùng để mua quà được tính như thế nào?',
      answer:
        'Theo đề xuất, quỹ có thể dùng trước khi mua quà bằng tiền bán hàng và tài trợ tiền đã nhận, trừ chi phí tổ chức và gây quỹ đã trả, chi phí còn phải trả và tiền khách đã trả cho đơn chưa hoàn tất. Mỗi khoản chỉ được trừ một lần; hiện vật chỉ giảm đúng khoản chi mà nó thay thế và không được quy thành tiền mặt.',
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
    routeSeo: {},
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
