import React from "react";
import { useSelector } from "react-redux";

export default function Steps({ step, setStep }) {
  const date = useSelector((state) => state.step1.date);
  const receiverInfo = useSelector((state) => state.step1.receiverInfo);
  const serviceid = useSelector((state) => state.step2.service);
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
    <div className="fx-stepper-tabstyle">
      <div
        className={datestepclass}
        onClick={() => {
          if (date || receiverInfo.firstName) setStep("datestep");
        }}
      >
        <span>1 DATE</span>
      </div>
      <div
        className={servicesstepclass}
        onClick={() => {
          if (serviceid) setStep("servicesstep");
        }}
      >
        2 <span>SERVICES</span>
      </div>
      <div className={extrastepclass}>
        3 <span>EXTRA</span>
      </div>
      <div className={checkoutstepclass}>
        4 <span>CHECKOUT</span>
      </div>
      <div className={paymentstepclass}>
        5 <span>PAYMENT</span>
      </div>
    </div>
  );
}
