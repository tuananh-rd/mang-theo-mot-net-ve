/**
 * Bộ nạp Bản chụp Xuất bản (Publication Snapshot Loader) cho Astro (Task C17)
 * Đọc dữ liệu từ bản chụp đã làm sạch và được duyệt, với cơ chế dự phòng (fallback)
 * an toàn về src/data/campaign.ts nếu chưa có bản xuất bản nào được tạo.
 */

import rawSnapshot from '../published-snapshot.json' with { type: 'json' };
import {
  CAMPAIGN_PROJECT,
  PROJECT_PROGRESS,
  PLANNED_SESSIONS,
  OFFICIAL_CONTACT,
  DONATION_ACCOUNT,
  TEAM_MEMBERS,
  PRODUCT_FAQS,
  SUPPORT_FAQS,
  TRANSPARENCY_FAQS,
  type Project,
  type ProjectProgress,
  type PlannedSession,
  type OfficialContact,
  type DonationAccount,
  type TeamMember,
  type ProductFaq,
  type SupportFaq,
  type TransparencyFaq,
} from '../campaign';

const snapshot =
  rawSnapshot && typeof rawSnapshot === 'object' && Object.keys(rawSnapshot).length > 0
    ? (rawSnapshot as Record<string, any>)
    : null;

/** Lấy thông tin dự án (ưu tiên từ snapshot đã duyệt nếu có) */
export function getPublishedProject(): Project {
  if (snapshot?.project) {
    return {
      ...CAMPAIGN_PROJECT,
      title: snapshot.project.title || CAMPAIGN_PROJECT.title,
      slogan: snapshot.project.slogan || CAMPAIGN_PROJECT.slogan,
      summary: snapshot.project.summary || CAMPAIGN_PROJECT.summary,
      executionStatus: snapshot.project.status || CAMPAIGN_PROJECT.executionStatus,
    };
  }
  return CAMPAIGN_PROJECT;
}

/** Lấy tiến độ dự án */
export function getPublishedProgress(): ProjectProgress {
  if (snapshot?.project?.progress) {
    return snapshot.project.progress;
  }
  return PROJECT_PROGRESS;
}

/** Lấy danh sách buổi hoạt động kế hoạch */
export function getPublishedSessions(): PlannedSession[] {
  if (Array.isArray(snapshot?.project?.plannedSessions) && snapshot.project.plannedSessions.length > 0) {
    return snapshot.project.plannedSessions;
  }
  return PLANNED_SESSIONS;
}

/** Lấy thông tin đầu mối liên hệ chính thức */
export function getPublishedContacts(): OfficialContact {
  if (snapshot?.project?.contacts) {
    return snapshot.project.contacts;
  }
  return OFFICIAL_CONTACT;
}

/** Lấy thông tin tài khoản quyên góp chính thức */
export function getPublishedDonationAccount(): DonationAccount {
  if (snapshot?.finance?.donationAccount) {
    return snapshot.finance.donationAccount;
  }
  return DONATION_ACCOUNT;
}

/** Lấy thông tin thành viên nhóm */
export function getPublishedTeamMembers(): TeamMember[] {
  if (Array.isArray(snapshot?.team?.members) && snapshot.team.members.length > 0) {
    return snapshot.team.members;
  }
  return TEAM_MEMBERS;
}

/** Lấy các nhóm FAQ */
export function getPublishedFaqs(): {
  productFaqs: ProductFaq[];
  supportFaqs: SupportFaq[];
  transparencyFaqs: TransparencyFaq[];
} {
  return {
    productFaqs: snapshot?.team?.productFaqs || PRODUCT_FAQS,
    supportFaqs: snapshot?.team?.supportFaqs || SUPPORT_FAQS,
    transparencyFaqs: snapshot?.team?.transparencyFaqs || TRANSPARENCY_FAQS,
  };
}
