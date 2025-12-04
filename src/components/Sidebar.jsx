import logo from "../assets/logo.png";
import React, { useRef, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import moment from "moment";
import { decodeHtml } from "../Utils/Functions";
import { setStep } from "../store/step1Slice";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { Sidebar as Sidebarpanel } from "primereact/sidebar";
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
import { setCouponlist } from "../store/step1Slice";

const PUBLIC_KEY = import.meta.env.VITE_STRIPE_KEY; // your publishable key
const stripePromise = loadStripe(PUBLIC_KEY);

export default function Sidebar() {
  const dispatch = useDispatch();
  const toast = useRef(null);
  const date = useSelector((state) => state.step1.date);
  const step = useSelector((state) => state.step1.step);
  const cart = useSelector((state) => state.step2.cart);
  const paymentstring = useSelector((state) => state.step4.paymentstring);
  const couponcode = useSelector((state) => state.step1.couponcode);
  const [visibleBottom, setVisibleBottom] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [fields, setFields] = useState([{ code: "" }]);
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

  const removeCoupon = (key) => {
    const updated = fields.filter((_, i) => i !== key);
    setFields(updated);
    // compute valid coupons using UPDATED list
    const validCoupons = updated
      .map((f) => f.code.trim())
      .filter((c) => c !== "");
    dispatch(setCouponlist(validCoupons));
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
      <div className="fx-sidebar ">
        <div className="logo">
          <img src={logo} className="fx-right-logo" />
        </div>
        {cart?.service?.length == 0 && !date && (
          <p className="giftmessagebox">
            book your service on a specific date" and "do a gift to a friend
          </p>
        )}
        {date && !paymentstring && (
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
                <div className="fx-delete-coupon">
                  <i
                    className="pi pi-trash"
                    onClick={() => removeCoupon(index)}
                  ></i>
                </div>
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
        {cart?.service?.length > 0 && !paymentstring && (
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
            <div className="fx-totalbar">
              <p>
                Total <span> {decodeHtml(cart.total_formatted)}</span>
              </p>
            </div>
          </>
        )}
        {paymentstring && (
          <div class="fx-paymentbox">
            <h1 class="fx-main-heading">Payment</h1>
            <Elements stripe={stripePromise}>
              <CheckoutForm />
            </Elements>
          </div>
        )}
      </div>
      {date && (
        <div
          className="fx-mobilesidebar"
          onClick={() => setVisibleBottom(true)}
        >
          <div className="fx-bottombar-top-details">
            <span className="fx-order-details">Order Details </span>
            <i className="pi pi-chevron-up"></i>
          </div>
          <div className="fx-bottombar-bottom-details">
            <div className="fx-left-content-date">
              <i className="fa fa-calendar"></i>{" "}
              <span className="fx-bottom-date">
                {moment(date).format("MMM DD")}
              </span>
            </div>
            {cart?.service?.length > 0 && (
              <>
                {cart.service.map((ct, ckey) => {
                  return (
                    <div
                      className="fx-left-content-service"
                      key={"ctm-" + ckey}
                    >
                      <span className="fx-bottom-service">, {ct.name}</span>
                    </div>
                  );
                })}
                <div className="fx-price">
                  {decodeHtml(cart.total_formatted)}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <Toast ref={toast} />
      <ConfirmDialog />

      <Sidebarpanel
        visible={visibleBottom}
        position="bottom"
        onHide={() => setVisibleBottom(false)}
      >
        <div className="fx-sidebar fx-mob-footer-order-details">
          <div className="logo">
            <img src={logo} className="fx-right-logo" />
          </div>
          <div
            className="fx-mob-down-arrow"
            onClick={() => setVisibleBottom(false)}
          >
            <i className="pi pi-chevron-down"></i>
          </div>
          <h3>Order Details</h3>
          {cart?.service?.length == 0 && !date && (
            <p className="giftmessagebox">
              book your service on a specific date" and "do a gift to a friend
            </p>
          )}

          {date && !paymentstring && (
            <div className="fx-bookingdatebar">
              <div className="fx-coupon-box">
                <input type="text" placeholder="Enter your coupon code" />
                <button className="fx-apply-btn">APPLY</button>
              </div>
              <div className="fx-bookingdate">
                Date
                <br />
                <span>{moment(date).format("MMMM DD YYYY")}</span>
              </div>
            </div>
          )}
          {cart?.service?.length > 0 && !paymentstring && (
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
                {cart?.extra?.map((ct, ckey) => {
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
              <div className="fx-totalbar">
                <p>
                  Total <span> {decodeHtml(cart.total_formatted)}</span>
                </p>
              </div>
            </>
          )}
          {paymentstring && (
            <div class="fx-paymentbox">
              <h1 class="fx-main-heading">Payment</h1>
              <Elements stripe={stripePromise}>
                <CheckoutForm />
              </Elements>
            </div>
          )}
        </div>
      </Sidebarpanel>
    </>
  );
}
