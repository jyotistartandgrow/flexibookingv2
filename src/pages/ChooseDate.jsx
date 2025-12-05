import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import calendar from "../assets/calendar.png";
import { Calendar } from "primereact/calendar";
import iconapplied from "../assets/icons8-confirm.svg";
import { Tooltip } from "primereact/tooltip";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import moment from "moment";
import axiosInstance from "../Utils/Interceptor";
import Swal from "sweetalert2";
import {
  setDate,
  setReceiverInfo,
  setStep,
  setCouponlist,
  setLoading,
} from "../store/step1Slice";
import { decodeHtml } from "../Utils/Functions";

export default function ChooseDate() {
  const calendarRef = useRef(null);
  const dispatch = useDispatch();
  const date = useSelector((state) => state.step1.date);
  const step = useSelector((state) => state.step1.step);
  const receiverInfo = useSelector((state) => state.step1.receiverInfo);
  const [isVisible, setIsVisible] = useState("booking");
  const [isVisibleGift, setIsVisibleGift] = useState(false);
  const [disabledDates, setDisabledDates] = useState([]);
  const [responsearr, setResponsear] = useState([]);
  const [coupon, setCoupon] = useState("");
  const [fields, setFields] = useState([{ code: "" }]);
  const [month, setMonth] = useState(moment().format("YYYY-MM"));
  const toggleDiv = (type) => {
    setIsVisible(type);
  };

  useEffect(() => {
    getserviceavailabilitycalendar(month);
  }, [month]);

  const addmoreCoupon = () => {
    setFields([...fields, { code: "" }]);
    setCoupon("");
  };

  const removeCoupon = (key) => {
    const updated = fields.filter((_, i) => i !== key);
    setFields(updated);
    console.log("Updated Coupons:", updated);
    const validCoupons = updated
      .map((f) => f.code.trim())
      .filter((c) => c !== "");
    dispatch(setCouponlist(validCoupons));
  };

  const applycoupon = async (key) => {
    Swal.fire({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      icon: "success",
      title:
        "Coupon Applied! Once you proceed to payment, the discount will be applied.",
    });

    setFields((prev) => {
      // update only one field
      const updated = prev.map((item, i) =>
        i === key ? { ...item, code: coupon } : item
      );

      // compute valid coupons using UPDATED list
      const validCoupons = updated
        .map((f) => f.code.trim())
        .filter((c) => c !== "");

      // dispatch inside the setter
      dispatch(setCouponlist(validCoupons));

      return updated;
    });
  };

  const dateTemplate = (dateMeta) => {
    // dateMeta = { day, month, year, today, selectable, otherMonth }
    let tooltipText = "";
    let availabilityPercent = 0;
    const { day, month, year } = dateMeta;
    let tooltipId = `tooltip-${year}-${month}-${day}`;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    if (
      disabledDates.find(
        (d) =>
          d.getFullYear() === year &&
          d.getMonth() === month &&
          d.getDate() === day
      )
    ) {
      tooltipText = "Date not available";
    } else {
      const matchedObj = responsearr?.find((item) => {
        const itemDate = item?.date
          ? moment(item.date).format("YYYY-MM-DD")
          : null;
        return itemDate === dateStr;
      });

      if (matchedObj) {
        // example: set tooltip based on matched object's properties
        tooltipText =
          matchedObj.total_service +
          " Options \n Starts From " +
          matchedObj.price;
        tooltipText = decodeHtml(tooltipText);
        availabilityPercent = matchedObj.available_service_percentage || 0;
      }
    }

    return (
      <>
        <div
          id={tooltipId}
          className="relative w-full h-full"
          onMouseEnter={(e) => {
            const tooltip =
              e.currentTarget.parentNode.querySelector(".fx-tooltip");
            tooltip?.classList.add("fx-tooltip-visible");
          }}
          onMouseLeave={(e) => {
            const tooltip =
              e.currentTarget.parentNode.querySelector(".fx-tooltip");
            tooltip?.classList.remove("fx-tooltip-visible");
          }}
        >
          <div className="custom-day">{day}</div>
        </div>

        <div
          className="percent-bar"
          style={{ width: `${availabilityPercent}%` }}
        ></div>

        <div className="fx-tooltip">{tooltipText}</div>
      </>
    );
  };

  const checkavailability = async () => {
    if (!date) {
      Swal.fire({
        toast: true,
        position: "top-end", // or 'bottom-end', 'top-start', etc.
        showConfirmButton: false,
        timer: 3000, // auto-close after 3 seconds
        icon: "warning", // 'success', 'error', 'warning', 'info', 'question'
        title: "Please select a date to check availability",
      });
    }

    const { data } = await axiosInstance(
      `/availability?date=${moment(date).format("YYYY-MM-DD")}`,
      {
        method: "get",
      }
    );
    if (data?.data?.is_bookable) {
      dispatch(setStep("servicesstep"));
    }
  };

  const viewService = () => {
    dispatch(setLoading(true));
    console.log("Receiver Info:", receiverInfo);
    if (
      receiverInfo.firstName === "" ||
      receiverInfo.lastName === "" ||
      receiverInfo.email === "" ||
      receiverInfo.phoneNumber === "" ||
      receiverInfo.country === "" ||
      receiverInfo.zip === ""
    ) {
      Swal.fire({
        toast: true,
        position: "top-end", // or 'bottom-end', 'top-start', etc.
        showConfirmButton: false,
        timer: 3000, // auto-close after 3 seconds
        icon: "warning",
        title: "Please fill in all information fields",
      });
      return;
    }
    dispatch(setStep("servicesstep"));
    dispatch(setLoading(false));
  };

  const getserviceavailabilitycalendar = async (monthYear) => {
    dispatch(setLoading(true));
    /* Service availability calendar */
    const { data: dataa } = await axiosInstance(
      `/service-availability-calendar?month=${monthYear}`,
      {
        method: "get",
      }
    );

    if (dataa?.data) {
      setResponsear(dataa?.data);
      if (dataa?.data && disabledDates.length === 0) {
        const datedarr = [];
        dataa?.data.forEach((dateItem) => {
          if (dateItem.is_bookable === false) {
            const dateObj = new Date(dateItem.date);
            datedarr.push(dateObj);
          }
        });
        setDisabledDates(datedarr);
        dispatch(setLoading(false));
      }
    }
  };

  const handleMonthChange = (e) => {
    setMonth(moment(e.year + "-" + e.month).format("YYYY-MM"));
  };

  return (
    <div
      className="fx-leftcontentbox"
      style={{ display: step === "datestep" ? "block" : "none" }}
    >
      <h1>Book your Services</h1>
      <div id="fx-tab_nav">
        <ul>
          <li>
            <a
              href="#/"
              className={isVisible == "booking" ? "selected" : ""}
              onClick={() => toggleDiv("booking")}
            >
              Booking
            </a>
          </li>
          <li>
            <a
              href="#/"
              className={isVisible == "gift" ? "selected" : ""}
              onClick={() => toggleDiv("gift")}
            >
              Gift
            </a>
          </li>
        </ul>

        <div
          className={
            isVisible == "booking" ? "fx-tabcontent selected" : "fx-tabcontent"
          }
        >
          <div className="fx-element-box">
            <div className="fx-calendar fx-commoninput">
              <Calendar
                value={date}
                onChange={(e) => dispatch(setDate(e.value))}
                dateTemplate={dateTemplate}
                className="fx-datepicker"
                minDate={new Date()}
                disabledDates={disabledDates}
                onMonthChange={handleMonthChange}
                ref={calendarRef}
                onClick={() => {
                  // force open
                  calendarRef.current?.show();
                }}
              />
              <img src={calendar} className="fx-calendaricon" />
            </div>
          </div>
          <div className="fx-element-box">
            <input
              type="submit"
              className="btn-primary"
              value="Check Availability"
              onClick={() => checkavailability()}
            />
          </div>
        </div>

        <div
          className={
            isVisible == "gift" ? "fx-tabcontent selected" : "fx-tabcontent"
          }
        >
          <h3>Gift receiver information</h3>
          <div className="fx-giftbox">
            <div className="fx-inputgroup">
              <input
                type="text"
                placeholder="First Name"
                onBlur={(e) =>
                  dispatch(
                    setReceiverInfo({
                      ...receiverInfo,
                      firstName: e.target.value,
                    })
                  )
                }
              />
              <input
                type="text"
                placeholder="Last Name"
                onBlur={(e) =>
                  dispatch(
                    setReceiverInfo({
                      ...receiverInfo,
                      lastName: e.target.value,
                    })
                  )
                }
              />
            </div>
            <div className="fx-inputgroup">
              <div className="fx-input-wrapper">
                <input
                  type="email"
                  placeholder="Email"
                  onBlur={(e) =>
                    dispatch(
                      setReceiverInfo({
                        ...receiverInfo,
                        email: e.target.value,
                      })
                    )
                  }
                />
                <i className="pi pi-envelope"></i>
              </div>
              <div className="fx-input-wrapper">
                <input
                  type="text"
                  placeholder="Phone Number"
                  onBlur={(e) =>
                    dispatch(
                      setReceiverInfo({
                        ...receiverInfo,
                        phoneNumber: e.target.value,
                      })
                    )
                  }
                />
                <i className="pi pi-phone"></i>
              </div>
            </div>
            <div className="fx-inputgroup">
              <div className="fx-input-wrapper">
                <input
                  type="text"
                  placeholder="Country"
                  onBlur={(e) =>
                    dispatch(
                      setReceiverInfo({
                        ...receiverInfo,
                        country: e.target.value,
                      })
                    )
                  }
                />
                <i className="pi pi-flag"></i>
              </div>
              <div className="fx-input-wrapper">
                <input
                  type="text"
                  placeholder="Zip"
                  onBlur={(e) =>
                    dispatch(
                      setReceiverInfo({
                        ...receiverInfo,
                        zip: e.target.value,
                      })
                    )
                  }
                />
              </div>
            </div>
            <div className="fx-inputgroup">
              <div className="fx-input-wrapper">
                <input
                  type="text"
                  placeholder="Address"
                  className="bigtextbox"
                  value={receiverInfo.address}
                  onBlur={(e) =>
                    dispatch(
                      setReceiverInfo({
                        ...receiverInfo,
                        address: e.target.value,
                      })
                    )
                  }
                />
              </div>
            </div>
            <div className="fx-element-box">
              <input
                type="submit"
                className="btn-primary"
                value="View Services"
                onClick={() => viewService()}
              />
            </div>
          </div>
        </div>

        <div className="fx-tabcontent selected">
          <div className="fx-couponcontainer">
            <div className="fx-element-box">
              <input
                type="checkbox"
                id="checkbox-checked"
                checked={isVisibleGift}
                onChange={(e) => setIsVisibleGift(e.target.checked)}
              />
              <label htmlFor="checkbox-checked" className="checkbox-label">
                If you have coupon
              </label>
            </div>
            {isVisibleGift && (
              <div className="fx-commoninput">
                {fields.map((field, index) => (
                  <div className="fx-couponcontainerinputbox" key={index}>
                    <div className="fx-coupon-box">
                      <input
                        type="text"
                        placeholder="Enter your coupon code"
                        value={
                          fields[index].code === ""
                            ? coupon
                            : fields[index].code
                        }
                        onChange={(e) => {
                          if (fields[index].code === "") {
                            setCoupon(e.target.value); // editable BEFORE apply
                          }
                        }}
                        disabled={fields[index].code !== ""} // disable AFTER apply
                      />
                      {fields[index].code === "" && (
                        <button
                          className="fx-apply-btn"
                          onClick={() => applycoupon(index)}
                        >
                          APPLY
                        </button>
                      )}
                      {fields[index].code !== "" && (
                        <button className="fx-apply-btn fx-applied-btn">
                          APPLIED <img src={iconapplied} />
                        </button>
                      )}
                    </div>
                    <div className="fx-delete-coupon">
                      <i
                        className="pi pi-trash"
                        onClick={() => removeCoupon(index)}
                      ></i>
                    </div>
                  </div>
                ))}
                <div className="fx-element-box" onClick={() => addmoreCoupon()}>
                  <p className="fx-addmorelink">Add More</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
