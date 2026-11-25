import { __, sprintf } from "../i18n";

export default function TimeSlotCard({
  time,
  price,
  left,
  selected,
  disabled,
  onSelect,
}) {
  return (
    <button
      type="button"
      className={`fx-ms-slot${selected ? " is-selected" : ""}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
    >
      <span className="fx-ms-slot-time">{time}</span>
      <span className="fx-ms-slot-meta">
        <strong>{price}</strong>
        {/* Hidden when service-details sets show_cap_left_text to false. */}
        {left !== null && left !== undefined && (
          <small>{sprintf(__("%s left"), left)}</small>
        )}
      </span>
    </button>
  );
}
