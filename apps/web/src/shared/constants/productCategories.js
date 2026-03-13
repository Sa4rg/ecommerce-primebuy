// web/src/shared/constants/productCategories.js

/**
 * Product categories with URL-safe slugs and match patterns.
 * Match patterns support variations in spelling (accents, language).
 */
export const PRODUCT_CATEGORIES = [
  { slug: "all", tKey: "productCatalog.sidebar.all", match: [] },
  { slug: "cameras", tKey: "productCatalog.sidebar.cameras", match: ["camaras", "cameras", "cámaras"] },
  { slug: "watches", tKey: "productCatalog.sidebar.watches", match: ["relojes", "watches"] },
  { slug: "toys-games", tKey: "productCatalog.sidebar.toysGames", match: ["juguetes y juegos", "toys and games", "juguetes", "toys"] },
  { slug: "home", tKey: "productCatalog.sidebar.home", match: ["hogar", "home"] },
  { slug: "adult-toys", tKey: "productCatalog.sidebar.adultToys", match: ["juguetes sexuales", "adult toys", "sex toys"] },
  { slug: "led-accessories", tKey: "productCatalog.sidebar.ledAccessories", match: ["accesorios led", "led accessories"] },
  { slug: "vehicle-accessories", tKey: "productCatalog.sidebar.vehicleAccessories", match: ["accesorios de vehiculos", "accesorios de vehículos", "vehicle accessories"] },
];

/**
 * Normalize a string for category matching (lowercase, remove accents).
 */
export function normalizeForMatch(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Check if a product belongs to a category.
 */
export function productMatchesCategory(product, categorySlug) {
  if (categorySlug === "all") return true;
  const cat = PRODUCT_CATEGORIES.find((c) => c.slug === categorySlug);
  if (!cat) return true;
  const productCategory = normalizeForMatch(product?.category);
  return cat.match.some((pattern) => normalizeForMatch(pattern) === productCategory);
}