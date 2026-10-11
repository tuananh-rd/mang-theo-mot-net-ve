/**
 * Bộ chuyển đổi và tạo bản chụp xuất bản (Publication Adapter) - Task C17
 * Tạo bản chụp bất biến (Immutable Snapshot) được làm sạch nghiêm ngặt,
 * cách ly dữ liệu bản nháp với dữ liệu công khai, tính mã băm SHA-256 toàn vẹn.
 */

import type { PublicationSnapshot } from '../types.js';
import {
  validateProjectData,
  validateJournalModuleData,
  validateProductsModuleData,
  validateFinanceModuleData,
  validateTeamModuleData,
  type ProjectModuleData,
  type JournalArticle,
  type ProductsModuleData,
  type FinanceModuleData,
  type TeamModuleData,
} from '../schemas/index.js';

export interface SnapshotGenerationResult {
  snapshot: PublicationSnapshot;
  validationErrors: Record<string, string[]>;
  isEligibleForPublish: boolean;
}

/**
 * Tính mã SHA-256 cho chuỗi hoặc đối tượng JSON
 */
export async function computeSha256(content: string): Promise<string> {
  const data = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Làm sạch và chuẩn hóa bài viết nhật ký cho bản chiếu công khai
 */
function sanitizeJournalForPublic(articles: JournalArticle[]): JournalArticle[] {
  return articles
    .filter((a) => a.status === 'published') // Chỉ xuất bản các bài có status published
    .map((a) => ({
      slug: a.slug,
      title: a.title,
      summary: a.summary,
      category: a.category,
      categoryLabel: a.categoryLabel,
      publishedAt: a.publishedAt,
      eventDate: a.eventDate || null,
      eventStatus: a.eventStatus || null,
      status: 'published' as const,
      coverImage: a.coverImage ? { ...a.coverImage } : undefined,
      content: a.content.map((block) => ({ ...block })),
    }));
}

/**
 * Làm sạch và chuẩn hóa phân hệ tài chính cho bản chiếu công khai
 */
function sanitizeFinanceForPublic(finance: FinanceModuleData): FinanceModuleData {
  const isReconciled = Boolean(finance.reconciled && finance.publicApproval === 'approved');

  return {
    reconciled: isReconciled,
    reconciledAt: isReconciled ? finance.reconciledAt : null,
    publicApproval: isReconciled ? 'approved' : 'pending',
    reconciledBy: isReconciled ? finance.reconciledBy : [],
    entries: isReconciled
      ? finance.entries.map((e) => {
          const isAnon =
            !e.donor ||
            ['ẩn danh', 'an danh', 'anonymous'].includes(e.donor.toLowerCase().trim());
          let safeRef: string | null = null;
          if (!isAnon && e.reference) {
            const rawRef = String(e.reference).trim();
            safeRef = rawRef.startsWith('...') ? rawRef : `...${rawRef.slice(-4)}`;
          }
          return {
            date: e.date,
            amount: e.amount,
            donor: isAnon ? 'Ẩn danh' : e.donor,
            reference: isAnon ? null : safeRef,
          };
        })
      : [],
    overview: {
      plannedExpenseTotal: finance.overview?.plannedExpenseTotal ?? 5470000,
      craftPlannedRevenue: finance.overview?.craftPlannedRevenue ?? 2200000,
      foodPlannedRevenue: finance.overview?.foodPlannedRevenue ?? 4950000,
      plannedRevenueScenario: finance.overview?.plannedRevenueScenario ?? 7150000,
      unfundedProjectedBalance: finance.overview?.unfundedProjectedBalance ?? 1680000,
      actualStatusNotice: finance.overview?.actualStatusNotice ?? 'Chưa có số liệu thực tế được xác nhận.',
      disclaimer: finance.overview?.disclaimer ?? '',
    },
  };
}

/**
 * Tạo bản chụp xuất bản hoàn chỉnh từ các bản nháp của các phân hệ
 */
export async function createPublicationSnapshot(
  drafts: Record<string, unknown>,
  versionTag: string = `v${Date.now()}`
): Promise<SnapshotGenerationResult> {
  const validationErrors: Record<string, string[]> = {};

  const projectData = (drafts.project || {}) as ProjectModuleData;
  const projectVal = validateProjectData(projectData);
  if (!projectVal.isValid) validationErrors.project = projectVal.errors;

  const journalData = (Array.isArray(drafts.journal) ? drafts.journal : []) as JournalArticle[];
  const journalVal = validateJournalModuleData(journalData);
  if (!journalVal.isValid) validationErrors.journal = journalVal.errors;

  const productsData = (drafts.products || {}) as ProductsModuleData;
  const productsVal = validateProductsModuleData(productsData);
  if (!productsVal.isValid) validationErrors.products = productsVal.errors;

  const financeData = (drafts.finance || {}) as FinanceModuleData;
  const financeVal = validateFinanceModuleData(financeData);
  if (!financeVal.isValid) validationErrors.finance = financeVal.errors;

  const teamData = (drafts.team || {}) as TeamModuleData;
  const teamVal = validateTeamModuleData(teamData);
  if (!teamVal.isValid) validationErrors.team = teamVal.errors;

  // Làm sạch dữ liệu cho bản chiếu công khai
  const sanitizedModules = {
    project: { ...projectData },
    journal: sanitizeJournalForPublic(journalData),
    products: { ...productsData },
    finance: sanitizeFinanceForPublic(financeData),
    team: { ...teamData },
  };

  const modulesJson = JSON.stringify(sanitizedModules);
  const sha256 = await computeSha256(modulesJson);
  const now = new Date().toISOString();

  const snapshot: PublicationSnapshot = {
    version: versionTag,
    generatedAt: now,
    sha256,
    modules: sanitizedModules,
  };

  const isEligibleForPublish = Object.keys(validationErrors).length === 0;

  return {
    snapshot,
    validationErrors,
    isEligibleForPublish,
  };
}
