export interface SeedVariant {
  color: string;
  size: string;
  stock: number;
}

export interface SeedProduct {
  name: string;
  description: string;
  priceCents: number;
  brand: string;
  category: string;
  sex: string;
  images: string[];
  variants: SeedVariant[];
}

export const BRANDS = ['Nike', 'Adidas', "Levi's", 'Zara', 'Uniqlo'] as const;
export const COLORS = ['Black', 'White', 'Red', 'Navy', 'Beige'] as const;
export const SIZES = ['XS', 'S', 'M', 'L', 'XL'] as const;
export const CATEGORIES = ['T-Shirts', 'Hoodies', 'Jeans', 'Jackets', 'Dresses'] as const;
export const SEXES = ['Men', 'Women', 'Unisex'] as const;

const sizeRun = (color: string, sizes: readonly string[], stock: number): SeedVariant[] =>
  sizes.map((size, i) => ({ color, size, stock: stock + i }));

export const PRODUCTS: SeedProduct[] = [
  {
    name: 'Sportswear Club Tee',
    description: 'Soft cotton jersey crewneck with a ribbed collar and an embroidered logo.',
    priceCents: 2999,
    brand: 'Nike',
    category: 'T-Shirts',
    sex: 'Men',
    images: ['/image/new/01.jpg'],
    variants: [...sizeRun('Black', ['S', 'M', 'L'], 12), ...sizeRun('White', ['M', 'L'], 6)],
  },
  {
    name: 'Essentials Fleece Hoodie',
    description: 'Brushed-back fleece with a lined hood and a kangaroo pocket.',
    priceCents: 6450,
    brand: 'Adidas',
    category: 'Hoodies',
    sex: 'Unisex',
    images: ['/image/new/02.jpg'],
    variants: [...sizeRun('Navy', ['S', 'M', 'L', 'XL'], 5), ...sizeRun('Black', ['M', 'L'], 9)],
  },
  {
    name: '501 Original Jeans',
    description: 'The original straight fit in rigid selvedge denim with a button fly.',
    priceCents: 9800,
    brand: "Levi's",
    category: 'Jeans',
    sex: 'Men',
    images: ['/image/new/03.jpg'],
    variants: [...sizeRun('Navy', ['S', 'M', 'L'], 7), ...sizeRun('Black', ['M', 'L', 'XL'], 4)],
  },
  {
    name: 'Oversized Denim Jacket',
    description: 'Boxy trucker silhouette with dropped shoulders and chest flap pockets.',
    priceCents: 12900,
    brand: 'Zara',
    category: 'Jackets',
    sex: 'Women',
    images: ['/image/new/04.jpg'],
    variants: [...sizeRun('Beige', ['XS', 'S', 'M'], 3), ...sizeRun('Navy', ['S', 'M'], 8)],
  },
  {
    name: 'Airism Cotton Tee',
    description: 'Lightweight blend that stays dry, with a clean rolled hem.',
    priceCents: 1990,
    brand: 'Uniqlo',
    category: 'T-Shirts',
    sex: 'Women',
    images: ['/image/new/05.jpg'],
    variants: [...sizeRun('White', ['XS', 'S', 'M', 'L'], 20), ...sizeRun('Beige', ['S', 'M'], 11)],
  },
  {
    name: 'Slip Midi Dress',
    description: 'Bias-cut satin with adjustable straps and a concealed side zip.',
    priceCents: 7550,
    brand: 'Zara',
    category: 'Dresses',
    sex: 'Women',
    images: ['/image/new/06.jpg'],
    variants: [...sizeRun('Black', ['XS', 'S', 'M'], 6), ...sizeRun('Red', ['S', 'M', 'L'], 2)],
  },
  {
    name: 'Tech Fleece Joggers',
    description: 'Tapered leg, zip cuffs, and a double-layer knit that holds its shape.',
    priceCents: 8900,
    brand: 'Nike',
    category: 'Hoodies',
    sex: 'Men',
    images: ['/image/sale/01.jpg'],
    variants: [...sizeRun('Black', ['M', 'L', 'XL'], 10)],
  },
  {
    name: 'Firebird Track Top',
    description: 'Retro three-stripe track jacket with a stand collar.',
    priceCents: 7200,
    brand: 'Adidas',
    category: 'Jackets',
    sex: 'Unisex',
    images: ['/image/sale/02.jpg'],
    variants: [...sizeRun('Red', ['S', 'M', 'L'], 4), ...sizeRun('Navy', ['M', 'L'], 6)],
  },
  {
    name: 'Ribbed Knit Dress',
    description: 'Stretch rib knit that skims the body, with a mock neck.',
    priceCents: 5400,
    brand: 'Uniqlo',
    category: 'Dresses',
    sex: 'Women',
    images: ['/image/modules/for-women/01.jpg'],
    variants: [...sizeRun('Beige', ['XS', 'S', 'M', 'L'], 9)],
  },
  {
    name: 'Relaxed Straight Jeans',
    description: 'Mid-rise with a roomy leg in a soft, broken-in wash.',
    priceCents: 6900,
    brand: "Levi's",
    category: 'Jeans',
    sex: 'Women',
    images: ['/image/modules/for-women/02.jpg'],
    variants: [...sizeRun('Navy', ['XS', 'S', 'M', 'L'], 5)],
  },
  {
    name: 'Heavyweight Pocket Tee',
    description: 'Dense 240gsm cotton that keeps its shape wash after wash.',
    priceCents: 3400,
    brand: 'Uniqlo',
    category: 'T-Shirts',
    sex: 'Unisex',
    images: ['/image/modules/for-men/01.jpg'],
    variants: [...sizeRun('White', ['S', 'M', 'L', 'XL'], 15), ...sizeRun('Black', ['M', 'L'], 7)],
  },
  {
    // priced well above the range the rest of the catalog occupies, on purpose. an
    // unfiltered listing has to return it and the integration tests check exactly
    // that, so a price filter quietly applying a default ceiling can't slip past.
    name: 'Limited Edition Wool Overcoat',
    description: 'Fully canvassed double-faced wool, made in a run of two hundred.',
    priceCents: 200000,
    brand: 'Zara',
    category: 'Jackets',
    sex: 'Unisex',
    images: ['/image/shop-now/01.jpg'],
    variants: [...sizeRun('Black', ['M', 'L'], 2), ...sizeRun('Beige', ['L'], 1)],
  },
];
