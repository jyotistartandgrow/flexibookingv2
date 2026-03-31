import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import moment from "moment";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
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
  validatePhoneForCountry,
} from "../Utils/Functions";
import CalendarPage from "./CalendarPage";
import CouponSection from "./CouponSection";

export default function ChooseDate(props) {
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
  const [selectedCountry, setSelectedCountry] = useState({ dialCode: "91" });
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
    let price = "";
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
        price = matchedObj ? decodeHtml(matchedObj.price).split(",")[0] : "";
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

        {props.calendarInfoVisibility === "true" &&
          (props.calendarInfo == "price" ? (
            <div className="fx-calender-price">{price}</div>
          ) : (
            <div
              className="percent-bar"
              style={{ width: `${availabilityPercent}%` }}
            ></div>
          ))}

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
      !validatePhoneForCountry(receiverInfo.phoneNumber, selectedCountry)
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
      {props.stepsVisibility?.step_1_title_visible == "true" && (
        <h1 className="fx-all-main-heading">{props.stepTitles?.step_1_title || "Book your Services"}</h1>
      )}
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
            isVisible == "booking" ? "fx-tabcontent fx-tabcontent-booking selected" : "fx-tabcontent"
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
          <div className="fx-element-box fx-element-box-check-button">
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
            isVisible == "gift" ? "fx-tabcontent fx-tabcontent-gift selected" : "fx-tabcontent"
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
                <div className="fx-phone-input">
                  <PhoneInput
                    country={"in"}
                    value={receiverInfo.phoneNumber}
                    className={errorlist.phoneNumber ? "fx-invalid" : ""}
                    onChange={(phone, country) => {
                      setSelectedCountry(country);
                      dispatch(
                        setReceiverInfo({
                          ...receiverInfo,
                          phoneNumber: phone,
                        }),
                      );
                      const isValid = validatePhoneForCountry(phone, country);
                      if (isValid && errorlist.phoneNumber) {
                        setErrorlist((prev) => ({
                          ...prev,
                          phoneNumber: false,
                        }));
                      }
                    }}
                    onBlur={() => {
                      const isValid = validatePhoneForCountry(
                        receiverInfo.phoneNumber,
                        selectedCountry,
                      );
                      setErrorlist((prev) => ({
                        ...prev,
                        phoneNumber: !isValid,
                      }));
                    }}
                    enableSearch={true}
                    disableDropdown={false}
                    inputStyle={{ width: "100%" }}
                    isValid={(value, country) =>
                      validatePhoneForCountry(value, country)
                    }
                  />
                  {errorlist.phoneNumber && (
                    <span className="fx-errortext">
                      Enter a valid phone number for the selected country
                    </span>
                  )}
                </div>
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
