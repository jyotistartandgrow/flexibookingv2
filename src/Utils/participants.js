import moment from "moment";
import { __, sprintf } from "../i18n";

export const getParticipantSlotStart = (item) => {
  const value =
    item?.from || String(item?.time_slot || "").split(/\s*[-–—]\s*/)[0];
  const parsed = moment(
    value,
    ["HH:mm", "H:mm", "HH:mm:ss", "h:mm A", "hh:mm A"],
    true,
  );
  return parsed.isValid() ? parsed.format("HH:mm") : "";
};

export const normalizeParticipantGroups = (config) => {
  const categories = config?.categories || {};
  const bands = Object.values(config?.bands || {});
  const source = bands.length ? bands : Object.values(categories);
  const order = ["adult", "children", "senior", "infant"];
  return source
    .map((band) => {
      const category = band.category || band.key;
      const policy = categories[category] || {};
      const from = band.from ?? policy.from;
      const to = band.to ?? policy.to;
      return {
        key: band.key,
        category,
        name: band.label || policy.label || category,
        ages:
          from == null
            ? ""
            : to == null || Number(to) >= 130
              ? `${from}+ years`
              : `${from}–${to} years`,
        disabled: Boolean(band.disabled || policy.disabled),
        takesPlace: Number(band.takes_place ?? policy.takes_place ?? 1) > 0,
        unitPrice: Number(band.unit_price),
        bandKey: bands.length ? band.key : null,
      };
    })
    .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
};

export const getParticipantSummary = (service) => {
  const groups = normalizeParticipantGroups(service?.participant_configuration);
  const labels = {
    adult: __("Adults"),
    adults: __("Adults"),
    children: __("Children"),
    senior: __("Seniors"),
    seniors: __("Seniors"),
    infant: __("Infants"),
    infants: __("Infants"),
  };
  const summary = new Map();
  for (const [key, value] of Object.entries(service?.participants || {})) {
    const quantity = Number(value);
    if (!Number.isFinite(quantity) || quantity <= 0) continue;
    const group = groups.find((item) => item.key === key);
    const category = group?.category || key.split(":")[0];
    const name =
      service?.participant_configuration?.categories?.[category]?.label ||
      group?.name ||
      labels[category] ||
      category;
    const existing = summary.get(category);
    summary.set(category, {
      key: category,
      name,
      quantity: (existing?.quantity || 0) + quantity,
    });
  }
  return Array.from(summary.values());
};

export const getParticipantSelection = (
  config,
  groups,
  counts,
  slotCapacity,
  serviceCapacity,
) => {
  const rules = config?.quantity_rules || {};
  const minimum = Math.max(
    1,
    Number(rules.minimum_quantity ?? config?.slot?.min_cap) || 1,
  );
  const increment = Math.max(
    1,
    Number(rules.booking_increment ?? config?.slot?.booking_increment) || 1,
  );
  const maximum = Math.max(
    0,
    Math.min(
      Number(config?.max_participants ?? 100),
      Number(rules.maximum_quantity ?? config?.slot?.max_cap ?? 100),
      Number(rules.available_quantity ?? 100),
    ),
  );
  const physicalCapacity = Math.max(
    0,
    Math.min(
      Number(slotCapacity) || 0,
      Number(config?.slot?.capacity_left ?? slotCapacity) || 0,
      serviceCapacity != null && String(serviceCapacity).trim() !== ""
        ? Number(serviceCapacity)
        : Infinity,
    ),
  );
  const allowed = Array.isArray(rules.allowed_quantities)
    ? rules.allowed_quantities.map(Number)
    : null;
  let total = 0;
  let counting = 0;
  let price = 0;
  let accompanied = false;
  let permitted = true;
  const guests = [];
  for (const group of groups) {
    const quantity = Number(counts[group.key]) || 0;
    total += quantity;
    counting += group.takesPlace ? quantity : 0;
    price +=
      (Number.isFinite(group.unitPrice) ? group.unitPrice : 0) * quantity;
    if (quantity && group.disabled) permitted = false;
    if (quantity && ["adult", "senior"].includes(group.category))
      accompanied = true;
    for (let index = 0; index < quantity; index++) {
      guests.push({
        type: "ticket",
        ticket_type: group.category,
        ...(group.bandKey ? { band_key: group.bandKey } : {}),
      });
    }
  }
  const quantityValid =
    total >= minimum &&
    total <= maximum &&
    (allowed ? allowed.includes(total) : (total - minimum) % increment === 0);
  const available =
    config?.slot?.bookable !== false &&
    !["not_on_sale", "too_late"].includes(config?.slot?.state);
  const adultValid = !config?.adult_required || accompanied;
  let message = __("Please choose a valid participant quantity for this slot.");
  if (total > maximum || counting > physicalCapacity)
    message = __(
      "This selection exceeds the available capacity. Reduce participants or choose another slot.",
    );
  else if (total > 0 && !adultValid)
    message = __("At least one accompanying adult or senior is required.");
  else if (!available)
    message = __(
      "This slot is no longer available. Please choose another slot.",
    );
  return {
    total,
    counting,
    price,
    maximum,
    physicalCapacity,
    guests,
    message,
    valid:
      Boolean(config) &&
      groups.length > 0 &&
      permitted &&
      quantityValid &&
      counting <= physicalCapacity &&
      available &&
      adultValid,
  };
};

const formatAges = (from, to) =>
  from == null
    ? ""
    : to == null || Number(to) >= 130
      ? `${from}+ years`
      : `${from}–${to} years`;

/**
 * One entry per age category (Adults, Children, …) with its price bands.
 * A category with needs_breakdown and several bands (e.g. Seniors 41–100 and
 * 101–130) asks the visitor to split its count across those bands.
 */
export const normalizeParticipantCategories = (config) => {
  const categories = config?.categories || {};
  const bands = config?.bands || {};
  const order = ["adult", "children", "senior", "infant"];
  return Object.values(categories)
    .map((category) => {
      const bandKeys = Array.isArray(category.band_keys)
        ? category.band_keys
        : Object.keys(bands).filter(
            (key) => bands[key]?.category === category.key,
          );
      const categoryBands = bandKeys
        .map((key) => bands[key])
        .filter(Boolean)
        .map((band) => ({
          key: band.key,
          name: band.label || category.label,
          ages: formatAges(band.from, band.to),
          disabled: Boolean(band.disabled || category.disabled),
        }));
      return {
        key: category.key,
        category: category.key,
        name: category.label || category.key,
        ages: formatAges(category.from, category.to),
        disabled: Boolean(category.disabled),
        takesPlace: Number(category.takes_place ?? 1) > 0,
        bands: categoryBands,
        needsBreakdown:
          Boolean(category.needs_breakdown) && categoryBands.length > 1,
      };
    })
    .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
};

/**
 * Band-level counts for the cart (keys match getParticipantSummary): single-band
 * categories use their band key, broken-down categories use the chosen bands,
 * and multi-band categories without a breakdown fall back to the category key.
 */
export const getCategoryBandCounts = (categories, counts, breakdown) => {
  const result = {};
  for (const category of categories) {
    const count = Number(counts?.[category.key]) || 0;
    if (category.needsBreakdown) {
      for (const band of category.bands) {
        const value = Number(breakdown?.[band.key]) || 0;
        if (value > 0) result[band.key] = value;
      }
    } else if (count > 0) {
      result[
        category.bands.length === 1 ? category.bands[0].key : category.key
      ] = count;
    }
  }
  return result;
};

export const getBreakdownTotal = (category, breakdown) =>
  category.bands.reduce(
    (sum, band) => sum + (Number(breakdown?.[band.key]) || 0),
    0,
  );

/**
 * Category-based selection: quantity/capacity rules from getParticipantSelection
 * plus every required age breakdown being complete. Guests carry the band_key
 * the quote/booking APIs expect.
 */
export const getCategoryParticipantSelection = (
  config,
  categories,
  counts,
  breakdown,
  slotCapacity,
  serviceCapacity,
) => {
  const base = getParticipantSelection(
    config,
    categories.map((category) => ({
      key: category.key,
      category: category.category,
      disabled: category.disabled,
      takesPlace: category.takesPlace,
      unitPrice: NaN,
      bandKey: null,
    })),
    counts || {},
    slotCapacity,
    serviceCapacity,
  );
  const incomplete = categories.filter(
    (category) =>
      category.needsBreakdown &&
      (Number(counts?.[category.key]) || 0) > 0 &&
      getBreakdownTotal(category, breakdown) !==
        (Number(counts?.[category.key]) || 0),
  );
  const guests = [];
  for (const category of categories) {
    const count = Number(counts?.[category.key]) || 0;
    if (category.needsBreakdown) {
      for (const band of category.bands) {
        const value = Number(breakdown?.[band.key]) || 0;
        for (let index = 0; index < value; index++) {
          guests.push({
            type: "ticket",
            ticket_type: category.category,
            band_key: band.key,
          });
        }
      }
    } else {
      const bandKey =
        category.bands.length === 1 ? category.bands[0].key : null;
      for (let index = 0; index < count; index++) {
        guests.push({
          type: "ticket",
          ticket_type: category.category,
          ...(bandKey ? { band_key: bandKey } : {}),
        });
      }
    }
  }
  return {
    ...base,
    guests,
    incompleteBreakdowns: incomplete.map((category) => category.key),
    breakdownComplete: incomplete.length === 0,
    valid: base.valid && incomplete.length === 0,
    message:
      base.valid && incomplete.length > 0
        ? sprintf(
            __("Complete the age breakdown for %s."),
            incomplete.map((category) => category.name).join(", "),
          )
        : base.message,
  };
};
