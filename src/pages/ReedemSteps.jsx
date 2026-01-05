import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setRedeemStep } from "../store/step1Slice";

export default function ReedemSteps() {
  const dispatch = useDispatch();
  const date = useSelector((state) => state.step1.date);
  const step = useSelector((state) => state.step1.redeemstep);
  let codestepclass = "step codestep";
  let datestepclass = "step datestep";
  let slotstepclass = "step slotstep";
  let checkoutstepclass = "step checkoutstep";

  if (step == "codestep") {
    codestepclass = codestepclass + " active";
  } else if (step == "datestep") {
    datestepclass = datestepclass + " active";
    codestepclass = codestepclass + " complete";
  } else if (step == "slotstep") {
    slotstepclass = slotstepclass + " active";
    codestepclass = codestepclass + " complete";
    datestepclass = datestepclass + " complete";
  } else if (step == "checkoutstep") {
    checkoutstepclass = checkoutstepclass + " active";
    codestepclass = codestepclass + " complete";
    slotstepclass = slotstepclass + " complete";
    datestepclass = datestepclass + " complete";
  }

  return (
    <div className="fx-step-top-fixed-box">
      <div className={`fx-stepper-tabstyle`}>
        <div
          className={codestepclass}
          onClick={() => {
            dispatch(setRedeemStep("codestep"));
          }}
        >
          <div>
            1 <span>ENTER YOUR CODE</span>
          </div>
        </div>
        <div
          className={datestepclass}
          onClick={() => {
            dispatch(setRedeemStep("datestep"));
          }}
        >
          <div>
            2 <span>SELECT DATE</span>
          </div>
        </div>
        <div
          className={slotstepclass}
          onClick={() => {
            dispatch(setRedeemStep("slotstep"));
          }}
        >
          <div>
            3 <span>SELECT SLOT</span>
          </div>
        </div>
        <div className={checkoutstepclass}>
          <div>
            4 <span>CHECKOUT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
