import React from "react";
import { useSelector } from "react-redux";

export default function Steps({ step, setStep }) {
  const date = useSelector((state) => state.step1.date);
  const receiverInfo = useSelector((state) => state.step1.receiverInfo);

  return (
    <div className="fx-stepper-tabstyle">
      <div
        className={
          step == "datestep" ? "step datestep active" : "step datestep"
        }
        onClick={() => {
          if (date || receiverInfo.firstName) setStep("datestep");
        }}
      >
        <span>1 DATE</span>
      </div>
      <div
        className={
          step == "servicesstep"
            ? "step servicesstep active"
            : "step servicesstep"
        }
      >
        2 <span>SERVICES</span>
      </div>
      <div
        className={
          step == "extrastep" ? "step extrastep active" : "step extrastep"
        }
      >
        3 <span>EXTRA</span>
      </div>
      <div
        className={
          step == "checkoutstep"
            ? "step checkoutstep active"
            : "step checkoutstep"
        }
      >
        4 <span>CHECKOT</span>
      </div>
      <div
        className={
          step == "paymentstep" ? "step paymentstep active" : "step paymentstep"
        }
      >
        5 <span>PAYMENT</span>
      </div>
    </div>
  );
}
