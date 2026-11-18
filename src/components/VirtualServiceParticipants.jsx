import { CalendarDays, Clock3, Minus, Pencil, Plus } from "lucide-react";
import BundleParticipants from "./BundleParticipants";

/**
 * Participant step for a virtual service: choose how many bookings
 * (total_service_booking), then the visitors for each included service, which
 * come from the shared component-participants API.
 */
export default function VirtualServiceParticipants({ slot, price, quantity, minQuantity, maxQuantity, onQuantityChange, onBack, disabled, selection }) {
  const busy = disabled || selection.checking;
  return (
    <div className="fx-service-participants">
      <section className="fx-service-selected-slot" aria-label="Selected time slot">
        <h3><CalendarDays size={16} aria-hidden="true" /> Selected Slot</h3>
        <div className="fx-service-selected-slot-row">
          <div className="fx-service-selected-slot-value"><Clock3 size={16} aria-hidden="true" /><strong>{slot}</strong><strong>{price}</strong></div>
          <button type="button" onClick={onBack}><Pencil size={15} aria-hidden="true" /> Change Slot</button>
        </div>
      </section>

      <fieldset className="fx-service-participant-panel" disabled={busy}>
        <h3>Quantity</h3>
        <div className="fx-service-participant-row">
          <div><strong>Bookings</strong><small>{maxQuantity > 0 ? `${maxQuantity} available` : "Not available"}</small></div>
          <div className="fx-service-participant-quantity" role="group" aria-label="Booking quantity">
            <button type="button" disabled={busy || quantity <= minQuantity} onClick={() => onQuantityChange(quantity - 1)} aria-label="Remove one booking"><Minus size={12} aria-hidden="true" /></button>
            <output aria-live="polite">{quantity}</output>
            <button type="button" disabled={busy || quantity >= maxQuantity} onClick={() => onQuantityChange(quantity + 1)} aria-label="Add one booking"><Plus size={12} aria-hidden="true" /></button>
          </div>
        </div>
      </fieldset>

      <BundleParticipants selection={selection} />
    </div>
  );
}
