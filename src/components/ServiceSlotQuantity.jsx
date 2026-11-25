import { ServiceSlotTabs } from "./ServiceSlotSelection";
import { getServiceSlotLists } from "../Utils/serviceSlots";
import { decodeHtml } from "../Utils/Functions";
import { __, sprintf } from "../i18n";

/**
 * "total_guests" mode (participant_input_mode): the original slot design — a
 * row per time with − / quantity / +. Choosing a quantity also selects that
 * slot; there is no separate participant step.
 */
export default function ServiceSlotQuantity({
  availability,
  selectedSlot,
  quantity,
  tab,
  onTabChange,
  onChange,
  disabled,
  fallbackPrice,
  hideTabs = false,
}) {
  // hideTabs: no tab bar, always the "All" list.
  const { uniqueSlots, visibleSlots } = getServiceSlotLists(
    availability,
    hideTabs ? "all" : tab,
  );

  return (
    <div className="fx-service-slot-quantity" aria-disabled={disabled}>
      <ServiceSlotTabs
        show={!hideTabs && uniqueSlots.length > 1}
        tab={tab}
        onTabChange={onTabChange}
        disabled={disabled}
      />
      <h5>{__("Choose the time")}</h5>
      <div className="fx-timelistboxbar">
        {visibleSlots.length === 0 && (
          <p className="fx-noslots">{__("No slots available")}</p>
        )}
        {visibleSlots.map((item) => {
          const isSelected = selectedSlot === item.time_slot;
          const value = isSelected ? quantity : 0;
          const capacityLeft = Number(item.capacity_left) || 0;
          const active = item.slot_type === "active" && capacityLeft > 0;
          return (
            <div
              className={`fx-timelistbox${isSelected ? " fx-slotbox-active" : ""}`}
              key={item.slot_key ?? item.time_slot}
            >
              <div className="fx-timeslotsection">
                <div className="time">{item.time_slot}</div>
              </div>
              {/* Same price source as the slot boxes in the age-wise view. */}
              <div className="fx-slot-row-price">
                {decodeHtml(
                  String(
                    item.slot_price_formatted ||
                      item.formatted_price ||
                      fallbackPrice ||
                      "",
                  ),
                )}
              </div>
              <div className="fx-common">
                <div className="fx-quantitybox">
                  {active && (
                    <>
                      <button
                        type="button"
                        className="decrement"
                        disabled={disabled || value <= 0}
                        onClick={() => onChange(item, -1)}
                        aria-label={sprintf(
                          __("Remove one guest at %s"),
                          item.time_slot,
                        )}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={value}
                        min={0}
                        max={capacityLeft}
                        readOnly
                        aria-label={sprintf(__("Guests at %s"), item.time_slot)}
                      />
                      <button
                        type="button"
                        className="increment"
                        disabled={disabled || value >= capacityLeft}
                        onClick={() => onChange(item, 1)}
                        aria-label={sprintf(
                          __("Add one guest at %s"),
                          item.time_slot,
                        )}
                      >
                        +
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
