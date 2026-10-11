/**
 * Bộ chuyển đổi và tạo bản chụp xuất bản (Publication Adapter) - Task C17
 * Tạo bản chụp bất biến (Immutable Snapshot) được làm sạch nghiêm ngặt,
 * cách ly dữ liệu bản nháp với dữ liệu công khai, tính mã băm SHA-256 toàn vẹn.
 * Sử dụng nested allowlist nghiêm ngặt, ngăn chặn rò rỉ trường thô và PII.
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
 * Làm sạch phân hệ Dự án theo nested allowlist
 */
function sanitizeProjectForPublic(project: ProjectModuleData) {
  const result: any = {
    slug: String(project.slug || 'mang-theo-mot-net-ve').trim(),
    title: String(project.title || '').trim(),
    slogan: String(project.slogan || '').trim(),
    summary: String(project.summary || '').trim(),
    location: String(project.location || '').trim(),
    executionStatus: project.executionStatus || 'unknown',
    statusNotice: String(project.statusNotice || '').trim(),
    previewNotice: String(project.previewNotice || '').trim(),
    activities: (project.activities || []).map((a) => ({
      id: String(a.id || '').trim(),
      title: String(a.title || '').trim(),
      description: String(a.description || '').trim(),
      badge: String(a.badge || '').trim(),
      note: a.note ? String(a.note).trim() : undefined,
    })),
    plannedStages: (project.plannedStages || []).map((s) => ({
      step: String(s.step || '').trim(),
      title: String(s.title || '').trim(),
      description: String(s.description || '').trim(),
    })),
    needs: (project.needs || []).map((n) => ({
      title: String(n.title || '').trim(),
      description: String(n.description || '').trim(),
    })),
    safetyPractices: (project.safetyPractices || []).map((p) => String(p).trim()).filter(Boolean),
  };

  if (project.progress) {
    result.progress = {
      currentWeek: Number(project.progress.currentWeek || 1),
      totalWeeks: Number(project.progress.totalWeeks || 5),
      updatedAt: String(project.progress.updatedAt || '2026-10-09').trim(),
      currentStageIndex: Number(project.progress.currentStageIndex ?? 0),
    };
  }

  if (Array.isArray(project.plannedSessions)) {
    result.plannedSessions = project.plannedSessions.map((s) => ({
      id: String(s.id || '').trim(),
      title: String(s.title || '').trim(),
      date: String(s.date || '').trim(),
      time: String(s.time || '').trim(),
      weekday: String(s.weekday || '').trim(),
      description: String(s.description || '').trim(),
    }));
  }

  if (project.contacts) {
    result.contacts = {
      status: String(project.contacts.status || 'confirmed').trim(),
      people: (project.contacts.people || []).map((p) => ({
        name: String(p.name || '').trim(),
        role: String(p.role || '').trim(),
        phone: String(p.phone || '').trim(),
        phoneE164: String(p.phoneE164 || '').trim(),
      })),
      fanpageUrl: String(project.contacts.fanpageUrl || '').trim(),
      sourceRef: String(project.contacts.sourceRef || '').trim(),
      updatedAt: String(project.contacts.updatedAt || '').trim(),
    };
  }

  return result;
}

/**
 * Làm sạch và chuẩn hóa bài viết nhật ký cho bản chiếu công khai theo allowlist
 */
function sanitizeJournalForPublic(articles: JournalArticle[]): JournalArticle[] {
  return articles
    .filter((a) => a.status === 'published') // Bắt buộc chỉ xuất bản bài đã duyệt (draft isolation)
    .map((a) => {
      const cleanArticle: JournalArticle = {
        slug: String(a.slug || '').trim(),
        title: String(a.title || '').trim(),
        summary: String(a.summary || '').trim(),
        category: a.category,
        categoryLabel: a.categoryLabel ? String(a.categoryLabel).trim() : undefined,
        publishedAt: String(a.publishedAt || '').trim(),
        eventDate: a.eventDate ? String(a.eventDate).trim() : null,
        eventStatus: a.eventStatus || null,
        status: 'published',
        content: (a.content || []).map((block) => {
          switch (block.type) {
            case 'paragraph':
            case 'callout':
            case 'quote':
              return { type: block.type, text: String(block.text || '').trim() };
            case 'heading':
              return { type: 'heading', level: block.level === 3 ? 3 : 2, text: String(block.text || '').trim() };
            case 'list':
              return {
                type: 'list',
                items: (block.items || []).map((it) => String(it).trim()).filter(Boolean),
              };
            case 'image':
              return {
                type: 'image',
                src: String(block.src || '').trim(),
                alt: String(block.alt || '').trim(),
                caption: String(block.caption || '').trim(),
                creditName: block.creditName ? String(block.creditName).trim() : undefined,
                creditSource: block.creditSource ? String(block.creditSource).trim() : undefined,
                creditUrl: block.creditUrl ? String(block.creditUrl).trim() : undefined,
              };
            default:
              return { type: 'paragraph', text: '' };
          }
        }),
      };

      if (a.coverImage && a.coverImage.src) {
        cleanArticle.coverImage = {
          src: String(a.coverImage.src).trim(),
          alt: String(a.coverImage.alt || '').trim(),
          caption: String(a.coverImage.caption || '').trim(),
          creditName: a.coverImage.creditName ? String(a.coverImage.creditName).trim() : undefined,
          creditSource: a.coverImage.creditSource ? String(a.coverImage.creditSource).trim() : undefined,
          creditUrl: a.coverImage.creditUrl ? String(a.coverImage.creditUrl).trim() : undefined,
        };
      }

      return cleanArticle;
    });
}

/**
 * Làm sạch phân hệ Sản phẩm theo allowlist
 */
function sanitizeProductsForPublic(products: ProductsModuleData) {
  const result: ProductsModuleData = {};
  for (const [id, item] of Object.entries(products)) {
    result[id] = {
      saleStatus: item.saleStatus || 'unconfirmed',
      officialPrice: typeof item.officialPrice === 'number' ? item.officialPrice : null,
      stockAvailable: typeof item.stockAvailable === 'number' ? item.stockAvailable : null,
      salesChannel: String(item.salesChannel || 'FPT Hòa Lạc').trim(),
      returnPolicy: item.returnPolicy ? String(item.returnPolicy).trim() : null,
      publicApproval: item.publicApproval || 'pending',
    };
  }
  return result;
}

/**
 * Làm sạch và chuẩn hóa phân hệ tài chính cho bản chiếu công khai
 * Khử PII của người đối soát (thay bằng vai trò), che mã tham chiếu (...XXXX)
 */
function sanitizeFinanceForPublic(finance: FinanceModuleData): FinanceModuleData {
  const isReconciled = Boolean(finance.reconciled && finance.publicApproval === 'approved');

  // Khử PII người đối soát: gán nhãn vai trò thay vì hiển thị email cá nhân
  const sanitizedRoles = (finance.reconciledBy || []).map((entry) => {
    if (entry.includes('@')) {
      return 'Thành viên Ban Tài chính (Đã xác minh)';
    }
    return String(entry).trim();
  });

  const result: any = {
    reconciled: isReconciled,
    reconciledAt: isReconciled ? finance.reconciledAt : null,
    publicApproval: isReconciled ? 'approved' : 'pending',
    reconciledBy: isReconciled ? (sanitizedRoles.length > 0 ? sanitizedRoles : ['Ban Tài chính']) : [],
    entries: isReconciled
      ? (finance.entries || []).map((e) => {
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
            donor: isAnon ? 'Ẩn danh' : String(e.donor).trim(),
            reference: isAnon ? null : safeRef,
          };
        })
      : [],
    overview: {
      plannedExpenseTotal: finance.overview?.plannedExpenseTotal ?? null as any,
      craftPlannedRevenue: finance.overview?.craftPlannedRevenue ?? null as any,
      foodPlannedRevenue: finance.overview?.foodPlannedRevenue ?? null as any,
      plannedRevenueScenario: finance.overview?.plannedRevenueScenario ?? null as any,
      unfundedProjectedBalance: finance.overview?.unfundedProjectedBalance ?? null as any,
      actualStatusNotice: String(finance.overview?.actualStatusNotice || 'Chưa có số liệu thực tế được xác nhận.').trim(),
      disclaimer: String(finance.overview?.disclaimer || '').trim(),
    },
  };

  if (finance.donationAccount) {
    result.donationAccount = {
      status: finance.donationAccount.status === 'active' ? 'active' : 'pending',
      bankName: finance.donationAccount.bankName ? String(finance.donationAccount.bankName).trim() : null,
      accountNumber: finance.donationAccount.accountNumber ? String(finance.donationAccount.accountNumber).trim() : null,
      accountHolder: finance.donationAccount.accountHolder ? String(finance.donationAccount.accountHolder).trim() : null,
      qrImage: finance.donationAccount.qrImage ? String(finance.donationAccount.qrImage).trim() : null,
      transferPrefix: String(finance.donationAccount.transferPrefix || 'MTMNV').trim(),
      goalAmount: typeof finance.donationAccount.goalAmount === 'number' ? finance.donationAccount.goalAmount : 3000000,
    };
  }

  if (Array.isArray(finance.ledgerProcess)) {
    result.ledgerProcess = finance.ledgerProcess.map((p) => ({
      title: String(p.title || '').trim(),
      description: String(p.description || '').trim(),
    }));
  }

  return result;
}

/**
 * Làm sạch phân hệ Nhóm, FAQ & SEO theo allowlist
 */
function sanitizeTeamForPublic(team: TeamModuleData): TeamModuleData {
  const result: any = {
    info: {
      name: String(team.info?.name || 'Lăng Kính').trim(),
      description: String(team.info?.description || '').trim(),
      course: String(team.info?.course || '').trim(),
      classId: String(team.info?.classId || '').trim(),
      size: typeof team.info?.size === 'number' ? team.info.size : 7,
    },
    principles: (team.principles || []).map((p) => ({
      title: String(p.title || '').trim(),
      description: String(p.description || '').trim(),
    })),
    areas: (team.areas || []).map((a) => ({
      title: String(a.title || '').trim(),
      members: typeof a.members === 'number' ? a.members : 1,
      description: String(a.description || '').trim(),
    })),
    faqs: (team.faqs || []).map((f) => ({
      question: String(f.question || '').trim(),
      answer: String(f.answer || '').trim(),
    })),
    siteMeta: {
      siteTitle: String(team.siteMeta?.siteTitle || 'Mang Theo Một Nét Vẽ').trim(),
      siteDescription: String(team.siteMeta?.siteDescription || '').trim(),
      ogImage: String(team.siteMeta?.ogImage || '/images/illustrations/a01.webp').trim(),
    },
  };

  if (Array.isArray(team.members)) {
    result.members = team.members.map((m) => ({
      name: String(m.name || '').trim(),
      role: String(m.role || '').trim(),
      photo: String(m.photo || '').trim(),
      description: String(m.description || '').trim(),
    }));
  }

  if (Array.isArray(team.productFaqs)) {
    result.productFaqs = team.productFaqs.map((f) => ({
      question: String(f.question || '').trim(),
      answer: String(f.answer || '').trim(),
    }));
  }

  if (Array.isArray(team.supportFaqs)) {
    result.supportFaqs = team.supportFaqs.map((f) => ({
      question: String(f.question || '').trim(),
      answer: String(f.answer || '').trim(),
    }));
  }

  if (Array.isArray(team.transparencyFaqs)) {
    result.transparencyFaqs = team.transparencyFaqs.map((f) => ({
      question: String(f.question || '').trim(),
      answer: String(f.answer || '').trim(),
    }));
  }

  return result;
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

  // Làm sạch dữ liệu cho bản chiếu công khai theo từng nested allowlist riêng biệt
  const sanitizedModules = {
    project: sanitizeProjectForPublic(projectData),
    journal: sanitizeJournalForPublic(journalData),
    products: sanitizeProductsForPublic(productsData),
    finance: sanitizeFinanceForPublic(financeData),
    team: sanitizeTeamForPublic(teamData),
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
