import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setRedeemStep, setStripeKey } from "../store/step1Slice";
import moment from "moment";
import { decodeHtml, darkenHex } from "../Utils/Functions";
import { Sidebar as Sidebarpanel } from "primereact/sidebar";
import logo from "../assets/logo.png";
import RedeemCommonbox from "../components/RedeemCommonbox";
import axiosInstance from "../Utils/Interceptor";
import useDeviceType from "../Utils/useDeviceType";

export default function ReedemSteps(props) {
  const dispatch = useDispatch();
  const date = useSelector((state) => state.step1.date);
  const step = useSelector((state) => state.step1.redeemstep);
  const slot = useSelector((state) => state.step3.slot);
  const voucherdetail = useSelector((state) => state.step3.voucherdetail);
  const isDesktop = useDeviceType();
  const [visibleBottom, setVisibleBottom] = useState(false);
  const isRedeemBooking = props.redeemBooking === true;
  const isUpsell = useSelector((state) => state.step1.redeemUpsell);
  const hasAdditions = useSelector((state) => state.step3.redeemUpsellSelections?.length > 0);

  // "Add more services" adds a Service step and a Payment step for the paid additions.
  const redeemSteps = isUpsell
    ? [
        ["codestep", "CODE", "ENTER YOUR CODE"],
        ["datestep", "DATE & SLOT", "SELECT DATE & SLOT"],
        ["upsellstep", "OPTIONAL ADDITIONS", "OPTIONAL ADDITIONS"],
        ["checkoutstep", "DETAILS", "DETAILS"],
        // Payment only applies when additions were chosen; skipping redeems the gift directly.
        ...(hasAdditions ? [["paymentstep", "PAYMENT", "PAYMENT"]] : []),
      ]
    : [
        ["codestep", "CODE", "ENTER YOUR CODE"],
        ["datestep", "DATE & SLOT", "SELECT DATE & SLOT"],
        ["checkoutstep", "CHECKOUT", "CHECKOUT"],
      ];
  const activeIndex = Math.max(0, redeemSteps.findIndex(([key]) => key === step));

  // Only completed steps before payment can be revisited from the bar.
  const goToStep = (key, index) => {
    if (index >= activeIndex || step === "paymentstep") return;
    if (key !== "codestep" && !(voucherdetail?.products?.length > 0)) return;
    dispatch(setRedeemStep(key));
  };

  const getSettings = async () => {
    try {
      const response = await axiosInstance.get("/settings");
      const settings = response.data;

      // Set CSS custom property
      if (settings.data.stripe_public_key) {
        dispatch(setStripeKey(settings.data.stripe_public_key));
      }
      if (settings.data.primary_color) {
        document.documentElement.style.setProperty(
          "--primary-color",
          settings.data.primary_color,
        );

        document.documentElement.style.setProperty(
          "--darkblue-color",
          darkenHex(settings.data.primary_color, 56),
        );
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  useEffect(() => {
    getSettings();
  }, []);

  return (
    <>
      <div className="fx-step-top-fixed-box">
        <div
          className={`fx-stepper-tabstyle step-for-redeem ${
            isUpsell ? "fx-redeem-upsell-step" : isRedeemBooking ? "fx-redeem-booking-step" : ""
          }`}
        >
          {redeemSteps.map(([key, shortLabel, label], index) => (
            <div
              key={key}
              className={`step ${key}${index === activeIndex ? " active" : ""}${index < activeIndex ? " complete" : ""}`}
              onClick={() => goToStep(key, index)}
            >
              <div>
                {index + 1} <span>{isRedeemBooking || isUpsell ? shortLabel : label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {date && (
        <div
          className={
            step != "checkoutstep"
              ? "fx-mobilesidebar"
              : "fx-mobilesidebar fx-mobilesidebar-top"
          }
          onClick={() => setVisibleBottom(true)}
          style={{ display: props.bottombar == "true" && !isDesktop ? "block" : "none" }}
        >
          <div className="fx-bottombar-top-details">
            <span className="fx-order-details">Order Details </span>
            <i
              className={
                step != "checkoutstep"
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
              <span className="fx-bottom-date">, {slot}</span>
            </div>
            {voucherdetail?.service?.length > 0 && (
              <>
                {voucherdetail.service.map((ct, ckey) => {
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
                  {decodeHtml(voucherdetail.total_formatted)}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Sidebarpanel
        visible={visibleBottom}
        position={step != "checkoutstep" ? "bottom" : "top"}
        onHide={() => setVisibleBottom(false)}
      >
        <div className="fx-sidebar fx-mob-footer-order-details">
          <div className="logo">
            <img src={logo} className="fx-right-logo" />
          </div>
          {step != "checkoutstep" && (
            <div
              className="fx-mob-down-arrow"
              onClick={() => setVisibleBottom(false)}
            >
              <i className="pi pi-chevron-down"></i>
            </div>
          )}
          <h3>Order Details</h3>
          <RedeemCommonbox setVisibleBottom={setVisibleBottom} />
        </div>
      </Sidebarpanel>
    </>
  );
}
