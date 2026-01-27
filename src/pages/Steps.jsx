import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setStep, setAll } from "../store/step1Slice";
import moment from "moment";
import { decodeHtml } from "../Utils/Functions";
import Commonbox from "../components/Commonbox";
import logo from "../assets/logo.png";
import { Toast } from "primereact/toast";
import { Sidebar as Sidebarpanel } from "primereact/sidebar";


export default function Steps({ type = "date" }) {
  const dispatch = useDispatch();
  const date = useSelector((state) => state.step1.date);
  const category = useSelector((state) => state.step1.category);
  const step = useSelector((state) => state.step1.step);
  const receiverInfo = useSelector((state) => state.step1.receiverInfo);
  const gift = useSelector((state) => state.step1.gift);
  const serviceid = useSelector((state) => state.step2.service);
  const extra = useSelector((state) => state.step3.extra);
  const checkoutkey = useSelector((state) => state.step4.checkoutkey);
  const cart = useSelector((state) => state.step2.cart);
  const [visibleBottom, setVisibleBottom] = useState(false);

  if (type == "category" || type == "service") {
    dispatch(setAll(true));
  }
  if (type == "service" && step == "datestep") {
    dispatch(setStep("servicesstep"));
  }
  let datestepclass = "step datestep";
  let servicesstepclass = "step servicesstep";
  let extrastepclass = "step extrastep";
  let checkoutstepclass = "step checkoutstep";
  let paymentstepclass = "step paymentstep";
  if (step == "datestep") {
    datestepclass = datestepclass + " active";
  } else if (step == "categorystep") {
    datestepclass = datestepclass + " active";
  } else if (step == "servicesstep") {
    servicesstepclass = servicesstepclass + " active";
    datestepclass = datestepclass + " complete";
  } else if (step == "extrastep") {
    extrastepclass = extrastepclass + " active";
    datestepclass = datestepclass + " complete";
    servicesstepclass = servicesstepclass + " complete";
  } else if (step == "checkoutstep") {
    checkoutstepclass = checkoutstepclass + " active";
    datestepclass = datestepclass + " complete";
    servicesstepclass = servicesstepclass + " complete";
    extrastepclass = extrastepclass + " complete";
  } else if (step == "paymentstep") {
    paymentstepclass = paymentstepclass + " active";
    datestepclass = datestepclass + " complete";
    servicesstepclass = servicesstepclass + " complete";
    extrastepclass = extrastepclass + " complete";
    checkoutstepclass = checkoutstepclass + " complete";
  }

  return (
    <>
      <div
        className={
          step != "paymentstep" && step != "checkoutstep"
            ? ""
            : "fx-step-top-fixed-box"
        }
      >
        <div className={`fx-stepper-tabstyle fx-${type}-step`}>
          {type == "date" && (
            <div
              className={datestepclass}
              onClick={() => {
                if (date || receiverInfo.firstName)
                  dispatch(setStep("datestep"));
              }}
            >
              <div>
                1 <span>{gift ? "INFORMATION" : "DATE"}</span>
              </div>
            </div>
          )}
          {type == "category" && (
            <div
              className={datestepclass}
              onClick={() => {
                if (category) dispatch(setStep("categorystep"));
              }}
            >
              <div>
                1 <span>CATEGORY</span>
              </div>
            </div>
          )}
          <div
            className={servicesstepclass}
            onClick={() => {
              if (serviceid) dispatch(setStep("servicesstep"));
            }}
          >
            <div>
              {type == "service" ? 1 : 2} <span>SERVICES</span>
            </div>
          </div>
          <div
            className={extrastepclass}
            onClick={() => {
              if (extra) dispatch(setStep("extrastep"));
            }}
          >
            <div>
              {type == "service" ? 2 : 3} <span>EXTRA</span>
            </div>
          </div>
          <div
            className={checkoutstepclass}
            onClick={() => {
              if (checkoutkey) dispatch(setStep("checkoutstep"));
            }}
          >
            <div>
              {type == "service" ? 3 : 4} <span>CHECKOUT</span>
            </div>
          </div>
          <div className={paymentstepclass}>
            <div>
              {type == "service" ? 4 : 5} <span>PAYMENT</span>
            </div>
          </div>
        </div>
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
          {step != "paymentstep" && step != "checkoutstep" && (
            <div
              className="fx-mob-down-arrow"
              onClick={() => setVisibleBottom(false)}
            >
              <i className="pi pi-chevron-down"></i>
            </div>
          )}
          <h3>Order Details</h3>
          <Commonbox setVisibleBottom={setVisibleBottom} />
        </div>
      </Sidebarpanel>
    </>
  );
}
