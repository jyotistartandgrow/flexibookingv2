import { useRef } from "react";
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

addLocale("en-monday", {
  firstDayOfWeek: 1, // Monday
});

export default function SelectDate() {
  const calendarRef = useRef(null);
  const dispatch = useDispatch();
  const step = useSelector((state) => state.step1.redeemstep);
  const date = useSelector((state) => state.step1.date);

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
    dispatch(setRedeemStep("slotstep"));
    dispatch(setLoading(false));
  };
  return (
    <div
      className="fx-tabcontent fx-gift-date-box"
      style={{ display: step === "datestep" ? "block" : "none" }}
    >
      <div className="fx-element-box">
        <div className="fx-calendar fx-commoninput">
          <Calendar
            value={date}
            onChange={(e) => dispatch(setDate(e.value))}
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
          <img src={calendar} className="fx-calendaricon" />
        </div>
      </div>
      <div className="fx-element-box">
        <input
          type="submit"
          className="btn-primary"
          value="Continue"
          onClick={() => getslot()}
        />
      </div>
    </div>
  );
}
