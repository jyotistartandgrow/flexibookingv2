import React, { useRef, useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useSelector } from "react-redux";
import { decodeHtml } from "../Utils/Functions";
import axiosInstance from "../Utils/Interceptor";
import Swal from "sweetalert2";

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const cart = useSelector((state) => state.step2.cart);
  const bookingKey = useSelector((state) => state.step3.bookingkey);
  const checkoutKey = useSelector((state) => state.step4.checkoutkey);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!stripe || !elements) return;

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
    </form>
  );
}
