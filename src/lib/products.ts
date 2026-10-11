/**
 * Xử lý dữ liệu sản phẩm thủ công, trạng thái mở bán và luồng soạn yêu cầu mua (Task C14).
 * Tuân thủ docs/task-specs/C14.md và early-review-04 / early-review-06 / integration-guidance:
 * - Không bịa vật liệu (mica/kim loại, chân đế gỗ/tre, sải cánh, tự tay sơn).
 * - Kích thước giữ đúng "12 cm theo đề xuất".
 * - Tách biệt cấu hình giá bán chính thức / mở bán (product-sales-config.json) khỏi referencePrice planned baseline.
 * - canInitiatePurchase kiểm tra toàn diện: status open, giá > 0, phê duyệt công khai, chính sách đổi trả và kênh tiếp nhận.
 */

import { PRODUCTS, type Product } from '../data/campaign.ts';
import { formatVND } from './finance.ts';
import productSalesConfig from '../data/product-sales-config.json' with { type: 'json' };
import { validateProductSalesConfig } from '../../tools/content-studio/product-validator.mjs';

// Kiểm tra schema dữ liệu tại read/build boundary
const _configValidation = validateProductSalesConfig(productSalesConfig);
if (!_configValidation.isValid) {
  throw new Error(`Dữ liệu cấu hình sản phẩm không hợp lệ: ${_configValidation.errors.join('; ')}`);
}

export interface ProductSalesConfigEntry {
  saleStatus: 'unconfirmed' | 'open' | 'closed';
  officialPrice: number | null;
  stockAvailable: number | null;
  salesChannel: string;
  returnPolicy: string | null;
  publicApproval: 'pending' | 'approved';
}

export interface CraftProductDetail {
  slug: string;
  aliases?: string[];
  product: Product;
  materialInfo: string;
  dimensionInfo: string | null;
  originDetails: string;
  salesLocationPlan: string;
  returnPolicy: string;
  image?: {
    src: string;
    alt: string;
    width: number;
    height: number;
    caption: string;
    isReferenceOnly: boolean;
  };
  imagePendingNote?: string;
}

/**
 * Lấy cấu hình mở bán chính thức của sản phẩm từ product-sales-config.json.
 */
export function getProductSalesConfig(productId: string): ProductSalesConfigEntry | undefined {
  return (productSalesConfig as Record<string, ProductSalesConfigEntry>)[productId];
}

/**
 * Danh sách sản phẩm thủ công hợp lệ có trang chi tiết.
 * Tuyệt đối không đưa các sản phẩm đồ ăn cũ (nem, su kem) vào danh mục này.
 */
export const CRAFT_PRODUCT_DETAILS: CraftProductDetail[] = [
  {
    slug: 'chuon-chuon-tre-kem-de',
    aliases: ['chuon-chuon-tre'],
    product: PRODUCTS.find((p) => p.id === 'chuon-chuon-tre-kem-de')!,
    materialInfo: 'Phôi tre mộc; nguồn gốc trang trí chưa xác nhận (theo đề xuất kế hoạch).',
    dimensionInfo: '12 cm theo đề xuất',
    originDetails:
      'Nhóm sinh viên Lăng Kính chuẩn bị và hoàn thiện mẫu theo kế hoạch. Hoạt động tại Mái ấm hoàn toàn là vui chơi sáng tạo; các em giữ lại sản phẩm do mình làm ra, không giao sản lượng cho các em.',
    salesLocationPlan:
      'Dự kiến mở bán tại khuôn viên Đại học FPT Hà Nội (Hòa Lạc) theo đề xuất kế hoạch; hiện chưa mở bán chính thức.',
    returnPolicy:
      'Điều kiện nhận/đổi/hủy chưa công bố; nhóm sẽ hoàn thiện và thống nhất trước khi mở bán.',
    image: {
      src: '/images/san-pham/chuon-chuon-tre.webp',
      alt: 'Những chú chuồn chuồn tre sơn nhiều màu đặt trên khay mây, có chân đế',
      width: 1117,
      height: 541,
      caption: 'Ảnh chuồn chuồn tre do nhóm cung cấp để tham khảo; mẫu thực tế có thể khác.',
      isReferenceOnly: true,
    },
  },
  {
    slug: 'moc-khoa',
    product: PRODUCTS.find((p) => p.id === 'moc-khoa')!,
    materialInfo: 'Móc khóa Lăng Kính (theo đề xuất kế hoạch).',
    dimensionInfo: null,
    originDetails:
      'Nhóm sinh viên Lăng Kính chuẩn bị và hoàn thiện mẫu theo kế hoạch. Tranh của các em nhỏ chỉ được in khi có sự đồng ý phù hợp từ Mái ấm và người giám hộ.',
    salesLocationPlan:
      'Dự kiến mở bán tại khuôn viên Đại học FPT Hà Nội (Hòa Lạc) theo đề xuất kế hoạch; hiện chưa mở bán chính thức.',
    returnPolicy:
      'Điều kiện nhận/đổi/hủy chưa công bố; nhóm sẽ hoàn thiện và thống nhất trước khi mở bán.',
    imagePendingNote:
      'Chưa có ảnh mẫu: móc khóa dự kiến in tranh các em vẽ, chỉ thực hiện khi có sự đồng ý phù hợp từ Mái ấm.',
  },
];

export interface PurchaseEligibilityCheckOptions {
  returnPolicyConfirmed?: boolean;
  salesChannelConfirmed?: boolean;
  stockConfirmed?: boolean;
}

/**
 * Kiểm tra xem sản phẩm đã đủ điều kiện để kích hoạt luồng soạn yêu cầu mua hay chưa.
 * Điều kiện kiểm tra đầy đủ:
 * 1. saleStatus === 'open' (sản phẩm đã được mở bán)
 * 2. Giá có giá trị nguyên dương > 0
 * 3. Giá bán đã được xác nhận (verification === 'confirmed' hoặc officialPrice xác nhận)
 * 4. Giá bán đã được phê duyệt công khai (publicApproval === 'approved')
 * 5. Chính sách đổi/trả/hủy đã được xác nhận công bố
 * 6. Kênh tiếp nhận/giao nhận đã được xác nhận
 * 7. Số lượng có sẵn (stockAvailable) không bị hết hàng (nếu biết và bằng 0 thì không cho phép mua)
 */
export function canInitiatePurchase(
  product: Product,
  options: PurchaseEligibilityCheckOptions = {}
): boolean {
  if (!product) return false;

  const salesConfig = getProductSalesConfig(product.id);
  const effectiveStatus = salesConfig?.saleStatus ?? product.saleStatus;
  if (effectiveStatus !== 'open') return false;

  // Nếu đã biết số lượng có sẵn và bằng 0, không kích hoạt luồng mua
  if (salesConfig?.stockAvailable === 0) return false;

  const effectivePrice = salesConfig?.officialPrice ?? product.referencePrice?.value;
  if (typeof effectivePrice !== 'number' || effectivePrice <= 0) return false;

  const isConfirmedPrice =
    (typeof salesConfig?.officialPrice === 'number' && salesConfig.officialPrice > 0) ||
    product.referencePrice?.verification === 'confirmed';
  if (!isConfirmedPrice) return false;

  const effectiveApproval = salesConfig?.publicApproval ?? product.referencePrice?.publicApproval;
  if (effectiveApproval !== 'approved') return false;

  const returnPolicyConfirmed =
    options.returnPolicyConfirmed ??
    (typeof salesConfig?.returnPolicy === 'string' && salesConfig.returnPolicy.trim().length > 0);
  if (!returnPolicyConfirmed) return false;

  const channelConfirmed =
    options.salesChannelConfirmed ??
    (typeof salesConfig?.salesChannel === 'string' && salesConfig.salesChannel.trim().length > 0);
  if (!channelConfirmed) return false;

  return true;
}

export interface EffectiveProductSaleModel {
  productId: string;
  name: string;
  saleStatus: 'unconfirmed' | 'open' | 'closed';
  statusLabel: string;
  statusChipKind: 'da-xac-nhan' | 'cho-xac-nhan';
  officialPrice: number | null;
  effectivePrice: number | null;
  priceText: string;
  unitSuffix: string;
  priceTypeLabel: string;
  priceNote: string;
  stockAvailable: number | null;
  maxPurchasableQuantity: number;
  salesChannel: string;
  returnPolicy: string;
  publicApproval: 'pending' | 'approved';
  canPurchase: boolean;
}

/**
 * Mô hình xem hiệu lực (effective sale view-model) thống nhất cho card, trang chi tiết và luồng đặt mua.
 * Đảm bảo giá chính thức (nếu có và được duyệt), trạng thái thực tế, kênh bán, chính sách và số lượng kho
 * đồng bộ 100% giữa SSR và client JavaScript.
 */
export function getEffectiveProductSaleModel(product: Product): EffectiveProductSaleModel {
  const salesConfig = getProductSalesConfig(product.id);
  const detail = CRAFT_PRODUCT_DETAILS.find((d) => d.product.id === product.id);

  const effectiveStatus = salesConfig?.saleStatus ?? product.saleStatus ?? 'unconfirmed';
  const statusLabel =
    effectiveStatus === 'open'
      ? 'Đang mở bán'
      : effectiveStatus === 'closed'
      ? 'Đã kết thúc'
      : 'Chờ mở bán';
  const statusChipKind =
    effectiveStatus === 'open' ? ('da-xac-nhan' as const) : ('cho-xac-nhan' as const);

  const hasOfficialPrice =
    typeof salesConfig?.officialPrice === 'number' && salesConfig.officialPrice > 0;
  const isApprovedOfficialPrice = hasOfficialPrice && salesConfig?.publicApproval === 'approved';

  const effectivePrice = isApprovedOfficialPrice
    ? salesConfig!.officialPrice
    : product.referencePrice?.value ?? null;

  const unitSuffix = product.referencePrice?.unit
    ? product.referencePrice.unit.replace('đ/', '')
    : 'chiếc';
  const priceText = effectivePrice !== null ? formatVND(effectivePrice) : 'Chưa có giá';

  const isConfirmedPrice =
    isApprovedOfficialPrice || product.referencePrice?.verification === 'confirmed';
  const priceTypeLabel = isConfirmedPrice ? 'Giá niêm yết' : 'Giá tham khảo';
  const priceNote = isConfirmedPrice
    ? '(Đã duyệt niêm yết chính thức)'
    : '(Giá trong đề xuất kế hoạch, chưa phải giá niêm yết chính thức)';

  const stockAvailable =
    salesConfig?.stockAvailable !== undefined ? salesConfig.stockAvailable : null;

  let maxPurchasableQuantity = 50;
  if (stockAvailable !== null) {
    maxPurchasableQuantity = stockAvailable > 0 ? Math.min(stockAvailable, 50) : 0;
  }

  const salesChannel =
    salesConfig?.salesChannel?.trim() ||
    detail?.salesLocationPlan ||
    'Khuôn viên Đại học FPT Hà Nội (Hòa Lạc) theo đề xuất kế hoạch; hiện chưa mở bán chính thức.';

  const returnPolicy =
    salesConfig?.returnPolicy?.trim() ||
    detail?.returnPolicy ||
    'Điều kiện nhận/đổi/hủy chưa công bố; nhóm sẽ hoàn thiện và thống nhất trước khi mở bán.';

  const publicApproval = salesConfig?.publicApproval ?? 'pending';

  const canPurchase = canInitiatePurchase(product);

  return {
    productId: product.id,
    name: product.name,
    saleStatus: effectiveStatus,
    statusLabel,
    statusChipKind,
    officialPrice: salesConfig?.officialPrice ?? null,
    effectivePrice,
    priceText,
    unitSuffix,
    priceTypeLabel,
    priceNote,
    stockAvailable,
    maxPurchasableQuantity,
    salesChannel,
    returnPolicy,
    publicApproval,
    canPurchase,
  };
}

/**
 * Soạn nội dung yêu cầu mua quà lưu niệm để người dùng sao chép gửi cho nhóm.
 * Đây KHÔNG phải đơn hàng hoàn tất; người dùng cần gửi cho nhóm và chờ phản hồi xác nhận.
 */
export function formatPurchaseInquiry(options: {
  product: Product;
  quantity: number;
  customerNote?: string;
}): string {
  const { product, quantity, customerNote } = options;
  const effectiveModel = getEffectiveProductSaleModel(product);
  const unitPrice = effectiveModel.effectivePrice ?? 0;
  const subtotal = unitPrice * quantity;

  const lines = [
    `[YÊU CẦU MUA QUÀ LƯU NIỆM GÂY QUỸ]`,
    `Dự án: Mang Theo Một Nét Vẽ — Nhóm sinh viên Lăng Kính`,
    `Sản phẩm: ${product.name}`,
    `Số lượng: ${quantity} ${effectiveModel.unitSuffix}`,
    `Đơn giá: ${formatVND(unitPrice)}`,
    `Tạm tính: ${formatVND(subtotal)}`,
    `Địa điểm nhận dự kiến: ${effectiveModel.salesChannel}`,
  ];

  if (customerNote && customerNote.trim()) {
    lines.push(`Ghi chú của bạn: ${customerNote.trim()}`);
  }

  lines.push(
    `---`,
    `Lưu ý: Đây là tin nhắn soạn mẫu gửi đến Fanpage hoặc thành viên nhóm Lăng Kính. Yêu cầu mua chỉ được xác nhận sau khi nhóm phản hồi và thống nhất cách nhận quà.`
  );

  return lines.join('\n');
}

/**
 * Tìm sản phẩm thủ công theo slug (hỗ trợ cả slug alias như chuon-chuon-tre).
 */
export function getCraftProductBySlug(slug: string): CraftProductDetail | undefined {
  return CRAFT_PRODUCT_DETAILS.find((item) => item.slug === slug || (item.aliases && item.aliases.includes(slug)));
}
