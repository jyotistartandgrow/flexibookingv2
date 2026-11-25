import {
  CalendarDays,
  ImageOff,
  Minus,
  Plus,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { Dialog } from "primereact/dialog";
import Swal from "sweetalert2";
import TimeSlotCard from "./TimeSlotCard";
import {
  choiceKey,
  formatLikePrice,
  getSelectedChoice,
} from "../Utils/redeemUpsells";
import { __, _n, sprintf } from "../i18n";

const choiceLabel = (choice) =>
  choice.slot_label || [choice.from, choice.to].filter(Boolean).join(" - ");

const allowedQuantities = (item, choice) => {
  const source = choice?.allowed_quantities?.length
    ? choice.allowed_quantities
    : item.allowed_quantities;
  return (source || [])
    .map(Number)
    .filter((value) => value > 0)
    .sort((a, b) => a - b);
};

const needsSlot = (item) => (item.schedule_choices || []).length > 0;

function SelectedServiceRow({
  item,
  quantity,
  slotKey,
  onQuantity,
  onSlot,
  onRemove,
}) {
  const choices = item.schedule_choices || [];
  const selectedChoice = getSelectedChoice(item, slotKey);
  const allowed = allowedQuantities(item, selectedChoice);
  const lower = [...allowed].reverse().find((value) => value < quantity);
  const higher = allowed.find((value) => value > quantity);

  return (
    <article className="fx-ms-service">
      <div className="fx-ms-info">
        {item.image ? (
          <img className="fx-ms-image" src={item.image} alt={item.name} />
        ) : (
          <span className="fx-ms-image fx-ms-image-fallback" aria-hidden="true">
            <ImageOff size={24} />
          </span>
        )}
        <div className="fx-ms-details">
          <h3 className="fx-ms-name">{item.name}</h3>
          {item.description && (
            <p className="fx-ms-description">{item.description}</p>
          )}
          <div className="fx-ms-quantity">
            <button
              type="button"
              aria-label={sprintf(__("Decrease quantity of %s"), item.name)}
              disabled={lower == null}
              onClick={() => onQuantity(lower)}
            >
              <Minus size={12} />
            </button>
            <span aria-live="polite">{quantity}</span>
            <button
              type="button"
              aria-label={sprintf(__("Increase quantity of %s"), item.name)}
              disabled={higher == null}
              onClick={() => onQuantity(higher)}
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      </div>

      <div className="fx-ms-slots">
        <h4 className="fx-ms-slots-title">
          {needsSlot(item) ? __("Select time slot") : __("Time slot")}
        </h4>
        {needsSlot(item) ? (
          <div className="fx-ms-slot-grid">
            {choices.map((choice) => {
              const key = choiceKey(choice);
              const isSelected = key === slotKey;
              const fits = allowedQuantities(item, choice).includes(quantity);
              return (
                <TimeSlotCard
                  key={key}
                  time={choiceLabel(choice)}
                  price={
                    choice.formatted_price ||
                    formatLikePrice(item.formatted_price, choice.price)
                  }
                  left={choice.available_count ?? 0}
                  selected={isSelected}
                  disabled={!fits}
                  onSelect={() => onSlot(isSelected ? null : key)}
                />
              );
            })}
          </div>
        ) : (
          <p className="fx-ms-description">
            {__("Added to your gift's time slot.")}
          </p>
        )}
      </div>

      <button
        type="button"
        className="fx-ms-remove"
        aria-label={sprintf(__("Remove %s"), item.name)}
        onClick={onRemove}
      >
        <Trash2 size={22} />
      </button>
    </article>
  );
}

export default function RedeemSelectedServices({
  visible,
  items,
  quantities,
  slots,
  onQuantity,
  onSlot,
  onRemove,
  onClose,
  onContinue,
}) {
  const isComplete = (item) =>
    !needsSlot(item) ||
    Boolean(getSelectedChoice(item, slots[item.recommendation_key]));
  const slotCount = items.filter(
    (item) => needsSlot(item) && isComplete(item),
  ).length;
  const total = items.reduce((sum, item) => {
    const choice = getSelectedChoice(item, slots[item.recommendation_key]);
    const unit = Number(choice?.price ?? item.price) || 0;
    return (
      sum +
      (isComplete(item) ? unit * (quantities[item.recommendation_key] || 0) : 0)
    );
  }, 0);

  const handleContinue = () => {
    if (!items.every(isComplete)) {
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        icon: "warning",
        title: __("Please select a time slot for each service"),
      });
      return;
    }
    onContinue(
      items.map((item) => {
        const choice = getSelectedChoice(item, slots[item.recommendation_key]);
        const quantity = quantities[item.recommendation_key];
        return {
          product_type: item.product_type,
          product_id: item.product_id,
          parent_service_id: item.parent_service_id,
          quantity,
          ...(choice ? { date: choice.date, from: choice.from } : {}),
          // Order-summary only; stripped before the quote request.
          display: {
            name: item.name,
            slot_label: choice ? choiceLabel(choice) : "",
            line_total: formatLikePrice(
              item.formatted_price,
              (Number(choice?.price ?? item.price) || 0) * quantity,
            ),
            amount: (Number(choice?.price ?? item.price) || 0) * quantity,
          },
        };
      }),
    );
  };

  return (
    <Dialog
      visible={visible}
      onHide={onClose}
      showHeader={false}
      className="fx-redeem-selected-services-dialog"
      style={{ width: "1080px", maxWidth: "calc(100vw - 32px)" }}
      contentStyle={{ padding: 0 }}
    >
      <section className="fx-multi-services">
        <header className="fx-ms-header">
          <h2 className="fx-ms-title">{__("Selected Services")}</h2>
          <span className="fx-ms-badge">
            {sprintf(
              _n("%s service", "%s services", items.length),
              items.length,
            )}
          </span>
          <button
            type="button"
            className="fx-ms-close"
            aria-label={__("Close")}
            onClick={onClose}
          >
            <X size={28} />
          </button>
        </header>

        <div className="fx-ms-list">
          {items.map((item) => (
            <SelectedServiceRow
              key={item.recommendation_key}
              item={item}
              quantity={quantities[item.recommendation_key] || 0}
              slotKey={slots[item.recommendation_key]}
              onQuantity={(value) => onQuantity(item, value)}
              onSlot={(key) => onSlot(item, key)}
              onRemove={() => onRemove(item)}
            />
          ))}
        </div>

        <footer className="fx-ms-footer">
          <button type="button" className="fx-ms-cancel" onClick={onClose}>
            {__("Back")}
          </button>
          <div className="fx-ms-summary">
            <div className="fx-ms-summary-item">
              <span className="fx-ms-summary-icon">
                <CalendarDays size={18} />
              </span>
              {sprintf(
                _n("%s Slot selected", "%s Slots selected", slotCount),
                slotCount,
              )}
            </div>
            <div className="fx-ms-summary-item">
              <span className="fx-ms-summary-icon">
                <Wallet size={18} />
              </span>
              {__("Total Price:")}{" "}
              <strong className="fx-ms-total">
                {formatLikePrice(items[0]?.formatted_price, total)}
              </strong>
            </div>
          </div>
          <button
            type="button"
            className="fx-ms-continue"
            disabled={items.length === 0}
            onClick={handleContinue}
          >
            {__("CONTINUE")}
          </button>
        </footer>
      </section>
    </Dialog>
  );
}
