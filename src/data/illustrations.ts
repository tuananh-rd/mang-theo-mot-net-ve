/**
 * Dữ liệu và cấu hình ảnh minh họa stock (A01 - A05)
 * Tuân thủ docs/task-specs/C02.md và docs/review-handoff-intake.md:
 * - Ảnh stock chỉ phục vụ minh họa ngữ cảnh trải nghiệm / hoạt động.
 * - Tuyệt đối không gọi là ảnh thật, người thật hay thành tích của dự án.
 * - Caption luôn hiển thị trực quan sát dưới hình ảnh, kèm credit và link nguồn rel="noreferrer noopener".
 * - Các sản phẩm chưa có ảnh mẫu thật (chuồn chuồn, móc khóa, set đồ ăn, 3 combo nem) tiếp tục dùng SVG.
 */

export interface StockIllustration {
  id: 'A01' | 'A02' | 'A03' | 'A04' | 'A05';
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  creditName: string;
  creditSource: string;
  creditUrl: string;
  objectPosition: string;
}

export const STOCK_ILLUSTRATIONS: Record<string, StockIllustration> = {
  hero: {
    id: 'A01',
    src: '/images/illustrations/a01.webp',
    width: 1600,
    height: 1068,
    alt: 'Bảng màu nước và các loại cọ vẽ đặt trên bàn',
    caption: 'Ảnh minh họa họa cụ — chưa phải ảnh chuẩn bị hoặc hoạt động của dự án',
    creditName: 'Pavel Danilyuk',
    creditSource: 'Pexels',
    creditUrl: 'https://www.pexels.com/photo/watercolors-and-paintbrushes-6925031/',
    objectPosition: '50% 40%',
  },
  'chuon-chuon': {
    id: 'A02',
    src: '/images/illustrations/a02.webp',
    width: 1067,
    height: 1600,
    alt: 'Màu vẽ và cọ trên nền màu pastel',
    caption: 'Ảnh minh họa màu vẽ cho góc trang trí — mẫu chuồn chuồn thực tế chờ xác nhận',
    creditName: 'Kaboompics (Karola G)',
    creditSource: 'Pexels',
    creditUrl: 'https://www.pexels.com/photo/paintbrush-and-paints-5412102/',
    objectPosition: '50% 90%',
  },
  'to-tuong': {
    id: 'A01',
    src: '/images/illustrations/a01.webp',
    width: 1600,
    height: 1068,
    alt: 'Bảng màu nước và cọ vẽ cho hoạt động tô màu',
    caption: 'Ảnh minh họa cọ và màu vẽ — mẫu tượng thạch cao thực tế chờ xác nhận',
    creditName: 'Pavel Danilyuk',
    creditSource: 'Pexels',
    creditUrl: 'https://www.pexels.com/photo/watercolors-and-paintbrushes-6925031/',
    objectPosition: '50% 50%',
  },
  hat: {
    id: 'A03',
    src: '/images/illustrations/a03.webp',
    width: 1600,
    height: 1067,
    alt: 'Trống lắc màu vàng',
    caption: 'Ảnh minh họa trống lắc — không phải nhạc cụ của nhóm hay người tham gia dự án',
    creditName: 'Kaboompics (Karola G)',
    creditSource: 'Pexels',
    creditUrl: 'https://www.pexels.com/photo/close-up-shot-of-a-person-playing-tambourine-7285222/',
    objectPosition: '50% 50%',
  },
  'tro-choi': {
    id: 'A04',
    src: '/images/illustrations/a04.webp',
    width: 1600,
    height: 1067,
    alt: 'Những quả bóng nhựa nhiều màu sắc',
    caption: 'Ảnh minh họa bóng cho góc trò chơi — không phải bộ bowling hay ảnh hoạt động thực tế',
    creditName: 'RDNE Stock project',
    creditSource: 'Pexels',
    creditUrl: 'https://www.pexels.com/photo/heap-of-colorful-balls-12405327/',
    objectPosition: '50% 50%',
  },
  'banh-su-kem': {
    id: 'A05',
    src: '/images/illustrations/a05.webp',
    width: 1062,
    height: 1600,
    alt: 'Bánh su kem trên đĩa trắng',
    caption: 'Ảnh minh họa bánh trên đĩa — không phải hộp/khẩu phần bán của nhóm; trà không thuộc cam kết sản phẩm',
    creditName: 'Ali Rashidi',
    creditSource: 'Pexels',
    creditUrl: 'https://www.pexels.com/photo/photograph-of-cream-puffs-on-a-white-plate-7730442/',
    objectPosition: '50% 80%',
  },
};
