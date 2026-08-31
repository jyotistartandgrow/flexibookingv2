import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useSelector, useDispatch } from "react-redux";
import { decodeHtml } from "../Utils/Functions";
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;
    dispatch(setLoading(true));
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
        dispatch(setLoading(false));
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
      return;
    }

    const { data } = await axiosInstance.post(`/payment-process`, {
      booking: bookingKey,
      checkout: checkoutKey,
      paymentMethod: paymentMethod.id,
      gift,
    });

    let paymentSuccess = false;
    if (data && data.status == 200) {
      console.log(data);
      if (data.data.status == "success") {
        const clientSecret = data.data.data;
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card: elements.getElement(CardElement) },
        });
        if (result.error) {
          setMessage(result.error.message);
        } else if (result.paymentIntent.status === "succeeded") {
          setMessage("Payment successful!");
          paymentSuccess = true;
        }
      } else if (data.data.status == "succeeded") {
        setMessage("Payment successful!");
        paymentSuccess = true;
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
                selected_component_slots: redeemBundleSlots,
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
