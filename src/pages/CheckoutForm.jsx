import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useSelector, useDispatch } from "react-redux";
import {
  decodeHtml,
  formatSelectedComponentSlots,
} from "../Utils/Functions";
import axiosInstance from "../Utils/Interceptor";
import Swal from "sweetalert2";
import { setStep, setLoading } from "../store/step1Slice";
import {
  setCheckoutkey,
  setPaymentstring,
  setSessionExpired,
} from "../store/step4Slice";
import CountdownTimer from "./CountdownTimer";
import { useNavigate } from "react-router-dom";
import moment from "moment";

// A PaymentIntent that reached one of these is paid for as far as the booking
// is concerned (`requires_capture` = authorised, captured later by the server).
const SUCCESS_INTENT_STATUSES = ["succeeded", "requires_capture"];
// Stripe API versions older than 2019-02-11 call this state
// `requires_source_action`; current versions call the same state
// `requires_action`. Accept both so a 3DS/SCA step is never missed.
const ACTION_INTENT_STATUSES = ["requires_action", "requires_source_action"];
// States where the intent still has to be confirmed from the browser.
const CONFIRMABLE_INTENT_STATUSES = ["requires_payment_method", "requires_source"];

const normalizeStatus = (status) => String(status ?? "").trim().toLowerCase();

// The client secret can arrive HTML-escaped or wrapped in an object; Stripe
// needs the exact `pi_..._secret_...` string or the lookup silently fails.
const extractClientSecret = (payload) => {
  const raw =
    typeof payload === "string"
      ? payload
      : (payload?.client_secret ?? payload?.clientSecret ?? payload?.data ?? "");
  if (typeof raw !== "string" || raw.trim() === "") return "";
  const value = decodeHtml(raw).trim();
  return value.includes("_secret_") ? value : "";
};

export default function CheckoutForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const stripe = useStripe();
  const elements = useElements();
  const cart = useSelector((state) => state.step2.cart);
  const bookingKey = useSelector((state) => state.step3.bookingkey);
  const checkoutKey = useSelector((state) => state.step4.checkoutkey);
  const sessionExpired = useSelector((state) => state.step4.session_expired);
  const loading = useSelector((state) => state.step1.loading);
  const gift = useSelector((state) => state.step1.gift);
  const opendatepurchase = useSelector((state) => state.step1.opendatepurchase);
  const redeemBooking = useSelector((state) => state.step1.redeemBooking);
  const voucher = useSelector((state) => state.step1.voucher);
  const date = useSelector((state) => state.step1.date);
  const slot = useSelector((state) => state.step3.slot);
  const redeemBundleSlots = useSelector(
    (state) => state.step3.redeemBundleSlots,
  );
  const voucherDetail = useSelector((state) => state.step3.voucherdetail);

  //const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // The server confirms the PaymentIntent, so the browser must only finish the
  // step that is actually left instead of attaching a second payment method.
  const finishPaymentIntent = async (clientSecret, cardElement) => {
    const retrieved = await stripe.retrievePaymentIntent(clientSecret);
    if (retrieved.error) return retrieved;

    const status = normalizeStatus(retrieved.paymentIntent?.status);

    if (SUCCESS_INTENT_STATUSES.includes(status)) return retrieved;

    if (ACTION_INTENT_STATUSES.includes(status)) {
      // Already confirmed server-side: only the 3DS/SCA challenge is pending.
      const actionResult = await stripe.handleNextAction({ clientSecret });
      return {
        error: actionResult.error,
        paymentIntent: actionResult.paymentIntent,
      };
    }

    if (status === "requires_confirmation") {
      // A payment method is already attached; confirm without sending another.
      return await stripe.confirmCardPayment(clientSecret);
    }

    if (CONFIRMABLE_INTENT_STATUSES.includes(status)) {
      return await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });
    }

    return retrieved;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;
    dispatch(setLoading(true));
    try {
      const { data: sessiondata } = await axiosInstance.post(`/check-session`, {
        booking_key: bookingKey,
      });
      if (sessiondata && sessiondata.status == 200) {
        if (sessiondata?.data?.is_expired) {
          Swal.fire({
            toast: true,
            position: "top-end", // or 'bottom-end', 'top-start', etc.
            showConfirmButton: false,
            timer: 3000, // auto-close after 3 seconds
            icon: "error", // 'success', 'error', 'warning', 'info', 'question'
            title: "Session Expired! Please re-initiate payment.",
          });
          dispatch(setPaymentstring(null));
          dispatch(setCheckoutkey(null));
          dispatch(setSessionExpired(false));
          dispatch(setStep("checkoutstep"));
          return;
        }
      }

      const cardElement = elements.getElement(CardElement);

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (error) {
        console.log("Error:", error.message);
        setMessage(error.message);
        return;
      }

      const { data } = await axiosInstance.post(`/payment-process`, {
        booking: bookingKey,
        checkout: checkoutKey,
        paymentMethod: paymentMethod.id,
        gift,
      });

      if (!data || data.status != 200) {
        setMessage(data?.message || "There is some error , please try again");
        return;
      }

      const paymentResponse = data.data;
      const backendStatus = normalizeStatus(paymentResponse?.status);
      let paymentSuccess = false;

      if (SUCCESS_INTENT_STATUSES.includes(backendStatus)) {
        setMessage("Payment successful!");
        paymentSuccess = true;
      } else if (
        backendStatus == "success" ||
        ACTION_INTENT_STATUSES.includes(backendStatus)
      ) {
        const clientSecret = extractClientSecret(
          paymentResponse?.data ?? paymentResponse,
        );
        if (!clientSecret) {
          setMessage(
            "Payment could not be confirmed because the payment reference returned by the server could not be read. Please try again.",
          );
        } else {
          const result = await finishPaymentIntent(clientSecret, cardElement);
          const resultStatus = normalizeStatus(result?.paymentIntent?.status);
          if (result?.error) {
            setMessage(result.error.message);
          } else if (SUCCESS_INTENT_STATUSES.includes(resultStatus)) {
            setMessage("Payment successful!");
            paymentSuccess = true;
          } else if (resultStatus == "processing") {
            setMessage(
              "Your payment is still being processed. Please wait a moment before trying again.",
            );
          } else {
            setMessage(
              "Card authentication was not completed. Please try again.",
            );
          }
        }
      } else {
        setMessage(
          paymentResponse?.message ||
            data?.message ||
            "Payment could not be processed. Please try again.",
        );
      }

      if (paymentSuccess) {
        try {
          if (redeemBooking) {
            const redeemResponse = await axiosInstance.post(
              `/voucher-redeem`,
              {
                voucher,
                date: moment(date).format("YYYY-MM-DD"),
                slot,
                selected_component_slots:
                  formatSelectedComponentSlots(redeemBundleSlots),
                recipient: voucherDetail?.recepient_data || {},
              },
            );
            if (
              redeemResponse?.data?.status != 200 ||
              redeemResponse?.data?.data?.status !== "success"
            ) {
              throw new Error(
                redeemResponse?.data?.message ||
                  "Unable to complete voucher redemption",
              );
            }
          }

          const paymentSaveResponse = await axiosInstance.post(
            `/payment-save`,
            {
              booking: bookingKey,
              checkout: checkoutKey,
              gift,
            },
          );
          if (paymentSaveResponse?.data?.status != 200) {
            throw new Error(
              paymentSaveResponse?.data?.message ||
                "Unable to save the successful booking payment",
            );
          }

          if (redeemBooking) {
            const emailResponse = await axiosInstance.post(
              `/redeem-upsell-send-email`,
              {
                redeem_code: voucher,
                booking_key: bookingKey,
              },
            );
            if (emailResponse?.data?.status != 200) {
              throw new Error(
                emailResponse?.data?.message ||
                  "Unable to send the confirmation email",
              );
            }

            dispatch(setLoading(false));
            navigate(`/redeem-thankyou`);
          } else if (opendatepurchase) {
            dispatch(setLoading(false));
            navigate(`/opendate-thankyou?pid=${bookingKey}`);
          } else {
            dispatch(setLoading(false));
            navigate(`/thankyou?pid=${bookingKey}`);
          }
        } catch (completionError) {
          dispatch(setLoading(false));
          const completionMessage =
            completionError?.response?.data?.message ||
            completionError?.message ||
            "Payment succeeded, but the booking could not be finalized";
          setMessage(completionMessage);
          Swal.fire({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 4000,
            icon: "error",
            title: completionMessage,
          });
        }
      }
    } catch (submitError) {
      const submitMessage =
        submitError?.data?.message ||
        submitError?.response?.data?.message ||
        submitError?.message ||
        "Payment could not be processed. Please try again.";
      setMessage(submitMessage);
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
        icon: "error",
        title: submitMessage,
      });
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CountdownTimer startSeconds={180} />
      {!sessionExpired && (
        <>
          <CardElement
            options={{
              hidePostalCode: true,
              style: {
                base: {
                  fontSize: "16px",
                  color: "#000",
                },
                invalid: {
                  color: "red",
                },
              },
            }}
          />
          <div className="fx-element-box fx-paymentbutton">
            <button disabled={!stripe || loading} className="btn-primary">
              {loading
                ? "Processing..."
                : "Pay " + decodeHtml(cart.total_formatted)}
            </button>
          </div>
          {message && <p>{message}</p>}
        </>
      )}
    </form>
  );
}
