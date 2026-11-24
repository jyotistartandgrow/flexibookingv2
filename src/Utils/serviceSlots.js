// Slots for the chosen Morning / Afternoon / All tab (shared by both slot designs).
export const getServiceSlotLists = (availability, tab) => {
  const singleSlot = availability?.single_time_slot;
  const allSlots = singleSlot?.time_slot
    ? [singleSlot]
    : Array.isArray(availability?.time_slots) &&
        availability.time_slots.length > 0
      ? availability.time_slots
      : ["morning", "afternoon", "evening"].flatMap(
          (key) => availability?.[key] || [],
        );
  const uniqueSlots = allSlots.filter(
    (slot, index, slots) =>
      slots.findIndex((candidate) => candidate.time_slot === slot.time_slot) ===
      index,
  );
  const visibleSlots = uniqueSlots.filter((slot) => {
    if (tab === "all" || uniqueSlots.length === 1) return true;
    if (Array.isArray(availability?.[tab]))
      return availability[tab].some(
        (candidate) => candidate.time_slot === slot.time_slot,
      );
    const match = String(slot.from || slot.time_slot).match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)?/i,
    );
    let hour = Number(match?.[1] || 0);
    if (match?.[3])
      hour = (hour % 12) + (match[3].toUpperCase() === "PM" ? 12 : 0);
    return tab === "morning" ? hour < 12 : hour >= 12;
  });

  return { uniqueSlots, visibleSlots };
};
