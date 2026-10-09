/**
 * Logic tính toán và kiểm tra dữ liệu tài chính cho chiến dịch Mang Theo Một Nét Vẽ (C06 - Final PDF).
 * Tuân thủ docs/data-and-finance.md, docs/task-specs/C06.md và docs/evidence/C06/source-calculations.json:
 * - Dùng số nguyên VND.
 * - Tách biệt kế hoạch với thực tế.
 * - Hiện vật thay chi tiền chỉ giảm chi phí tiền một lần, không cộng vào doanh thu tiền.
 * - Không tự ý chuyển giá trị null / chưa biết thành 0.
 * - Không gộp các combo ẩm thực vào doanh thu kịch bản cơ sở.
 * - Phân định rõ ràng các khoản chi và chênh lệch đối soát nội bộ.
 */

import type { Product, PlannedExpenseItem, FinanceScenario, QuantitativeFact } from '../data/campaign';

export interface ExpenseCategoryGroup {
  category: string;
  sourceRef: string;
  subtotal: number | null;
  items: PlannedExpenseItem[];
}

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
 * Phân nhóm các khoản chi dự toán theo hạng mục xuất hiện trong dữ liệu đầu vào.
 * - Tự động dẫn xuất danh sách nhóm từ category của từng khoản mục, bảo toàn thứ tự xuất hiện đầu tiên.
 * - Dẫn xuất sourceRef của nhóm từ sourceRef của khoản mục đầu tiên trong nhóm đó.
 * - Mỗi khoản mục đầu vào thuộc đúng một nhóm duy nhất; không tạo nhóm rỗng.
 * - Tính tổng phụ (subtotal) cho từng nhóm trực tiếp từ dữ liệu khoản mục.
 * - Nếu bất kỳ khoản nào trong nhóm có giá trị null hoặc undefined, trả về subtotal: null an toàn.
 */
export function groupPlannedExpensesByCategory(
  items: PlannedExpenseItem[]
): ExpenseCategoryGroup[] {
  const groupsMap = new Map<
    string,
    {
      category: string;
      sourceRef: string;
      items: PlannedExpenseItem[];
    }
  >();

  for (const item of items) {
    const category = item.category || 'Khác';
    if (!groupsMap.has(category)) {
      const sourceRef = item.amount?.sourceRef || '';
      groupsMap.set(category, {
        category,
        sourceRef,
        items: [],
      });
    }
    groupsMap.get(category)!.items.push(item);
  }

  const result: ExpenseCategoryGroup[] = [];
  for (const group of groupsMap.values()) {
    const hasUnknown = group.items.some(
      (item) => item.amount.value === null || item.amount.value === undefined
    );
    const subtotal = hasUnknown
      ? null
      : group.items.reduce((sum, item) => sum + (item.amount.value ?? 0), 0);

    result.push({
      category: group.category,
      sourceRef: group.sourceRef,
      subtotal,
      items: group.items,
    });
  }

  return result;
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
 * Tính tổng doanh thu kịch bản từ danh sách sản phẩm.
 * - Mặc định: Ném lỗi nếu có sản phẩm bị loại trừ khỏi doanh thu cơ sở (isBaseRevenueItem === false, ví dụ 3 combo)
 *   để ngăn chặn việc cộng nhầm combo vào doanh thu kịch bản cơ sở.
 * - Ném lỗi nếu bất kỳ sản phẩm nào có số lượng null.
 */
export function calculateTotalRevenueScenario(
  products: Product[],
  options?: { allowExcludedCombos?: boolean }
): number {
  if (!options?.allowExcludedCombos) {
    const excluded = products.filter((p) => p.isBaseRevenueItem === false);
    if (excluded.length > 0) {
      throw new Error(
        `Danh sách chứa các mặt hàng không thuộc doanh thu cơ sở (${excluded.map((p) => p.id).join(', ')}); không được tự ý gộp combo vào kịch bản cơ sở.`
      );
    }
  }
  return products.reduce((sum, p) => sum + calculateProductRevenue(p), 0);
}

/**
 * Tính doanh thu kế hoạch từ nhóm sản phẩm thủ công (chuồn chuồn tre + móc khóa).
 * 30 × 40.000đ + 100 × 10.000đ = 2.200.000đ.
 */
export function calculateCraftRevenue(products: Product[]): number {
  const craftProducts = products.filter((p) => p.category === 'craft');
  return craftProducts.reduce((sum, p) => sum + calculateProductRevenue(p), 0);
}

/**
 * Tính doanh thu ẩm thực kịch bản cơ sở (50 set đồ ăn + 50 bánh su kem).
 * 50 × 79.000đ + 50 × 20.000đ = 4.950.000đ.
 * Loại trừ 3 combo nem chưa đối chiếu nguồn lực.
 */
export function calculateFoodRevenue(products: Product[]): number {
  const baseFoodProducts = products.filter(
    (p) => p.category === 'food' && p.isBaseRevenueItem !== false
  );
  return baseFoodProducts.reduce((sum, p) => sum + calculateProductRevenue(p), 0);
}

/**
 * Tính doanh thu kịch bản cơ sở từ danh sách sản phẩm (chỉ tính các sản phẩm có isBaseRevenueItem !== false).
 * 2.200.000đ (thủ công) + 4.950.000đ (ẩm thực cơ sở) = 7.150.000đ.
 */
export function calculateBaseRevenue(products: Product[]): number {
  const baseProducts = products.filter((p) => p.isBaseRevenueItem !== false);
  return baseProducts.reduce((sum, p) => sum + calculateProductRevenue(p), 0);
}

/**
 * Tính tổng doanh thu kế hoạch kết hợp giữa sản phẩm thủ công và ẩm thực cơ sở:
 * - Nếu bất kỳ giá trị nào là null hoặc undefined: trả về null (propagate unknown), không tự coi là 0.
 * - Hỗ trợ cả số nguyên lẫn QuantitativeFact metadata.
 * - Khi cả hai có giá trị: trả về tổng doanh thu kế hoạch.
 */
export function calculateCombinedPlannedRevenue(
  craftRevenue: number | null | undefined,
  foodAssumption: number | QuantitativeFact | null | undefined
): number | null {
  if (craftRevenue === null || craftRevenue === undefined || foodAssumption === null || foodAssumption === undefined) {
    return null;
  }
  const foodVal = typeof foodAssumption === 'number' ? foodAssumption : foodAssumption.value;
  if (foodVal === null || foodVal === undefined) {
    return null;
  }
  return craftRevenue + foodVal;
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

/**
 * Định dạng số lượng kế hoạch của sản phẩm:
 * - Dẫn xuất trực tiếp từ plannedQuantity.value và plannedQuantity.unit.
 * - Giữ nguyên qualifier/prefix (ví dụ: 'Tối đa ') nếu có.
 * - Trả về 'Chưa xác nhận' nếu plannedQuantity.value là null, không mặc định số cũ hoặc '0'.
 */
export function formatProductQuantity(product: Product): string {
  if (product.plannedQuantity.value === null || product.plannedQuantity.value === undefined) {
    return 'Chưa xác nhận';
  }
  const prefix = product.quantityPrefix || '';
  return `${prefix}${product.plannedQuantity.value} ${product.plannedQuantity.unit}`;
}

/**
 * Định dạng giá tham khảo của sản phẩm kèm đơn vị tính:
 * - Trả về 'Chưa xác nhận' nếu referencePrice.value là null, KHÔNG tự ý ghép thêm '/bộ' hay '/chiếc'.
 * - Trả về định dạng chuẩn (ví dụ: '40.000đ/bộ', '79.000đ/set') khi có giá trị số.
 */
export function formatProductPrice(product: Product): string {
  if (product.referencePrice.value === null || product.referencePrice.value === undefined) {
    return 'Chưa xác nhận';
  }
  const formattedVal = formatVND(product.referencePrice.value);
  const unitSuffix = product.referencePrice.unit.split('/')[1] || 'món';
  return `${formattedVal}/${unitSuffix}`;
}

export interface BalanceDisplay {
  text: string;
  diffClass: 'diff-negative' | 'diff-positive' | 'diff-neutral';
  isUnknown: boolean;
}

/**
 * Định dạng chênh lệch số dư kịch bản trên trang chủ:
 * - Âm: '-220.000đ', class 'diff-negative'
 * - 0: '0đ', class 'diff-neutral'
 * - Dương: '+1.680.000đ', class 'diff-positive'
 * - Null / Unknown: 'Chưa xác nhận', class 'diff-neutral' (KHÔNG tự ép về '0đ')
 */
export function formatScenarioBalance(
  result: ScenarioCalculationResult | null
): BalanceDisplay {
  if (!result || result.projectedBalance === null || result.projectedBalance === undefined) {
    return {
      text: 'Chưa xác nhận',
      diffClass: 'diff-neutral',
      isUnknown: true,
    };
  }

  if (result.projectedBalance < 0) {
    return {
      text: `-${formatVND(Math.abs(result.projectedBalance))}`,
      diffClass: 'diff-negative',
      isUnknown: false,
    };
  }

  if (result.projectedBalance === 0) {
    return {
      text: '0đ',
      diffClass: 'diff-neutral',
      isUnknown: false,
    };
  }

  return {
    text: `+${formatVND(result.projectedBalance)}`,
    diffClass: 'diff-positive',
    isUnknown: false,
  };
}

export interface FoodRevenueReconciliation {
  hypotheticalSets: number | null;
  setUnitPrice: number | null;
  setsCalculatedRevenue: number | null;
  suKemQuantity: number | null;
  suKemUnitPrice: number | null;
  suKemCalculatedRevenue: number | null;
  totalCoreFoodRevenue: number | null;
  targetFoodRevenue: number | null;
  unallocatedGap: number | null;
  hypotheticalTotalCombinedRevenue: number | null;
  hypotheticalProjectedBalance: number | null;
  foodExpensesTotal: number | null;
  foodRevenueMinusExpenses: number | null;
  foodProfitQuote: number | null;
  foodProfitGap: number | null;
}

/**
 * Tính toán đối chiếu doanh thu ẩm thực giữa mục tiêu đề xuất Final và các cơ cấu thành phần.
 * - 50 set × 79.000đ = 3.950.000đ
 * - 50 hộp su kem × 20.000đ = 1.000.000đ
 * - Tổng doanh thu ẩm thực cơ sở = 4.950.000đ (đã giải thích cơ cấu 1 triệu từ su kem)
 * - Chi phí nguyên liệu ẩm thực = 2.480.000đ (đã bao gồm 400.000đ bánh su kem)
 * - Doanh thu trừ chi phí = 4.950.000đ − 2.480.000đ = 2.470.000đ
 * - Lãi đồ ăn PDF ghi 2.070.000đ, lệch 400.000đ so với phép trừ theo nhóm. Bảng lãi theo mặt hàng
 *   (trang 30) cho thấy khoản su kem 400.000đ xuất hiện ở cả dòng set lẫn dòng su kem; phân bổ chính thức
 *   chưa được nhóm xác nhận, nên không coi số nào là lãi sản phẩm chính thức.
 */
export function calculateFoodReconciliation(
  hypotheticalSets: number | QuantitativeFact | null | undefined = null,
  setPrice: number | QuantitativeFact | null | undefined = null,
  targetFoodRevenue: number | QuantitativeFact | null | undefined = null,
  craftRevenue: number | QuantitativeFact | null | undefined = null,
  totalExpense: number | QuantitativeFact | null | undefined = null,
  suKemQuantity: number | QuantitativeFact | null | undefined = null,
  suKemPrice: number | QuantitativeFact | null | undefined = null,
  foodExpensesTotal: number | QuantitativeFact | null | undefined = null,
  foodProfitQuote: number | QuantitativeFact | null | undefined = null
): FoodRevenueReconciliation {
  const setsVal =
    hypotheticalSets === null || hypotheticalSets === undefined
      ? null
      : typeof hypotheticalSets === 'number'
        ? hypotheticalSets
        : hypotheticalSets.value ?? null;

  const priceVal =
    setPrice === null || setPrice === undefined
      ? null
      : typeof setPrice === 'number'
        ? setPrice
        : setPrice.value ?? null;

  const targetVal =
    targetFoodRevenue === null || targetFoodRevenue === undefined
      ? null
      : typeof targetFoodRevenue === 'number'
        ? targetFoodRevenue
        : targetFoodRevenue.value ?? null;

  const craftVal =
    craftRevenue === null || craftRevenue === undefined
      ? null
      : typeof craftRevenue === 'number'
        ? craftRevenue
        : craftRevenue.value ?? null;

  const expenseVal =
    totalExpense === null || totalExpense === undefined
      ? null
      : typeof totalExpense === 'number'
        ? totalExpense
        : totalExpense.value ?? null;

  const suKemQtyVal =
    suKemQuantity === null || suKemQuantity === undefined
      ? null
      : typeof suKemQuantity === 'number'
        ? suKemQuantity
        : suKemQuantity.value ?? null;

  const suKemPriceVal =
    suKemPrice === null || suKemPrice === undefined
      ? null
      : typeof suKemPrice === 'number'
        ? suKemPrice
        : suKemPrice.value ?? null;

  const foodExpVal =
    foodExpensesTotal === null || foodExpensesTotal === undefined
      ? null
      : typeof foodExpensesTotal === 'number'
        ? foodExpensesTotal
        : foodExpensesTotal.value ?? null;

  const profitQuoteVal =
    foodProfitQuote === null || foodProfitQuote === undefined
      ? null
      : typeof foodProfitQuote === 'number'
        ? foodProfitQuote
        : foodProfitQuote.value ?? null;

  const setsCalculatedRevenue =
    setsVal !== null && priceVal !== null ? setsVal * priceVal : null;

  const suKemCalculatedRevenue =
    suKemQtyVal !== null && suKemPriceVal !== null ? suKemQtyVal * suKemPriceVal : null;

  const totalCoreFoodRevenue =
    setsCalculatedRevenue !== null && suKemCalculatedRevenue !== null
      ? setsCalculatedRevenue + suKemCalculatedRevenue
      : null;

  const unallocatedGap =
    targetVal !== null && totalCoreFoodRevenue !== null
      ? targetVal - totalCoreFoodRevenue
      : null;

  const hypotheticalTotalCombinedRevenue =
    craftVal !== null && totalCoreFoodRevenue !== null
      ? craftVal + totalCoreFoodRevenue
      : null;

  const hypotheticalProjectedBalance =
    hypotheticalTotalCombinedRevenue !== null && expenseVal !== null
      ? hypotheticalTotalCombinedRevenue - expenseVal
      : null;

  const foodRevenueMinusExpenses =
    totalCoreFoodRevenue !== null && foodExpVal !== null
      ? totalCoreFoodRevenue - foodExpVal
      : null;

  const foodProfitGap =
    foodRevenueMinusExpenses !== null && profitQuoteVal !== null
      ? foodRevenueMinusExpenses - profitQuoteVal
      : null;

  return {
    hypotheticalSets: setsVal,
    setUnitPrice: priceVal,
    setsCalculatedRevenue,
    suKemQuantity: suKemQtyVal,
    suKemUnitPrice: suKemPriceVal,
    suKemCalculatedRevenue,
    totalCoreFoodRevenue,
    targetFoodRevenue: targetVal,
    unallocatedGap,
    hypotheticalTotalCombinedRevenue,
    hypotheticalProjectedBalance,
    foodExpensesTotal: foodExpVal,
    foodRevenueMinusExpenses,
    foodProfitQuote: profitQuoteVal,
    foodProfitGap,
  };
}

export interface CraftRevenueReconciliation {
  treQuantity: number | null;
  treUnitPrice: number | null;
  treCalculatedRevenue: number | null;
  mocQuantity: number | null;
  mocUnitPrice: number | null;
  mocCalculatedRevenue: number | null;
  totalCraftRevenue: number | null;
  workshopExpensesTotal: number | null;
  craftRevenueMinusExpenses: number | null;
  craftProfitQuote: number | null;
  craftProfitGap: number | null;
}

/**
 * Tính toán đối chiếu doanh thu và lãi thủ công trong đề xuất Final:
 * - 30 chuồn chuồn tre × 40.000đ = 1.200.000đ
 * - 100 móc khóa × 10.000đ = 1.000.000đ
 * - Tổng doanh thu thủ công = 2.200.000đ
 * - Tổng chi phí vật tư workshop & quà tặng = 1.860.000đ
 * - Doanh thu trừ chi phí = 2.200.000đ − 1.860.000đ = 340.000đ
 * - Lãi thủ công PDF ghi 740.000đ; chênh lệch 400.000đ xuất phát từ phân bổ chi phí nội bộ chưa thống nhất.
 */
export function calculateCraftReconciliation(
  treQty: number | QuantitativeFact | null | undefined = null,
  trePrice: number | QuantitativeFact | null | undefined = null,
  mocQty: number | QuantitativeFact | null | undefined = null,
  mocPrice: number | QuantitativeFact | null | undefined = null,
  workshopExpensesTotal: number | QuantitativeFact | null | undefined = null,
  craftProfitQuote: number | QuantitativeFact | null | undefined = null
): CraftRevenueReconciliation {
  const tQ = treQty === null || treQty === undefined ? null : typeof treQty === 'number' ? treQty : treQty.value ?? null;
  const tP = trePrice === null || trePrice === undefined ? null : typeof trePrice === 'number' ? trePrice : trePrice.value ?? null;
  const mQ = mocQty === null || mocQty === undefined ? null : typeof mocQty === 'number' ? mocQty : mocQty.value ?? null;
  const mP = mocPrice === null || mocPrice === undefined ? null : typeof mocPrice === 'number' ? mocPrice : mocPrice.value ?? null;
  const wE = workshopExpensesTotal === null || workshopExpensesTotal === undefined ? null : typeof workshopExpensesTotal === 'number' ? workshopExpensesTotal : workshopExpensesTotal.value ?? null;
  const cPQ = craftProfitQuote === null || craftProfitQuote === undefined ? null : typeof craftProfitQuote === 'number' ? craftProfitQuote : craftProfitQuote.value ?? null;

  const treCalculatedRevenue = tQ !== null && tP !== null ? tQ * tP : null;
  const mocCalculatedRevenue = mQ !== null && mP !== null ? mQ * mP : null;
  const totalCraftRevenue =
    treCalculatedRevenue !== null && mocCalculatedRevenue !== null
      ? treCalculatedRevenue + mocCalculatedRevenue
      : null;
  const craftRevenueMinusExpenses = totalCraftRevenue !== null && wE !== null ? totalCraftRevenue - wE : null;
  const craftProfitGap =
    cPQ !== null && craftRevenueMinusExpenses !== null
      ? cPQ - craftRevenueMinusExpenses
      : null;

  return {
    treQuantity: tQ,
    treUnitPrice: tP,
    treCalculatedRevenue,
    mocQuantity: mQ,
    mocUnitPrice: mP,
    mocCalculatedRevenue,
    totalCraftRevenue,
    workshopExpensesTotal: wE,
    craftRevenueMinusExpenses,
    craftProfitQuote: cPQ,
    craftProfitGap,
  };
}

export interface ProductCatalogRow {
  product: Product;
  priceText: string;
  quantityText: string;
  /** Doanh thu kịch bản (giá × số lượng); null với mặt hàng không thuộc doanh thu cơ sở hoặc thiếu dữ liệu. */
  scenarioRevenue: number | null;
  inBaseScenario: boolean;
}

/**
 * Dựng các dòng danh mục sản phẩm cho trang Sản phẩm/Trang chủ.
 * - Mặt hàng có isBaseRevenueItem === false (3 combo) luôn có scenarioRevenue null, không được cộng vào cơ sở.
 * - Thiếu giá hoặc số lượng: scenarioRevenue null, không tự coi là 0.
 */
export function buildProductCatalog(products: Product[]): ProductCatalogRow[] {
  return products.map((product) => {
    const inBaseScenario = product.isBaseRevenueItem !== false;
    const price = product.referencePrice.value;
    const qty = product.plannedQuantity.value;
    const scenarioRevenue =
      inBaseScenario && price !== null && price !== undefined && qty !== null && qty !== undefined
        ? price * qty
        : null;
    return {
      product,
      priceText: formatProductPrice(product),
      quantityText: formatProductQuantity(product),
      scenarioRevenue,
      inBaseScenario,
    };
  });
}

/**
 * Tổng doanh thu kịch bản từ các dòng danh mục.
 * Trả về null nếu bất kỳ dòng thuộc cơ sở nào thiếu doanh thu (không bỏ qua dòng thiếu dữ liệu).
 */
export function sumCatalogScenarioRevenue(rows: ProductCatalogRow[]): number | null {
  let total = 0;
  for (const row of rows) {
    if (!row.inBaseScenario) continue;
    if (row.scenarioRevenue === null) return null;
    total += row.scenarioRevenue;
  }
  return total;
}
