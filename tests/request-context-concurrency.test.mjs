import test from 'node:test';
import assert from 'node:assert/strict';
import { runWithSnapshot } from '../src/data/lib/snapshot-loader.ts';
import {
  CAMPAIGN_PROJECT,
  OFFICIAL_CONTACT,
  PRODUCTS,
  getCampaignProject,
  getOfficialContact,
  getCampaignProducts,
} from '../src/data/campaign.ts';
import {
  JOURNAL_ENTRIES,
  getPublishedJournalEntries,
  getJournalEntryBySlug,
} from '../src/data/journal.ts';
import { getCraftProductBySlug, getProductSalesConfig } from '../src/lib/products.ts';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('AsyncLocalStorage: Cách ly hoàn hảo giữa 2 snapshot đồng thời và 1 baseline request (No Cross-Contamination)', async () => {
  const snapshotA = {
    version: '1.0.0',
    generatedAt: '2026-10-12T10:00:00Z',
    sha256: 'a'.repeat(64),
    modules: {
      project: {
        title: 'Tiêu đề Snapshot A - Đang diễn ra',
        slogan: 'Khẩu hiệu A',
        contacts: null, // Chủ ý xóa liên hệ để ẩn CTA
      },
      products: {
        'chuon-chuon-tre-kem-de': {
          saleStatus: 'open',
          officialPrice: 99000,
          stockAvailable: 15,
          narrative: 'Mô tả A',
          publicApproval: 'approved',
        },
      },
      journal: [
        {
          slug: 'bai-viet-a',
          title: 'Bài viết A trong Snapshot A',
          summary: 'Tóm tắt A',
          category: 'ke-hoach',
          categoryLabel: 'Kế hoạch',
          publishedAt: '2026-10-12',
          eventDate: null,
          status: 'published',
          content: [{ type: 'paragraph', text: 'Nội dung A' }],
        },
      ],
    },
  };

  const snapshotB = {
    version: '1.0.0',
    generatedAt: '2026-10-12T11:00:00Z',
    sha256: 'b'.repeat(64),
    modules: {
      project: {
        title: 'Tiêu đề Snapshot B - Bản xem trước mới',
        slogan: 'Khẩu hiệu B',
        contacts: {
          status: 'confirmed',
          people: [{ name: 'Đại diện B', role: 'Liên hệ B', phone: '0901234567', phoneE164: '+84901234567' }],
          fanpageUrl: 'https://fb.com/page-b',
          sourceRef: 'test:b',
          updatedAt: '2026-10-12',
        },
      },
      products: {
        'chuon-chuon-tre-kem-de': {
          saleStatus: 'closed',
          officialPrice: 55000,
          stockAvailable: 0,
          narrative: 'Mô tả B',
          publicApproval: 'approved',
        },
      },
      journal: [
        {
          slug: 'bai-viet-b',
          title: 'Bài viết B trong Snapshot B',
          summary: 'Tóm tắt B',
          category: 'chuan-bi',
          categoryLabel: 'Chuẩn bị',
          publishedAt: '2026-10-12',
          eventDate: null,
          status: 'published',
          content: [{ type: 'paragraph', text: 'Nội dung B' }],
        },
      ],
    },
  };

  // Chạy 3 luồng bất đồng bộ gối nhau (overlapping concurrent renders)
  const taskA = runWithSnapshot(snapshotA, async () => {
    await delay(15);
    // Kiểm tra giai đoạn 1
    assert.equal(CAMPAIGN_PROJECT.title, 'Tiêu đề Snapshot A - Đang diễn ra');
    assert.equal(getCampaignProject().title, 'Tiêu đề Snapshot A - Đang diễn ra');
    assert.equal(OFFICIAL_CONTACT.status, 'unconfirmed');
    assert.deepEqual(OFFICIAL_CONTACT.people, []);

    await delay(25);
    // Kiểm tra giai đoạn 2
    assert.equal(PRODUCTS[0].saleStatus, 'open');
    assert.equal(PRODUCTS[0].referencePrice.value, 40000);
    const salesA = getProductSalesConfig('chuon-chuon-tre-kem-de');
    assert.equal(salesA?.officialPrice, 99000);
    const prodDetailA = getCraftProductBySlug('chuon-chuon-tre-kem-de');
    assert.equal(prodDetailA?.narrative, 'Mô tả A');

    const journalA = getPublishedJournalEntries();
    assert.equal(journalA.length, 1);
    assert.equal(journalA[0].slug, 'bai-viet-a');

    await delay(10);
    // Khẳng định lại sau khi task B và baseline hoàn tất
    assert.equal(CAMPAIGN_PROJECT.title, 'Tiêu đề Snapshot A - Đang diễn ra');
    return 'DONE_A';
  });

  const taskB = runWithSnapshot(snapshotB, async () => {
    await delay(10);
    // Kiểm tra giai đoạn 1
    assert.equal(CAMPAIGN_PROJECT.title, 'Tiêu đề Snapshot B - Bản xem trước mới');
    assert.equal(getCampaignProject().title, 'Tiêu đề Snapshot B - Bản xem trước mới');
    assert.equal(OFFICIAL_CONTACT.status, 'confirmed');
    assert.equal(OFFICIAL_CONTACT.people.length, 1);
    assert.equal(OFFICIAL_CONTACT.people[0].name, 'Đại diện B');

    await delay(20);
    // Kiểm tra giai đoạn 2
    assert.equal(PRODUCTS[0].saleStatus, 'closed');
    // Proposal reference price preserves 40000, official sale price is 55000
    assert.equal(PRODUCTS[0].referencePrice.value, 40000);
    const salesB = getProductSalesConfig('chuon-chuon-tre-kem-de');
    assert.equal(salesB?.officialPrice, 55000);
    const prodDetailB = getCraftProductBySlug('chuon-chuon-tre-kem-de');
    assert.equal(prodDetailB?.narrative, 'Mô tả B');

    const journalB = getPublishedJournalEntries();
    assert.equal(journalB.length, 1);
    assert.equal(journalB[0].slug, 'bai-viet-b');

    await delay(15);
    assert.equal(CAMPAIGN_PROJECT.title, 'Tiêu đề Snapshot B - Bản xem trước mới');
    return 'DONE_B';
  });

  const taskBaseline = (async () => {
    await delay(5);
    // Kiểm tra baseline (không dùng runWithSnapshot)
    assert.equal(CAMPAIGN_PROJECT.title, 'Mang Theo Một Nét Vẽ');
    assert.equal(getCampaignProject().title, 'Mang Theo Một Nét Vẽ');
    assert.equal(OFFICIAL_CONTACT.status, 'confirmed');
    assert.equal(OFFICIAL_CONTACT.people.length, 2);

    await delay(30);
    assert.equal(PRODUCTS[0].saleStatus, 'unconfirmed');
    assert.equal(PRODUCTS[0].referencePrice.value, 40000);

    const journalBase = getPublishedJournalEntries();
    assert.equal(journalBase.length, 2);

    await delay(15);
    assert.equal(CAMPAIGN_PROJECT.title, 'Mang Theo Một Nét Vẽ');
    return 'DONE_BASELINE';
  })();

  const results = await Promise.all([taskA, taskB, taskBaseline]);
  assert.deepEqual(results, ['DONE_A', 'DONE_B', 'DONE_BASELINE']);
});
