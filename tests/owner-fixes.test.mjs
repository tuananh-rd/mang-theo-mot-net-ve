import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CAMPAIGN_PROJECT,
  PROJECT_PROGRESS,
  PLANNED_SESSIONS,
  CURRENT_STAGE_INDEX,
  PLANNED_STAGES,
  formatStageStatus,
  DONATION_ACCOUNT,
} from '../src/data/campaign.ts';
import { CRAFT_PRODUCT_DETAILS, getEffectiveProductSaleModel } from '../src/lib/products.ts';

describe('Chặng dự án do chủ dự án xác nhận (P1)', () => {
  it('chặng hiện tại là chặng 02 — Gây quỹ và nhãn trạng thái suy ra từ cùng một nguồn', () => {
    assert.equal(CURRENT_STAGE_INDEX, 1);
    assert.equal(PROJECT_PROGRESS.currentStageIndex, CURRENT_STAGE_INDEX);
    assert.equal(PLANNED_STAGES[PROJECT_PROGRESS.currentStageIndex].step, '02');
    assert.equal(PLANNED_STAGES[PROJECT_PROGRESS.currentStageIndex].title, 'Gây quỹ');
    assert.equal(CAMPAIGN_PROJECT.statusNotice, formatStageStatus());
    assert.equal(CAMPAIGN_PROJECT.statusNotice, 'CHẶNG 2 — Gây quỹ');
    assert.strictEqual(CAMPAIGN_PROJECT.plannedStages, PLANNED_STAGES);
  });

  it('không đổi tuần, ngày cập nhật, lịch dự kiến và mục tiêu ủng hộ', () => {
    assert.equal(PROJECT_PROGRESS.currentWeek, 2);
    assert.equal(PROJECT_PROGRESS.totalWeeks, 5);
    assert.equal(PROJECT_PROGRESS.updatedAt, '2026-10-12');
    assert.deepEqual(PLANNED_SESSIONS.map((s) => s.date), ['2026-10-31', '2026-11-07']);
    assert.equal(DONATION_ACCOUNT.goalAmount, 7000000);
  });

  it('không còn nhãn "Đang triển khai · tuần" cũ trong mã nguồn giao diện', () => {
    for (const file of ['src/components/Footer.astro', 'src/pages/index.astro', 'src/pages/du-an/mang-theo-mot-net-ve.astro']) {
      assert.doesNotMatch(fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), /Đang triển khai · tuần/);
    }
  });
});

describe('Ảnh móc khóa do chủ dự án cung cấp (P1)', () => {
  it('móc khóa dùng ảnh mẫu từ nguồn chi tiết sản phẩm chung, hiển thị trọn khung và có chú thích mẫu', () => {
    const detail = CRAFT_PRODUCT_DETAILS.find((d) => d.product.id === 'moc-khoa');
    assert.ok(detail?.image, 'móc khóa phải có ảnh');
    assert.equal(detail.image.fit, 'contain');
    assert.match(detail.image.src, /^\/images\/san-pham\/.+\.webp$/);
    assert.ok(fs.existsSync(new URL(`../public${detail.image.src}`, import.meta.url)));
    assert.match(detail.image.caption, /mẫu thực tế có thể khác/);
    // Không còn trạng thái "chưa có ảnh" cho móc khóa; giá và trạng thái vẫn từ mô hình bán hàng hiện có.
    assert.equal(detail.imagePendingNote, undefined);
    assert.equal(getEffectiveProductSaleModel(detail.product).effectivePrice, 10000);
  });

  it('các mẫu không lặp đường dẫn ảnh trong template; ProductGrid và trang chi tiết đọc từ nguồn chung', () => {
    const grid = fs.readFileSync(new URL('../src/components/ProductGrid.astro', import.meta.url), 'utf8');
    const detailPage = fs.readFileSync(new URL('../src/pages/san-pham/[slug].astro', import.meta.url), 'utf8');
    assert.doesNotMatch(grid, /\/images\/san-pham\//);
    assert.doesNotMatch(detailPage, /\/images\/san-pham\//);
    assert.match(grid, /CRAFT_PRODUCT_DETAILS/);
  });
});
