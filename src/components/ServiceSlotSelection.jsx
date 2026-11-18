import TimeSlotCard from "./TimeSlotCard";
import { decodeHtml } from "../Utils/Functions";

export default function ServiceSlotSelection({ availability, selectedSlot, tab, onTabChange, onSelect, disabled, fallbackPrice }) {
  const singleSlot = availability?.single_time_slot;
  const allSlots = singleSlot?.time_slot
    ? [singleSlot]
    : Array.isArray(availability?.time_slots) && availability.time_slots.length > 0
      ? availability.time_slots
      : ["morning", "afternoon", "evening"].flatMap((key) => availability?.[key] || []);
  const uniqueSlots = allSlots.filter((slot, index, slots) =>
    slots.findIndex((candidate) => candidate.time_slot === slot.time_slot) === index,
  );
  const visibleSlots = uniqueSlots.filter((slot) => {
    if (tab === "all" || uniqueSlots.length === 1) return true;
    if (Array.isArray(availability?.[tab])) return availability[tab].some((candidate) => candidate.time_slot === slot.time_slot);
    const match = String(slot.from || slot.time_slot).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    let hour = Number(match?.[1] || 0);
    if (match?.[3]) hour = (hour % 12) + (match[3].toUpperCase() === "PM" ? 12 : 0);
    return tab === "morning" ? hour < 12 : hour >= 12;
  });

  return (
    <fieldset className="fx-service-slot-flow fx-popup-slot-selection" disabled={disabled} aria-disabled={disabled}>
      <h3>Choose the Slot</h3>
      {uniqueSlots.length > 1 && (
        <div id="fx-modaltab_nav" className="fx-service-slot-tabs" aria-label="Filter time slots">
          <ul>
            {[["morning", "Morning"], ["afternoon", "Afternoon"], ["all", "All"]].map(([key, label]) => (
              <li key={key} className={tab === key ? "selected" : ""}>
                <a href="#" className={tab === key ? "selected" : ""} aria-current={tab === key ? "true" : undefined} aria-disabled={disabled} onClick={(event) => { event.preventDefault(); if (!disabled) onTabChange(key); }}>{label}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="fx-ms-slot-grid">
        {visibleSlots.map((item) => (
          <TimeSlotCard
            key={item.slot_key ?? item.time_slot}
            time={item.time_slot}
            price={decodeHtml(String(item.slot_price_formatted || item.formatted_price || fallbackPrice || ""))}
            left={item.capacity_left ?? 0}
            selected={selectedSlot === item.time_slot}
            disabled={disabled || item.slot_type !== "active" || Number(item.capacity_left) <= 0}
            onSelect={() => onSelect(item)}
          />
        ))}
      </div>
      {visibleSlots.length === 0 && <p className="fx-service-slot-empty">No {tab === "all" ? "" : `${tab} `}slots available for this date.</p>}
    </fieldset>
  );
}
