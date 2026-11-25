import { useMemo, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import Swal from "sweetalert2";
import axiosInstance from "../Utils/Interceptor";
import { setCart } from "../store/step2Slice";
import { setLoading } from "../store/step1Slice";
import moment from "moment";
import { decodeHtml, toPlainText } from "../Utils/Functions";
import CheckoutForm from "../pages/CheckoutForm";
import useDeviceType from "../Utils/useDeviceType";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import closeicon from "../assets/close2.svg";
import { applyCouponToBooking } from "../Utils/coupons";
import { __, sprintf, getStripeLocale } from "../i18n";

const stripePromiseCache = {};

// const PUBLIC_KEY = import.meta.env.VITE_STRIPE_KEY; // your publishable key
// const stripePromise = loadStripe(PUBLIC_KEY);
export default function Payment(props) {
  const dispatch = useDispatch();
  const step = useSelector((state) => state.step1.step);
  const date = useSelector((state) => state.step1.date);
  const cart = useSelector((state) => state.step2.cart);
  const bookingkey = useSelector((state) => state.step3.bookingkey);
  const couponcode = useSelector((state) => state.step1.couponcode);
  // Coupons already applied to this booking from the checkout page.
  const bookingCoupons = useSelector((state) => state.step1.bookingCoupons);
  const checkoutkey = useSelector((state) => state.step4.checkoutkey);
  // Coupons are applied once per checkout session, not every time the user
  // navigates back to the payment step.
  const appliedCouponsFor = useRef(null);
  const isDesktop = useDeviceType();
  const stripe_key = useSelector((state) => state.step1.stripe_key);
  const topbar = useSelector((state) => state.step1.topbar);
  const stripePromise = useMemo(() => {
    if (!stripe_key) return null;
    if (!stripePromiseCache[stripe_key]) {
      stripePromiseCache[stripe_key] = loadStripe(stripe_key);
    }
    return stripePromiseCache[stripe_key];
  }, [stripe_key]);

  useEffect(() => {
    if (step != "paymentstep") return;
    const sessionKey = `${bookingkey}|${checkoutkey}`;
    if (appliedCouponsFor.current === sessionKey) return;
    appliedCouponsFor.current = sessionKey;
    auto_apply_coupon();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, bookingkey, checkoutkey]);

  const auto_apply_coupon = async () => {
    dispatch(setLoading(true));
    try {
      await applyCoupons();
    } catch (error) {
      console.error("Unable to apply coupons.", error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const applyCoupons = async () => {
    // Build each update on the latest cart, not the one captured at render.
    let latestCart = cart;
    const { data } = await axiosInstance(
      `/auto-apply-coupon?booking_key=${bookingkey}`,
      {
        method: "get",
      },
    );
    if (data && data.status == 200 && data?.data.status) {
      // discount may arrive as a number or as formatted text ("€13,00");
      // keep a number for the "is there a discount" check and the text to show.
      const rawDiscount = data?.data?.discount;
      const discountNumber =
        Number(
          String(rawDiscount ?? "")
            .replace(/[^\d,.-]/g, "")
            .replace(",", "."),
        ) || 0;
      latestCart = {
        ...latestCart,
        total_formatted: data?.data?.total,
        discount: discountNumber,
        discount_formatted:
          typeof rawDiscount === "string" && Number.isNaN(Number(rawDiscount))
            ? rawDiscount
            : latestCart.discount_formatted,
        subtotal: data?.data?.subtotal,
      };
      dispatch(setCart(latestCart));
    }
    const alreadyApplied =
      bookingCoupons?.bookingKey === bookingkey ? bookingCoupons.codes : [];
    const pendingCoupons = (couponcode || []).filter(
      (code) => !alreadyApplied.includes(code),
    );
    // Date-screen coupons are applied here, one by one.
    for (const code of pendingCoupons) {
      const result = await applyCouponToBooking(bookingkey, code, latestCart);
      if (result.ok) {
        latestCart = result.cart;
        dispatch(setCart(latestCart));
      } else {
        Swal.fire({
          iconHtml: `<img class="fx-coupon-close-icon" src="${closeicon}">`,
          titleText: toPlainText(sprintf(__("%s Coupon Error"), code)),
          text: result.error,
          customClass: {
            popup: "fx-coupon-box-popup",
          },
        });
      }
    }
  };

  return (
    <div
      className={`fx-leftcontentbox ${topbar ? "fx-content-with-topbar" : ""}`}
      style={{ display: step === "paymentstep" ? "block" : "none" }}
    >
      {step === "paymentstep" && (!isDesktop || topbar) && (
        <div className="fx-paymentbox">
          {props.stepsVisibility?.step_5_title_visible == "true" && (
            <h1 className="fx-all-main-heading">
              {props.stepTitles?.step_5_title || __("Payment")}
            </h1>
          )}
          {stripePromise && (
            <Elements stripe={stripePromise} options={{ locale: getStripeLocale() }}>
              <CheckoutForm />
            </Elements>
          )}
        </div>
      )}
      {isDesktop && !topbar && (
        <>
          {props.stepsVisibility?.step_5_title_visible == "true" && (
            <h1 className="fx-all-main-heading">
              {props.stepTitles?.step_5_title || __("Checkout")}
            </h1>
          )}
          <div className="fx-order-summary">
            <div className="fx-service-date">
              <strong>{__("Service Date:")}</strong>
              <p>{moment(date).format("MMMM Do, YYYY")}</p>
            </div>

            <table className="fx-summary-table">
              <thead>
                <tr>
                  <th>{__("Products Name")}</th>
                  <th>{__("Price")}</th>
                  <th>{__("Qty")}</th>
                  <th>{__("Total")}</th>
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
                <span>{__("Subtotal")}</span>
                <span className="value">{decodeHtml(cart?.subtotal)}</span>
              </div>
              <div className="fx-summary-line">
                <span>{__("Discount")}</span>
                <span className="value">{decodeHtml(cart?.discount)}</span>
              </div>
              <div className="fx-summary-line">
                <span>{__("Total")}</span>
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
