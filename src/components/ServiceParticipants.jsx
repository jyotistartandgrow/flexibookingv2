import { CalendarDays, Clock3, Pencil, Minus, Plus } from "lucide-react";

export default function ServiceParticipants({
  slot,
  price,
  counts,
  groups,
  onChange,
  onBack,
  disabled,
  loading,
  error,
  onRetry,
  maxQuantity,
  counting,
  physicalCapacity,
  formatPrice,
  totalPrice,
  total,
  validQuantity,
  quantityMessage,
}) {
  return (
    <div className="fx-service-participants">
      <section
        className="fx-service-selected-slot"
        aria-label="Selected time slot"
      >
        <h3>
          <CalendarDays size={16} aria-hidden="true" /> Selected Slot
        </h3>
        <div className="fx-service-selected-slot-row">
          <div className="fx-service-selected-slot-value">
            <Clock3 size={16} aria-hidden="true" />
            <strong>{slot}</strong>
            <strong>{price}</strong>
          </div>
          <button type="button" onClick={onBack}>
            <Pencil size={15} aria-hidden="true" /> Change Slot
          </button>
        </div>
      </section>
      {loading && (
        <p className="fx-service-participant-status" role="status">
          Loading participant options…
        </p>
      )}
      {error && (
        <div className="fx-service-participant-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}
      {!loading && !error && (
        <fieldset className="fx-service-participant-panel" disabled={disabled}>
          <h3>Who is coming?</h3>
          <p>
            Choose your participants once. Your selection applies to this time
            slot.
          </p>
          {groups.map((group) => (
            <div
              className={`fx-service-participant-row${group.disabled ? " is-disabled" : ""}`}
              key={group.key}
            >
              <div>
                <strong>{group.name}</strong>
                <small>{group.ages}</small>
                {Number.isFinite(group.unitPrice) && (
                  <small>{formatPrice(group.unitPrice)}</small>
                )}
              </div>
              <div
                className="fx-service-participant-quantity"
                role="group"
                aria-label={`${group.name} quantity`}
              >
                <button
                  type="button"
                  disabled={
                    disabled || group.disabled || !(counts[group.key] > 0)
                  }
                  onClick={() => onChange(group.key, -1)}
                  aria-label={`Remove one ${group.name.toLowerCase()} participant`}
                >
                  <Minus size={12} aria-hidden="true" />
                </button>
                <output aria-label={`${group.name} count`} aria-live="polite">
                  {counts[group.key] || 0}
                </output>
                <button
                  type="button"
                  disabled={
                    disabled ||
                    group.disabled ||
                    total >= maxQuantity ||
                    (group.takesPlace && counting >= physicalCapacity)
                  }
                  onClick={() => onChange(group.key, 1)}
                  aria-label={`Add one ${group.name.toLowerCase()} participant`}
                >
                  <Plus size={12} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
          {groups.length === 0 && (
            <p>
              No participant options are available for this slot. Please choose
              another slot.
            </p>
          )}
          {total > 0 && !validQuantity && (
            <p
              className="fx-service-participant-message is-invalid"
              role="alert"
            >
              {quantityMessage}
            </p>
          )}
          {total > 0 && (
            <div className="fx-service-participant-total" aria-live="polite">
              <span>
                {total} participant{total === 1 ? "" : "s"}
              </span>
              <strong>{totalPrice}</strong>
            </div>
          )}
        </fieldset>
      )}
    </div>
  );
}
