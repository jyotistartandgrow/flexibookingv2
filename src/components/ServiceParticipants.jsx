import {
  CalendarDays,
  ChevronDown,
  Clock3,
  Pencil,
  Minus,
  Plus,
} from "lucide-react";
import { getBreakdownTotal } from "../Utils/participants";
import { decodeHtml } from "../Utils/Functions";

const visitorsLabel = (count) =>
  `${count} visitor${Number(count) === 1 ? "" : "s"}`;

function QuantityControl({
  label,
  value,
  onMinus,
  onPlus,
  minusDisabled,
  plusDisabled,
}) {
  return (
    <div
      className="fx-service-participant-quantity"
      role="group"
      aria-label={`${label} quantity`}
    >
      <button
        type="button"
        disabled={minusDisabled}
        onClick={onMinus}
        aria-label={`Remove one ${label.toLowerCase()}`}
      >
        <Minus size={12} aria-hidden="true" />
      </button>
      <output aria-label={`${label} count`} aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        disabled={plusDisabled}
        onClick={onPlus}
        aria-label={`Add one ${label.toLowerCase()}`}
      >
        <Plus size={12} aria-hidden="true" />
      </button>
    </div>
  );
}

// Splits a category's visitors across its age bands (e.g. Seniors 41–100 / 101–130).
function AgeBreakdown({ category, count, breakdown, disabled, onBandChange }) {
  const assigned = getBreakdownTotal(category, breakdown);
  const remaining = count - assigned;
  return (
    <details className="fx-service-participant-breakdown" open>
      <summary>
        <ChevronDown size={14} aria-hidden="true" /> Age breakdown
      </summary>
      <p
        className={`fx-service-participant-breakdown-status${remaining === 0 ? " is-complete" : ""}`}
        role="status"
      >
        {remaining === 0
          ? "Age breakdown complete."
          : `Assign ${visitorsLabel(remaining)} to an age range.`}
      </p>
      {category.bands.map((band) => {
        const value = Number(breakdown?.[band.key]) || 0;
        return (
          <div className="fx-service-participant-band" key={band.key}>
            <span>{band.ages || band.name}</span>
            <QuantityControl
              label={`${category.name} ${band.ages}`}
              value={value}
              minusDisabled={disabled || band.disabled || value <= 0}
              plusDisabled={disabled || band.disabled || remaining <= 0}
              onMinus={() => onBandChange(category, band.key, -1)}
              onPlus={() => onBandChange(category, band.key, 1)}
            />
          </div>
        );
      })}
    </details>
  );
}

// Price summary from the participant-quote API (group rates, age-band prices).
function QuoteSummary({ quote, loading, error }) {
  if (error) {
    return (
      <p className="fx-service-participant-message is-invalid" role="alert">
        {decodeHtml(error)}
      </p>
    );
  }
  if (!quote) {
    return loading ? (
      <p className="fx-service-participant-message">Calculating price…</p>
    ) : null;
  }
  const lines = quote.group?.applied
    ? [
        `Group rate · ${visitorsLabel(quote.group.count ?? quote.tickets)} · ${decodeHtml(quote.group.formatted_total || quote.formatted_total || "")}`,
      ]
    : (Array.isArray(quote.breakdown) ? quote.breakdown : [])
        .filter((line) => Number(line?.quantity) > 0)
        .map(
          (line) =>
            `${line.label}${line.from != null ? ` ${line.from}${line.to != null && Number(line.to) < 130 ? `–${line.to}` : "+"}` : ""} × ${line.quantity} · ${decodeHtml(line.formatted_total || "")}`,
        );
  return (
    <div className="fx-service-participant-quote" aria-live="polite">
      <p>
        Total visitors: {quote.tickets} · Places needed: {quote.counting} ·{" "}
        {decodeHtml(quote.formatted_total || "")}
      </p>
      {lines.length > 0 && (
        <ul>
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {(quote.available === false || quote.quantity_valid === false) &&
        quote.validation_message && (
          <p className="fx-service-participant-message is-invalid" role="alert">
            {decodeHtml(quote.validation_message)}
          </p>
        )}
    </div>
  );
}

export default function ServiceParticipants({
  slot,
  price,
  categories,
  counts,
  breakdown,
  onCategoryChange,
  onBandChange,
  onBack,
  disabled,
  loading,
  error,
  onRetry,
  maxQuantity,
  counting,
  physicalCapacity,
  total,
  validQuantity,
  quantityMessage,
  quote,
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
          {categories.map((category) => {
            const value = Number(counts?.[category.key]) || 0;
            return (
              <div
                className={`fx-service-participant-category${category.disabled ? " is-disabled" : ""}`}
                key={category.key}
              >
                <div className="fx-service-participant-row">
                  <div>
                    <strong>{category.name}</strong>
                    <small>{category.ages}</small>
                  </div>
                  <QuantityControl
                    label={category.name}
                    value={value}
                    minusDisabled={disabled || category.disabled || value <= 0}
                    plusDisabled={
                      disabled ||
                      category.disabled ||
                      total >= maxQuantity ||
                      (category.takesPlace && counting >= physicalCapacity)
                    }
                    onMinus={() => onCategoryChange(category.key, -1)}
                    onPlus={() => onCategoryChange(category.key, 1)}
                  />
                </div>
                {category.needsBreakdown && value > 0 && (
                  <AgeBreakdown
                    category={category}
                    count={value}
                    breakdown={breakdown}
                    disabled={disabled || category.disabled}
                    onBandChange={onBandChange}
                  />
                )}
              </div>
            );
          })}
          {categories.length === 0 && (
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
            <>
              <div className="fx-service-participant-total" aria-live="polite">
                <span>
                  {total} participant{total === 1 ? "" : "s"}
                </span>
                <strong>
                  {quote?.quote?.formatted_total
                    ? decodeHtml(quote.quote.formatted_total)
                    : quote?.loading
                      ? "…"
                      : ""}
                </strong>
              </div>
              {validQuantity && (
                <QuoteSummary
                  quote={quote?.quote}
                  loading={quote?.loading}
                  error={quote?.error}
                />
              )}
            </>
          )}
        </fieldset>
      )}
    </div>
  );
}
