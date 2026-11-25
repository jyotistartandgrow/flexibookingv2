import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axiosInstance from "../Utils/Interceptor";
import {
  setRedeemStep,
  setLoading,
  setVoucher,
  setDate,
  setRedeemUpsell,
} from "../store/step1Slice";
import Swal from "sweetalert2";
import moment from "moment";
import { toPlainText } from "../Utils/Functions";
import {
  setRedeemBundleSchedule,
  setRedeemBundleSlots,
  setRedeemUpsellSelections,
  setSlot,
} from "../store/step3Slice";
import { __ } from "../i18n";

export default function Code() {
  const dispatch = useDispatch();
  const step = useSelector((state) => state.step1.redeemstep);

  const [code, setCode] = useState("");

  const reedemcode = async () => {
    // Dispatch an action or perform validation here
    if (!code) {
      Swal.fire({
        toast: true,
        position: "top-end", // or 'bottom-end', 'top-start', etc.
        showConfirmButton: false,
        timer: 3000, // auto-close after 3 seconds
        icon: "warning", // 'success', 'error', 'warning', 'info', 'question'
        title: __("Please enter a voucher code"),
      });
    }
    dispatch(setLoading(true));
    const { data } = await axiosInstance(`/check-voucher-validity`, {
      method: "post",
      data: { voucher: code },
    });

    if (data.status == 200 && data?.data?.status == true) {
      dispatch(setVoucher(code));
      dispatch(setSlot(null));
      dispatch(setRedeemBundleSlots([]));
      dispatch(setRedeemBundleSchedule(null));
      dispatch(setRedeemUpsellSelections([]));
      dispatch(setRedeemUpsell(false));
      dispatch(setRedeemStep("datestep"));
      dispatch(setDate(moment()));
    } else {
      Swal.fire({
        toast: true,
        position: "top-end", // or 'bottom-end', 'top-start', etc.
        showConfirmButton: false,
        timer: 3000, // auto-close after 3 seconds
        icon: "error", // 'success', 'error', 'warning', 'info', 'question'
        titleText: toPlainText(data?.message || __("Invalid voucher code")),
      });
    }
    dispatch(setLoading(false));
  };
  return (
    <div
      className="fx-booking"
      style={{ display: step === "codestep" ? "block" : "none" }}
    >
      <div className="fx-redeem-container">
        <h2 className="fx-redeem-title">{__("Redeem Your gift")}</h2>
        <div className="fx-input-group">
          <input
            type="text"
            className="fx-voucher-input"
            placeholder={__("Enter your voucher code")}
            aria-label={__("Voucher code")}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        <button
          type="button"
          className={`btn-primary fx-redeem-btn-primary ${!code ? "fx-btn-disable" : ""}`}
          onClick={() => reedemcode()}
          disabled={!code}
        >
          {__("Verify")}
        </button>
      </div>
    </div>
  );
}
