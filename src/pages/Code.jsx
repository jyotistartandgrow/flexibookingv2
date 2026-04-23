import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axiosInstance from "../Utils/Interceptor";
import {
  setRedeemStep,
  setLoading,
  setVoucher,
  setDate,
} from "../store/step1Slice";
import Swal from "sweetalert2";
import moment from "moment";

export default function Code() {
  const dispatch = useDispatch();
  const step = useSelector((state) => state.step1.redeemstep);

  const [code, setCode] = useState("");

  const reedemcode = async () => {
    // Dispatch an action or perform validation here
    console.log("Verifying code:", code);
    if (!code) {
      Swal.fire({
        toast: true,
        position: "top-end", // or 'bottom-end', 'top-start', etc.
        showConfirmButton: false,
        timer: 3000, // auto-close after 3 seconds
        icon: "warning", // 'success', 'error', 'warning', 'info', 'question'
        title: "Please enter a voucher code",
      });
    }
    dispatch(setLoading(true));
    const { data } = await axiosInstance(`/check-voucher-validity`, {
      method: "post",
      data: { voucher: code },
    });

    if (data.status == 200 && data?.data?.status == true) {
      dispatch(setVoucher(code));
      dispatch(setRedeemStep("datestep"));
      dispatch(setDate(moment()));
    } else {
      Swal.fire({
        toast: true,
        position: "top-end", // or 'bottom-end', 'top-start', etc.
        showConfirmButton: false,
        timer: 3000, // auto-close after 3 seconds
        icon: "error", // 'success', 'error', 'warning', 'info', 'question'
        title: data?.message || "Invalid voucher code",
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
        <h2 className="fx-redeem-title">Redeem Your gift</h2>
        <div className="fx-input-group">
          <input
            type="text"
            className="fx-voucher-input"
            placeholder="Enter your voucher code"
            aria-label="Voucher code"
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
          Verify
        </button>
      </div>
    </div>
  );
}
