package com.smartagri.entity;

/**
 * Top-level agricultural categories (spec section 2). Finer-grained
 * classification (e.g. "Wheat" under Seeds, "Urea" under Fertilizers)
 * is captured on the product via {@code subCategory} and the flexible
 * {@code attributes} map rather than as further enum values, so new
 * sub-classifications don't require a schema change.
 */
public enum ProductCategory {
    SEEDS,
    FERTILIZERS,
    CROP_PROTECTION,
    EQUIPMENT,
    IRRIGATION,
    SMART_FARMING,
    LIVESTOCK,
    FARMER_PRODUCE,
    TOOLS
}
