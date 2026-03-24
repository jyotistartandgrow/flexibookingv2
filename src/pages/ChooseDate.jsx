import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import moment from "moment";
import axiosInstance from "../Utils/Interceptor";
import Swal from "sweetalert2";
import {
  setDate,
  setReceiverInfo,
  setStep,
  setLoading,
  setGift,
} from "../store/step1Slice";
import {
  decodeHtml,
  validateEmail,
  validatePhoneNumber,
} from "../Utils/Functions";
import CalendarPage from "./CalendarPage";
import CouponSection from "./CouponSection";

export default function ChooseDate() {
  const dispatch = useDispatch();
  const date = useSelector((state) => state.step1.date);
  const step = useSelector((state) => state.step1.step);
  const gift = useSelector((state) => state.step1.gift);
  const receiverInfo = useSelector((state) => state.step1.receiverInfo);
  const [isVisible, setIsVisible] = useState(gift ? "gift" : "booking");
  const [disabledDates, setDisabledDates] = useState([]);
  const [responsearr, setResponsear] = useState([]);
  const [month, setMonth] = useState(moment().format("YYYY-MM"));
  const [errorlist, setErrorlist] = useState({});
  const toggleDiv = (type) => {
    setIsVisible(type);
  };

  useEffect(() => {
    if (gift) {
      dispatch(setDate(moment().add(1, "day")));
    }
    getserviceavailabilitycalendar(month);
  }, [month]);

  const dateTemplate = (dateMeta) => {
    // dateMeta = { day, month, year, today, selectable, otherMonth }
    let tooltipText = "";
    let availabilityPercent = 0;
    const { day, month, year } = dateMeta;
    let tooltipId = `tooltip-${year}-${month}-${day}`;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day,
    ).padStart(2, "0")}`;
    if (
      disabledDates.find(
        (d) =>
          d.getFullYear() === year &&
          d.getMonth() === month &&
          d.getDate() === day,
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
          onTouchStart={(e) => {
            const tooltip =
              e.currentTarget.parentNode.querySelector(".fx-tooltip");
            tooltip?.classList.toggle("fx-tooltip-visible");
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
    if (gift) {
      dispatch(setLoading(true));
      dispatch(setStep("servicesstep"));
      dispatch(setLoading(false));
      return;
    }
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

    dispatch(setLoading(true));
    const { data } = await axiosInstance(
      `/availability?date=${moment(date).format("YYYY-MM-DD")}`,
      {
        method: "get",
      },
    );
    if (data?.data?.is_bookable) {
      dispatch(setStep("servicesstep"));
      dispatch(setLoading(false));
    } else {
      Swal.fire({
        toast: true,
        position: "top-end", // or 'bottom-end', 'top-start', etc.
        showConfirmButton: false,
        timer: 3000, // auto-close after 3 seconds
        icon: "warning", // 'success', 'error', 'warning', 'info', 'question'
        title: "There is no service available on selected Date",
      });
    }
    dispatch(setLoading(false));
  };

  const viewService = () => {
    console.log("Receiver Info:", receiverInfo);

    if (!receiverInfo.firstName) {
      setErrorlist({ firstName: true });
      return;
    }
    if (!receiverInfo.lastName) {
      setErrorlist({ lastName: true });
      return;
    }
    if (!receiverInfo.email) {
      setErrorlist({ email: true });
      return;
    }
    if (
      !receiverInfo.phoneNumber ||
      !validatePhoneNumber(receiverInfo.phoneNumber)
    ) {
      setErrorlist({ phoneNumber: true });
      return;
    }
    // if (!receiverInfo.country) {
    //   setErrorlist({ country: true });
    //   return;
    // }
    // if (!receiverInfo.zip) {
    //   setErrorlist({ zip: true });
    //   return;
    // }
    // if (!receiverInfo.address) {
    //   setErrorlist({ address: true });
    //   return;
    // }

    checkavailability();
  };

  const getserviceavailabilitycalendar = async (monthYear) => {
    dispatch(setLoading(true));
    /* Service availability calendar */
    const { data: dataa } = await axiosInstance(
      `/service-availability-calendar?month=${monthYear}`,
      {
        method: "get",
      },
    );

    if (dataa?.data) {
      setResponsear(dataa?.data);
      if (dataa?.data) {
        const datedarr = [];
        let firstBookable = null;
        dataa?.data.forEach((dateItem) => {
          if (dateItem.is_bookable === false) {
            const dateObj = new Date(dateItem.date);
            datedarr.push(dateObj);
          } else if (!firstBookable) {
            firstBookable = new Date(dateItem.date);
          }
        });
        setDisabledDates(datedarr);
        if (firstBookable && !gift) {
          dispatch(setDate(firstBookable));
        }
        dispatch(setLoading(false));
      }
    }
  };

  const handleMonthChange = (e) => {
    if (e.month < 0) {
      return;
    }
    const month = String(e.month).padStart(2, "0"); // ensure 01–12
    const selectedDate = moment(`${e.year}-${month}`, "YYYY-MM");
    const currentMonth = moment().startOf("month");

    if (!selectedDate.isValid()) {
      return;
    }
    if (selectedDate.isBefore(currentMonth)) {
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        icon: "warning",
        title: "Cannot select past months",
      });
      return;
    }

    setMonth(`${e.year}-${month}`); // YYYY-MM
  };

  return (
    <div
      className="fx-leftcontentbox"
      style={{ display: step === "datestep" ? "block" : "none" }}
    >
      <h1 className="fx-all-main-heading fx-main-page-heading">
        {gift ? "Book your Gift" : "Book your Services"}
      </h1>
      <div id="fx-tab_nav">
        <ul>
          <li>
            <a
              href="#/"
              className={isVisible == "booking" ? "selected" : ""}
              onClick={() => {
                toggleDiv("booking");
                dispatch(setGift(false));
              }}
            >
              Booking
            </a>
          </li>
          <li>
            <a
              href="#/"
              className={isVisible == "gift" ? "selected" : ""}
              onClick={() => {
                dispatch(setGift(true));
                toggleDiv("gift");
              }}
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
              <CalendarPage
                value={date}
                onChange={(e) => dispatch(setDate(e.value))}
                dateTemplate={dateTemplate}
                disabledDates={disabledDates}
                handleMonthChange={handleMonthChange}
              />
              <i className="pi pi-calendar fx-calendaricon"></i>
            </div>
          </div>
          <div className="fx-element-box">
            <input
              type="submit"
              className={!date ? "btn-primary fx-btn-disable" : "btn-primary"}
              value="Check Availability"
              onClick={() => checkavailability()}
              disabled={!date}
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
              <div className="fx-input-wrapper">
                <input
                  type="text"
                  placeholder="First Name"
                  className={
                    errorlist.firstName
                      ? "fx-invalid fx-inputbox-generic"
                      : "fx-inputbox-gift fx-input-firstname-box"
                  }
                  onChange={(e) =>
                    dispatch(
                      setReceiverInfo({
                        ...receiverInfo,
                        firstName: e.target.value,
                      }),
                    )
                  }
                />
                {errorlist.firstName && (
                  <span class="fx-errortext">Enter First Name</span>
                )}
              </div>
              <div className="fx-input-wrapper">
                <input
                  type="text"
                  placeholder="Last Name"
                  className={
                    errorlist.lastName ? "fx-invalid" : "fx-input-lastname-box"
                  }
                  onChange={(e) =>
                    dispatch(
                      setReceiverInfo({
                        ...receiverInfo,
                        lastName: e.target.value,
                      }),
                    )
                  }
                />
                {errorlist.lastName && (
                  <span class="fx-errortext">Enter Last Name</span>
                )}
              </div>
            </div>
            <div></div>
            <div className="fx-inputgroup">
              <div className="fx-input-wrapper">
                <input
                  type="email"
                  placeholder="Email"
                  className={
                    errorlist.email ? "fx-invalid" : "fx-input-email-box"
                  }
                  onChange={(e) =>
                    dispatch(
                      setReceiverInfo({
                        ...receiverInfo,
                        email: e.target.value,
                      }),
                    )
                  }
                  onBlur={(e) => {
                    if (e.target.value && !validateEmail(e.target.value)) {
                      setErrorlist({ ...errorlist, email: true });
                    } else {
                      setErrorlist({ ...errorlist, email: false });
                    }
                  }}
                />
                <i className="pi pi-envelope"></i>
                {errorlist.email && (
                  <span class="fx-errortext">Enter Valid Email</span>
                )}
              </div>
              <div className="fx-input-wrapper">
                <input
                  type="number"
                  placeholder="Phone Number"
                  className={
                    errorlist.phoneNumber ? "fx-input-number fx-invalid" : "fx-input-number"
                  }
                  onChange={(e) =>
                    dispatch(
                      setReceiverInfo({
                        ...receiverInfo,
                        phoneNumber: e.target.value,
                      }),
                    )
                  }
                  onBlur={(e) => {
                    const phone = e.target.value.trim();
                    if (phone && !validatePhoneNumber(phone)) {
                      setErrorlist((prev) => ({ ...prev, phoneNumber: true }));
                    } else {
                      setErrorlist((prev) => ({ ...prev, phoneNumber: false }));
                    }
                  }}
                />
                <i className="pi pi-phone"></i>
                {errorlist.phoneNumber && (
                  <span class="fx-errortext">
                    Enter valid phone number (min 10 digits)
                  </span>
                )}
              </div>
            </div>
            <div className="fx-inputgroup fx-hidden">
              <div className="fx-input-wrapper">
                <input
                  type="text"
                  placeholder="Country"
                  className={errorlist.country ? "fx-invalid" : ""}
                  onChange={(e) =>
                    dispatch(
                      setReceiverInfo({
                        ...receiverInfo,
                        country: e.target.value,
                      }),
                    )
                  }
                />
                <i className="pi pi-flag"></i>
                {errorlist.country && (
                  <span class="fx-errortext">Enter Country</span>
                )}
              </div>
              <div className="fx-input-wrapper">
                <input
                  type="text"
                  placeholder="Zip"
                  className={errorlist.zip ? "fx-invalid" : ""}
                  onChange={(e) =>
                    dispatch(
                      setReceiverInfo({
                        ...receiverInfo,
                        zip: e.target.value,
                      }),
                    )
                  }
                />
                {errorlist.zip && <span class="fx-errortext">Enter Zip</span>}
              </div>
            </div>
            <div className="fx-inputgroup fx-hidden">
              <div className="fx-input-wrapper">
                <input
                  type="text"
                  placeholder="Address"
                  className={
                    errorlist.address ? "fx-invalid bigtextbox" : "bigtextbox"
                  }
                  onChange={(e) =>
                    dispatch(
                      setReceiverInfo({
                        ...receiverInfo,
                        address: e.target.value,
                      }),
                    )
                  }
                />
                {errorlist.address && (
                  <span class="fx-errortext">Enter Address</span>
                )}
              </div>
            </div>
            {(() => {
              const isValid =
                receiverInfo.firstName &&
                receiverInfo.lastName &&
                receiverInfo.email &&
                receiverInfo.phoneNumber &&
                !errorlist.firstName &&
                !errorlist.lastName &&
                !errorlist.email &&
                !errorlist.phoneNumber;
              return (
                <div className="fx-element-box fx-viewservice-button">
                  <input
                    type="submit"
                    className={
                      isValid ? "btn-primary" : "btn-primary fx-btn-disable"
                    }
                    value="View Services"
                    onClick={() => viewService()}
                    disabled={!isValid}
                  />
                </div>
              );
            })()}
          </div>
        </div>

        <CouponSection />
      </div>
    </div>
  );
}
