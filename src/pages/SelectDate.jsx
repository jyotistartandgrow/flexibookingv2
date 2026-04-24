import { useRef, useEffect, useState } from "react";
import calendar from "../assets/calendar.png";
import { useSelector, useDispatch } from "react-redux";
import { Calendar } from "primereact/calendar";
import { addLocale } from "primereact/api";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { setDate } from "../store/step1Slice";
import moment from "moment";
import Swal from "sweetalert2";
import { setRedeemStep, setLoading } from "../store/step1Slice";
import { setSlot, setVoucherDetail } from "../store/step3Slice";
import axiosInstance from "../Utils/Interceptor";
import { decodeEntities } from "../Utils/Functions";

addLocale("en-monday", {
  firstDayOfWeek: 1, // Monday
});

export default function SelectDate() {
  const calendarRef = useRef(null);
  const dispatch = useDispatch();
  const step = useSelector((state) => state.step1.redeemstep);
  const date = useSelector((state) => state.step1.date);
  const voucher = useSelector((state) => state.step1.voucher);
  const [voucherdetail, setVoucherdetail] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);

  const getDecodedMarkup = (html) => ({
    __html: decodeEntities(html || ""),
  });

  const slotset = (slot) => {
    setSelectedSlot(slot);
    dispatch(setSlot(slot));
  };

  const calendarDate = date
    ? moment(date).isValid()
      ? moment(date).toDate()
      : null
    : null;

  useEffect(() => {
    if (step == "datestep") {
      fetchVoucher();
    }
  }, [step, date]);

  const fetchVoucher = async () => {
    dispatch(setLoading(true));
    const { data } = await axiosInstance(`/voucher-detail`, {
      method: "post",
      data: { voucher: voucher, date: moment(date).format("YYYY-MM-DD") },
    });
    if (data && data.status == 200 && data?.data?.status == true) {
      setVoucherdetail(data.data);
      dispatch(setVoucherDetail(data.data));
    }
    dispatch(setLoading(false));
  };

  const getslot = () => {
    dispatch(setLoading(true));
    console.log("Selected date:", moment(date).format("YYYY-MM-DD"));
    if (!date) {
      Swal.fire({
        toast: true,
        position: "top-end", // or 'bottom-end', 'top-start', etc.
        showConfirmButton: false,
        timer: 3000, // auto-close after 3 seconds
        icon: "warning", // 'success', 'error', 'warning', 'info', 'question'
        title: "Please select a date",
      });
      dispatch(setLoading(false));
      return;
    }

    if (!selectedSlot) {
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        icon: "warning",
        title: "Please select a slot",
      });
      dispatch(setLoading(false));
      return;
    }

    dispatch(setRedeemStep("checkoutstep"));
    dispatch(setLoading(false));
  };

  const isContinueDisabled = !date || !selectedSlot;

  return (
    <div
      className="fx-tabcontent fx-gift-date-box"
      style={{ display: step === "datestep" ? "block" : "none" }}
    >
      <div class="redemption-Voucher-services-box">
        <div class="fx-booking-container">
          <div class="fx-content-body">
            <div class="fx-section-group">
              <h2 class="fx-section-title">Service</h2>
              {voucherdetail?.products?.map(
                (product, p2) =>
                  product.service_id && (
                    <div className="fx-serviceboxlist" key={p2}>
                      <div className="fx-servicepicboxlist">
                        <div className="fx-list-img-box">
                          <img src={product.image} alt={product.name} />
                        </div>
                        <span className="fx-servicepiccontentbox">
                          {product.category_name}
                        </span>
                      </div>
                      <div className="fx-servicecontentboxlist">
                        <div className="list-view-text-content">
                          <h4>{product.name}</h4>
                          <div
                            dangerouslySetInnerHTML={getDecodedMarkup(
                              product.service_desc,
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  ),
              )}
            </div>

            <div class="fx-section-group">
              <h2 class="fx-section-title">Extra</h2>
              {voucherdetail?.products?.map(
                (product, p2) =>
                  product.id && (
                    <div className="fx-serviceboxlist" key={p2}>
                      <div className="fx-servicepicboxlist">
                        <div className="fx-list-img-box">
                          <img src={product.image} alt={product.name} />
                        </div>
                      </div>
                      <div className="fx-servicecontentboxlist">
                        <div className="list-view-text-content">
                          <h4>{product.name}</h4>
                          <div
                            dangerouslySetInnerHTML={getDecodedMarkup(
                              product.service_desc,
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  ),
              )}
            </div>

            <div class="fx-scheduling-panel">
              <div class="fx-date-picker-group">
                <label class="fx-label">Select date</label>
                <div class="fx-input-with-icon">
                  <Calendar
                    value={calendarDate}
                    onChange={(e) => {
                      setSelectedSlot(null);
                      dispatch(setSlot(null));
                      dispatch(setDate(e.value));
                    }}
                    className="fx-datepicker"
                    minDate={new Date()}
                    ref={calendarRef}
                    onClick={() => {
                      // force open
                      calendarRef.current?.show();
                    }}
                    locale="en-monday"
                    dateFormat="dd/mm/yy"
                  />
                  <span class="fx-icon">
                    <i class="pi pi-calendar fx-calendaricon"></i>
                  </span>
                </div>
              </div>

              <p class="fx-availability-note">
                Available times for{" "}
                <strong>{moment(date).format("dddd, MMM DD")}</strong>
              </p>

              <div class="fx-time-selector-grid">
                {voucherdetail?.slots?.length == 0 && (
                  <div>No slots available for the selected date.</div>
                )}
                {voucherdetail?.slots?.map((slot, index) => (
                  <div
                    key={index}
                    className={
                      slot == selectedSlot
                        ? "fx-time-btn fx-selected"
                        : "fx-time-btn"
                    }
                    onClick={() => slotset(slot)}
                  >
                    {slot.split(" - ")[0]} - {slot.split(" - ")[1]}
                  </div>
                ))}
              </div>

              <div class="fx-footer-actions">
                <div class="fx-btn-back" onClick={()=> dispatch(setRedeemStep("codestep"))}>← Back</div>
                <div
                  className={`fx-btn-continue ${isContinueDisabled ? "fx-btn-disabled" : ""}`}
                  onClick={() => {
                    if (!isContinueDisabled) {
                      getslot();
                    }
                  }}
                  style={{
                    opacity: isContinueDisabled ? 0.5 : 1,
                    pointerEvents: isContinueDisabled ? "none" : "auto",
                    cursor: isContinueDisabled ? "not-allowed" : "pointer",
                  }}
                >
                  CONTINUE
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
