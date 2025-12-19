import React, { useRef, useState, useEffect } from "react";
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
import { setCart } from "../store/step2Slice";
import axiosInstance from "../Utils/Interceptor";
import useDeviceType from "../Utils/useDeviceType";

const PUBLIC_KEY = import.meta.env.VITE_STRIPE_KEY; // your publishable key
const stripePromise = loadStripe(PUBLIC_KEY);

export default function Commonbox() {
  const dispatch = useDispatch();
  const toast = useRef(null);
  const date = useSelector((state) => state.step1.date);
  const step = useSelector((state) => state.step1.step);
  const cart = useSelector((state) => state.step2.cart);
  const paymentstring = useSelector((state) => state.step4.paymentstring);
  const couponcode = useSelector((state) => state.step1.couponcode);
  const bookingkey = useSelector((state) => state.step3.bookingkey);
  const [coupon, setCoupon] = useState("");
  const [fields, setFields] = useState([{ code: "" }]);
  const isDesktop = useDeviceType();
  useEffect(() => {
    let field = [];
    if (couponcode && couponcode.length > 0) {
      couponcode.forEach((coup) => {
        field.push({ code: coup });
      });
      setFields(field);
    }
  }, [couponcode]);

  useEffect(() => {
    if (paymentstring) {
      if (step !== "paymentstep") {
        dispatch(setPaymentstring(null));
        dispatch(setCheckoutkey(null));
        dispatch(setSessionExpired(false));
      }
    }
  }, [step]);

  const editaccept = (id) => {
    dispatch(setStep("servicesstep"));
  };

  const reject = () => {
    toast.current.show({
      severity: "warn",
      summary: "Rejected",
      detail: "You have rejected the request",
      life: 3000,
    });
  };

  const edititem = (id) => {
    confirmDialog({
      message: "Are you sure you want to proceed?",
      header: "Confirmation",
      icon: "pi pi-exclamation-triangle",
      accept: () => editaccept(id),
      reject,
    });
  };

  const addmoreCoupon = () => {
    setFields([...fields, { code: "" }]);
    setCoupon("");
  };

  const removeCoupon = async (key) => {
    dispatch(setLoading(true));
    let couponcode = fields[key].code;
    const updated = fields.filter((_, i) => i !== key);
    setFields(updated);
    // compute valid coupons using UPDATED list
    const validCoupons = updated
      .map((f) => f.code.trim())
      .filter((c) => c !== "");
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
          })
        );
      }
    }
    dispatch(setLoading(false));
  };

  const applycoupon = async (key) => {
    Swal.fire({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      icon: "success",
      title:
        "Coupon Applied! Once you proceed to payment, the discount will be applied.",
    });

    setFields((prev) => {
      // update only one field
      const updated = prev.map((item, i) =>
        i === key ? { ...item, code: coupon } : item
      );

      // compute valid coupons using UPDATED list
      const validCoupons = updated
        .map((f) => f.code.trim())
        .filter((c) => c !== "");

      // dispatch inside the setter
      dispatch(setCouponlist(validCoupons));

      return updated;
    });
  };

  return (
    <>
      {!cart.service && !date && (
        <p className="giftmessagebox">
          book your service on a specific date" and "do a gift to a friend
        </p>
      )}
      {date &&
        ((step !== "paymentstep" && !paymentstring) ||
          (step === "paymentstep" && !isDesktop)) && (
          <div className="fx-bookingdatebar">
            {fields.map((field, index) => (
              <div className="fx-couponcontainerinputbox" key={index}>
                <div className="fx-coupon-box">
                  <input
                    type="text"
                    placeholder="Enter your coupon code"
                    value={
                      fields[index].code === "" ? coupon : fields[index].code
                    }
                    onChange={(e) => {
                      if (fields[index].code === "") {
                        setCoupon(e.target.value); // editable BEFORE apply
                      }
                    }}
                    disabled={fields[index].code !== ""} // disable AFTER apply
                  />
                  {fields[index].code === "" && (
                    <button
                      className="fx-apply-btn"
                      onClick={() => applycoupon(index)}
                    >
                      APPLY
                    </button>
                  )}
                  {fields[index].code !== "" && (
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
            <div className="fx-bookingdate">
              Date
              <br />
              <span>{moment(date).format("MMMM DD YYYY")}</span>
            </div>
          </div>
        )}
      {cart?.service?.length > 0 &&
        ((step !== "paymentstep" && !paymentstring) ||
          (step === "paymentstep" && !isDesktop)) && (
          <>
            <div className="fx-servicelistbox">
              {cart.service.map((ct, ckey) => {
                return (
                  <div className="fx-serviceitem" key={"ct-" + ckey}>
                    <div className="itemname">
                      {ct.name} X {ct.capacity}
                      <br />
                      <span onClick={() => edititem(ct.id)}>Edit</span>{" "}
                    </div>
                    <div className="time">{ct.slot}</div>
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
                        {ct.name} X {ct.capacity}
                        <br />
                        <span onClick={() => edititem(ct.id)}>Edit</span>{" "}
                      </div>
                      <div className="time">{ct.slot}</div>
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
               {step == "paymentstep" ||
            (step == "checkoutstep" && (
              <div className="fx-down-icon-botttom" onClick={() => setVisibleBottom(false)}>
                <i className="pi pi-chevron-up"></i>
              </div>
            ))}
            </div>
          </>
        )}
      {paymentstring && isDesktop && (
        <div className="fx-paymentbox">
          <h1 className="fx-main-heading">Payment</h1>
          <Elements stripe={stripePromise}>
            <CheckoutForm />
          </Elements>
        </div>
      )}
      <Toast ref={toast} />
      <ConfirmDialog />
    </>
  );
}
