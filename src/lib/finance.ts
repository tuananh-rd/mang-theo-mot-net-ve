/**
 * Logic tính toán và kiểm tra dữ liệu tài chính cho chiến dịch Mang Theo Một Nét Vẽ.
 * Tuân thủ docs/data-and-finance.md và docs/task-specs/T03.md:
 * - Dùng số nguyên VND.
 * - Tách biệt kế hoạch với thực tế.
 * - Hiện vật thay chi tiền chỉ giảm chi phí tiền một lần, không cộng vào doanh thu tiền.
 * - Không tự ý chuyển giá trị null / chưa biết thành 0.
 */

import type { Product, PlannedExpenseItem, FinanceScenario } from '../data/campaign';

/**
 * Tính tổng dự toán chi từ danh sách các khoản chi dự kiến.
 * Nếu bất kỳ khoản nào có giá trị null, ném lỗi thay vì tự coi là 0.
 */
export function sumPlannedExpenses(items: PlannedExpenseItem[]): number {
  return items.reduce((sum, item) => {
    if (item.amount.value === null || item.amount.value === undefined) {
      throw new Error(`Khoản dự toán "${item.id}" không có giá trị (null).`);
    }
    return sum + item.amount.value;
  }, 0);
}

/**
 * Tính doanh thu giả định cho từng sản phẩm theo công thức:
 * Doanh thu = Giá tham khảo × Số lượng dự kiến.
 */
export function calculateProductRevenue(product: Product): number {
  if (product.referencePrice.value === null || product.referencePrice.value === undefined) {
    throw new Error(`Sản phẩm "${product.id}" chưa có giá tham khảo.`);
  }
  if (product.plannedQuantity.value === null || product.plannedQuantity.value === undefined) {
    throw new Error(`Sản phẩm "${product.id}" chưa có số lượng kế hoạch.`);
  }
  return product.referencePrice.value * product.plannedQuantity.value;
}

/**
 * Tính tổng doanh thu kịch bản từ danh sách sản phẩm khi bán đủ số lượng kế hoạch.
 */
export function calculateTotalRevenueScenario(products: Product[]): number {
  return products.reduce((sum, p) => sum + calculateProductRevenue(p), 0);
}

export interface ScenarioCalculationResult {
  scenarioId: string;
  title: string;
  inKindReplacement: number;
  remainingCashExpense: number;
  projectedRevenue: number;
  projectedBalance: number;
  isDeficit: boolean;
  balanceText: string;
}

/**
 * Tính toán kết quả cho từng kịch bản tài chính kế hoạch.
 * - Hiện vật thay chi chỉ làm giảm chi tiền còn lại (Chi tiền = Tổng dự toán chi - Giá trị hiện vật thay thế).
 * - Không cộng giá trị hiện vật vào doanh thu/tiền nhận (Doanh thu kịch bản giữ nguyên).
 * - Số dư giả định = Doanh thu kịch bản - Chi tiền còn lại.
 * - Nếu bất kỳ giá trị đầu vào nào là null, trả về null, KHÔNG tự gán thành 0.
 */
export function calculateScenario(
  scenario: FinanceScenario,
  plannedRevenue: number | null,
  totalExpense: number | null
): ScenarioCalculationResult | null {
  if (
    plannedRevenue === null ||
    plannedRevenue === undefined ||
    totalExpense === null ||
    totalExpense === undefined ||
    scenario.inKindReplacement.value === null ||
    scenario.inKindReplacement.value === undefined
  ) {
    return null;
  }

  const inKind = scenario.inKindReplacement.value;
  if (inKind < 0) {
    throw new Error('Giá trị hiện vật thay thế không được là số âm.');
  }
  if (inKind > totalExpense) {
    throw new Error('Giá trị hiện vật thay thế không được vượt quá tổng dự toán chi.');
  }

  const remainingCashExpense = totalExpense - inKind;
  const projectedBalance = plannedRevenue - remainingCashExpense;
  const isDeficit = projectedBalance < 0;

  let balanceText: string;
  if (projectedBalance < 0) {
    balanceText = `Thiếu ${formatVND(Math.abs(projectedBalance))}`;
  } else if (projectedBalance === 0) {
    balanceText = 'Hòa vốn 0đ';
  } else {
    balanceText = `Dư ${formatVND(projectedBalance)}`;
  }

  return {
    scenarioId: scenario.id,
    title: scenario.title,
    inKindReplacement: inKind,
    remainingCashExpense,
    projectedRevenue: plannedRevenue,
    projectedBalance,
    isDeficit,
    balanceText,
  };
}

/**
 * Định dạng tiền tệ VND với dấu chấm phân cách hàng nghìn.
 * Trả về chuỗi 'Chưa xác nhận' nếu giá trị null/undefined, không hiển thị '0đ' cho dữ liệu thiếu.
 */
export function formatVND(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'Chưa xác nhận';
  }
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
}
