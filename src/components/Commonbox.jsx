import React, { useRef, useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import moment from "moment";
import { decodeHtml } from "../Utils/Functions";
import { setStep } from "../store/step1Slice";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "../pages/CheckoutForm";
import Swal from "sweetalert2";
import iconapplied from "../assets/icons8-confirm.svg";
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

// const PUBLIC_KEY = import.meta.env.VITE_STRIPE_KEY; // your publishable key
// const stripePromise = loadStripe(PUBLIC_KEY);

export default function Commonbox({ setVisibleBottom, toggleCard }) {
  const dispatch = useDispatch();
  const toast = useRef(null);
  const date = useSelector((state) => state.step1.date);
  const step = useSelector((state) => state.step1.step);
  const cart = useSelector((state) => state.step2.cart);
  const gift = useSelector((state) => state.step1.gift);
  const topbar = useSelector((state) => state.step1.topbar);
  const paymentstring = useSelector((state) => state.step4.paymentstring);
  const couponcode = useSelector((state) => state.step1.couponcode);
  const bookingkey = useSelector((state) => state.step3.bookingkey);
  const stripe_key = useSelector((state) => state.step1.stripe_key);
  const stripePromise = useMemo(() => {
    return stripe_key ? loadStripe(stripe_key) : null;
  }, [stripe_key]);
  const [fields, setFields] = useState([{ code: "", applied: false }]);
  const [isInitialized, setIsInitialized] = useState(false);
  const isDesktop = useDeviceType();
  useEffect(() => {
    // Only initialize from Redux once on mount, don't overwrite local state later
    if (!isInitialized && couponcode && couponcode.length > 0) {
      let field = [];
      couponcode.forEach((coup) => {
        field.push({ code: coup, applied: true });
      });
      setFields(field);
      setIsInitialized(true);
    }
  }, [couponcode, isInitialized]);

  useEffect(() => {
    if (paymentstring) {
      if (step !== "paymentstep") {
        dispatch(setPaymentstring(null));
        dispatch(setCheckoutkey(null));
        dispatch(setSessionExpired(false));
      }
    }
  }, [step]);

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

    let serviceid =
      type === "service"
        ? ""
        : cart.service && cart.service[0]
          ? cart.service[0].id
          : "";
    let extraid =
      type === "extra"
        ? ""
        : cart.extra && cart.extra[0]
          ? cart.extra[0].id
          : "";
    let servicecapacity =
      type === "service"
        ? 0
        : cart.service && cart.service[0]
          ? cart.service[0].capacity
          : 0;
    let extracapacity =
      type === "extra"
        ? 0
        : cart.extra && cart.extra[0]
          ? cart.extra[0].capacity
          : 0;
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
      message: "Are you sure you want to delete this service?",
      header: "Delete Confirmation",
      icon: "pi pi-exclamation-triangle",
      className: "fx-confirmation-popup",
      accept: () => deleteaccept(id, type),
      reject,
    });
  };

  const addmoreCoupon = () => {
    setFields([...fields, { code: "", applied: false }]);
  };

  const removeCoupon = async (key) => {
    dispatch(setLoading(true));
    let couponcode = fields[key].code;
    const updated = fields.filter((_, i) => i !== key);
    setFields(updated);
    // compute valid coupons - only include actually applied coupons
    const validCoupons = updated
      .filter((f) => f.applied && f.code.trim() !== "")
      .map((f) => f.code.trim());
    dispatch(setCouponlist(validCoupons));
    if (cart.discount && cart.discount != 0) {
      const { data: coupondata } = await axiosInstance.post(`/coupon-removal`, {
        booking_key: bookingkey,
        coupon_code: couponcode,
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
          }),
        );
      }
    }
    dispatch(setLoading(false));
  };

  const applycoupon = async (key) => {
    if (fields[key].code.trim() === "") {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Please enter a coupon code",
        life: 3000,
      });
      return;
    }
    Swal.fire({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      icon: "info",
      title: "Once you proceed to payment, the discount will be applied.",
    });

    // Mark this coupon as applied
    setFields((prev) => {
      const updated = prev.map((item, i) =>
        i === key ? { ...item, applied: true } : item,
      );

      // compute valid coupons - only include actually applied coupons
      const validCoupons = updated
        .filter((f) => f.applied && f.code.trim() !== "")
        .map((f) => f.code.trim());

      // dispatch inside the setter
      dispatch(setCouponlist(validCoupons));

      return updated;
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
        ((step !== "paymentstep" && !paymentstring) ||
          (step === "paymentstep" && !isDesktop)) && (
          <div className="fx-bookingdatebar">
            {step == "checkoutstep" && (
              <>
                {fields.map((field, index) => (
                  <div className="fx-couponcontainerinputbox" key={index}>
                    <div className="fx-coupon-box">
                      <input
                        type="text"
                        placeholder="Enter your coupon code"
                        value={fields[index].code}
                        onChange={(e) => {
                          if (!fields[index].applied) {
                            const newFields = [...fields];
                            newFields[index].code = e.target.value;
                            setFields(newFields);
                          }
                        }}
                        disabled={fields[index].applied}
                        className={fields[index].applied ? "fx-coupon-applied" : ""}
                      />
                      {!fields[index].applied && (
                        <button
                          className="fx-apply-btn"
                          onClick={() => applycoupon(index)}
                        >
                          APPLY
                        </button>
                      )}
                      {fields[index].applied && (
                        <button className="fx-apply-btn fx-applied-btn">
                          APPLIED <img src={iconapplied} />
                        </button>
                      )}
                    </div>
                    {step != "paymentstep" && (
                      <div className="fx-delete-coupon">
                        <i
                          className="pi pi-trash"
                          onClick={() => removeCoupon(index)}
                        ></i>
                      </div>
                    )}
                  </div>
                ))}
                <div className="fx-element-box" onClick={() => addmoreCoupon()}>
                  <p className="fx-addmorelink">Add More</p>
                </div>
              </>
            )}
            {!gift && (
              <div className="fx-bookingdate">
                Date
                <br />
                <span>{moment(date).format("MMMM DD YYYY")}</span>
              </div>
            )}
          </div>
        )}
      {(cart?.service?.length > 0 || cart?.extra?.length > 0) &&
        ((step !== "paymentstep" && !paymentstring) ||
          topbar ||
          (step === "paymentstep" && !isDesktop)) && (
          <>
            <div className="fx-servicelistbox">
              {cart.service.map((ct, ckey) => {
                return (
                  <div className="fx-serviceitem" key={"ct-" + ckey}>
                    <div className="itemname">
                      {ct.name} {!gift && `X ${ct.capacity}`}
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
      {paymentstring && isDesktop && !topbar && (
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
