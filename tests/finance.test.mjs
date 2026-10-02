/**
 * Bộ kiểm thử logic tài chính và tính toàn vẹn dữ liệu cho Task T03.
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
  calculateScenario,
  formatVND,
  formatProductQuantity,
  formatProductPrice,
  formatScenarioBalance,
} from '../src/lib/finance.ts';

describe('Kiểm thử logic tài chính và tính toán (Task T03)', () => {
  test('Tổng dự toán chi của 6 khoản mục đúng bằng 3.120.000đ', () => {
    assert.equal(PLANNED_EXPENSES.length, 6, 'Phải có đúng 6 khoản dự toán chi.');
    const total = sumPlannedExpenses(PLANNED_EXPENSES);
    assert.equal(total, 3120000, 'Tổng dự toán chi phải là 3.120.000đ.');
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
      'Hàm sumPlannedExpenses phải ném lỗi khi gặp giá trị null thay vì trả về 100.000đ.'
    );
  });

  test('Doanh thu kịch bản từng sản phẩm tính đúng theo giá tham khảo × số lượng kế hoạch', () => {
    const chuonChuon = PRODUCTS.find((p) => p.id === 'chuon-chuon-tre-kem-de');
    const tuiBut = PRODUCTS.find((p) => p.id === 'tui-but');
    const tuiVai = PRODUCTS.find((p) => p.id === 'tui-vai');

    assert.ok(chuonChuon, 'Phải tìm thấy sản phẩm chuồn chuồn tre.');
    assert.ok(tuiBut, 'Phải tìm thấy sản phẩm túi bút.');
    assert.ok(tuiVai, 'Phải tìm thấy sản phẩm túi vải.');

    // 30 × 40.000 = 1.200.000đ
    assert.equal(calculateProductRevenue(chuonChuon), 1200000);
    // 20 × 55.000 = 1.100.000đ
    assert.equal(calculateProductRevenue(tuiBut), 1100000);
    // 8 × 75.000 = 600.000đ
    assert.equal(calculateProductRevenue(tuiVai), 600000);
  });

  test('Tổng doanh thu kịch bản bán đủ hàng đúng bằng 2.900.000đ', () => {
    const totalRev = calculateTotalRevenueScenario(PRODUCTS);
    assert.equal(totalRev, 2900000, 'Tổng doanh thu kịch bản bán đủ hàng phải là 2.900.000đ.');
  });

  test('Kịch bản 1 — Chưa tính tài trợ: Chi 3.120.000đ, Thu 2.900.000đ => Thiếu 220.000đ', () => {
    const s1 = FINANCE_SCENARIOS.find((s) => s.id === 'chua-tinh-tai-tro');
    assert.ok(s1);

    const result = calculateScenario(s1, 2900000, 3120000);
    assert.ok(result);
    assert.equal(result.inKindReplacement, 0);
    assert.equal(result.remainingCashExpense, 3120000);
    assert.equal(result.projectedRevenue, 2900000);
    assert.equal(result.projectedBalance, -220000);
    assert.equal(result.isDeficit, true);
    assert.equal(result.balanceText, 'Thiếu 220.000đ');
  });

  test('Kịch bản 2 — Hiện vật thay một phần (500.000đ): Chi tiền còn 2.620.000đ => Dư 280.000đ', () => {
    const s2 = FINANCE_SCENARIOS.find((s) => s.id === 'thay-mot-phan');
    assert.ok(s2);

    const result = calculateScenario(s2, 2900000, 3120000);
    assert.ok(result);
    assert.equal(result.inKindReplacement, 500000);
    assert.equal(result.remainingCashExpense, 2620000);
    assert.equal(result.projectedRevenue, 2900000, 'Doanh thu không được cộng dồn giá trị hiện vật.');
    assert.equal(result.projectedBalance, 280000);
    assert.equal(result.isDeficit, false);
    assert.equal(result.balanceText, 'Dư 280.000đ');
  });

  test('Kịch bản 3 — Hiện vật thay chi workshop (1.120.000đ): Chi tiền còn 2.000.000đ => Dư 900.000đ', () => {
    const s3 = FINANCE_SCENARIOS.find((s) => s.id === 'thay-chi-workshop');
    assert.ok(s3);

    const result = calculateScenario(s3, 2900000, 3120000);
    assert.ok(result);
    assert.equal(result.inKindReplacement, 1120000);
    assert.equal(result.remainingCashExpense, 2000000);
    assert.equal(result.projectedRevenue, 2900000);
    assert.equal(result.projectedBalance, 900000);
    assert.equal(result.isDeficit, false);
    assert.equal(result.balanceText, 'Dư 900.000đ');
  });

  test('calculateScenario trả về null khi dữ liệu doanh thu hoặc chi phí chưa biết (null)', () => {
    const s = FINANCE_SCENARIOS[0];
    assert.equal(calculateScenario(s, null, 3120000), null);
    assert.equal(calculateScenario(s, 2900000, null), null);
  });

  test('calculateScenario ném lỗi khi hiện vật vượt quá tổng chi hoặc là số âm', () => {
    const invalidScenarioOver = {
      id: 'invalid-over',
      title: 'Vượt chi',
      description: '',
      inKindReplacement: {
        value: 5000000,
        unit: 'đ',
        kind: 'planned',
        verification: 'unverified',
        sourceRef: null,
        updatedAt: null,
        publicApproval: 'pending',
      },
      note: '',
    };
    assert.throws(() => calculateScenario(invalidScenarioOver, 2900000, 3120000), /vượt quá tổng dự toán/);

    const invalidScenarioNeg = {
      id: 'invalid-neg',
      title: 'Số âm',
      description: '',
      inKindReplacement: {
        value: -1000,
        unit: 'đ',
        kind: 'planned',
        verification: 'unverified',
        sourceRef: null,
        updatedAt: null,
        publicApproval: 'pending',
      },
      note: '',
    };
    assert.throws(() => calculateScenario(invalidScenarioNeg, 2900000, 3120000), /không được là số âm/);
  });

  test('Định dạng formatVND xử lý chuẩn xác số dương, 0 và null', () => {
    assert.equal(formatVND(3120000), '3.120.000đ');
    assert.equal(formatVND(0), '0đ');
    assert.equal(formatVND(null), 'Chưa xác nhận');
    assert.equal(formatVND(undefined), 'Chưa xác nhận');
  });
});

describe('Kiểm tra tính toàn vẹn dữ liệu và an toàn thông tin (Task T03)', () => {
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

  test('Sản phẩm gây quỹ giữ nguyên trạng thái actualStock null và saleStatus unconfirmed', () => {
    for (const product of PRODUCTS) {
      assert.equal(product.actualStock, null);
      assert.equal(product.saleStatus, 'unconfirmed');
    }
  });
});

describe('Kiểm thử helpers hiển thị và quy tắc định dạng (Task T04 / R04)', () => {
  test('formatProductQuantity dẫn xuất đúng số lượng, tiền tố và đơn vị', () => {
    const chuonChuon = PRODUCTS.find((p) => p.id === 'chuon-chuon-tre-kem-de');
    const tuiBut = PRODUCTS.find((p) => p.id === 'tui-but');
    const tuiVai = PRODUCTS.find((p) => p.id === 'tui-vai');

    assert.equal(formatProductQuantity(chuonChuon), '30 bộ bán dự kiến');
    assert.equal(formatProductQuantity(tuiBut), '20 chiếc dự kiến');
    assert.equal(formatProductQuantity(tuiVai), 'Tối đa 8 chiếc');

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
      'Khi số lượng null, chỉ hiển thị "Chưa xác nhận", không tự suy diễn số cũ.'
    );
  });

  test('formatProductPrice định dạng chuẩn và không ghép đơn vị khi giá null', () => {
    const chuonChuon = PRODUCTS.find((p) => p.id === 'chuon-chuon-tre-kem-de');
    const tuiBut = PRODUCTS.find((p) => p.id === 'tui-but');

    assert.equal(formatProductPrice(chuonChuon), '40.000đ/bộ');
    assert.equal(formatProductPrice(tuiBut), '55.000đ/chiếc');

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
      'Khi giá null, chỉ hiển thị "Chưa xác nhận", không ghép thành "Chưa xác nhận/bộ".'
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
    const posRes = { projectedBalance: 280000 };
    const posDisplay = formatScenarioBalance(posRes);
    assert.equal(posDisplay.text, '+280.000đ');
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

