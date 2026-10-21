/**
 * Bộ chuyển đổi và tạo bản chụp xuất bản (Publication Adapter) - Task C17
 * Tạo bản chụp bất biến (Immutable Snapshot) được làm sạch nghiêm ngặt,
 * cách ly dữ liệu bản nháp với dữ liệu công khai, tính mã băm SHA-256 toàn vẹn.
 * Sử dụng nested allowlist nghiêm ngặt, ngăn chặn rò rỉ trường thô và PII.
 */

import type { PublicationSnapshot } from '../types.js';
import { APPROVED_MEDIA_REGISTRY } from '../storage/media-registry.js';
import {
  validateProjectData,
  validateJournalModuleData,
  validateProductsModuleData,
  validateFinanceModuleData,
  validateTeamModuleData,
  isValidCanonicalRoute,
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
    previewNotice: '',
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
      currentWeek: typeof project.progress.currentWeek === 'number' ? project.progress.currentWeek : Number(project.progress.currentWeek ?? 1),
      totalWeeks: typeof project.progress.totalWeeks === 'number' ? project.progress.totalWeeks : Number(project.progress.totalWeeks ?? 5),
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

  if (project.contacts === null) {
    result.contacts = null;
  } else if (project.contacts) {
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
function sanitizeJournalForPublic(articles: JournalArticle[], approvedMediaKeys?: Set<string>): JournalArticle[] {
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
        content: (a.content || [])
          .map((block) => {
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
              case 'image': {
                const src = String(block.src || '').trim();
                // Fail-closed: Loại bỏ ảnh nội dung chưa được phê duyệt khỏi bản xuất bản công khai
                if (!approvedMediaKeys || !approvedMediaKeys.has(src)) {
                  return null;
                }
                return {
                  type: 'image',
                  src,
                  alt: String(block.alt || '').trim(),
                  caption: String(block.caption || '').trim(),
                  creditName: block.creditName ? String(block.creditName).trim() : undefined,
                  creditSource: block.creditSource ? String(block.creditSource).trim() : undefined,
                  creditUrl: block.creditUrl ? String(block.creditUrl).trim() : undefined,
                };
              }
              default:
                return { type: 'paragraph', text: '' };
            }
          })
          .filter(Boolean) as any,
      };

      if (a.coverImage && a.coverImage.src) {
        const coverSrc = String(a.coverImage.src).trim();
        // Fail-closed: Chỉ xuất bản ảnh bìa khi nằm trong danh mục media đã duyệt
        if (approvedMediaKeys && approvedMediaKeys.has(coverSrc)) {
          cleanArticle.coverImage = {
            src: coverSrc,
            alt: String(a.coverImage.alt || '').trim(),
            caption: String(a.coverImage.caption || '').trim(),
            creditName: a.coverImage.creditName ? String(a.coverImage.creditName).trim() : undefined,
            creditSource: a.coverImage.creditSource ? String(a.coverImage.creditSource).trim() : undefined,
            creditUrl: a.coverImage.creditUrl ? String(a.coverImage.creditUrl).trim() : undefined,
          };
        }
      }

      return cleanArticle;
    });
}

/**
 * Làm sạch và chuẩn hóa bài viết nhật ký cho bản xem trước riêng tư (Private Draft Preview).
 * Khác với bản chiếu công khai, bản xem trước riêng tư giữ nguyên cả các bài viết 'draft'
 * để người biên tập có thể xem trước bài viết nháp trước khi bấm xuất bản.
 */
function sanitizeJournalForPrivateDraft(articles: JournalArticle[], approvedMediaKeys?: Set<string>): JournalArticle[] {
  return articles.map((a) => {
    const cleanArticle: JournalArticle = {
      slug: String(a.slug || '').trim(),
      title: String(a.title || '').trim(),
      summary: String(a.summary || '').trim(),
      category: a.category,
      categoryLabel: a.categoryLabel ? String(a.categoryLabel).trim() : undefined,
      publishedAt: String(a.publishedAt || '').trim(),
      eventDate: a.eventDate ? String(a.eventDate).trim() : null,
      eventStatus: a.eventStatus || null,
      status: a.status === 'published' ? 'published' : 'draft',
      content: (a.content || [])
        .map((block) => {
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
            case 'image': {
              const src = String(block.src || '').trim();
              return {
                type: 'image',
                src,
                alt: String(block.alt || '').trim(),
                caption: String(block.caption || '').trim(),
                creditName: block.creditName ? String(block.creditName).trim() : undefined,
                creditSource: block.creditSource ? String(block.creditSource).trim() : undefined,
                creditUrl: block.creditUrl ? String(block.creditUrl).trim() : undefined,
              };
            }
            default:
              return { type: 'paragraph', text: '' };
          }
        })
        .filter(Boolean) as any,
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
 * Làm sạch phân hệ Sản phẩm theo allowlist và ngăn chặn rò rỉ media chưa duyệt (Fail-Closed)
 */
function sanitizeProductsForPublic(products: ProductsModuleData, approvedMediaKeys?: Set<string>): ProductsModuleData {
  const result: ProductsModuleData = {};
  for (const [id, item] of Object.entries(products)) {
    result[id] = {
      saleStatus: item.saleStatus || 'unconfirmed',
      officialPrice: typeof item.officialPrice === 'number' ? item.officialPrice : null,
      stockAvailable: typeof item.stockAvailable === 'number' ? item.stockAvailable : null,
      salesChannel: String(item.salesChannel || 'FPT Hòa Lạc').trim(),
      returnPolicy: item.returnPolicy ? String(item.returnPolicy).trim() : null,
      publicApproval: item.publicApproval || 'pending',
      preorderOpen: item.preorderOpen ?? false,
      pickup: item.pickup ? String(item.pickup).trim() : null,
    };
    if (item.name !== undefined) {
      result[id].name = item.name !== null && String(item.name).trim() ? String(item.name).trim() : null;
    }
    if (item.description !== undefined) {
      result[id].description = item.description !== null && String(item.description).trim() ? String(item.description).trim() : null;
    }
    if (item.originText !== undefined) {
      result[id].originText = item.originText !== null && String(item.originText).trim() ? String(item.originText).trim() : null;
    }
    if (item.narrative !== undefined) {
      result[id].narrative = item.narrative !== null && String(item.narrative).trim() ? String(item.narrative).trim() : null;
    }
    if (item.mediaKey !== undefined) {
      if (item.mediaKey === null || item.mediaKey === '') {
        result[id].mediaKey = null;
      } else {
        const key = String(item.mediaKey).trim();
        // Fail-closed: Không cho phép prefix bypass; bắt buộc phải có trong approvedMediaKeys
        if (approvedMediaKeys && approvedMediaKeys.has(key)) {
          result[id].mediaKey = key;
        }
      }
    }
  }
  return result;
}

/**
 * Làm sạch và chuẩn hóa phân hệ tài chính cho bản chiếu công khai
 * Khử PII của người đối soát (thay bằng vai trò), loại mã tham chiếu khỏi bản công khai
 */
function sanitizeFinanceForPublic(finance: FinanceModuleData): FinanceModuleData {
  const hasFirstSigner = Boolean(
    finance.firstSigner &&
    typeof finance.firstSigner.name === 'string' &&
    finance.firstSigner.name.trim() &&
    finance.firstSigner.revisionId &&
    finance.firstSigner.revisionHash
  );

  const hasSecondSigner = Boolean(
    finance.secondSigner &&
    typeof finance.secondSigner.name === 'string' &&
    finance.secondSigner.name.trim() &&
    finance.secondSigner.revisionId &&
    finance.secondSigner.revisionHash
  );

  const distinctSigners = Boolean(
    hasFirstSigner &&
    hasSecondSigner &&
    finance.firstSigner!.name.trim().toLowerCase() !== finance.secondSigner!.name.trim().toLowerCase()
  );

  const matchingRevision = Boolean(
    distinctSigners &&
    finance.firstSigner!.revisionId === finance.secondSigner!.revisionId &&
    finance.firstSigner!.revisionHash === finance.secondSigner!.revisionHash
  );

  // Chỉ khi hội tụ đầy đủ: cờ reconciled=true, publicApproval='approved',
  // hai người ký xác thực độc lập khác nhau, và cùng ký trên một phiên bản bất biến
  const isReconciled = Boolean(
    finance.reconciled &&
    finance.publicApproval === 'approved' &&
    distinctSigners &&
    matchingRevision
  );

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
          return {
            date: e.date,
            amount: e.amount,
            donor: isAnon ? 'Ẩn danh' : String(e.donor).trim(),
          };
        })
      : [],
    overview: {
      plannedExpenseTotal: typeof finance.overview?.plannedExpenseTotal === 'number' && !Number.isNaN(finance.overview.plannedExpenseTotal) ? finance.overview.plannedExpenseTotal : null,
      craftPlannedRevenue: typeof finance.overview?.craftPlannedRevenue === 'number' && !Number.isNaN(finance.overview.craftPlannedRevenue) ? finance.overview.craftPlannedRevenue : null,
      foodPlannedRevenue: typeof finance.overview?.foodPlannedRevenue === 'number' && !Number.isNaN(finance.overview.foodPlannedRevenue) ? finance.overview.foodPlannedRevenue : null,
      plannedRevenueScenario: typeof finance.overview?.plannedRevenueScenario === 'number' && !Number.isNaN(finance.overview.plannedRevenueScenario) ? finance.overview.plannedRevenueScenario : null,
      unfundedProjectedBalance: typeof finance.overview?.unfundedProjectedBalance === 'number' && !Number.isNaN(finance.overview.unfundedProjectedBalance) ? finance.overview.unfundedProjectedBalance : null,
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
      goalAmount: typeof finance.donationAccount.goalAmount === 'number' ? finance.donationAccount.goalAmount : null,
    };
  }

  if (Array.isArray(finance.ledgerProcess)) {
    result.ledgerProcess = finance.ledgerProcess.map((p) => ({
      title: String(p.title || '').trim(),
      description: String(p.description || '').trim(),
    }));
  }

  if (Array.isArray((finance as any).plannedExpenses)) {
    (result as any).plannedExpenses = (finance as any).plannedExpenses.map((p: any) => ({
      id: String(p.id || '').trim(),
      category: String(p.category || '').trim(),
      title: String(p.title || '').trim(),
      calculationText: String(p.calculationText || '').trim(),
      amount: p.amount ? {
        value: typeof p.amount.value === 'number' ? p.amount.value : null,
        unit: String(p.amount.unit || 'đ').trim(),
        kind: 'planned',
        verification: p.amount.verification || 'unverified',
        sourceRef: p.amount.sourceRef || null,
        updatedAt: p.amount.updatedAt || null,
        publicApproval: p.amount.publicApproval || 'pending',
      } : { value: null, unit: 'đ', kind: 'planned', verification: 'unverified', sourceRef: null, updatedAt: null, publicApproval: 'pending' },
      note: String(p.note || '').trim(),
      isEstimated: Boolean(p.isEstimated),
    }));
  }

  return result;
}

/**
 * Làm sạch cấu hình per-route SEO: chỉ chấp nhận tuyến đường bắt đầu bằng '/',
 * làm sạch title và description, loại bỏ trường lạ
 */
function sanitizeRouteSeo(routeSeo: unknown): Record<string, { title?: string; description?: string }> {
  if (!routeSeo || typeof routeSeo !== 'object' || Array.isArray(routeSeo)) {
    return {};
  }
  const result: Record<string, { title?: string; description?: string }> = {};
  for (const [routeKey, rawItem] of Object.entries(routeSeo as Record<string, any>)) {
    if (!isValidCanonicalRoute(routeKey)) continue;
    if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem)) continue;
    const cleanItem: { title?: string; description?: string } = {};
    if (typeof rawItem.title === 'string' && rawItem.title.trim()) {
      cleanItem.title = rawItem.title.trim();
    }
    if (typeof rawItem.description === 'string' && rawItem.description.trim()) {
      cleanItem.description = rawItem.description.trim();
    }
    if (cleanItem.title !== undefined || cleanItem.description !== undefined) {
      result[routeKey] = cleanItem;
    }
  }
  return result;
}

/**
 * Làm sạch phân hệ Nhóm, FAQ & SEO theo allowlist
 */
function sanitizeTeamForPublic(team: TeamModuleData, approvedMediaKeys?: Set<string>): TeamModuleData {
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
      routeSeo: sanitizeRouteSeo(team.siteMeta?.routeSeo),
    },
  };

  if (Array.isArray(team.members)) {
    result.members = team.members.map((m) => {
      const photoKey = String(m.photo || '').trim();
      return {
        name: String(m.name || '').trim(),
        role: String(m.role || '').trim(),
        // Fail-closed: Chỉ xuất bản đường dẫn ảnh chân dung khi đã duyệt
        photo: approvedMediaKeys && approvedMediaKeys.has(photoKey) ? photoKey : '',
        description: String(m.description || '').trim(),
      };
    });
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
  versionTag: string = `v${Date.now()}`,
  approvedMediaKeys?: Set<string>
): Promise<SnapshotGenerationResult> {
  const validationErrors: Record<string, string[]> = {};
  const mediaKeys = approvedMediaKeys !== undefined ? approvedMediaKeys : new Set<string>(
    APPROVED_MEDIA_REGISTRY.flatMap((r) => [r.publicPath, r.r2Key, r.id, `/media/${r.id}`])
  );

  const projectData = (drafts.project || {}) as ProjectModuleData;
  const projectVal = validateProjectData(projectData);
  if (!projectVal.isValid) validationErrors.project = projectVal.errors;

  const journalData = (Array.isArray(drafts.journal) ? drafts.journal : []) as JournalArticle[];
  const journalVal = validateJournalModuleData(journalData);
  if (!journalVal.isValid) validationErrors.journal = journalVal.errors;

  // Kiểm tra ảnh chưa duyệt trong bài viết nhật ký đã xuất bản
  for (const art of journalData) {
    if (art.status === 'published') {
      if (art.coverImage?.src && !mediaKeys.has(art.coverImage.src.trim())) {
        validationErrors.journal = validationErrors.journal || [];
        validationErrors.journal.push(`Bài viết '${art.slug}' sử dụng ảnh bìa '${art.coverImage.src}' chưa được phê duyệt.`);
      }
      for (const block of art.content || []) {
        if (block.type === 'image' && block.src && !mediaKeys.has(block.src.trim())) {
          validationErrors.journal = validationErrors.journal || [];
          validationErrors.journal.push(`Bài viết '${art.slug}' chứa ảnh nội dung '${block.src}' chưa được phê duyệt.`);
        }
      }
    }
  }

  const productsData = (drafts.products || {}) as ProductsModuleData;
  const productsVal = validateProductsModuleData(productsData);
  if (!productsVal.isValid) validationErrors.products = productsVal.errors;

  // Kiểm tra ảnh chưa duyệt trong sản phẩm (Fail-closed)
  for (const [prodId, prod] of Object.entries(productsData)) {
    if (prod.mediaKey && !mediaKeys.has(prod.mediaKey.trim())) {
      validationErrors.products = validationErrors.products || [];
      validationErrors.products.push(`Sản phẩm '${prodId}' đang sử dụng hình ảnh '${prod.mediaKey}' chưa được duyệt.`);
    }
  }

  const financeData = (drafts.finance || {}) as FinanceModuleData;
  const financeVal = validateFinanceModuleData(financeData);
  if (!financeVal.isValid) validationErrors.finance = financeVal.errors;

  const teamData = (drafts.team || {}) as TeamModuleData;
  const teamVal = validateTeamModuleData(teamData);
  if (!teamVal.isValid) validationErrors.team = teamVal.errors;

  // Kiểm tra ảnh chân dung chưa duyệt trong thành viên nhóm
  for (const m of teamData.members || []) {
    if (m.photo && !mediaKeys.has(m.photo.trim())) {
      validationErrors.team = validationErrors.team || [];
      validationErrors.team.push(`Thành viên '${m.name}' sử dụng ảnh chân dung '${m.photo}' chưa được phê duyệt.`);
    }
  }

  // Làm sạch dữ liệu cho bản chiếu công khai theo từng nested allowlist riêng biệt (Fail-closed)
  const sanitizedModules = {
    project: sanitizeProjectForPublic(projectData),
    journal: sanitizeJournalForPublic(journalData, mediaKeys),
    products: sanitizeProductsForPublic(productsData, mediaKeys),
    finance: sanitizeFinanceForPublic(financeData),
    team: sanitizeTeamForPublic(teamData, mediaKeys),
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

/**
 * Tạo bản chụp nháp riêng tư (Private Draft Snapshot) dành riêng cho luồng xem trước /preview/*
 * Khác với xuất bản công khai, bản xem trước riêng tư giữ nguyên các bài viết trạng thái 'draft'
 * và cờ isPreview: true để các route kiểm thử hiển thị đầy đủ dữ liệu mới tạo trước khi xuất bản.
 */
export async function createPrivateDraftSnapshot(
  drafts: Record<string, unknown>,
  versionTag: string = `preview-${Date.now()}`,
  approvedMediaKeys?: Set<string>
): Promise<PublicationSnapshot & { isPreview: true }> {
  const mediaKeys = approvedMediaKeys !== undefined ? approvedMediaKeys : new Set<string>(
    APPROVED_MEDIA_REGISTRY.flatMap((r) => [r.publicPath, r.r2Key, r.id, `/media/${r.id}`])
  );

  const projectData = (drafts.project || {}) as ProjectModuleData;
  const journalData = (Array.isArray(drafts.journal) ? drafts.journal : []) as JournalArticle[];
  const productsData = (drafts.products || {}) as ProductsModuleData;
  const financeData = (drafts.finance || {}) as FinanceModuleData;
  const teamData = (drafts.team || {}) as TeamModuleData;

  const sanitizedModules = {
    project: sanitizeProjectForPublic(projectData),
    journal: sanitizeJournalForPrivateDraft(journalData, mediaKeys),
    products: sanitizeProductsForPublic(productsData, mediaKeys),
    finance: sanitizeFinanceForPublic(financeData),
    team: sanitizeTeamForPublic(teamData, mediaKeys),
  };

  const modulesJson = JSON.stringify(sanitizedModules);
  const sha256 = await computeSha256(modulesJson);
  const now = new Date().toISOString();

  return {
    version: versionTag,
    generatedAt: now,
    sha256,
    modules: sanitizedModules,
    isPreview: true,
  };
}
