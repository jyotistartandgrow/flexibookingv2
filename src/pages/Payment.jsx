import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import Swal from "sweetalert2";
import axiosInstance from "../Utils/Interceptor";
import { setStep } from "../store/step1Slice";
import moment from "moment";
import { decodeHtml } from "../Utils/Functions";

export default function Payment() {
  const dispatch = useDispatch();
  const step = useSelector((state) => state.step1.step);
  const date = useSelector((state) => state.step1.date);
  const cart = useSelector((state) => state.step2.cart);

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
            <span className="value">{decodeHtml(cart?.total_formatted)}</span>
          </div>
          <div className="fx-summary-line">
            <span>Discount</span>
            <span className="value">€0,00</span>
          </div>
        </div>
      </div>
    </div>
  );
}
