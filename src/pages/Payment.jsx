import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import Swal from "sweetalert2";
import axiosInstance from "../Utils/Interceptor";
import { setStep } from "../store/step1Slice";

export default function Payment() {
  const dispatch = useDispatch();
  const step = useSelector((state) => state.step1.step);

  return (
    <div
      className="fx-leftcontentbox"
      style={{ display: step === "paymentstep" ? "block" : "none" }}
    >
      <h1 className="fx-main-heading">Checkout</h1>
      <div className="fx-order-summary">
        <div className="fx-service-date">
          <strong>Service Date:</strong>
          <p>December 28th, 2024</p>
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
            <tr>
              <td>Test new</td>
              <td>€23,00</td>
              <td>0</td>
              <td>€0,00</td>
            </tr>
            <tr>
              <td>Test1</td>
              <td>€23,00</td>
              <td>0</td>
              <td>€0,00</td>
            </tr>
          </tbody>
        </table>

        <div className="fx-summary-footer">
          <div className="fx-summary-line">
            <span>Subtotal</span>
            <span className="value">€60,00</span>
          </div>
          <div className="fx-summary-line">
            <span>Discount</span>
            <span className="value">€60,00</span>
          </div>
        </div>
      </div>
    </div>
  );
}
