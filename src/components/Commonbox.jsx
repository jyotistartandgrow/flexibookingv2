import React, { useRef, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import moment from "moment";
import { decodeHtml } from "../Utils/Functions";
import { setStep } from "../store/step1Slice";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "../pages/CheckoutForm";
import {
  setCheckoutkey,
  setPaymentstring,
  setSessionExpired,
} from "../store/step4Slice";
import { setCouponlist, setLoading } from "../store/step1Slice";
import {
  setCart,
  setTimeslot,
  setCapacity,
  setService,
} from "../store/step2Slice";
import { setExtracapacity, setExtra } from "../store/step3Slice";
import axiosInstance from "../Utils/Interceptor";
import useDeviceType from "../Utils/useDeviceType";

const formatBundleSlot = (component) => {
  if (component?.from && component?.to) {
    const from = moment(component.from, "HH:mm", true);
    const to = moment(component.to, "HH:mm", true);
    if (from.isValid() && to.isValid()) {
      return `${from.format("h:mm A")} - ${to.format("h:mm A")}`;
    }
  }

  return component?.slot_label || "-";
};

// const PUBLIC_KEY = import.meta.env.VITE_STRIPE_KEY; // your publishable key
// const stripePromise = loadStripe(PUBLIC_KEY);

const stripePromiseCache = {};

export default function Commonbox({ setVisibleBottom, toggleCard }) {
  const dispatch = useDispatch();
  const toast = useRef(null);
  const date = useSelector((state) => state.step1.date);
  const step = useSelector((state) => state.step1.step);
  const cart = useSelector((state) => state.step2.cart);
  const gift = useSelector((state) => state.step1.gift);
  const topbar = useSelector((state) => state.step1.topbar);
  const paymentstring = useSelector((state) => state.step4.paymentstring);
  const stripe_key = useSelector((state) => state.step1.stripe_key);
  const stripePromise = useMemo(() => {
    if (!stripe_key) return null;
    if (!stripePromiseCache[stripe_key]) {
      stripePromiseCache[stripe_key] = loadStripe(stripe_key);
    }
    return stripePromiseCache[stripe_key];
  }, [stripe_key]);
  const isDesktop = useDeviceType();

  useEffect(() => {
    if (paymentstring) {
      if (step !== "paymentstep") {
        dispatch(setPaymentstring(null));
        dispatch(setCheckoutkey(null));
        dispatch(setSessionExpired(false));
      }
    }
  }, [step, paymentstring, dispatch]);

  const editaccept = (id, type) => {
    if (type === "service") {
      dispatch(setStep("servicesstep"));
    } else {
      dispatch(setStep("extrastep"));
    }
  };

  const deleteaccept = async (id, type) => {
    dispatch(setLoading(true));
    const updatedServices = cart[type].filter((item) => item.id !== id);
    const remainingExtras =
      type === "extra"
        ? updatedServices
        : Array.isArray(cart.extra)
          ? cart.extra
          : [];

    let serviceid =
      type === "service"
        ? ""
        : cart.service && cart.service[0]
          ? cart.service[0].id
          : "";
    let servicecapacity =
      type === "service"
        ? 0
        : cart.service && cart.service[0]
          ? cart.service[0].capacity
          : 0;
    let extraid = remainingExtras.map((item) => item.id).join(",");
    let extracapacity = remainingExtras.map((item) => item.capacity).join(",");
    const { data } = await axiosInstance(
      `/price-format?service_id=${serviceid}&capacity=${servicecapacity}&date=${moment(
        date,
      ).format(
        "YYYY-MM-DD",
      )}&extra_id=${extraid}&extra_capacity=${extracapacity}`,
      {
        method: "get",
      },
    );
    if (data && data.status == 200) {
      dispatch(
        setCart({
          ...cart,
          [type]: updatedServices,
          total: data?.data?.total,
          total_formatted: data?.data?.total_formated,
          discount: 0,
          subtotal: data?.data?.total_formated,
        }),
      );
    }
    dispatch(setCouponlist([])); // Clear coupons on service/extra change
    if (type == "service") {
      dispatch(setTimeslot(null));
      dispatch(setCapacity(0));
      dispatch(setService(null));
    } else {
      dispatch(setExtracapacity(0));
      dispatch(setExtra(null));
    }
    dispatch(setLoading(false));
    toast.current.show({
      severity: "success",
      summary: "Deleted",
      detail: "Service has been removed from cart",
      life: 3000,
    });
    if (type == "service") {
      dispatch(setStep("servicesstep"));
    } else {
      dispatch(setStep("extrastep"));
    }
  };

  const reject = () => {
    toast.current.show({
      severity: "warn",
      summary: "Rejected",
      detail: "You have rejected the request",
      life: 3000,
    });
  };

  const edititem = (id, type) => {
    if (toggleCard) toggleCard();
    confirmDialog({
      message: "Are you sure you want to proceed?",
      header: "Confirmation",
      icon: "pi pi-exclamation-triangle",
      className: "fx-confirmation-popup",
      accept: () => editaccept(id, type),
      reject,
    });
  };

  const deleteitem = (id, type) => {
    if (toggleCard) toggleCard();
    confirmDialog({
      message: `Are you sure you want to delete this ${type}?`,
      header: "Delete Confirmation",
      icon: "pi pi-exclamation-triangle",
      className: "fx-confirmation-popup",
      accept: () => deleteaccept(id, type),
      reject,
    });
  };

  return (
    <>
      {!cart.service && !date && !gift && (
        <p className="giftmessagebox">
          book your service on a specific date" and "do a gift to a friend
        </p>
      )}
      {date &&
        !gift &&
        ((step !== "paymentstep" && !paymentstring) ||
          (step === "paymentstep" && !isDesktop)) && (
          <div className="fx-bookingdatebar">
            <div className="fx-bookingdate">
              Date
              <br />
              <span>{moment(date).format("MMMM DD YYYY")}</span>
            </div>
          </div>
        )}
      {(cart?.service?.length > 0 || cart?.extra?.length > 0) &&
        ((step !== "paymentstep" && !paymentstring) ||
          topbar ||
          (step === "paymentstep" && !isDesktop)) && (
          <>
            <div
              className="fx-servicelistbox"
              style={{
                borderTop: gift ? "none" : "1px solid var(--border-color)",
              }}
            >
              {cart.service.map((ct, ckey) => {
                return (
                  <React.Fragment key={"ct-" + ckey}>
                    <div className="fx-serviceitem">
                      <div className="itemname">
                        {ct.name}{" "}
                        {!gift && !ct.bundle_id && `X ${ct.capacity}`}
                        {cart?.service_option_details?.name && (
                          <>( {cart.service_option_details.name} )</>
                        )}
                        <br />
                        <div className="time">{ct.slot}</div>
                        <span onClick={() => edititem(ct.id, "service")}>
                          <i className="pi pi-pencil"></i>
                        </span>{" "}
                        <span onClick={() => deleteitem(ct.id, "service")}>
                          <i className="pi pi-trash"></i>
                        </span>{" "}
                      </div>

                      <div className="price">
                        {decodeHtml(ct.total_formatted)}
                      </div>
                    </div>
                    {ct.bundle_id > 0 &&
                      Array.isArray(ct.bundle_components) &&
                      ct.bundle_components.length > 0 && (
                        <>
                          {ct.bundle_pricing && (
                            <div className="fx-bundle-cart-pricing">
                              <span>
                                Original{" "}
                                <strong>
                                  {decodeHtml(
                                    ct.bundle_pricing.subtotal_formatted,
                                  )}
                                </strong>
                              </span>
                              <span>
                                Discount{" "}
                                <strong>
                                  {decodeHtml(
                                    ct.bundle_pricing.discount_amount_formatted,
                                  )}
                                </strong>
                              </span>
                              <span>
                                Package total{" "}
                                <strong>
                                  {decodeHtml(
                                    ct.bundle_pricing.final_price_formatted,
                                  )}
                                </strong>
                              </span>
                            </div>
                          )}
                          <div className="fx-bundle-cart-components">
                            <table>
                              <thead>
                                <tr>
                                  <th>Component</th>
                                  <th>Quantity</th>
                                  <th>Date</th>
                                  <th>Slot</th>
                                  <th>Line total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {ct.bundle_components.map(
                                  (component, componentIndex) => (
                                    <tr
                                      key={
                                        component.bundle_item_id ||
                                        componentIndex
                                      }
                                    >
                                      <td>
                                        <strong>{component.service_name}</strong>
                                        <small>{component.component_label}</small>
                                      </td>
                                      <td>{component.quantity}</td>
                                      <td>{component.date || "-"}</td>
                                      <td>{formatBundleSlot(component)}</td>
                                      <td>
                                        {component.line_total_formatted
                                          ? decodeHtml(
                                              String(
                                                component.line_total_formatted,
                                              ),
                                            )
                                          : "-"}
                                      </td>
                                    </tr>
                                  ),
                                )}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                  </React.Fragment>
                );
              })}
              {cart?.extra?.length > 0 &&
                cart.extra.map((ct, ckey) => {
                  return (
                    <div className="fx-serviceitem" key={"ct-" + ckey}>
                      <div className="itemname">
                        {ct.name} {!gift && `X ${ct.capacity}`}
                        <br />
                        <div className="time">{ct.slot}</div>
                        <span onClick={() => edititem(ct.id, "extra")}>
                          <i className="pi pi-pencil"></i>
                        </span>{" "}
                        <span onClick={() => deleteitem(ct.id, "extra")}>
                          <i className="pi pi-trash"></i>
                        </span>{" "}
                      </div>

                      <div className="price">
                        {decodeHtml(ct.total_formatted)}
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="fx-right-bottom-bar">
              {cart.discount > 0 && (
                <div className="fx-subtotal-discount-bar">
                  <div className="fx-subtotalbar">
                    <p>
                      Sub Total <span> {decodeHtml(cart.subtotal)}</span>
                    </p>
                  </div>
                  <div className="fx-discountbar">
                    <p>
                      Discount <span> {decodeHtml(cart.discount)}</span>
                    </p>
                  </div>
                </div>
              )}
              <div className="fx-totalbar">
                <p>
                  Total <span> {decodeHtml(cart.total_formatted)}</span>
                </p>
              </div>
              {(step == "paymentstep" || step == "checkoutstep") && (
                <div
                  className="fx-down-icon-botttom"
                  onClick={() => {
                    if (setVisibleBottom) setVisibleBottom(false);
                  }}
                >
                  <i className="pi pi-chevron-up"></i>
                </div>
              )}
            </div>
          </>
        )}
      {!cart.service && gift && (
        <p className="giftmessagebox">
          Please select the service you want to gift to your friend.
        </p>
      )}
      {step === "paymentstep" &&
        paymentstring &&
        stripePromise &&
        isDesktop &&
        !topbar && (
          <div className="fx-paymentbox">
            <h1 className="fx-all-main-heading">Payment</h1>
            <Elements stripe={stripePromise}>
              <CheckoutForm />
            </Elements>
          </div>
        )}
      <Toast ref={toast} />
      <ConfirmDialog className="fx-confirmation-popup" />
    </>
  );
}
