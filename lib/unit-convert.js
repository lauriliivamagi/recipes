/**
 * Deterministic unit conversion module for recipe imports.
 *
 * Converts US/UK measurements to metric (grams for weight, ml for volume)
 * using lookup tables from config/unit-conversions.json and density overrides
 * from config/ingredient-densities.json.
 *
 * @module unit-convert
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const configDir = join(__dirname, "..", "config");

const conversions = JSON.parse(
  readFileSync(join(configDir, "unit-conversions.json"), "utf-8"),
);
const densities = JSON.parse(
  readFileSync(join(configDir, "ingredient-densities.json"), "utf-8"),
);

/**
 * Resolve a unit string to its canonical form using the alias table.
 *
 * @param {string} unit - The unit string to normalize (e.g. "tablespoons", "cups").
 * @returns {string} The canonical unit name (e.g. "tbsp", "cup").
 */
export function normalizeUnit(unit) {
  const lower = unit.toLowerCase().trim();
  return conversions.aliases[lower] ?? lower;
}

/**
 * Look up the density entry for an ingredient by name.
 * Tries exact match first, then checks if any density key is contained
 * within the ingredient name (e.g. "all-purpose flour" matches "flour").
 *
 * @param {string} ingredientName
 * @returns {object|null} The density entry or null.
 */
function findDensity(ingredientName) {
  if (!ingredientName) return null;
  const lower = ingredientName.toLowerCase().trim();

  // Exact match first
  if (densities[lower] && lower !== "_comment") return densities[lower];

  // Try progressively shorter partial matches — prefer longer keys
  // (e.g. "all-purpose flour" should match before "flour")
  const keys = Object.keys(densities)
    .filter((k) => k !== "_comment")
    .sort((a, b) => b.length - a.length);

  for (const key of keys) {
    if (lower.includes(key) || key.includes(lower)) {
      return densities[key];
    }
  }
  return null;
}

/**
 * Convert a volume quantity to grams using a density entry.
 * Supports g_per_cup, g_per_tbsp, g_per_tsp, ml_per_tsp density formats.
 *
 * @param {number} quantity
 * @param {string} canonicalUnit - The canonical volume unit (e.g. "cup", "tbsp").
 * @param {object} density - The density entry from ingredient-densities.json.
 * @returns {{ quantity: number, unit: string }|null} Converted result or null if no applicable density.
 */
function convertWithDensity(quantity, canonicalUnit, density) {
  // Convert the quantity to the unit that has a density entry
  if (density.g_per_cup != null) {
    const mlValue = conversions.volume[canonicalUnit]?.ml;
    if (mlValue == null) return null;
    const cups = (quantity * mlValue) / 240;
    return { quantity: cups * density.g_per_cup, unit: "g" };
  }

  if (density.g_per_tbsp != null) {
    const mlValue = conversions.volume[canonicalUnit]?.ml;
    if (mlValue == null) return null;
    const tbsps = (quantity * mlValue) / 15;
    return { quantity: tbsps * density.g_per_tbsp, unit: "g" };
  }

  if (density.g_per_tsp != null) {
    const mlValue = conversions.volume[canonicalUnit]?.ml;
    if (mlValue == null) return null;
    const tsps = (quantity * mlValue) / 5;
    return { quantity: tsps * density.g_per_tsp, unit: "g" };
  }

  if (density.ml_per_tsp != null) {
    // This ingredient stays as volume (e.g. vanilla extract)
    const mlValue = conversions.volume[canonicalUnit]?.ml;
    if (mlValue == null) return null;
    return { quantity: quantity * mlValue, unit: "ml" };
  }

  return null;
}

/**
 * Convert a quantity from one unit to metric (grams for weight, ml for volume).
 *
 * - Resolves unit aliases first (e.g. "tablespoons" -> "tbsp").
 * - If the unit is already metric (g, kg, ml, l, dl), normalizes to g or ml.
 * - For weight units (oz, lb): converts to grams.
 * - For volume units (cup, tbsp, tsp, fl oz, pint, quart, gallon):
 *   - If ingredientName is provided and has a density override: converts to grams.
 *   - If no density override: converts to ml.
 *   - If volume-to-weight conversion attempted but no density exists: returns flagged result.
 *
 * @param {number} quantity - The numeric quantity to convert.
 * @param {string} fromUnit - The source unit (e.g. "cup", "oz", "tablespoons").
 * @param {string|null} [ingredientName=null] - Optional ingredient name for density lookup.
 * @returns {{ quantity: number, unit: string } | { flagged: boolean, quantity: number, unit: string, original: { quantity: number, unit: string }, reason: string }}
 */
export function convertUnit(quantity, fromUnit, ingredientName = null) {
  const canonical = normalizeUnit(fromUnit);

  // Weight conversion
  if (conversions.weight[canonical]) {
    const grams = quantity * conversions.weight[canonical].g;
    return { quantity: grams, unit: "g" };
  }

  // Volume conversion
  if (conversions.volume[canonical]) {
    const density = findDensity(ingredientName);

    if (density) {
      const result = convertWithDensity(quantity, canonical, density);
      if (result) return result;
    }

    // If ingredientName was provided but no density found, and the unit is
    // a non-metric volume unit, flag it for review
    if (ingredientName && !density) {
      const isAlreadyMetric = ["ml", "l", "dl", "liter"].includes(canonical);
      if (!isAlreadyMetric) {
        const mlValue = quantity * conversions.volume[canonical].ml;
        return {
          flagged: true,
          quantity: mlValue,
          unit: "ml",
          original: { quantity, unit: fromUnit },
          reason: "No density data for ingredient",
        };
      }
    }

    // No ingredient or no density — convert to ml
    const ml = quantity * conversions.volume[canonical].ml;
    return { quantity: ml, unit: "ml" };
  }

  // Unit not in any table — return as-is
  return { quantity, unit: canonical };
}

/**
 * Convert a temperature value to Celsius.
 *
 * @param {number} value - The temperature value.
 * @param {string} fromUnit - The source unit: "F", "fahrenheit", "C", or "celsius".
 * @returns {{ value: number, unit: string }}
 */
export function convertTemperature(value, fromUnit) {
  const lower = fromUnit.toLowerCase().trim();

  if (lower === "f" || lower === "fahrenheit") {
    return { value: Math.round((value - 32) * 5 / 9), unit: "°C" };
  }

  // Already Celsius
  return { value, unit: "°C" };
}

/**
 * Smart rounding based on unit type.
 *
 * - Whole items (whole, cloves, leaves): round to nearest integer.
 * - Grams: round to nearest 5 for values > 50, nearest 1 for smaller.
 * - Milliliters: round to nearest 5 for values > 50, nearest 1 for smaller.
 * - General: 1 decimal place.
 *
 * @param {number} quantity - The quantity to round.
 * @param {string} unit - The unit (e.g. "g", "ml", "whole", "cloves").
 * @returns {number} The rounded quantity.
 */
export function roundQuantity(quantity, unit) {
  const lower = unit.toLowerCase().trim();

  const wholeUnits = ["whole", "cloves", "leaves"];
  if (wholeUnits.includes(lower)) {
    return Math.round(quantity);
  }

  if (lower === "g" || lower === "ml") {
    if (quantity > 50) {
      return Math.round(quantity / 5) * 5;
    }
    return Math.round(quantity);
  }

  // General: 1 decimal place
  return Math.round(quantity * 10) / 10;
}

// ---------------------------------------------------------------------------
// Self-test
// ---------------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  let passed = 0;
  let failed = 0;

  function assert(label, actual, expected) {
    const act = JSON.stringify(actual);
    const exp = JSON.stringify(expected);
    if (act === exp) {
      console.log(`  PASS: ${label}`);
      passed++;
    } else {
      console.log(`  FAIL: ${label}`);
      console.log(`    expected: ${exp}`);
      console.log(`    actual:   ${act}`);
      failed++;
    }
  }

  console.log("unit-convert self-test\n");

  // 1. Cup of flour -> grams (density override: 120 g/cup)
  assert(
    "cup of flour → grams",
    convertUnit(1, "cup", "flour"),
    { quantity: 120, unit: "g" },
  );

  // 2. Cup of water -> ml (no density entry, volume stays volume)
  assert(
    "cup of water → ml (no density)",
    convertUnit(1, "cup"),
    { quantity: 240, unit: "ml" },
  );

  // 3. Ounces -> grams
  assert(
    "8 oz → grams",
    convertUnit(8, "oz"),
    { quantity: 226.8, unit: "g" },
  );

  // 4. Fahrenheit -> Celsius (350°F → 177°C)
  assert(
    "350°F → °C",
    convertTemperature(350, "F"),
    { value: 177, unit: "°C" },
  );

  // 5. Already metric -> pass through
  assert(
    "500g → g (pass through)",
    convertUnit(500, "g"),
    { quantity: 500, unit: "g" },
  );
  assert(
    "250ml → ml (pass through)",
    convertUnit(250, "ml"),
    { quantity: 250, unit: "ml" },
  );

  // 6. Unknown ingredient with cup -> flagged
  const flagged = convertUnit(1, "cup", "dragon fruit paste");
  assert(
    "cup of unknown ingredient → flagged",
    flagged,
    {
      flagged: true,
      quantity: 240,
      unit: "ml",
      original: { quantity: 1, unit: "cup" },
      reason: "No density data for ingredient",
    },
  );

  // 7. Alias resolution (tablespoons → tbsp)
  assert(
    "normalizeUnit('tablespoons') → 'tbsp'",
    normalizeUnit("tablespoons"),
    "tbsp",
  );
  assert(
    "2 tablespoons of sugar → grams",
    convertUnit(2, "tablespoons", "sugar"),
    { quantity: 25, unit: "g" },
  );

  // 8. Pounds -> grams
  assert(
    "2 lb → grams",
    convertUnit(2, "lb"),
    { quantity: 907.2, unit: "g" },
  );

  // 9. Celsius pass through
  assert(
    "200°C → °C (pass through)",
    convertTemperature(200, "celsius"),
    { value: 200, unit: "°C" },
  );

  // 10. Smart rounding
  assert("roundQuantity(123, 'g') → 125", roundQuantity(123, "g"), 125);
  assert("roundQuantity(30, 'g') → 30", roundQuantity(30, "g"), 30);
  assert("roundQuantity(1.4, 'whole') → 1", roundQuantity(1.4, "whole"), 1);
  assert("roundQuantity(2.6, 'cloves') → 3", roundQuantity(2.6, "cloves"), 3);
  assert("roundQuantity(3.456, 'tsp') → 3.5", roundQuantity(3.456, "tsp"), 3.5);

  // 11. Teaspoon of baking powder with density (g_per_tsp)
  assert(
    "1 tsp baking powder → grams",
    convertUnit(1, "tsp", "baking powder"),
    { quantity: 4, unit: "g" },
  );

  // 12. Salt with g_per_tbsp density
  assert(
    "1 tbsp salt → grams",
    convertUnit(1, "tbsp", "salt"),
    { quantity: 18, unit: "g" },
  );

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}
