import React, { useRef, useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useSelector, useDispatch } from "react-redux";
import { decodeHtml } from "../Utils/Functions";
import axiosInstance from "../Utils/Interceptor";
import Swal from "sweetalert2";
import { setStep } from "../store/step1Slice";
import { setCheckoutkey, setPaymentstring } from "../store/step4Slice";
import CountdownTimer from "./CountdownTimer";

export default function CheckoutForm() {
  const dispatch = useDispatch();
  const stripe = useStripe();
  const elements = useElements();
  const cart = useSelector((state) => state.step2.cart);
  const bookingKey = useSelector((state) => state.step3.bookingkey);
  const checkoutKey = useSelector((state) => state.step4.checkoutkey);
  const sessionExpired = useSelector((state) => state.step4.session_expired);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!stripe || !elements) return;

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
        setLoading(false);
        dispatch(setPaymentstring(null));
        dispatch(setCheckoutkey(null));
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
      return;
    }

    console.log("Payment Method:", paymentMethod);
    console.log("Payment Method ID:", paymentMethod.id);

    const { data } = await axiosInstance.post(`/payment-process`, {
      booking: bookingKey,
      checkout: checkoutKey,
      paymentMethod: paymentMethod.id,
    });

    if (data && data.status == 200 && data.data.status == "success") {
      console.log(data);
      const clientSecret = data.data.data;
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (result.error) {
        setMessage(result.error.message);
      } else {
        if (result.paymentIntent.status === "succeeded") {
          setMessage("Payment successful!");
          const { data } = await axiosInstance.post(`/payment-save`, {
            booking: bookingKey,
            checkout: checkoutKey,
          });
          if (data && data.status == 200) {
            console.log(data);
            window.location.href = "/thankyou";
          }
        }
      }
      setLoading(false);
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
          <div class="fx-element-box fx-paymentbutton">
            <button disabled={!stripe || loading} class="btn-primary">
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
