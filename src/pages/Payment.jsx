import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import Swal from "sweetalert2";
import axiosInstance from "../Utils/Interceptor";
import { setCart } from "../store/step2Slice";
import moment from "moment";
import { decodeHtml } from "../Utils/Functions";

export default function Payment() {
  const dispatch = useDispatch();
  const step = useSelector((state) => state.step1.step);
  const date = useSelector((state) => state.step1.date);
  const cart = useSelector((state) => state.step2.cart);
  const bookingkey = useSelector((state) => state.step3.bookingkey);

  useEffect(() => {
    if (step == "paymentstep") {
      auto_apply_coupon();
    }
  }, [step]);

  const auto_apply_coupon = async () => {
    const { data } = await axiosInstance(
      `/auto-apply-coupon?booking_key=${bookingkey}`,
      {
        method: "get",
      }
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
  };

  return (
    <div
      className="fx-leftcontentbox"
      style={{ display: step === "paymentstep" ? "block" : "none" }}
    >
      <h1 className="fx-main-heading">Checkout</h1>
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
            <span className="value">{decodeHtml(cart?.total_formatted)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
