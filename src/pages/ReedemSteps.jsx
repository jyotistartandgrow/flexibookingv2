import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setRedeemStep } from "../store/step1Slice";
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
  let codestepclass = "step codestep";
  let datestepclass = "step datestep";
  let checkoutstepclass = "step checkoutstep";

  if (step == "codestep") {
    codestepclass = codestepclass + " active";
  } else if (step == "datestep") {
    datestepclass = datestepclass + " active";
    codestepclass = codestepclass + " complete";
  } else if (step == "checkoutstep") {
    checkoutstepclass = checkoutstepclass + " active";
    codestepclass = codestepclass + " complete";
    datestepclass = datestepclass + " complete";
  }

  const getSettings = async () => {
    try {
      const response = await axiosInstance.get("/settings");
      const settings = response.data;

      // Set CSS custom property
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
            isRedeemBooking ? "fx-redeem-booking-step" : ""
          }`}
        >
          <div
            className={codestepclass}
            onClick={() => {
              dispatch(setRedeemStep("codestep"));
            }}
          >
            <div>
              1 <span>{isRedeemBooking ? "CODE" : "ENTER YOUR CODE"}</span>
            </div>
          </div>
          <div
            className={datestepclass}
            onClick={() => {
              voucherdetail?.products?.length > 0 &&
                dispatch(setRedeemStep("datestep"));
            }}
          >
            <div>
              2 <span>{isRedeemBooking ? "DATE & SLOT" : "SELECT DATE & SLOT"}</span>
            </div>
          </div>

          {isRedeemBooking ? (
            <>
              <div className="step servicesstep">
                <div>3 <span>SERVICES</span></div>
              </div>
              <div className="step extrastep">
                <div>4 <span>EXTRA</span></div>
              </div>
              <div className="step checkoutstep">
                <div>5 <span>CHECKOUT</span></div>
              </div>
              <div className="step paymentstep">
                <div>6 <span>PAYMENT</span></div>
              </div>
            </>
          ) : (
            <div className={checkoutstepclass}>
              <div>
                3 <span>CHECKOUT</span>
              </div>
            </div>
          )}
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
