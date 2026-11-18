import moment from "moment";

export const getParticipantSlotStart = (item) => {
  const value = item?.from || String(item?.time_slot || "").split(/\s*[-–—]\s*/)[0];
  const parsed = moment(value, ["HH:mm", "H:mm", "HH:mm:ss", "h:mm A", "hh:mm A"], true);
  return parsed.isValid() ? parsed.format("HH:mm") : "";
};

export const normalizeParticipantGroups = (config) => {
  const categories = config?.categories || {};
  const bands = Object.values(config?.bands || {});
  const source = bands.length ? bands : Object.values(categories);
  const order = ["adult", "children", "senior", "infant"];
  return source.map((band) => {
    const category = band.category || band.key;
    const policy = categories[category] || {};
    const from = band.from ?? policy.from;
    const to = band.to ?? policy.to;
    return {
      key: band.key,
      category,
      name: band.label || policy.label || category,
      ages: from == null ? "" : to == null || Number(to) >= 130 ? `${from}+ years` : `${from}–${to} years`,
      disabled: Boolean(band.disabled || policy.disabled),
      takesPlace: Number(band.takes_place ?? policy.takes_place ?? 1) > 0,
      unitPrice: Number(band.unit_price),
      bandKey: bands.length ? band.key : null,
    };
  }).sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
};

export const getParticipantSummary = (service) => {
  const groups = normalizeParticipantGroups(service?.participant_configuration);
  const labels = { adult: "Adults", adults: "Adults", children: "Children", senior: "Seniors", seniors: "Seniors", infant: "Infants", infants: "Infants" };
  const summary = new Map();
  for (const [key, value] of Object.entries(service?.participants || {})) {
    const quantity = Number(value);
    if (!Number.isFinite(quantity) || quantity <= 0) continue;
    const group = groups.find((item) => item.key === key);
    const category = group?.category || key.split(":")[0];
    const name = service?.participant_configuration?.categories?.[category]?.label || group?.name || labels[category] || category;
    const existing = summary.get(category);
    summary.set(category, { key: category, name, quantity: (existing?.quantity || 0) + quantity });
  }
  return Array.from(summary.values());
};

export const getParticipantSelection = (config, groups, counts, slotCapacity, serviceCapacity) => {
  const rules = config?.quantity_rules || {};
  const minimum = Math.max(1, Number(rules.minimum_quantity ?? config?.slot?.min_cap) || 1);
  const increment = Math.max(1, Number(rules.booking_increment ?? config?.slot?.booking_increment) || 1);
  const maximum = Math.max(0, Math.min(
    Number(config?.max_participants ?? 100),
    Number(rules.maximum_quantity ?? config?.slot?.max_cap ?? 100),
    Number(rules.available_quantity ?? 100),
  ));
  const physicalCapacity = Math.max(0, Math.min(
    Number(slotCapacity) || 0,
    Number(config?.slot?.capacity_left ?? slotCapacity) || 0,
    serviceCapacity != null && String(serviceCapacity).trim() !== "" ? Number(serviceCapacity) : Infinity,
  ));
  const allowed = Array.isArray(rules.allowed_quantities) ? rules.allowed_quantities.map(Number) : null;
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
    price += (Number.isFinite(group.unitPrice) ? group.unitPrice : 0) * quantity;
    if (quantity && group.disabled) permitted = false;
    if (quantity && ["adult", "senior"].includes(group.category)) accompanied = true;
    for (let index = 0; index < quantity; index++) {
      guests.push({ type: "ticket", ticket_type: group.category, ...(group.bandKey ? { band_key: group.bandKey } : {}) });
    }
  }
  const quantityValid = total >= minimum && total <= maximum &&
    (allowed ? allowed.includes(total) : (total - minimum) % increment === 0);
  const available = config?.slot?.bookable !== false && !["not_on_sale", "too_late"].includes(config?.slot?.state);
  const adultValid = !config?.adult_required || accompanied;
  let message = "Please choose a valid participant quantity for this slot.";
  if (total > maximum || counting > physicalCapacity) message = "This selection exceeds the available capacity. Reduce participants or choose another slot.";
  else if (total > 0 && !adultValid) message = "At least one accompanying adult or senior is required.";
  else if (!available) message = "This slot is no longer available. Please choose another slot.";
  return {
    total, counting, price, maximum, physicalCapacity, guests, message,
    valid: Boolean(config) && groups.length > 0 && permitted && quantityValid && counting <= physicalCapacity && available && adultValid,
  };
};
