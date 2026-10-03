/**
 * Bộ kiểm thử logic tài chính và tính toàn vẹn dữ liệu cho Task C01.
 * Chạy trên Node 24 native test runner: node --test tests/finance.test.mjs
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  PLANNED_EXPENSES,
  PRODUCTS,
  FINANCE_SCENARIOS,
  FINANCE_OVERVIEW,
  ACTUAL_FINANCE,
  OFFICIAL_CONTACT,
} from '../src/data/campaign.ts';

import {
  sumPlannedExpenses,
  calculateProductRevenue,
  calculateTotalRevenueScenario,
  calculateCraftRevenue,
  calculateCombinedPlannedRevenue,
  calculateScenario,
  formatVND,
  formatProductQuantity,
  formatProductPrice,
  formatScenarioBalance,
  calculateFoodReconciliation,
} from '../src/lib/finance.ts';

describe('Kiểm thử logic tài chính và tính toán (Task C01)', () => {
  test('Tổng dự toán chi của 19 khoản mục đúng bằng 4.935.000đ theo 3 nhóm cụ thể', () => {
    assert.equal(PLANNED_EXPENSES.length, 19, 'Phải có đúng 19 khoản dự toán chi.');
    const total = sumPlannedExpenses(PLANNED_EXPENSES);
    assert.equal(total, 4935000, 'Tổng dự toán chi phải là 4.935.000đ.');

    // Nhóm 1: Nguyên liệu gây quỹ (trang 24) = 2.245.000đ
    const group1 = PLANNED_EXPENSES.filter((i) => i.amount.sourceRef === 'proposal:page-24');
    assert.equal(group1.length, 9, 'Nhóm 1 phải có 9 khoản.');
    const group1Total = sumPlannedExpenses(group1);
    assert.equal(group1Total, 2245000, 'Nhóm 1 phải có tổng là 2.245.000đ.');

    // Nhóm 2: Vật tư workshop & quà tặng (trang 25) = 1.560.000đ
    const group2 = PLANNED_EXPENSES.filter((i) => i.amount.sourceRef === 'proposal:page-25');
    assert.equal(group2.length, 7, 'Nhóm 2 phải có 7 khoản.');
    const group2Total = sumPlannedExpenses(group2);
    assert.equal(group2Total, 1560000, 'Nhóm 2 phải có tổng là 1.560.000đ.');

    // Nhóm 3: Truyền thông & Di chuyển (trang 26) = 1.130.000đ
    const group3 = PLANNED_EXPENSES.filter((i) => i.amount.sourceRef === 'proposal:page-26');
    assert.equal(group3.length, 3, 'Nhóm 3 phải có 3 khoản.');
    const group3Total = sumPlannedExpenses(group3);
    assert.equal(group3Total, 1130000, 'Nhóm 3 phải có tổng là 1.130.000đ.');

    assert.equal(group1Total + group2Total + group3Total, 4935000);
  });

  test('sumPlannedExpenses ném lỗi khi có khoản mục null (không tự coi là 0)', () => {
    const dummyItems = [
      {
        id: 'item-1',
        category: 'Test',
        title: 'Khoản 1',
        calculationText: '100.000đ',
        amount: {
          value: 100000,
          unit: 'đ',
          kind: 'planned',
          verification: 'unverified',
          sourceRef: null,
          updatedAt: null,
          publicApproval: 'pending',
        },
        note: '',
        isEstimated: false,
      },
      {
        id: 'item-unknown',
        category: 'Test',
        title: 'Khoản chưa rõ',
        calculationText: 'Chưa rõ',
        amount: {
          value: null,
          unit: 'đ',
          kind: 'planned',
          verification: 'unverified',
          sourceRef: null,
          updatedAt: null,
          publicApproval: 'pending',
        },
        note: '',
        isEstimated: false,
      },
    ];

    assert.throws(
      () => sumPlannedExpenses(dummyItems),
      /không có giá trị/,
      'Hàm sumPlannedExpenses phải ném lỗi khi gặp giá trị null thay vì tự làm tròn về 0.'
    );
  });

  test('Doanh thu kịch bản từng sản phẩm thủ công tính đúng theo giá tham khảo × số lượng kế hoạch', () => {
    const chuonChuon = PRODUCTS.find((p) => p.id === 'chuon-chuon-tre-kem-de');
    const mocKhoa = PRODUCTS.find((p) => p.id === 'moc-khoa');

    assert.ok(chuonChuon, 'Phải tìm thấy sản phẩm chuồn chuồn tre.');
    assert.ok(mocKhoa, 'Phải tìm thấy sản phẩm móc khóa Lăng Kính.');

    // 30 × 40.000 = 1.200.000đ
    assert.equal(calculateProductRevenue(chuonChuon), 1200000);
    // 100 × 10.000 = 1.000.000đ
    assert.equal(calculateProductRevenue(mocKhoa), 1000000);

    // Tổng craft = 2.200.000đ
    assert.equal(calculateCraftRevenue(PRODUCTS), 2200000);
  });

  test('calculateTotalRevenueScenario ném lỗi khi có sản phẩm với plannedQuantity null (không âm thầm bỏ null)', () => {
    assert.throws(
      () => calculateTotalRevenueScenario(PRODUCTS),
      /chưa có số lượng kế hoạch/,
      'calculateTotalRevenueScenario trên toàn bộ 7 SKUs phải ném lỗi vì các món ăn có plannedQuantity null.'
    );
  });

  test('calculateCombinedPlannedRevenue kết hợp đúng doanh thu thủ công và giả định ẩm thực (2.200.000đ + 4.500.000đ = 6.700.000đ)', () => {
    const craftRev = calculateCraftRevenue(PRODUCTS);
    const foodFact = FINANCE_OVERVIEW.foodPlannedRevenueAssumption;
    assert.equal(craftRev, 2200000);
    assert.equal(foodFact.value, 4500000);
    assert.equal(foodFact.unit, 'đ');
    assert.equal(foodFact.kind, 'planned');
    assert.equal(foodFact.verification, 'unverified');
    assert.equal(foodFact.sourceRef, 'proposal:page-18');
    assert.equal(foodFact.updatedAt, null);
    assert.equal(foodFact.publicApproval, 'pending');

    const combinedRev = calculateCombinedPlannedRevenue(craftRev, foodFact);
    assert.equal(combinedRev, 6700000, 'Tổng doanh thu kịch bản kết hợp phải là 6.700.000đ.');
  });

  test('calculateCombinedPlannedRevenue propagate null khi một trong hai nguồn là null (không tự về 0)', () => {
    assert.equal(calculateCombinedPlannedRevenue(null, 4500000), null);
    assert.equal(calculateCombinedPlannedRevenue(2200000, null), null);
    assert.equal(calculateCombinedPlannedRevenue(null, null), null);
  });

  test('Kịch bản cơ sở — Chưa tính tài trợ: Chi 4.935.000đ, Thu giả định 6.700.000đ => Dư giả định 1.765.000đ', () => {
    const s1 = FINANCE_SCENARIOS.find((s) => s.id === 'chua-tinh-tai-tro');
    assert.ok(s1);

    const result = calculateScenario(s1, 6700000, 4935000);
    assert.ok(result);
    assert.equal(result.inKindReplacement, 0);
    assert.equal(result.remainingCashExpense, 4935000);
    assert.equal(result.projectedRevenue, 6700000);
    assert.equal(result.projectedBalance, 1765000);
    assert.equal(result.isDeficit, false);
    assert.equal(result.balanceText, 'Dư 1.765.000đ');
  });

  test('calculateScenario trả về null khi dữ liệu doanh thu hoặc chi phí chưa biết (null)', () => {
    const s = FINANCE_SCENARIOS[0];
    assert.equal(calculateScenario(s, null, 4935000), null);
    assert.equal(calculateScenario(s, 6700000, null), null);
  });

  test('calculateScenario ném lỗi khi hiện vật vượt quá tổng chi hoặc là số âm', () => {
    const invalidScenarioOver = {
      id: 'invalid-over',
      title: 'Vượt chi',
      description: '',
      inKindReplacement: {
        value: 10000000,
        unit: 'đ',
        kind: 'planned',
        verification: 'unverified',
        sourceRef: null,
        updatedAt: null,
        publicApproval: 'pending',
      },
      note: '',
    };
    assert.throws(() => calculateScenario(invalidScenarioOver, 6700000, 4935000), /vượt quá tổng dự toán/);

    const invalidScenarioNeg = {
      id: 'invalid-neg',
      title: 'Số âm',
      description: '',
      inKindReplacement: {
        value: -5000,
        unit: 'đ',
        kind: 'planned',
        verification: 'unverified',
        sourceRef: null,
        updatedAt: null,
        publicApproval: 'pending',
      },
      note: '',
    };
    assert.throws(() => calculateScenario(invalidScenarioNeg, 6700000, 4935000), /không được là số âm/);
  });

  test('Định dạng formatVND xử lý chuẩn xác số dương, 0 và null', () => {
    assert.equal(formatVND(4935000), '4.935.000đ');
    assert.equal(formatVND(6700000), '6.700.000đ');
    assert.equal(formatVND(1765000), '1.765.000đ');
    assert.equal(formatVND(0), '0đ');
    assert.equal(formatVND(null), 'Chưa xác nhận');
    assert.equal(formatVND(undefined), 'Chưa xác nhận');
  });
});

describe('Kiểm tra tính toàn vẹn dữ liệu và an toàn thông tin (Task C01)', () => {
  test('Toàn bộ số liệu thực tế được khởi tạo ở trạng thái null / chưa xác nhận', () => {
    assert.equal(FINANCE_OVERVIEW.actualCashBalance, null);
    assert.equal(FINANCE_OVERVIEW.actualInKindLedger, null);

    assert.equal(ACTUAL_FINANCE.actualCashReceived.value, null);
    assert.equal(ACTUAL_FINANCE.actualCashSpent.value, null);
    assert.equal(ACTUAL_FINANCE.actualCashBalance.value, null);
    assert.equal(ACTUAL_FINANCE.actualInKindReceived.value, null);
    assert.equal(ACTUAL_FINANCE.actualInKindDelivered.value, null);
    assert.equal(ACTUAL_FINANCE.vouchersCount, null);
  });

  test('Kênh liên hệ chính thức có giá trị null và trạng thái unconfirmed', () => {
    assert.equal(OFFICIAL_CONTACT.email, null);
    assert.equal(OFFICIAL_CONTACT.phone, null);
    assert.equal(OFFICIAL_CONTACT.representative, null);
    assert.equal(OFFICIAL_CONTACT.status, 'unconfirmed');
  });

  test('Sản phẩm gây quỹ có đủ 7 SKUs, actualStock null và saleStatus unconfirmed', () => {
    assert.equal(PRODUCTS.length, 7, 'Phải có đúng 7 SKUs.');
    for (const product of PRODUCTS) {
      assert.equal(product.actualStock, null);
      assert.equal(product.saleStatus, 'unconfirmed');
      assert.equal(product.assetId, null);
    }
  });

  test('5 SKUs ẩm thực có plannedQuantity.value === null (chưa có phân bổ số lượng từng SKU)', () => {
    const foodProducts = PRODUCTS.filter((p) => p.category === 'food');
    assert.equal(foodProducts.length, 5, 'Phải có 5 SKUs ẩm thực.');
    for (const food of foodProducts) {
      assert.equal(food.plannedQuantity.value, null, `${food.name} phải có plannedQuantity.value là null.`);
    }
  });

  test('Không còn tham chiếu tới túi bút hoặc túi vải cũ trong sản phẩm và chi phí', () => {
    const productIds = PRODUCTS.map((p) => p.id);
    assert.ok(!productIds.includes('tui-but'), 'Không được có túi bút.');
    assert.ok(!productIds.includes('tui-vai'), 'Không được có túi vải.');

    for (const expense of PLANNED_EXPENSES) {
      assert.ok(!expense.id.includes('tui-but'));
      assert.ok(!expense.id.includes('tui-vai'));
    }
  });
});

describe('Kiểm thử helpers hiển thị và quy tắc định dạng (Task C01)', () => {
  test('formatProductQuantity dẫn xuất đúng số lượng cho thủ công và Chưa xác nhận cho đồ ăn', () => {
    const chuonChuon = PRODUCTS.find((p) => p.id === 'chuon-chuon-tre-kem-de');
    const mocKhoa = PRODUCTS.find((p) => p.id === 'moc-khoa');
    const setDoAn = PRODUCTS.find((p) => p.id === 'set-do-an');

    assert.equal(formatProductQuantity(chuonChuon), '30 bộ bán dự kiến');
    assert.equal(formatProductQuantity(mocKhoa), '100 chiếc dự kiến');
    assert.equal(formatProductQuantity(setDoAn), 'Chưa xác nhận');

    const dummyUnknownQty = {
      ...chuonChuon,
      plannedQuantity: {
        ...chuonChuon.plannedQuantity,
        value: null,
      },
    };
    assert.equal(
      formatProductQuantity(dummyUnknownQty),
      'Chưa xác nhận',
      'Khi số lượng null, chỉ hiển thị "Chưa xác nhận".'
    );
  });

  test('formatProductPrice định dạng chuẩn cho cả 7 SKUs và không ghép đơn vị khi giá null', () => {
    const chuonChuon = PRODUCTS.find((p) => p.id === 'chuon-chuon-tre-kem-de');
    const mocKhoa = PRODUCTS.find((p) => p.id === 'moc-khoa');
    const setDoAn = PRODUCTS.find((p) => p.id === 'set-do-an');
    const comboNemGion = PRODUCTS.find((p) => p.id === 'combo-nem-gion');
    const banhSuKem = PRODUCTS.find((p) => p.id === 'banh-su-kem');

    assert.equal(formatProductPrice(chuonChuon), '40.000đ/bộ');
    assert.equal(formatProductPrice(mocKhoa), '10.000đ/chiếc');
    assert.equal(formatProductPrice(setDoAn), '79.000đ/set');
    assert.equal(formatProductPrice(comboNemGion), '40.000đ/set');
    assert.equal(formatProductPrice(banhSuKem), '20.000đ/hộp');

    const dummyUnknownPrice = {
      ...chuonChuon,
      referencePrice: {
        ...chuonChuon.referencePrice,
        value: null,
      },
    };
    assert.equal(
      formatProductPrice(dummyUnknownPrice),
      'Chưa xác nhận',
      'Khi giá null, chỉ hiển thị "Chưa xác nhận", không ghép đơn vị.'
    );
  });

  test('formatScenarioBalance phân biệt chính xác 4 trạng thái: âm, 0, dương, và unknown', () => {
    // 1. Âm
    const negativeRes = { projectedBalance: -220000 };
    const negDisplay = formatScenarioBalance(negativeRes);
    assert.equal(negDisplay.text, '-220.000đ');
    assert.equal(negDisplay.diffClass, 'diff-negative');
    assert.equal(negDisplay.isUnknown, false);

    // 2. Không (0)
    const zeroRes = { projectedBalance: 0 };
    const zeroDisplay = formatScenarioBalance(zeroRes);
    assert.equal(zeroDisplay.text, '0đ');
    assert.equal(zeroDisplay.diffClass, 'diff-neutral');
    assert.equal(zeroDisplay.isUnknown, false);

    // 3. Dương
    const posRes = { projectedBalance: 1765000 };
    const posDisplay = formatScenarioBalance(posRes);
    assert.equal(posDisplay.text, '+1.765.000đ');
    assert.equal(posDisplay.diffClass, 'diff-positive');
    assert.equal(posDisplay.isUnknown, false);

    // 4. Null / Unknown
    const nullDisplay = formatScenarioBalance(null);
    assert.equal(nullDisplay.text, 'Chưa xác nhận');
    assert.equal(nullDisplay.diffClass, 'diff-neutral');
    assert.equal(nullDisplay.isUnknown, true);

    const unknownRes = { projectedBalance: null };
    const unknownDisplay = formatScenarioBalance(unknownRes);
    assert.equal(unknownDisplay.text, 'Chưa xác nhận');
    assert.equal(unknownDisplay.diffClass, 'diff-neutral');
    assert.equal(unknownDisplay.isUnknown, true);
  });
});

describe('Kiểm thử đối chiếu doanh thu ẩm thực và kế hoạch (Task C02)', () => {
  test('calculateFoodReconciliation tính chuẩn xác 50 set × 79.000đ = 3.950.000đ và chênh lệch 550.000đ với inputs rõ ràng', () => {
    const setDoAn = PRODUCTS.find((p) => p.id === 'set-do-an');
    assert.ok(setDoAn, 'Phải tìm thấy SKU set-do-an.');

    const res = calculateFoodReconciliation(
      FINANCE_OVERVIEW.foodHypotheticalSets,
      setDoAn.referencePrice,
      FINANCE_OVERVIEW.foodPlannedRevenueAssumption,
      FINANCE_OVERVIEW.craftPlannedRevenue,
      FINANCE_OVERVIEW.plannedExpenseTotal
    );

    assert.equal(res.hypotheticalSets, 50);
    assert.equal(res.setUnitPrice, 79000);
    assert.equal(res.setsCalculatedRevenue, 3950000);
    assert.equal(res.targetFoodRevenue, 4500000);
    assert.equal(res.unallocatedGap, 550000);
    assert.equal(res.hypotheticalTotalCombinedRevenue, 6150000);
    assert.equal(res.hypotheticalProjectedBalance, 1215000);
  });

  test('calculateFoodReconciliation mặc định craftRevenue và totalExpense là null khi không truyền (không gán cứng ngân sách)', () => {
    const res = calculateFoodReconciliation(50, 79000, 4500000);

    assert.equal(res.hypotheticalSets, 50);
    assert.equal(res.setUnitPrice, 79000);
    assert.equal(res.setsCalculatedRevenue, 3950000);
    assert.equal(res.targetFoodRevenue, 4500000);
    assert.equal(res.unallocatedGap, 550000);
    // craft và expense không truyền -> kết quả kết hợp phải là null, không dùng số cứng 2.200.000đ / 4.935.000đ
    assert.equal(res.hypotheticalTotalCombinedRevenue, null);
    assert.equal(res.hypotheticalProjectedBalance, null);
  });

  test('calculateFoodReconciliation propagate null khi hypotheticalSets là null hoặc undefined (unknown count)', () => {
    // 1. null sets
    const resNull = calculateFoodReconciliation(null, 79000, 4500000, 2200000, 4935000);
    assert.equal(resNull.hypotheticalSets, null);
    assert.equal(resNull.setsCalculatedRevenue, null);
    assert.equal(resNull.unallocatedGap, null);
    assert.equal(resNull.hypotheticalTotalCombinedRevenue, null);
    assert.equal(resNull.hypotheticalProjectedBalance, null);

    // 2. undefined sets
    const resUndefined = calculateFoodReconciliation(undefined, 79000, 4500000);
    assert.equal(resUndefined.hypotheticalSets, null);
    assert.equal(resUndefined.setsCalculatedRevenue, null);
    assert.equal(resUndefined.unallocatedGap, null);

    // 3. QuantitativeFact với value: null
    const factNull = {
      value: null,
      unit: 'set',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: null,
      updatedAt: null,
      publicApproval: 'pending',
    };
    const resFactNull = calculateFoodReconciliation(factNull, 79000, 4500000);
    assert.equal(resFactNull.hypotheticalSets, null);
    assert.equal(resFactNull.setsCalculatedRevenue, null);
    assert.equal(resFactNull.unallocatedGap, null);
  });

  test('calculateFoodReconciliation xử lý an toàn khi giá set hoặc mục tiêu là null (propagate null)', () => {
    const resNullPrice = calculateFoodReconciliation(50, null, 4500000);
    assert.equal(resNullPrice.setsCalculatedRevenue, null);
    assert.equal(resNullPrice.unallocatedGap, null);
    assert.equal(resNullPrice.hypotheticalTotalCombinedRevenue, null);

    const resNullTarget = calculateFoodReconciliation(50, 79000, null);
    assert.equal(resNullTarget.setsCalculatedRevenue, 3950000);
    assert.equal(resNullTarget.unallocatedGap, null);
  });

  test('calculateFoodReconciliation tính toán động và chính xác với đơn giá và số lượng thay đổi (varied-price / varied-count)', () => {
    // Kịch bản A: 60 set với đơn giá 85.000đ, mục tiêu ẩm thực 5.500.000đ
    const resA = calculateFoodReconciliation(60, 85000, 5500000, 2000000, 5000000);
    assert.equal(resA.hypotheticalSets, 60);
    assert.equal(resA.setUnitPrice, 85000);
    assert.equal(resA.setsCalculatedRevenue, 5100000); // 60 * 85.000
    assert.equal(resA.targetFoodRevenue, 5500000);
    assert.equal(resA.unallocatedGap, 400000); // 5.500.000 - 5.100.000
    assert.equal(resA.hypotheticalTotalCombinedRevenue, 7100000); // 2.000.000 + 5.100.000
    assert.equal(resA.hypotheticalProjectedBalance, 2100000); // 7.100.000 - 5.000.000

    // Kịch bản B: 40 set với đơn giá 100.000đ, mục tiêu ẩm thực 3.500.000đ (vượt mục tiêu)
    const resB = calculateFoodReconciliation(40, 100000, 3500000, 1500000, 6000000);
    assert.equal(resB.hypotheticalSets, 40);
    assert.equal(resB.setUnitPrice, 100000);
    assert.equal(resB.setsCalculatedRevenue, 4000000); // 40 * 100.000
    assert.equal(resB.unallocatedGap, -500000); // 3.500.000 - 4.000.000 = -500.000 (vượt)
    assert.equal(resB.hypotheticalTotalCombinedRevenue, 5500000); // 1.500.000 + 4.000.000
    assert.equal(resB.hypotheticalProjectedBalance, -500000); // 5.500.000 - 6.000.000 (thâm hụt)
  });

  test('FINANCE_OVERVIEW không lưu trữ trường tính toán dẫn xuất cứng, tính động từ foodHypotheticalSets và SKU set-do-an', () => {
    assert.equal('foodCalculatedRevenueFromSets' in FINANCE_OVERVIEW, false, 'Không được lưu trữ foodCalculatedRevenueFromSets trong campaign.ts');
    assert.equal('foodUnallocatedRevenueGap' in FINANCE_OVERVIEW, false, 'Không được lưu trữ foodUnallocatedRevenueGap trong campaign.ts');
    assert.equal(FINANCE_OVERVIEW.foodHypotheticalSets, 50, 'Nguồn duy nhất cho số set giả định đề xuất là 50.');

    const setDoAn = PRODUCTS.find((p) => p.id === 'set-do-an');
    const dynamicRecon = calculateFoodReconciliation(
      FINANCE_OVERVIEW.foodHypotheticalSets,
      setDoAn.referencePrice,
      FINANCE_OVERVIEW.foodPlannedRevenueAssumption
    );
    assert.equal(dynamicRecon.setsCalculatedRevenue, 3950000);
    assert.equal(dynamicRecon.unallocatedGap, 550000);
  });
});

