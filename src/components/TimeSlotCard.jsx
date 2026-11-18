export default function TimeSlotCard({ time, price, left, selected, disabled, onSelect }) {
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
        <small>{left} left</small>
      </span>
    </button>
  );
}
