import { useRef, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Calendar } from "primereact/calendar";
import { addLocale } from "primereact/api";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { ArrowLeft, CalendarDays, Clock, ImageOff } from "lucide-react";
import moment from "moment";
import Swal from "sweetalert2";
import {
  setDate,
  setRedeemStep,
  setLoading,
  setRedeemBooking,
  setStep,
} from "../store/step1Slice";
import { setSlot, setVoucherDetail } from "../store/step3Slice";
import { setTimeslot } from "../store/step2Slice";
import axiosInstance from "../Utils/Interceptor";
import { decodeEntities } from "../Utils/Functions";

addLocale("en-monday", {
  firstDayOfWeek: 1, // Monday
});

function RedeemItemCard({ product, description }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(product.image) && !imageFailed;

  return (
    <article className="fx-redeem-item-card">
      <div className="fx-redeem-item-media">
        {showImage ? (
          <img
            src={product.image}
            alt=""
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="fx-redeem-item-fallback" aria-hidden="true">
            <ImageOff size={22} />
          </span>
        )}
        {product.category_name && (
          <span className="fx-redeem-item-category">
            {product.category_name}
          </span>
        )}
      </div>
      <div className="fx-redeem-item-copy">
        <h3>{product.name}</h3>
        {description && (
          <div
            className="fx-redeem-item-desc"
            dangerouslySetInnerHTML={{
              __html: decodeEntities(description),
            }}
          />
        )}
      </div>
    </article>
  );
}

export default function SelectDate() {
  const calendarRef = useRef(null);
  const dispatch = useDispatch();
  const step = useSelector((state) => state.step1.redeemstep);
  const date = useSelector((state) => state.step1.date);
  const voucher = useSelector((state) => state.step1.voucher);
  const [voucherdetail, setVoucherdetail] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);

  const products = voucherdetail?.products || [];
  const services = products.filter((product) => product.service_id);
  const extras = products.filter(
    (product) => product.id && !product.service_id,
  );
  const slots = voucherdetail?.slots || [];
  const isContinueDisabled = !date || !selectedSlot;

  const slotset = (slot) => {
    setSelectedSlot(slot);
    dispatch(setSlot(slot));
  };

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
      dispatch(setDate(data.data.date));
    }
    dispatch(setLoading(false));
  };

  const getslot = () => {
    dispatch(setLoading(true));
    if (!date) {
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        icon: "warning",
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
    dispatch(setRedeemBooking(false));
    dispatch(setRedeemStep("checkoutstep"));
    dispatch(setLoading(false));
  };

  const bookNewServices = () => {
    if (isContinueDisabled) return;

    dispatch(setTimeslot(selectedSlot));
    dispatch(setStep("servicesstep"));
    dispatch(setRedeemBooking(true));
  };

  return (
    <div
      className="fx-tabcontent fx-gift-date-box"
      style={{ display: step === "datestep" ? "block" : "none" }}
    >
      <div className="redemption-Voucher-services-box">
        <div className="fx-booking-container">
          <div className="fx-content-body">
            <div className="fx-redeem-slot-heading">
              <h1>Select date & time</h1>
              <p>Choose when you’d like to use this voucher.</p>
            </div>

            {services.length > 0 && (
              <section className="fx-section-group">
                <h2 className="fx-section-title">
                  {services.length === 1
                    ? "Included service"
                    : "Included services"}
                </h2>
                {services.map((product, index) => (
                  <RedeemItemCard
                    key={product.service_id || index}
                    product={product}
                    description={product.service_desc}
                  />
                ))}
              </section>
            )}

            {extras.length > 0 && (
              <section className="fx-section-group">
                <h2 className="fx-section-title">
                  {extras.length === 1 ? "Extra" : "Extras"}
                </h2>
                {extras.map((product, index) => (
                  <RedeemItemCard
                    key={product.id || index}
                    product={product}
                    description={product.service_desc}
                  />
                ))}
              </section>
            )}

            <section className="fx-scheduling-panel">
              <div className="fx-date-picker-group">
                <label className="fx-label" htmlFor="redeem-slot-date">
                  Date
                </label>
                <div className="fx-input-with-icon">
                  <Calendar
                    inputId="redeem-slot-date"
                    value={
                      moment(voucherdetail?.date).isValid()
                        ? moment(voucherdetail?.date).toDate()
                        : null
                    }
                    onChange={(e) => {
                      setSelectedSlot(null);
                      dispatch(setSlot(null));
                      dispatch(setDate(e.value));
                    }}
                    className="fx-datepicker"
                    minDate={new Date()}
                    ref={calendarRef}
                    onClick={() => {
                      calendarRef.current?.show();
                    }}
                    locale="en-monday"
                    dateFormat="dd/mm/yy"
                  />
                  <span className="fx-icon" aria-hidden="true">
                    <CalendarDays size={18} />
                  </span>
                </div>
              </div>

              <div className="fx-slot-block">
                {slots.length > 0 ? (
                  <p className="fx-availability-note">
                    Available times for{" "}
                    <strong>
                      {moment(voucherdetail?.date).format("dddd, MMM D")}
                    </strong>
                  </p>
                ) : (
                  <p className="fx-availability-note fx-availability-empty">
                    No times available for this date. Try another day.
                  </p>
                )}

                {slots.length > 0 && (
                  <div
                    className="fx-time-selector-grid"
                    role="radiogroup"
                    aria-label="Available times"
                  >
                    {slots.map((slot, index) => {
                      const isSelected = slot == selectedSlot;
                      const [start, end] = slot.split(" - ");

                      return (
                        <button
                          type="button"
                          key={`${slot}-${index}`}
                          className={`fx-time-btn ${isSelected ? "fx-selected" : ""}`}
                          onClick={() => slotset(slot)}
                          role="radio"
                          aria-checked={isSelected}
                        >
                          <Clock size={16} aria-hidden="true" />
                          <span>
                            {start} – {end}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            <div className="fx-footer-actions">
              <button
                type="button"
                className="fx-btn-back"
                onClick={() => dispatch(setRedeemStep("codestep"))}
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Back
              </button>
              <div className="fx-footer-primary-actions">
                <button
                  type="button"
                  className={`fx-btn-secondary ${isContinueDisabled ? "fx-btn-disable" : ""}`}
                  onClick={bookNewServices}
                  disabled={isContinueDisabled}
                >
                  Add more services
                </button>
                <button
                  type="button"
                  className={`btn-primary btn-primary-countinu ${isContinueDisabled ? "fx-btn-disable" : ""}`}
                  onClick={() => {
                    if (!isContinueDisabled) {
                      getslot();
                    }
                  }}
                  disabled={isContinueDisabled}
                >
                  Continue to checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
