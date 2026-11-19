import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import Swal from "sweetalert2";
import {
  Elements,
  CardElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { setLoading, setRedeemStep } from "../store/step1Slice";
import { formatSelectedComponentSlots, toSafeUrl } from "../Utils/Functions";
import {
  callVoucherApi,
  formatLikePrice,
  getApiErrorMessage,
} from "../Utils/redeemUpsells";
import "../styles/redeem-upsell-services.scss";

const stripePromiseCache = {};
const PAID_INTENT_STATUSES = ["succeeded", "processing", "requires_capture"];

const showError = (title) =>
  Swal.fire({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 4000,
    icon: "error",
    title,
  });

// Starts (or resumes) the additions payment and completes it; the server redeems the voucher once paid.
function usePayAdditions() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const quote = useSelector((state) => state.step3.redeemUpsellQuote);
  const voucher = useSelector((state) => state.step1.voucher);
  const date = useSelector((state) => state.step1.date);
  const slot = useSelector((state) => state.step3.slot);
  const bundleSlots = useSelector((state) => state.step3.redeemBundleSlots);
  const participants = useSelector((state) => state.step3.redeemParticipants);
  const [busy, setBusy] = useState(false);

  const finish = () => navigate("/redeem-thankyou");

  const confirmPaid = async () => {
    await callVoucherApi(
      "/upsells/payment/confirm",
      "confirm_redemption_upsells_payment",
      { order_key: quote.order_key },
    );
    finish();
  };

  // Fully discounted additions need no card: redeem the voucher against the paid additions order.
  const redeemWithoutPayment = async () => {
    await callVoucherApi("/redeem", "confirm_voucher_redemption", {
      voucher,
      date: moment(date).format("YYYY-MM-DD"),
      slot,
      recipient: quote.recipient,
      selected_component_slots: formatSelectedComponentSlots(bundleSlots || []),
      upsell_order_key: quote.order_key,
      ...(participants
        ? {
            slot_selection: participants.slot_selection,
            capacity_component_guests: participants.capacity_component_guests,
          }
        : {}),
    });
    finish();
  };

  const pay = async (transport, confirmCard) => {
    if (busy || !quote?.order_key) return;
    setBusy(true);
    dispatch(setLoading(true));
    try {
      const payment = await callVoucherApi(
        "/upsells/payment",
        "pay_redemption_upsells",
        { order_key: quote.order_key, transport },
      );
      if (!payment?.payment_required) {
        await redeemWithoutPayment();
        return;
      }
      if (payment.transport === "woocommerce" && payment.payment_url) {
        // Only follow http(s) payment URLs; never script-capable schemes.
        const paymentUrl = toSafeUrl(payment.payment_url);
        if (!paymentUrl)
          throw new Error("Invalid payment link. Please try again.");
        window.location.href = paymentUrl;
        return;
      }
      if (payment.status !== "provider_paid") {
        if (!confirmCard || !payment.client_secret)
          throw new Error("Card payment is not available. Please try again.");
        const { error, paymentIntent } = await confirmCard(
          payment.client_secret,
        );
        const intent = paymentIntent || error?.payment_intent;
        if (!PAID_INTENT_STATUSES.includes(intent?.status)) {
          throw new Error(
            error?.message ||
              "Payment could not be processed. Please try again.",
          );
        }
      }
      await confirmPaid();
    } catch (error) {
      showError(
        getApiErrorMessage(
          error,
          "Payment could not be processed. Please try again.",
        ),
      );
    } finally {
      setBusy(false);
      dispatch(setLoading(false));
    }
  };

  return { pay, busy };
}

// Stripe (e.g. Indian regulations) requires the payer's name and address on the card payment.
const toBillingDetails = (recipient = {}) => {
  const clean = (value) => String(value ?? "").trim() || undefined;
  const contact = clean(recipient.recipient_contact);
  return {
    name: clean(
      [recipient.recipient_first_name, recipient.recipient_last_name]
        .filter(Boolean)
        .join(" "),
    ),
    email: clean(recipient.recipient_email),
    phone: contact && !contact.startsWith("+") ? `+${contact}` : contact,
    address: {
      line1: clean(recipient.recipient_address),
      city: clean(recipient.recipient_city),
      state: clean(recipient.recipient_state),
      postal_code: clean(recipient.recipient_postcode),
      country: clean(recipient.recipient_country)?.toUpperCase(),
    },
  };
};

function CardPaymentForm({ totalLabel }) {
  const stripe = useStripe();
  const elements = useElements();
  const recipient = useSelector(
    (state) => state.step3.redeemUpsellQuote?.recipient,
  );
  const { pay, busy } = usePayAdditions();

  const submit = (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    pay("native", (clientSecret) =>
      stripe.confirmCardPayment(clientSecret, {
        payment_method: { card, billing_details: toBillingDetails(recipient) },
      }),
    );
  };

  return (
    <form onSubmit={submit}>
      <CardElement
        options={{
          hidePostalCode: true,
          style: {
            base: { fontSize: "16px", color: "#000" },
            invalid: { color: "red" },
          },
        }}
      />
      <div className="fx-element-box fx-paymentbutton">
        <button
          type="submit"
          disabled={!stripe || busy}
          className="btn-primary"
        >
          {busy ? "Processing..." : `Pay ${totalLabel}`}
        </button>
      </div>
    </form>
  );
}

function RedirectPaymentButton({ totalLabel }) {
  const { pay, busy } = usePayAdditions();
  return (
    <div className="fx-element-box fx-paymentbutton">
      <button
        type="button"
        disabled={busy}
        className="btn-primary"
        onClick={() => pay("auto")}
      >
        {busy ? "Processing..." : `Pay ${totalLabel}`}
      </button>
    </div>
  );
}

export default function RedeemUpsellPayment(props) {
  const dispatch = useDispatch();
  const step = useSelector((state) => state.step1.redeemstep);
  const stripeKey = useSelector((state) => state.step1.stripe_key);
  const quote = useSelector((state) => state.step3.redeemUpsellQuote);
  const stripePromise = useMemo(() => {
    if (!stripeKey) return null;
    if (!stripePromiseCache[stripeKey])
      stripePromiseCache[stripeKey] = loadStripe(stripeKey);
    return stripePromiseCache[stripeKey];
  }, [stripeKey]);

  if (step !== "paymentstep" || !quote) return null;

  const money = (value) => formatLikePrice(quote.formatted_total, value);
  const totalLabel = quote.formatted_total || money(quote.total);
  const discount =
    Number(quote.rule_discount || 0) + Number(quote.coupon_discount || 0);

  return (
    <div className="fx-leftcontentbox fx-checkoutpage fx-redeem-upsell-payment">
      {props.stepsVisibility?.step_5_title_visible != "false" && (
        <h1 className="fx-all-main-heading">
          {props.stepTitles?.step_5_title || "Payment"}
        </h1>
      )}

      {/* <div className="fx-order-summary">
        <table className="fx-summary-table">
          <thead>
            <tr>
              <th>Addition</th>
              <th>Date &amp; time</th>
              <th>Qty</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {(quote.items || []).map((item, index) => (
              <tr key={`${item.product_type}-${item.product_id}-${index}`}>
                <td>{item.name}</td>
                <td>
                  {item.booking_date ? moment(item.booking_date).format("MMM DD") : ""}
                  {item.slot_from ? `, ${[item.slot_from, item.slot_to].filter(Boolean).join(" - ")}` : ""}
                </td>
                <td>{item.quantity}</td>
                <td>{money(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="fx-summary-footer">
          <div className="fx-summary-line">
            <span>Subtotal</span>
            <span className="value">{money(quote.subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="fx-summary-line">
              <span>Discount</span>
              <span className="value">-{money(discount)}</span>
            </div>
          )}
          <div className="fx-summary-line">
            <span>Total</span>
            <span className="value">{totalLabel}</span>
          </div>
        </div>
      </div> */}

      <div className="fx-paymentbox">
        {stripePromise ? (
          <Elements stripe={stripePromise}>
            <CardPaymentForm totalLabel={totalLabel} />
          </Elements>
        ) : (
          <RedirectPaymentButton totalLabel={totalLabel} />
        )}
      </div>

      <button
        type="button"
        className="fx-upsell-back fx-redeem-payment-back"
        onClick={() => dispatch(setRedeemStep("checkoutstep"))}
      >
        Back
      </button>
    </div>
  );
}
