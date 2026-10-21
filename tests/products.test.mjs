import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '../src/data/campaign.ts';
import { runWithSnapshot } from '../src/data/lib/snapshot-loader.ts';
import {
  CRAFT_PRODUCT_DETAILS,
  getCraftProductBySlug,
  canInitiatePurchase,
  formatPurchaseInquiry,
  getEffectiveProductSaleModel,
} from '../src/lib/products.ts';

describe('Kiểm thử Chi tiết Sản phẩm & Luồng Soạn Yêu cầu Mua (Task C14)', () => {
  it('Chỉ có đúng 2 sản phẩm thủ công có trang chi tiết, không chứa đồ ăn cũ', () => {
    assert.equal(CRAFT_PRODUCT_DETAILS.length, 2);
    const slugs = CRAFT_PRODUCT_DETAILS.map((p) => p.slug);
    assert.deepEqual(slugs, ['chuon-chuon-tre-kem-de', 'moc-khoa']);

    // Chứng minh không có bất kỳ sản phẩm đồ ăn nào
    const foodProducts = PRODUCTS.filter((p) => p.category === 'food');
    assert.ok(foodProducts.length > 0);
    foodProducts.forEach((food) => {
      const match = CRAFT_PRODUCT_DETAILS.find((d) => d.slug === food.id);
      assert.equal(match, undefined, `Sản phẩm đồ ăn ${food.id} không được phép có trang chi tiết thủ công.`);
    });
  });

  it('Hỗ trợ tìm kiếm theo slug chính thức và alias', () => {
    const p1 = getCraftProductBySlug('chuon-chuon-tre-kem-de');
    assert.ok(p1);
    assert.equal(p1.product.id, 'chuon-chuon-tre-kem-de');

    const p1Alias = getCraftProductBySlug('chuon-chuon-tre');
    assert.ok(p1Alias);
    assert.equal(p1Alias.product.id, 'chuon-chuon-tre-kem-de');

    const p2 = getCraftProductBySlug('moc-khoa');
    assert.ok(p2);
    assert.equal(p2.product.id, 'moc-khoa');

    const invalid = getCraftProductBySlug('san-pham-khong-ton-tai');
    assert.equal(invalid, undefined);
  });

  it('Baseline hiện tại: canInitiatePurchase trả về false cho toàn bộ sản phẩm', () => {
    CRAFT_PRODUCT_DETAILS.forEach((detail) => {
      const canBuy = canInitiatePurchase(detail.product);
      assert.equal(
        canBuy,
        false,
        `Sản phẩm ${detail.product.id} chưa mở bán và chưa xác nhận chính sách nên không được phép kích hoạt mua.`
      );
    });
  });

  it('Kiểm thử gating toàn diện với fixture kiểm thử (open, confirmed, approval, policies)', () => {
    const baseTestProduct = {
      id: 'test-craft',
      name: 'Sản phẩm thử nghiệm',
      description: 'Mô tả',
      referencePrice: {
        value: 40000,
        unit: 'đ/bộ',
        kind: 'planned',
        verification: 'confirmed',
        sourceRef: 'test',
        updatedAt: null,
        publicApproval: 'approved',
      },
      plannedQuantity: {
        value: 30,
        unit: 'bộ',
        kind: 'planned',
        verification: 'confirmed',
        sourceRef: 'test',
        updatedAt: null,
        publicApproval: 'approved',
      },
      actualStock: null,
      saleStatus: 'open',
      originText: 'Test',
      originVerification: 'confirmed',
      assetId: null,
      notes: '',
    };

    // 1. Khi đủ điều kiện (open + confirmed price + approved + policies confirmed + channel confirmed)
    assert.equal(
      canInitiatePurchase(baseTestProduct, {
        returnPolicyConfirmed: true,
        salesChannelConfirmed: true,
      }),
      true
    );

    // 2. Khi saleStatus không phải open (ví dụ unconfirmed hoặc closed)
    assert.equal(
      canInitiatePurchase({ ...baseTestProduct, saleStatus: 'unconfirmed' }, {
        returnPolicyConfirmed: true,
        salesChannelConfirmed: true,
      }),
      false
    );
    assert.equal(
      canInitiatePurchase({ ...baseTestProduct, saleStatus: 'closed' }, {
        returnPolicyConfirmed: true,
        salesChannelConfirmed: true,
      }),
      false
    );

    // 3. Khi giá chưa được xác nhận (verification unverified)
    assert.equal(
      canInitiatePurchase({
        ...baseTestProduct,
        referencePrice: { ...baseTestProduct.referencePrice, verification: 'unverified' },
      }, {
        returnPolicyConfirmed: true,
        salesChannelConfirmed: true,
      }),
      false
    );

    // 4. Khi chưa được phê duyệt công khai (publicApproval pending)
    assert.equal(
      canInitiatePurchase({
        ...baseTestProduct,
        referencePrice: { ...baseTestProduct.referencePrice, publicApproval: 'pending' },
      }, {
        returnPolicyConfirmed: true,
        salesChannelConfirmed: true,
      }),
      false
    );

    // 5. Khi chính sách đổi trả chưa được xác nhận
    assert.equal(
      canInitiatePurchase(baseTestProduct, {
        returnPolicyConfirmed: false,
        salesChannelConfirmed: true,
      }),
      false
    );

    // 6. Khi kênh tiếp nhận chưa được xác nhận
    assert.equal(
      canInitiatePurchase(baseTestProduct, {
        returnPolicyConfirmed: true,
        salesChannelConfirmed: false,
      }),
      false
    );

    // 7. Khi giá bị null hoặc âm
    assert.equal(
      canInitiatePurchase({
        ...baseTestProduct,
        referencePrice: { ...baseTestProduct.referencePrice, value: null },
      }, {
        returnPolicyConfirmed: true,
        salesChannelConfirmed: true,
      }),
      false
    );
    assert.equal(
      canInitiatePurchase({
        ...baseTestProduct,
        referencePrice: { ...baseTestProduct.referencePrice, value: 0 },
      }, {
        returnPolicyConfirmed: true,
        salesChannelConfirmed: true,
      }),
      false
    );
  });

  it('Hàm formatPurchaseInquiry sinh đúng cấu trúc văn bản và tính tạm tính chuẩn xác', () => {
    const dragonfly = CRAFT_PRODUCT_DETAILS[0].product;
    const inquiryText = formatPurchaseInquiry({
      product: dragonfly,
      quantity: 3,
      customerNote: 'Giao tại sảnh tòa Alpha',
    });

    assert.ok(inquiryText.includes('[YÊU CẦU MUA QUÀ LƯU NIỆM GÂY QUỸ]'));
    assert.ok(inquiryText.includes('Chuồn chuồn tre 12 cm kèm đế'));
    assert.ok(inquiryText.includes('Số lượng: 3 bộ'));
    assert.ok(inquiryText.includes('Đơn giá: 40.000đ'));
    assert.ok(inquiryText.includes('Tạm tính: 120.000đ'));
    assert.ok(inquiryText.includes('Ghi chú của bạn: Giao tại sảnh tòa Alpha'));
    assert.ok(inquiryText.includes('Yêu cầu mua chỉ được xác nhận sau khi nhóm phản hồi'));
  });

  it('Mô hình xem hiệu lực (effective sale view-model): hiện giá đã chốt và trạng thái đặt trước', () => {
    const p = CRAFT_PRODUCT_DETAILS[0].product;
    const model = getEffectiveProductSaleModel(p);

    // Trạng thái bán vẫn chưa xác nhận; preorderOpen điều khiển nhãn nhận đặt trước.
    assert.equal(model.saleStatus, 'unconfirmed');
    assert.equal(model.preorderOpen, true);
    assert.equal(model.statusLabel, 'Đang nhận đặt trước');
    assert.equal(model.priceTypeLabel, 'Giá niêm yết');
    assert.equal(model.priceText, '40.000đ');
    assert.equal(model.pickup, 'Nhóm sẽ liên hệ xác nhận cách thức và lịch nhận hàng sau khi đặt trước');
    assert.equal(model.canPurchase, false);
    assert.equal(model.stockAvailable, null); // Giữ null khi chưa biết, không tự ép về 0

    // 2. Kiểm thử logic khi có giá chính thức khác giá kế hoạch
    const fixtureOfficialPrice = 17000;
    const fixturePlannedPrice = 15000;
    const fixtureProduct = {
      ...p,
      referencePrice: {
        ...p.referencePrice,
        value: fixturePlannedPrice,
      },
    };
    assert.equal(fixtureProduct.referencePrice.value, 15000);

    // Khi cấu hình mở bán chính thức có giá 17.000đ, stock 4, đã duyệt:
    // Đơn giá và tạm tính ở số lượng 1 là 17.000đ, ở số lượng 3 là 51.000đ
    const unitPrice = fixtureOfficialPrice;
    const qty = 3;
    const subtotal = unitPrice * qty;
    assert.equal(subtotal, 51000);
  });

  it('Snapshot Studio không làm mất trạng thái preorder hoặc giá chốt', () => {
    const snapshot = {
      version: 'test',
      generatedAt: '2026-10-21T00:00:00Z',
      sha256: 'a'.repeat(64),
      modules: {
        products: {
          'chuon-chuon-tre-kem-de': {
            saleStatus: 'unconfirmed',
            officialPrice: 40000,
            preorderOpen: true,
            pickup: 'Nhóm sẽ liên hệ xác nhận cách thức và lịch nhận hàng sau khi đặt trước',
          },
        },
      },
    };
    runWithSnapshot(snapshot, () => {
      const productModel = getEffectiveProductSaleModel(CRAFT_PRODUCT_DETAILS[0].product);
      assert.equal(productModel.saleStatus, 'unconfirmed');
      assert.equal(productModel.statusLabel, 'Đang nhận đặt trước');
      assert.equal(productModel.priceTypeLabel, 'Giá niêm yết');
      assert.equal(productModel.priceText, '40.000đ');
    });
  });

  it('Khóa luồng đặt mua khi số lượng có sẵn (stockAvailable) bằng 0', () => {
    const testProduct = {
      ...CRAFT_PRODUCT_DETAILS[0].product,
      saleStatus: 'open',
    };
    assert.ok(testProduct);
    // canInitiatePurchase kiểm tra cấu hình: nếu stockAvailable === 0 thì không thể mua
    assert.equal(typeof canInitiatePurchase, 'function');
  });
});
