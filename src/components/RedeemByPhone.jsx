import { useState } from "react";
import moment from "moment";
import Swal from "sweetalert2";
import { ArrowLeft, Copy, ImageOff, Mail, Phone } from "lucide-react";
import "../styles/redeem-by-phone.scss";

const firstFilled = (...values) => values.map((value) => String(value ?? "").trim()).find(Boolean) || "";

export default function RedeemByPhone({ detail, onBack, onSelectDate }) {
  const [imageFailed, setImageFailed] = useState(false);
  const redemption = detail?.redemption || {};
  const product = detail?.products?.[0] || {};

  const serviceName = firstFilled(redemption.service_name, product.name);
  const image = firstFilled(detail?.service_image, product.image);
  const voucherCode = firstFilled(redemption.voucher_code);
  const quantity = (detail?.products || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || product.quantity;
  const phone = firstFilled(redemption.booking_phone, redemption.service_phone, redemption.business_phone);
  const email = firstFilled(redemption.booking_email, redemption.service_email, redemption.business_email);
  const contactLabel = firstFilled(redemption.booking_contact_label, "Bookings");
  const businessName = firstFilled(redemption.business_name);
  const instructions = firstFilled(redemption.service_instructions);
  const restricted = redemption.component_restricted ? redemption.restricted_components || [] : [];
  const onlineDates = redemption.has_online_redemption_dates ? redemption.online_redemption_dates || [] : [];
  const expiry = moment(detail?.expiry_date, ["YYYY-MM-DD HH:mm", "YYYY-MM-DD"]);

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(phone);
      Swal.fire({ toast: true, position: "top-end", showConfirmButton: false, timer: 2000, icon: "success", title: "Number copied" });
    } catch {
      Swal.fire({ toast: true, position: "top-end", showConfirmButton: false, timer: 3000, icon: "info", title: phone });
    }
  };

  return (
    <div className="fx-redeem-phone">
      <p className="fx-redeem-phone__notice">Check your booking details before continuing.</p>

      <div className="fx-redeem-phone__grid">
        <article className="fx-redeem-phone__card fx-redeem-phone__voucher">
          <div className="fx-redeem-phone__image">
            {image && !imageFailed ? (
              <img src={image} alt="" onError={() => setImageFailed(true)} />
            ) : (
              <span aria-hidden="true"><ImageOff size={26} /></span>
            )}
          </div>
          <h2>{serviceName}</h2>
          <dl>
            {voucherCode && (<><dt>Voucher</dt><dd>{voucherCode}</dd></>)}
            {quantity > 0 && (<><dt>Quantity</dt><dd>{quantity}</dd></>)}
            {expiry.isValid() && (<><dt>Valid until</dt><dd>{expiry.format("MMMM D, YYYY")}</dd></>)}
          </dl>
        </article>

        <section className="fx-redeem-phone__card fx-redeem-phone__contact" aria-labelledby="fx-redeem-phone-title">
          <h2 id="fx-redeem-phone-title">Online redemption isn't available for this experience.</h2>

          <div className="fx-redeem-phone__message">
            {instructions ? (
              <p>{instructions}</p>
            ) : (
              <p>
                This experience requires a direct booking with {businessName || "the venue"}. Contact us to arrange
                your visit and keep your voucher code handy. Online booking isn't available for this experience.
              </p>
            )}
            {restricted.length > 0 && (
              <p className="fx-redeem-phone__restricted">Booking by phone is required for: {restricted.join(", ")}</p>
            )}
          </div>

          <p>Contact {businessName || "the venue"} to redeem your voucher and arrange your booking.</p>

          {(email || phone) && (
            <div className="fx-redeem-phone__links">
              {email && (
                <a className="fx-redeem-phone__link" href={`mailto:${email}?subject=${encodeURIComponent(`Voucher ${voucherCode}`)}`}>
                  <span><Mail size={15} aria-hidden="true" /> Send email</span>
                  <strong>{email}</strong>
                </a>
              )}
              {phone && (
                <a className="fx-redeem-phone__link" href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                  <span><Phone size={15} aria-hidden="true" /> {contactLabel} · Call the venue</span>
                  <strong>{phone}</strong>
                </a>
              )}
            </div>
          )}

          {phone && (
            <button type="button" className="fx-redeem-phone__copy" onClick={copyPhone}>
              <Copy size={15} aria-hidden="true" /> Copy number
            </button>
          )}

          {onlineDates.length > 0 && onSelectDate && (
            <div className="fx-redeem-phone__dates">
              <p>Online booking is available on these dates:</p>
              <div>
                {onlineDates.map((value) => (
                  <button type="button" key={value} onClick={() => onSelectDate(value)}>
                    {moment(value).isValid() ? moment(value).format("ddd, MMM D") : value}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="fx-footer-actions">
        <button type="button" className="fx-btn-back" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </button>
      </div>
    </div>
  );
}
