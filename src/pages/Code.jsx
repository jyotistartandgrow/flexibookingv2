import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axiosInstance from "../Utils/Interceptor";
import { setRedeemStep, setLoading, setVoucher } from "../store/step1Slice";
import Swal from "sweetalert2";

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
      class="fx-booking"
      style={{ display: step === "codestep" ? "block" : "none" }}
    >
      <div class="fx-redeem-container">
        <h2 class="fx-redeem-title">Redeem Your gift</h2>
        <div class="fx-input-group">
          <input
            type="text"
            class="fx-voucher-input"
            placeholder="Enter your voucher code"
            aria-label="Voucher code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button
            type="button"
            class="fx-btn-verify"
            onClick={() => reedemcode()}
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}
