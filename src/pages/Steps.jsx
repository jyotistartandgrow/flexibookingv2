import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setStep } from "../store/step1Slice";

export default function Steps() {
  const dispatch = useDispatch();
  const date = useSelector((state) => state.step1.date);
  const step = useSelector((state) => state.step1.step);
  const receiverInfo = useSelector((state) => state.step1.receiverInfo);
  const serviceid = useSelector((state) => state.step2.service);
  const extra = useSelector((state) => state.step3.extra);
  const checkoutkey = useSelector((state) => state.step4.checkoutkey);
  let datestepclass = "step datestep";
  let servicesstepclass = "step servicesstep";
  let extrastepclass = "step extrastep";
  let checkoutstepclass = "step checkoutstep";
  let paymentstepclass = "step paymentstep";
  if (step == "datestep") {
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
    <div className={
            step != "paymentstep" && step != "checkoutstep"
              ? ""
              : "fx-step-top-fixed-box"
          }>
    <div className="fx-stepper-tabstyle">
      <div
        className={datestepclass}
        onClick={() => {
          if (date || receiverInfo.firstName) dispatch(setStep("datestep"));
        }}
      >
        <div>1 <span>DATE</span></div>
      </div>
      <div
        className={servicesstepclass}
        onClick={() => {
          if (serviceid) dispatch(setStep("servicesstep"));
        }}
      >
        <div>2 <span>SERVICES</span></div>
      </div>
      <div
        className={extrastepclass}
        onClick={() => {
          if (extra) dispatch(setStep("extrastep"));
        }}
      >
        <div>3 <span>EXTRA</span></div>
      </div>
      <div
        className={checkoutstepclass}
        onClick={() => {
          if (checkoutkey) dispatch(setStep("checkoutstep"));
        }}
      >
        <div>4 <span>CHECKOUT</span></div>
      </div>
      <div className={paymentstepclass}>
        <div>5 <span>PAYMENT</span></div>
      </div>
    </div>
    </div>
  );
}
