import { useState } from "react";
import { CalendarDays, Minus, Plus, Trash2, Wallet, X } from "lucide-react";
import Swal from "sweetalert2";
import daySpaImage from "../assets/popupservice.jpg";
import spaPackImage from "../assets/service1.jpg";

// Placeholder data matching the design. Replace with the API response.
const createSlots = (serviceId) =>
  Array.from({ length: 6 }, (_, index) => ({
    id: `${serviceId}-${index + 1}`,
    time: "09:00 - 09:40",
    price: 60,
    left: 2,
  }));

const SAMPLE_SERVICES = [
  {
    id: "day-spa",
    name: "Day SPA",
    description: "Ingresso SPA dalle 12:00 alle 21:00",
    image: daySpaImage,
    quantity: 1,
    selectedSlotId: "day-spa-1",
    slots: createSlots("day-spa"),
  },
  {
    id: "10-ingressi-spa",
    name: "10 ingressi spa",
    description: "Ingresso SPA dalle 12:00 alle 21:00",
    image: spaPackImage,
    quantity: 1,
    selectedSlotId: "10-ingressi-spa-2",
    slots: createSlots("10-ingressi-spa"),
  },
];

const getSelectedSlot = (service) =>
  service.slots.find((slot) => slot.id === service.selectedSlotId);

function ServiceRow({ service, onChange, onRemove }) {
  const { name, description, image, quantity, slots, selectedSlotId } = service;
  const maxQuantity =
    getSelectedSlot(service)?.left ?? Math.max(...slots.map((s) => s.left));

  return (
    <article className="fx-ms-service">
      <div className="fx-ms-info">
        <img className="fx-ms-image" src={image} alt={name} />
        <div className="fx-ms-details">
          <h3 className="fx-ms-name">{name}</h3>
          <p className="fx-ms-description">{description}</p>
          <div className="fx-ms-quantity">
            <button
              type="button"
              aria-label={`Decrease quantity of ${name}`}
              disabled={quantity <= 1}
              onClick={() => onChange({ quantity: quantity - 1 })}
            >
              <Minus size={12} />
            </button>
            <span aria-live="polite">{quantity}</span>
            <button
              type="button"
              aria-label={`Increase quantity of ${name}`}
              disabled={quantity >= maxQuantity}
              onClick={() => onChange({ quantity: quantity + 1 })}
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      </div>

      <div className="fx-ms-slots">
        <h4 className="fx-ms-slots-title">Select time slot</h4>
        <div className="fx-ms-slot-grid">
          {slots.map((slot) => {
            const isSelected = slot.id === selectedSlotId;
            return (
              <button
                key={slot.id}
                type="button"
                className={`fx-ms-slot${isSelected ? " is-selected" : ""}`}
                aria-pressed={isSelected}
                disabled={slot.left < quantity}
                onClick={() =>
                  onChange({ selectedSlotId: isSelected ? null : slot.id })
                }
              >
                <span className="fx-ms-slot-time">{slot.time}</span>
                <span className="fx-ms-slot-meta">
                  <strong>€{slot.price}</strong>
                  <small>{slot.left} left</small>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        className="fx-ms-remove"
        aria-label={`Remove ${name}`}
        onClick={onRemove}
      >
        <Trash2 size={22} />
      </button>
    </article>
  );
}

export default function MultiServices({ onClose, onContinue }) {
  const [services, setServices] = useState(SAMPLE_SERVICES);

  const updateService = (id, changes) =>
    setServices((current) =>
      current.map((service) =>
        service.id === id ? { ...service, ...changes } : service,
      ),
    );

  const removeService = (id) =>
    setServices((current) => current.filter((service) => service.id !== id));

  const selected = services.filter(getSelectedSlot);
  const totalPrice = selected.reduce(
    (sum, service) => sum + getSelectedSlot(service).price * service.quantity,
    0,
  );

  const handleContinue = () => {
    if (selected.length < services.length) {
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        icon: "warning",
        title: "Please select a time slot for each service",
      });
      return;
    }
    onContinue?.(
      services.map((service) => ({
        serviceId: service.id,
        quantity: service.quantity,
        slot: getSelectedSlot(service),
      })),
    );
  };

  return (
    <section className="fx-multi-services">
      <header className="fx-ms-header">
        <h2 className="fx-ms-title">Selected Services</h2>
        <span className="fx-ms-badge">
          {services.length} {services.length === 1 ? "service" : "services"}
        </span>
        <button
          type="button"
          className="fx-ms-close"
          aria-label="Close"
          onClick={() => onClose?.()}
        >
          <X size={28} />
        </button>
      </header>

      <div className="fx-ms-list">
        {services.length === 0 && (
          <p className="fx-ms-empty">No services selected.</p>
        )}
        {services.map((service) => (
          <ServiceRow
            key={service.id}
            service={service}
            onChange={(changes) => updateService(service.id, changes)}
            onRemove={() => removeService(service.id)}
          />
        ))}
      </div>

      <footer className="fx-ms-footer">
        <button
          type="button"
          className="fx-ms-cancel"
          onClick={() => onClose?.()}
        >
          Cancel
        </button>
        <div className="fx-ms-summary">
          <div className="fx-ms-summary-item">
            <span className="fx-ms-summary-icon">
              <CalendarDays size={18} />
            </span>
            {selected.length} {selected.length === 1 ? "Slot" : "Slots"} selected
          </div>
          <div className="fx-ms-summary-item">
            <span className="fx-ms-summary-icon">
              <Wallet size={18} />
            </span>
            Total Price: <strong className="fx-ms-total">€{totalPrice}</strong>
          </div>
        </div>
        <button
          type="button"
          className="fx-ms-continue"
          disabled={services.length === 0}
          onClick={handleContinue}
        >
          CONTINUE
        </button>
      </footer>
    </section>
  );
}
