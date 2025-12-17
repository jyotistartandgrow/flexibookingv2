import logo from "../assets/logo.png";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import moment from "moment";
import { decodeHtml } from "../Utils/Functions";
import { Toast } from "primereact/toast";
import { Sidebar as Sidebarpanel } from "primereact/sidebar";
import CheckoutForm from "../pages/CheckoutForm";
import Swal from "sweetalert2";

import Commonbox from "./Commonbox";

export default function Sidebar() {
  const step = useSelector((state) => state.step1.step);
  const date = useSelector((state) => state.step1.date);
  const cart = useSelector((state) => state.step2.cart);
  const [visibleBottom, setVisibleBottom] = useState(false);

  return (
    <>
      <div className="fx-sidebar ">
        <div className="logo">
          <img src={logo} className="fx-right-logo" />
        </div>
        <Commonbox />
      </div>
      {date && (
        <div
          className={
            step != "paymentstep" && step != "checkoutstep"
              ? "fx-mobilesidebar"
              : "fx-mobilesidebar fx-mobilesidebar-top"
          }
          onClick={() => setVisibleBottom(true)}
        >
          <div className="fx-bottombar-top-details">
            <span className="fx-order-details">Order Details </span>
            <i
              className={
                step != "paymentstep" && step != "checkoutstep"
                  ? "pi pi-chevron-up"
                  : "pi pi-chevron-down"
              }
            ></i>
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

      <Sidebarpanel
        visible={visibleBottom}
        position={
          step != "paymentstep" && step != "checkoutstep" ? "bottom" : "top"
        }
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
          <Commonbox />
        </div>
      </Sidebarpanel>
    </>
  );
}
