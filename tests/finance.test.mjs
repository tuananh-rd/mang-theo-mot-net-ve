/**
 * Bộ kiểm thử logic tài chính và tính toàn vẹn dữ liệu cho Task C06 (Final PDF).
 * Chạy trên Node native test runner: node --test tests/finance.test.mjs
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
  calculateFoodRevenue,
  calculateBaseRevenue,
  calculateCombinedPlannedRevenue,
  calculateScenario,
  formatVND,
  formatProductQuantity,
  formatProductPrice,
  formatScenarioBalance,
  calculateFoodReconciliation,
  calculateCraftReconciliation,
  groupPlannedExpensesByCategory,
  buildProductCatalog,
  sumCatalogScenarioRevenue,
} from '../src/lib/finance.ts';

describe('Kiểm thử logic tài chính và tính toán (Task C06 - Final PDF)', () => {
  test('Tổng dự toán chi của 24 khoản mục đúng bằng 5.470.000đ theo 3 nhóm cụ thể', () => {
    assert.equal(PLANNED_EXPENSES.length, 24, 'Phải có đúng 24 khoản dự toán chi.');
    const total = sumPlannedExpenses(PLANNED_EXPENSES);
    assert.equal(total, 5470000, 'Tổng dự toán chi phải là 5.470.000đ.');

    // Nhóm 1: Nguyên liệu gây quỹ (trang 29) = 2.480.000đ (14 khoản)
    const group1 = PLANNED_EXPENSES.filter((i) => i.amount.sourceRef === 'proposal-final:page-29');
    assert.equal(group1.length, 14, 'Nhóm 1 phải có 14 khoản.');
    const group1Total = sumPlannedExpenses(group1);
    assert.equal(group1Total, 2480000, 'Nhóm 1 phải có tổng là 2.480.000đ.');

    // Nhóm 2: Vật tư workshop & quà tặng (trang 30) = 1.860.000đ (7 khoản)
    const group2 = PLANNED_EXPENSES.filter((i) => i.amount.sourceRef === 'proposal-final:page-30');
    assert.equal(group2.length, 7, 'Nhóm 2 phải có 7 khoản.');
    const group2Total = sumPlannedExpenses(group2);
    assert.equal(group2Total, 1860000, 'Nhóm 2 phải có tổng là 1.860.000đ.');

    // Nhóm 3: Truyền thông & Di chuyển (trang 31) = 1.130.000đ (3 khoản)
    const group3 = PLANNED_EXPENSES.filter((i) => i.amount.sourceRef === 'proposal-final:page-31');
    assert.equal(group3.length, 3, 'Nhóm 3 phải có 3 khoản.');
    const group3Total = sumPlannedExpenses(group3);
    assert.equal(group3Total, 1130000, 'Nhóm 3 phải có tổng là 1.130.000đ.');

    assert.equal(group1Total + group2Total + group3Total, 5470000);
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

  test('Doanh thu kịch bản ẩm thực cơ sở tính đúng 50 set × 79.000đ + 50 bánh su kem × 20.000đ = 4.950.000đ', () => {
    const setDoAn = PRODUCTS.find((p) => p.id === 'set-do-an');
    const banhSuKem = PRODUCTS.find((p) => p.id === 'banh-su-kem');

    assert.ok(setDoAn, 'Phải tìm thấy sản phẩm set đồ ăn.');
    assert.ok(banhSuKem, 'Phải tìm thấy sản phẩm bánh su kem.');

    assert.equal(calculateProductRevenue(setDoAn), 3950000); // 50 × 79.000đ
    assert.equal(calculateProductRevenue(banhSuKem), 1000000); // 50 × 20.000đ

    const foodRevenue = calculateFoodRevenue(PRODUCTS);
    assert.equal(foodRevenue, 4950000, 'Doanh thu ẩm thực cơ sở phải là 4.950.000đ.');
  });

  test('Bắt lỗi cộng nhầm combo vào doanh thu cơ sở (3 combo nem bị loại khỏi kịch bản cơ sở)', () => {
    const combos = PRODUCTS.filter((p) => p.id.startsWith('combo-'));
    assert.equal(combos.length, 3, 'Phải có đúng 3 combo nem.');

    for (const combo of combos) {
      assert.equal(combo.isBaseRevenueItem, false, `${combo.id} phải có isBaseRevenueItem === false.`);
      assert.equal(combo.plannedQuantity.value, 60, `${combo.id} ghi số lượng đề xuất 60 trong nguồn.`);
    }

    // calculateTotalRevenueScenario ném lỗi khi cố tính trên toàn bộ 7 SKUs chứa combo
    assert.throws(
      () => calculateTotalRevenueScenario(PRODUCTS),
      /không thuộc doanh thu cơ sở/,
      'calculateTotalRevenueScenario phải ném lỗi khi cố sum cả 7 SKUs chứa combo.'
    );

    // Nếu cố tình cộng cả 3 combo (60 × 40k + 60 × 40k + 60 × 60k = 8.400.000đ)
    // thì tổng sẽ bị phóng đại lên 15.550.000đ
    const totalWithCombos = calculateTotalRevenueScenario(PRODUCTS, { allowExcludedCombos: true });
    assert.equal(totalWithCombos, 15550000, 'Tổng bao gồm cả 3 combo là 15.550.000đ, không phải doanh thu cơ sở.');

    // Doanh thu kịch bản cơ sở chuẩn xác chỉ là 7.150.000đ
    assert.equal(calculateBaseRevenue(PRODUCTS), 7150000);
  });

  test('calculateCombinedPlannedRevenue kết hợp đúng doanh thu thủ công và ẩm thực cơ sở (2.200.000đ + 4.950.000đ = 7.150.000đ)', () => {
    const craftRev = calculateCraftRevenue(PRODUCTS);
    const foodRev = calculateFoodRevenue(PRODUCTS);
    assert.equal(craftRev, 2200000);
    assert.equal(foodRev, 4950000);

    const combinedRev = calculateCombinedPlannedRevenue(craftRev, foodRev);
    assert.equal(combinedRev, 7150000, 'Tổng doanh thu kịch bản cơ sở kết hợp phải là 7.150.000đ.');
  });

  test('calculateCombinedPlannedRevenue propagate null khi một trong hai nguồn là null (không tự về 0)', () => {
    assert.equal(calculateCombinedPlannedRevenue(null, 4950000), null);
    assert.equal(calculateCombinedPlannedRevenue(2200000, null), null);
    assert.equal(calculateCombinedPlannedRevenue(null, null), null);
  });

  test('Bắt lỗi trừ su kem hai lần trong đối soát lãi ẩm thực (làm rõ khoản chênh 400.000đ)', () => {
    const groups = groupPlannedExpensesByCategory(PLANNED_EXPENSES);
    const foodGroup = groups.find((g) => g.category === 'Nguyên liệu gây quỹ');
    assert.ok(foodGroup);
    assert.equal(foodGroup.subtotal, 2480000);

    // Khoản chi su kem 400.000đ đã nằm trong nhóm 2.480.000đ
    const suKemExpense = foodGroup.items.find((i) => i.id === 'banh-su-kem');
    assert.ok(suKemExpense);
    assert.equal(suKemExpense.amount.value, 400000);

    // Tính đối soát
    const setDoAn = PRODUCTS.find((p) => p.id === 'set-do-an');
    const banhSuKem = PRODUCTS.find((p) => p.id === 'banh-su-kem');
    const recon = calculateFoodReconciliation(
      50,
      setDoAn?.referencePrice,
      FINANCE_OVERVIEW.foodPlannedRevenueAssumption,
      2200000,
      5470000,
      50,
      banhSuKem?.referencePrice,
      foodGroup.subtotal,
      FINANCE_OVERVIEW.foodProfitQuote
    );

    // Doanh thu ẩm thực = 4.950.000đ
    assert.equal(recon.totalCoreFoodRevenue, 4950000);
    // Doanh thu trừ chi phí ẩm thực thực tế = 4.950.000đ − 2.480.000đ = 2.470.000đ
    assert.equal(recon.foodRevenueMinusExpenses, 2470000);
    // Số lãi ghi trong PDF = 2.070.000đ
    assert.equal(recon.foodProfitQuote, 2070000);
    // Khoản chênh lệch đúng bằng 400.000đ (bằng đúng chi phí mua bánh su kem bị trừ 2 lần)
    assert.equal(recon.foodProfitGap, 400000);
  });

  test('Đối soát lãi thủ công làm rõ khoản chênh 400.000đ do phân bổ chi phí nội bộ', () => {
    const groups = groupPlannedExpensesByCategory(PLANNED_EXPENSES);
    const workshopGroup = groups.find((g) => g.category === 'Vật tư workshop & quà tặng');
    assert.ok(workshopGroup);
    assert.equal(workshopGroup.subtotal, 1860000);

    const chuonChuon = PRODUCTS.find((p) => p.id === 'chuon-chuon-tre-kem-de');
    const mocKhoa = PRODUCTS.find((p) => p.id === 'moc-khoa');

    const craftRecon = calculateCraftReconciliation(
      chuonChuon?.plannedQuantity,
      chuonChuon?.referencePrice,
      mocKhoa?.plannedQuantity,
      mocKhoa?.referencePrice,
      workshopGroup.subtotal,
      FINANCE_OVERVIEW.craftProfitQuote
    );

    // Doanh thu thủ công = 2.200.000đ
    assert.equal(craftRecon.totalCraftRevenue, 2200000);
    // Doanh thu trừ chi phí workshop = 2.200.000đ − 1.860.000đ = 340.000đ
    assert.equal(craftRecon.craftRevenueMinusExpenses, 340000);
    // Lãi thủ công ghi trong PDF = 740.000đ
    assert.equal(craftRecon.craftProfitQuote, 740000);
    // Khoản chênh lệch = 740.000đ − 340.000đ = 400.000đ
    assert.equal(craftRecon.craftProfitGap, 400000);
  });

  test('Chênh lệch 400.000đ bù trừ giữa ẩm thực và thủ công, tổng số dư toàn dự án khớp chuẩn xác 1.680.000đ', () => {
    // Tổng lãi theo công thức chi phí phân nhóm:
    // 2.470.000đ (ẩm thực) + 340.000đ (thủ công) = 2.810.000đ
    const directTotalProfit = 2470000 + 340000;
    assert.equal(directTotalProfit, 2810000);

    // Tổng lãi theo số PDF ghi:
    // 2.070.000đ (ẩm thực) + 740.000đ (thủ công) = 2.810.000đ
    const pdfTotalProfit = 2070000 + 740000;
    assert.equal(pdfTotalProfit, 2810000);

    // Trừ đi chi phí truyền thông & di chuyển (1.130.000đ):
    // 2.810.000đ − 1.130.000đ = 1.680.000đ
    const finalBalance = directTotalProfit - 1130000;
    assert.equal(finalBalance, 1680000);
    assert.equal(finalBalance, FINANCE_OVERVIEW.unfundedProjectedBalance);
  });

  test('Kịch bản cơ sở — Chi 5.470.000đ, Thu cơ sở 7.150.000đ => Dư trước quà +1.680.000đ', () => {
    const s1 = FINANCE_SCENARIOS.find((s) => s.id === 'chua-tinh-tai-tro');
    assert.ok(s1);

    const result = calculateScenario(s1, 7150000, 5470000);
    assert.ok(result);
    assert.equal(result.inKindReplacement, 0);
    assert.equal(result.remainingCashExpense, 5470000);
    assert.equal(result.projectedRevenue, 7150000);
    assert.equal(result.projectedBalance, 1680000);
    assert.equal(result.isDeficit, false);
    assert.equal(result.balanceText, 'Dư 1.680.000đ');
  });

  test('Bắt lỗi hiện vật cộng vào doanh thu (hiện vật chỉ giảm chi tiền còn lại, không tăng doanh thu tiền)', () => {
    const s500k = FINANCE_SCENARIOS.find((s) => s.id === 'tai-tro-qua-tang-500k');
    assert.ok(s500k);

    const res = calculateScenario(s500k, 7150000, 5470000);
    assert.ok(res);
    // Doanh thu tiền không thay đổi: vẫn là 7.150.000đ, KHÔNG thành 7.650.000đ
    assert.equal(res.projectedRevenue, 7150000);
    // Chi tiền giảm từ 5.470.000đ xuống 4.970.000đ
    assert.equal(res.remainingCashExpense, 4970000);
    // Số dư = 7.150.000đ − 4.970.000đ = 2.180.000đ
    assert.equal(res.projectedBalance, 2180000);
  });

  test('Tất cả 5 kịch bản tài trợ tại trang 32 khớp chuẩn xác số dư theo đề xuất Final', () => {
    const expected = [
      { id: 'chua-tinh-tai-tro', inKind: 0, expenseRemaining: 5470000, balance: 1680000 },
      { id: 'tai-tro-qua-tang-500k', inKind: 500000, expenseRemaining: 4970000, balance: 2180000 },
      { id: 'tai-tro-nguyen-lieu-do-an', inKind: 2480000, expenseRemaining: 2990000, balance: 4160000 },
      { id: 'tai-tro-vat-tu-workshop', inKind: 1860000, expenseRemaining: 3610000, balance: 3540000 },
      { id: 'tai-tro-truyen-thong-di-chuyen', inKind: 1130000, expenseRemaining: 4340000, balance: 2810000 },
    ];

    for (const exp of expected) {
      const scenario = FINANCE_SCENARIOS.find((s) => s.id === exp.id);
      assert.ok(scenario, `Phải tìm thấy kịch bản ${exp.id}`);
      const res = calculateScenario(scenario, 7150000, 5470000);
      assert.ok(res);
      assert.equal(res.inKindReplacement, exp.inKind);
      assert.equal(res.remainingCashExpense, exp.expenseRemaining);
      assert.equal(res.projectedBalance, exp.balance);
    }
  });

  test('calculateScenario trả về null khi dữ liệu doanh thu hoặc chi phí chưa biết (null)', () => {
    const s = FINANCE_SCENARIOS[0];
    assert.equal(calculateScenario(s, null, 5470000), null);
    assert.equal(calculateScenario(s, 7150000, null), null);
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
    assert.throws(() => calculateScenario(invalidScenarioOver, 7150000, 5470000), /vượt quá tổng dự toán/);

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
    assert.throws(() => calculateScenario(invalidScenarioNeg, 7150000, 5470000), /không được là số âm/);
  });

  test('Định dạng formatVND xử lý chuẩn xác số dương, 0 và null', () => {
    assert.equal(formatVND(5470000), '5.470.000đ');
    assert.equal(formatVND(7150000), '7.150.000đ');
    assert.equal(formatVND(1680000), '1.680.000đ');
    assert.equal(formatVND(0), '0đ');
    assert.equal(formatVND(null), 'Chưa xác nhận');
    assert.equal(formatVND(undefined), 'Chưa xác nhận');
  });
});

describe('Kiểm tra tính toàn vẹn dữ liệu và an toàn thông tin (Task C06)', () => {
  test('Toàn bộ số liệu thực tế được khởi tạo ở trạng thái null / chưa xác nhận (không tự gán 0)', () => {
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

  test('Toàn bộ 24 khoản dự toán có sourceRef theo mẫu proposal-final:page-N (không còn proposal cũ)', () => {
    for (const expense of PLANNED_EXPENSES) {
      assert.ok(
        expense.amount.sourceRef && expense.amount.sourceRef.startsWith('proposal-final:page-'),
        `Khoản ${expense.id} phải có sourceRef dạng proposal-final:page-N, thực tế là ${expense.amount.sourceRef}`
      );
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

describe('Kiểm thử helpers hiển thị và quy tắc định dạng (Task C06)', () => {
  test('formatProductQuantity dẫn xuất đúng số lượng cho cả 7 SKUs', () => {
    const chuonChuon = PRODUCTS.find((p) => p.id === 'chuon-chuon-tre-kem-de');
    const mocKhoa = PRODUCTS.find((p) => p.id === 'moc-khoa');
    const setDoAn = PRODUCTS.find((p) => p.id === 'set-do-an');
    const banhSuKem = PRODUCTS.find((p) => p.id === 'banh-su-kem');
    const comboNemGion = PRODUCTS.find((p) => p.id === 'combo-nem-gion');

    assert.equal(formatProductQuantity(chuonChuon), '30 bộ bán dự kiến');
    assert.equal(formatProductQuantity(mocKhoa), '100 chiếc dự kiến');
    assert.equal(formatProductQuantity(setDoAn), '50 set dự kiến');
    assert.equal(formatProductQuantity(banhSuKem), '50 hộp dự kiến');
    assert.equal(formatProductQuantity(comboNemGion), '60 suất đề xuất');

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
    const posRes = { projectedBalance: 1680000 };
    const posDisplay = formatScenarioBalance(posRes);
    assert.equal(posDisplay.text, '+1.680.000đ');
    assert.equal(posDisplay.diffClass, 'diff-positive');
    assert.equal(posDisplay.isUnknown, false);

    // 4. Null / Unknown
    const nullDisplay = formatScenarioBalance(null);
    assert.equal(nullDisplay.text, 'Chưa xác nhận');
    assert.equal(nullDisplay.diffClass, 'diff-neutral');
    assert.equal(nullDisplay.isUnknown, true);
  });
});

describe('Kiểm thử phân nhóm chi phí dự toán (Task C06)', () => {
  test('groupPlannedExpensesByCategory phân đúng 3 nhóm từ PLANNED_EXPENSES với tổng phụ 2.480k, 1.860k, 1.130k', () => {
    const groups = groupPlannedExpensesByCategory(PLANNED_EXPENSES);
    assert.equal(groups.length, 3, 'Phải có đúng 3 nhóm chi phí từ PLANNED_EXPENSES.');

    const [group1, group2, group3] = groups;

    // Nhóm 1: Nguyên liệu gây quỹ (14 khoản)
    assert.equal(group1.category, 'Nguyên liệu gây quỹ');
    assert.equal(group1.sourceRef, 'proposal-final:page-29');
    assert.equal(group1.items.length, 14);
    assert.equal(group1.subtotal, 2480000);

    // Nhóm 2: Vật tư workshop & quà tặng (7 khoản)
    assert.equal(group2.category, 'Vật tư workshop & quà tặng');
    assert.equal(group2.sourceRef, 'proposal-final:page-30');
    assert.equal(group2.items.length, 7);
    assert.equal(group2.subtotal, 1860000);

    // Nhóm 3: Truyền thông & Di chuyển (3 khoản)
    assert.equal(group3.category, 'Truyền thông & Di chuyển');
    assert.equal(group3.sourceRef, 'proposal-final:page-31');
    assert.equal(group3.items.length, 3);
    assert.equal(group3.subtotal, 1130000);

    // Tổng 3 nhóm
    assert.equal(
      group1.subtotal + group2.subtotal + group3.subtotal,
      5470000,
      'Tổng 3 nhóm phải bằng 5.470.000đ.'
    );
    assert.equal(
      group1.subtotal + group2.subtotal + group3.subtotal,
      sumPlannedExpenses(PLANNED_EXPENSES)
    );

    // Kiểm tra tính toàn vẹn: mỗi khoản mục thuộc đúng 1 nhóm duy nhất
    const allGroupedItemIds = groups.flatMap((g) => g.items.map((i) => i.id));
    assert.equal(allGroupedItemIds.length, PLANNED_EXPENSES.length);
    assert.deepEqual(allGroupedItemIds, PLANNED_EXPENSES.map((i) => i.id));
  });

  test('groupPlannedExpensesByCategory bảo vệ an toàn khi có khoản mục unknown (subtotal = null, không crash)', () => {
    const mockItemsWithNull = [
      {
        id: 'mock-known',
        category: 'Nguyên liệu gây quỹ',
        title: 'Mock known',
        calculationText: '300k',
        amount: { value: 300000, unit: 'đ', kind: 'planned', verification: 'unverified', sourceRef: 'p29', updatedAt: null, publicApproval: 'pending' },
        note: '',
        isEstimated: false,
      },
      {
        id: 'mock-unknown',
        category: 'Nguyên liệu gây quỹ',
        title: 'Mock unknown',
        calculationText: 'Chưa rõ',
        amount: { value: null, unit: 'đ', kind: 'planned', verification: 'unverified', sourceRef: 'p29', updatedAt: null, publicApproval: 'pending' },
        note: '',
        isEstimated: false,
      },
      {
        id: 'mock-workshop',
        category: 'Vật tư workshop & quà tặng',
        title: 'Workshop',
        calculationText: '200k',
        amount: { value: 200000, unit: 'đ', kind: 'planned', verification: 'unverified', sourceRef: 'p30', updatedAt: null, publicApproval: 'pending' },
        note: '',
        isEstimated: false,
      },
    ];

    const groups = groupPlannedExpensesByCategory(mockItemsWithNull);
    assert.equal(groups.length, 2, 'Chỉ trả về 2 nhóm có dữ liệu đầu vào.');
    assert.equal(groups[0].subtotal, null, 'Nhóm chứa khoản unknown phải có subtotal: null');
    assert.equal(groups[1].subtotal, 200000, 'Nhóm không chứa khoản unknown vẫn tính đúng subtotal');
  });
});

describe('Kiểm thử hồi quy: Lan truyền null trong calculateFoodReconciliation', () => {
  const setPrice = 79000;
  const suKemPrice = 20000;
  const targetFoodRevenue = 4950000;
  const craftRev = 2200000;
  const totalExp = 5470000;
  const foodExp = 2480000;
  const foodProfitQuote = 2070000;

  test('Khi đầy đủ dữ liệu ẩm thực, cho kết quả chuẩn xác 4.950.000đ, 7.150.000đ, 1.680.000đ', () => {
    const res = calculateFoodReconciliation(
      50,
      setPrice,
      targetFoodRevenue,
      craftRev,
      totalExp,
      50,
      suKemPrice,
      foodExp,
      foodProfitQuote
    );

    assert.equal(res.setsCalculatedRevenue, 3950000);
    assert.equal(res.suKemCalculatedRevenue, 1000000);
    assert.equal(res.totalCoreFoodRevenue, 4950000);
    assert.equal(res.hypotheticalTotalCombinedRevenue, 7150000);
    assert.equal(res.hypotheticalProjectedBalance, 1680000);
    assert.equal(res.foodRevenueMinusExpenses, 2470000);
    assert.equal(res.foodProfitGap, 400000);
    assert.equal(res.unallocatedGap, 0);
  });

  test('Khi suKemQuantity là null: giữ subtotal của set, nhưng lan truyền null cho coreFood, combined, balance, profit và gap', () => {
    const res = calculateFoodReconciliation(
      50,
      setPrice,
      targetFoodRevenue,
      craftRev,
      totalExp,
      null, // suKemQuantity null
      suKemPrice,
      foodExp,
      foodProfitQuote
    );

    assert.equal(res.setsCalculatedRevenue, 3950000, 'Subtotal của set đồ ăn phải được giữ nguyên');
    assert.equal(res.suKemCalculatedRevenue, null, 'Subtotal của su kem phải là null');
    assert.equal(res.totalCoreFoodRevenue, null, 'totalCoreFoodRevenue không được fallback về set subtotal mà phải là null');
    assert.equal(res.hypotheticalTotalCombinedRevenue, null, 'combined revenue phải lan truyền null');
    assert.equal(res.hypotheticalProjectedBalance, null, 'projected balance phải lan truyền null');
    assert.equal(res.foodRevenueMinusExpenses, null, 'food revenue minus expenses phải lan truyền null');
    assert.equal(res.foodProfitGap, null, 'food profit gap phải lan truyền null');
    assert.equal(res.unallocatedGap, null, 'unallocated gap phải lan truyền null');
  });

  test('Khi suKemQuantity là undefined: lan truyền null tương tự', () => {
    const res = calculateFoodReconciliation(
      50,
      setPrice,
      targetFoodRevenue,
      craftRev,
      totalExp,
      undefined,
      suKemPrice,
      foodExp,
      foodProfitQuote
    );

    assert.equal(res.setsCalculatedRevenue, 3950000);
    assert.equal(res.suKemCalculatedRevenue, null);
    assert.equal(res.totalCoreFoodRevenue, null);
    assert.equal(res.hypotheticalTotalCombinedRevenue, null);
    assert.equal(res.hypotheticalProjectedBalance, null);
    assert.equal(res.foodRevenueMinusExpenses, null);
    assert.equal(res.foodProfitGap, null);
  });

  test('Khi suKemQuantity là QuantitativeFact với value: null: lan truyền null tương tự', () => {
    const factNull = {
      value: null,
      unit: 'hộp',
      kind: 'planned',
      verification: 'unverified',
      sourceRef: null,
      updatedAt: null,
      publicApproval: 'pending',
    };

    const res = calculateFoodReconciliation(
      50,
      setPrice,
      targetFoodRevenue,
      craftRev,
      totalExp,
      factNull,
      suKemPrice,
      foodExp,
      foodProfitQuote
    );

    assert.equal(res.setsCalculatedRevenue, 3950000);
    assert.equal(res.suKemCalculatedRevenue, null);
    assert.equal(res.totalCoreFoodRevenue, null);
    assert.equal(res.hypotheticalTotalCombinedRevenue, null);
    assert.equal(res.hypotheticalProjectedBalance, null);
  });

  test('Khi hypotheticalSets hoặc setPrice là null/undefined/fact(null): giữ subtotal của su kem nhưng lan truyền null cho tổng', () => {
    const res = calculateFoodReconciliation(
      null,
      setPrice,
      targetFoodRevenue,
      craftRev,
      totalExp,
      50,
      suKemPrice,
      foodExp,
      foodProfitQuote
    );

    assert.equal(res.setsCalculatedRevenue, null);
    assert.equal(res.suKemCalculatedRevenue, 1000000, 'Subtotal của su kem phải được giữ nguyên');
    assert.equal(res.totalCoreFoodRevenue, null, 'totalCoreFoodRevenue phải là null');
    assert.equal(res.hypotheticalTotalCombinedRevenue, null);
    assert.equal(res.hypotheticalProjectedBalance, null);
    assert.equal(res.foodRevenueMinusExpenses, null);
    assert.equal(res.foodProfitGap, null);
  });
});

describe('Kiểm thử danh mục sản phẩm hiển thị (Task C07)', () => {
  test('buildProductCatalog: 4 mặt hàng cơ sở cộng đúng 7.150.000đ, 3 combo không có doanh thu kịch bản', () => {
    const rows = buildProductCatalog(PRODUCTS);
    assert.equal(rows.length, 7);
    const combos = rows.filter((r) => !r.inBaseScenario);
    assert.deepEqual(
      combos.map((r) => r.product.id).sort(),
      ['combo-nem-gion', 'combo-nem-pho-mai', 'combo-nem-xu']
    );
    for (const r of combos) assert.equal(r.scenarioRevenue, null);
    assert.equal(sumCatalogScenarioRevenue(rows), 7150000);
    assert.equal(sumCatalogScenarioRevenue(rows), calculateBaseRevenue(PRODUCTS));
  });

  test('buildProductCatalog giữ null khi thiếu số lượng và tổng trả về null thay vì bỏ qua', () => {
    const broken = PRODUCTS.map((p) =>
      p.id === 'banh-su-kem'
        ? { ...p, plannedQuantity: { ...p.plannedQuantity, value: null } }
        : p
    );
    const rows = buildProductCatalog(broken);
    const suKem = rows.find((r) => r.product.id === 'banh-su-kem');
    assert.equal(suKem.scenarioRevenue, null);
    assert.equal(suKem.quantityText, 'Chưa xác nhận');
    assert.equal(sumCatalogScenarioRevenue(rows), null);
  });
});
