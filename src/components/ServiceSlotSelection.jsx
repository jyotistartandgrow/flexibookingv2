import TimeSlotCard from "./TimeSlotCard";
import { decodeHtml } from "../Utils/Functions";
import { getServiceSlotLists } from "../Utils/serviceSlots";

export function ServiceSlotTabs({ show, tab, onTabChange, disabled }) {
  if (!show) return null;
  return (
    <div
      id="fx-modaltab_nav"
      className="fx-service-slot-tabs"
      aria-label="Filter time slots"
    >
      <ul>
        {[
          ["morning", "Morning"],
          ["afternoon", "Afternoon"],
          ["all", "All"],
        ].map(([key, label]) => (
          <li key={key} className={tab === key ? "selected" : ""}>
            <a
              href="#"
              className={tab === key ? "selected" : ""}
              aria-current={tab === key ? "true" : undefined}
              aria-disabled={disabled}
              onClick={(event) => {
                event.preventDefault();
                if (!disabled) onTabChange(key);
              }}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ServiceSlotSelection({
  availability,
  selectedSlot,
  tab,
  onTabChange,
  onSelect,
  disabled,
  fallbackPrice,
  showCapacityLeft = true,
}) {
  const { uniqueSlots, visibleSlots } = getServiceSlotLists(availability, tab);

  return (
    <fieldset
      className="fx-service-slot-flow fx-popup-slot-selection"
      disabled={disabled}
      aria-disabled={disabled}
    >
      <h3>Choose the Slot</h3>
      <ServiceSlotTabs
        show={uniqueSlots.length > 1}
        tab={tab}
        onTabChange={onTabChange}
        disabled={disabled}
      />
      <div className="fx-ms-slot-grid">
        {visibleSlots.map((item) => (
          <TimeSlotCard
            key={item.slot_key ?? item.time_slot}
            time={item.time_slot}
            price={decodeHtml(
              String(
                item.slot_price_formatted ||
                  item.formatted_price ||
                  fallbackPrice ||
                  "",
              ),
            )}
            left={showCapacityLeft ? (item.capacity_left ?? 0) : null}
            selected={selectedSlot === item.time_slot}
            disabled={
              disabled ||
              item.slot_type !== "active" ||
              Number(item.capacity_left) <= 0
            }
            onSelect={() => onSelect(item)}
          />
        ))}
      </div>
      {visibleSlots.length === 0 && (
        <p className="fx-service-slot-empty">
          No {tab === "all" ? "" : `${tab} `}slots available for this date.
        </p>
      )}
    </fieldset>
  );
}
