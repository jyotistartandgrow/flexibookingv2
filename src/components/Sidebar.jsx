import logo from "../assets/logo.png";
import React, { useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import moment from "moment";
import { decodeHtml } from "../Utils/Functions";
import { setStep } from "../store/step1Slice";
import { setCart } from "../store/step2Slice";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { Sidebar as Sidebarpanel } from "primereact/sidebar";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "../pages/CheckoutForm";

const PUBLIC_KEY = import.meta.env.VITE_STRIPE_KEY; // your publishable key
const stripePromise = loadStripe(PUBLIC_KEY);

export default function Sidebar() {
  const dispatch = useDispatch();
  const toast = useRef(null);
  const date = useSelector((state) => state.step1.date);
  //const step = useSelector((state) => state.step1.step);
  const cart = useSelector((state) => state.step2.cart);
  const paymentstring = useSelector((state) => state.step4.paymentstring);
  const [visibleBottom, setVisibleBottom] = useState(false);

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

  const removeaccept = (id) => {
    const updatedCart = cart.filter((item) => item.id !== id);
    dispatch(setCart(updatedCart));
    dispatch(setStep("servicesstep"));
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

  const removeitem = (id) => {
    confirmDialog({
      message: "Are you sure you want to proceed?",
      header: "Confirmation",
      icon: "pi pi-exclamation-triangle",
      accept: () => removeaccept(id),
      reject,
    });
  };
  return (
    <>
      <div className="fx-sidebar">
        <div className="logo">
          <img src={logo} className="fx-right-logo" />
        </div>
        {cart.length == 0 && !date && (
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
        {cart.length > 0 && !paymentstring && (
          <>
            <div className="fx-servicelistbox">
              {cart.map((ct, ckey) => {
                return (
                  <div className="fx-serviceitem" key={"ct-" + ckey}>
                    <div className="itemname">
                      {ct.name}
                      <br />
                      <span onClick={() => edititem(ct.id)}>Edit</span> |{" "}
                      <span onClick={() => removeitem(ct.id)}>Remove</span>
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
                Total <span> {decodeHtml(cart[0].total_formatted)}</span>
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
            {/* <div class="fx-card-input">
              <div class="fx-card-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="16"
                  width="16"
                  fill="#9ca3af"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16
               c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V10h16v8zm0-10H4V6h16v2z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Card Number"
                class="fx-card-number"
              />
              <input type="text" placeholder="MM / YY" class="fx-card-expiry" />
              <input type="text" placeholder="CVC" class="fx-card-cvc" />
            </div>
            <div class="fx-element-box fx-paymentbutton">
              <input
                type="submit"
                class="btn-primary"
                value={"Pay " + decodeHtml(cart[0].total_formatted)}
              />
            </div> */}
          </div>
        )}
      </div>
      {cart.length > 0 && (
        <div
          className="fx-mobilesidebar"
          onClick={() => setVisibleBottom(true)}
        >
          <div className="fx-bottombar-top-details">
            <span className="fx-order-details">Order Details </span>
            <i className="fa fa-chevron-up"></i>
          </div>
          <div className="fx-bottombar-bottom-details">
            <div className="fx-left-content-date">
              <i className="fa fa-calendar"></i>{" "}
              <span className="fx-bottom-date">
                {moment(date).format("MMM DD")},
              </span>
            </div>
            {cart.map((ct, ckey) => {
              return (
                <div className="fx-left-content-service" key={"ctm-" + ckey}>
                  <span className="fx-bottom-service">{ct.name}</span>
                </div>
              );
            })}
            <div className="fx-price">
              {decodeHtml(cart[0].total_formatted)}
            </div>
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
        <div className="fx-sidebar">
          <div className="logo">
            <img src={logo} className="fx-right-logo" />
          </div>
          {cart.length == 0 && !date && (
            <p className="giftmessagebox">
              book your service on a specific date" and "do a gift to a friend
            </p>
          )}

          {date && (
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
          {cart.length > 0 && (
            <>
              <div className="fx-servicelistbox">
                {cart.map((ct, ckey) => {
                  return (
                    <div className="fx-serviceitem" key={"ct-" + ckey}>
                      <div className="itemname">
                        {ct.name}
                        <br />
                        <span onClick={() => edititem(ct.id)}>Edit</span> |{" "}
                        <span onClick={() => removeitem(ct.id)}>Remove</span>
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
                  Total <span> {decodeHtml(cart[0].total_formatted)}</span>
                </p>
              </div>
            </>
          )}
        </div>
      </Sidebarpanel>
    </>
  );
}
