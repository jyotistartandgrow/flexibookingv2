import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setRedeemStep, setLoading } from "../store/step1Slice";
import { setSlot, setVoucherDetail } from "../store/step3Slice";
import axiosInstance from "../Utils/Interceptor";
import { decodeHtml } from "../Utils/Functions";
import moment from "moment";
import Swal from "sweetalert2";

export default function SelectSlot() {
  const dispatch = useDispatch();
  const step = useSelector((state) => state.step1.redeemstep);
  const date = useSelector((state) => state.step1.date);
  const voucher = useSelector((state) => state.step1.voucher);

  const [voucherdetail, setVoucherdetail] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    if (step == "slotstep") {
      fetchVoucher();
    }
  }, [step]);

  const fetchVoucher = async () => {
    dispatch(setLoading(true));
    const { data } = await axiosInstance(`/voucher-detail`, {
      method: "post",
      data: { voucher: voucher, date: moment(date).format("YYYY-MM-DD") },
    });
    if (data && data.status == 200 && data?.data?.status == true) {
      setVoucherdetail(data.data);
      dispatch(setVoucherDetail(voucherdetail));
    }
    dispatch(setLoading(false));
  };

  const slotset = (slot) => {
    setSelectedSlot(slot);
    dispatch(setSlot(slot));
  };

  const checkout = () => {
    if (!selectedSlot) {
      Swal.fire({
        toast: true,
        position: "top-end", // or 'bottom-end', 'top-start', etc.
        showConfirmButton: false,
        timer: 3000, // auto-close after 3 seconds
        icon: "warning", // 'success', 'error', 'warning', 'info', 'question'
        title: "Please select a slot",
      });
      return;
    }
    dispatch(setRedeemStep("checkoutstep"));
  };
  return (
    <div
      className="fx-booking-gift-slots"
      style={{ display: step === "slotstep" && voucherdetail?.products ? "block" : "none" }}
    >
      <div className="fx-treatment-card">
        <div className="fx-treatment-image">
          <img
            src={voucherdetail?.service_image}
            alt={
              voucherdetail?.products ? voucherdetail?.products[0]?.name : ""
            }
          />
        </div>

        <div className="fx-treatment-content">
          <h2 className="fx-title">
            {voucherdetail?.products ? voucherdetail?.products[0]?.name : ""}
          </h2>
          <p className="fx-description">
            {decodeHtml(voucherdetail?.service_description)}
          </p>

          <div className="fx-slots-list">
            {voucherdetail?.slots?.length == 0 && (
              <div>No slots available for the selected date.</div>
            )}
            {voucherdetail?.slots?.map((slot) => (
              <div
                className={
                  slot == selectedSlot
                    ? "fx-slot-item fx-slotbox-active"
                    : "fx-slot-item"
                }
                onClick={() => slotset(slot)}
              >
                {slot.split(" - ")[0]} - {slot.split(" - ")[1]}
              </div>
            ))}
          </div>

          <div className="fx-button-container">
            <button
              type="button"
              className="fx-btn-continue"
              onClick={() => checkout()}
            >
              CONTINUE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
