import { useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import Swal from "sweetalert2";
import axiosInstance from "../Utils/Interceptor";
import { setCart } from "../store/step2Slice";
import { setLoading } from "../store/step1Slice";
import moment from "moment";
import { decodeHtml } from "../Utils/Functions";
import CheckoutForm from "../pages/CheckoutForm";
import useDeviceType from "../Utils/useDeviceType";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// const PUBLIC_KEY = import.meta.env.VITE_STRIPE_KEY; // your publishable key
// const stripePromise = loadStripe(PUBLIC_KEY);
export default function Payment() {
  const dispatch = useDispatch();
  const step = useSelector((state) => state.step1.step);
  const date = useSelector((state) => state.step1.date);
  const cart = useSelector((state) => state.step2.cart);
  const bookingkey = useSelector((state) => state.step3.bookingkey);
  const couponcode = useSelector((state) => state.step1.couponcode);
  const isDesktop = useDeviceType();
  const stripe_key = useSelector((state) => state.step1.stripe_key);
  const topbar = useSelector((state) => state.step1.topbar);
  const stripePromise = useMemo(() => {
    return stripe_key ? loadStripe(stripe_key) : null;
  }, [stripe_key]);

  useEffect(() => {
    if (step == "paymentstep") {
      auto_apply_coupon();
    }
  }, [step]);

  const auto_apply_coupon = async () => {
    dispatch(setLoading(true));
    const { data } = await axiosInstance(
      `/auto-apply-coupon?booking_key=${bookingkey}`,
      {
        method: "get",
      },
    );
    if (data && data.status == 200 && data?.data.status) {
      const updatedCart = {
        ...cart,
        total_formatted: data?.data?.total,
        discount: data?.data?.discount,
        subtotal: data?.data?.subtotal,
      };
      dispatch(setCart(updatedCart));
    }
    if (couponcode && couponcode.length > 0) {
      // apply coupons one by one
      for (let i = 0; i < couponcode.length; i++) {
        const { data: coupondata } = await axiosInstance.post(`/apply-coupon`, {
          booking_key: bookingkey,
          coupon_code: couponcode[i],
        });

        if (
          coupondata &&
          coupondata.status == 200 &&
          coupondata.data.status == true
        ) {
          dispatch(
            setCart({
              ...cart,
              total: coupondata?.data?.original_data?.amount,
              total_formatted: coupondata?.data?.total,
              discount: coupondata?.data?.coupon_discount,
              subtotal: coupondata?.data?.original_data?.subtotal,
            }),
          );
        } else {
          Swal.fire({
            icon: "error",
            title: `${couponcode[i]} Coupon Error`,
            text:
              decodeHtml(coupondata?.data?.error) || "Failed to apply coupon",
          });
        }
      }
    }

    dispatch(setLoading(false));
  };

  return (
    <div
      className={`fx-leftcontentbox ${topbar ? "fx-content-with-topbar" : ""}`}
      style={{ display: step === "paymentstep" ? "block" : "none" }}
    >
      {(!isDesktop || topbar) && (
        <div className="fx-paymentbox">
          <h1 className="fx-all-main-heading">Payment</h1>
          {stripePromise && (
            <Elements stripe={stripePromise}>
              <CheckoutForm />
            </Elements>
          )}
        </div>
      )}
      {isDesktop && !topbar && (
        <>
          <h1 className="fx-all-main-heading">Checkout</h1>
          <div className="fx-order-summary">
            <div className="fx-service-date">
              <strong>Service Date:</strong>
              <p>{moment(date).format("MMMM Do, YYYY")}</p>
            </div>

            <table className="fx-summary-table">
              <thead>
                <tr>
                  <th>Products Name</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {cart?.service?.length > 0 &&
                  cart.service.map((ct, ckey) => {
                    return (
                      <tr key={ckey}>
                        <td>{ct.name}</td>
                        <td>{decodeHtml(ct.price)}</td>
                        <td>{ct.capacity}</td>
                        <td>{decodeHtml(ct.total_formatted)}</td>
                      </tr>
                    );
                  })}
                {cart?.extra?.length > 0 &&
                  cart.extra.map((ct, ckey) => {
                    return (
                      <tr key={ckey}>
                        <td>{ct.name}</td>
                        <td>{decodeHtml(ct.price)}</td>
                        <td>{ct.capacity}</td>
                        <td>{decodeHtml(ct.total_formatted)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            <div className="fx-summary-footer">
              <div className="fx-summary-line">
                <span>Subtotal</span>
                <span className="value">{decodeHtml(cart?.subtotal)}</span>
              </div>
              <div className="fx-summary-line">
                <span>Discount</span>
                <span className="value">{decodeHtml(cart?.discount)}</span>
              </div>
              <div className="fx-summary-line">
                <span>Total</span>
                <span className="value">
                  {decodeHtml(cart?.total_formatted)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
