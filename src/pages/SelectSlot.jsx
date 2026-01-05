import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setRedeemStep, setLoading } from "../store/step1Slice";
import axiosInstance from "../Utils/Interceptor";
import { decodeHtml } from "../Utils/Functions";
import moment from "moment";

export default function SelectSlot() {
  const dispatch = useDispatch();
  const step = useSelector((state) => state.step1.redeemstep);
  const date = useSelector((state) => state.step1.date);
  const voucher = useSelector((state) => state.step1.voucher);

  const [voucherdetail, setVoucherdetail] = useState({});

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
    }
    dispatch(setLoading(false));
  };
  return (
    <div
      class="fx-booking-gift-slots"
      style={{ display: step === "slotstep" ? "block" : "none" }}
    >
      <div class="fx-treatment-card">
        <div class="fx-treatment-image">
          <img
            src={voucherdetail?.service_image}
            alt={
              voucherdetail?.products ? voucherdetail?.products[0]?.name : ""
            }
          />
        </div>

        <div class="fx-treatment-content">
          <h2 class="fx-title">
            {voucherdetail?.products ? voucherdetail?.products[0]?.name : ""}
          </h2>
          <p class="fx-description">
            Body treatments with innovative techniques, created by QC Terme's
            experts to offer immediate and long-lasting results.
          </p>

          <div class="fx-slots-list">
            {voucherdetail?.slots?.length == 0 && (
              <div>No slots available for the selected date.</div>
            )}
            {voucherdetail?.slots?.map((slot) => (
              <div class="fx-slot-item">
                {slot.split(" - ")[0]} - {slot.split(" - ")[1]}
              </div>
            ))}
          </div>

          <div class="fx-button-container">
            <button type="button" class="fx-btn-continue">
              CONTINUE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
