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
  setStripeKey,
} from "../store/step1Slice";
import { usePersistor } from "../store/PersistorContext";
import {
  setCart,
  setCapacity,
  setService,
  setTimeslot,
} from "../store/step2Slice";
import { setBookingkey, setExtra, setExtracapacity } from "../store/step3Slice";
import { sessionClear } from "../store/step4Slice";
import {
  decodeHtml,
  validateEmail,
  validatePhoneForCountry,
} from "../Utils/Functions";
import CalendarPage from "./CalendarPage";
import CouponSection from "./CouponSection";

const DATE_FORMAT = "YYYY-MM-DD";
const toDateString = (value) =>
  value ? moment(value).format(DATE_FORMAT) : "";
const giftDefaultDate = () => moment().add(1, "day").format(DATE_FORMAT);

const showToast = (icon, title) =>
  Swal.fire({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    icon,
    title,
  });

export default function ChooseDate(props) {
  const dispatch = useDispatch();
  const persistor = usePersistor();
  const date = useSelector((state) => state.step1.date);
  const step = useSelector((state) => state.step1.step);
  const gift = useSelector((state) => state.step1.gift);
  const loading = useSelector((state) => state.step1.loading);
  const receiverInfo = useSelector((state) => state.step1.receiverInfo);
  const stripe_key = useSelector((state) => state.step1.stripe_key);
  const [isVisible, setIsVisible] = useState(gift ? "gift" : "booking");
  const [disabledDates, setDisabledDates] = useState([]);
  const [responsearr, setResponsear] = useState([]);
  const [month, setMonth] = useState(moment().format("YYYY-MM"));
  const [errorlist, setErrorlist] = useState({});
  const [selectedCountry, setSelectedCountry] = useState({ dialCode: "91" });

  const handleFlowSwitch = async (type) => {
    if (isVisible === type) return;

    const isGiftFlow = type === "gift";

    // Preserve stripe key so it isn't lost when clearing the session
    const preservedStripeKey = stripe_key;

    // Clear current booking session so flow changes always start clean.
    dispatch({ type: "app/reset" });
    await persistor?.purge();

    // restore small global settings that should survive flow switch
    if (preservedStripeKey) {
      dispatch(setStripeKey(preservedStripeKey));
    }

    dispatch(setGift(isGiftFlow));
    setIsVisible(type);
    setErrorlist({});

    // The reset wiped the date, so pick a fresh default for the new flow.
    if (isGiftFlow) {
      dispatch(setDate(giftDefaultDate()));
    } else {
      getserviceavailabilitycalendar(month, { autoSelect: true });
    }
  };

  // A different date invalidates everything booked after the date step
  // (cart, booking key, checkout session), so drop it.
  const clearBookingProgress = () => {
    dispatch(setCart([]));
    dispatch(setService(null));
    dispatch(setTimeslot(""));
    dispatch(setCapacity(0));
    dispatch(setBookingkey(null));
    dispatch(setExtra(null));
    dispatch(setExtracapacity(0));
    dispatch(sessionClear());
  };

  const handleDateChange = (value) => {
    const nextDate = toDateString(value);
    if (nextDate === toDateString(date)) return;
    clearBookingProgress();
    dispatch(setDate(nextDate));
  };

  useEffect(() => {
    // Only fill in a default date when none exists yet; a date restored from the
    // persisted session (page reload) or picked by the user must be kept.
    if (gift && !date) {
      dispatch(setDate(giftDefaultDate()));
    }
    getserviceavailabilitycalendar(month, {
      autoSelect: !gift && !date && step === "datestep",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          {props.calendarInfoVisibility === "true" &&
            (props.calendarInfo == "price" ? (
              <div className="fx-calender-price">{price}</div>
            ) : (
              <div
                className="percent-bar"
                style={{ width: `${availabilityPercent}%` }}
              ></div>
            ))}
        </div>

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
      showToast("warning", "Please select a date to check availability");
      return;
    }

    dispatch(setLoading(true));
    try {
      const { data } = await axiosInstance(
        `/availability?date=${toDateString(date)}`,
        {
          method: "get",
        },
      );
      if (data?.data?.is_bookable) {
        dispatch(setStep("servicesstep"));
      } else {
        showToast("warning", "There is no service available on selected Date");
      }
    } catch (error) {
      console.error("Unable to check availability.", error);
      showToast(
        "error",
        error?.data?.message ||
          "Unable to check availability, please try again",
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  const viewService = () => {
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

  // autoSelect: pick the month's first bookable date. Only used when there is
  // no date yet, so browsing months or reloading never replaces the user's choice.
  const getserviceavailabilitycalendar = async (
    monthYear,
    { autoSelect = false } = {},
  ) => {
    dispatch(setLoading(true));
    try {
      /* Service availability calendar */
      const { data: dataa } = await axiosInstance(
        `/service-availability-calendar?month=${monthYear}`,
        {
          method: "get",
        },
      );

      const days = Array.isArray(dataa?.data) ? dataa.data : [];
      setResponsear(days);
      const datedarr = [];
      let firstBookable = null;
      days.forEach((dateItem) => {
        // moment parses "YYYY-MM-DD" as local midnight; new Date() would use
        // UTC and shift the day for users west of UTC.
        if (dateItem.is_bookable === false) {
          datedarr.push(moment(dateItem.date).toDate());
        } else if (!firstBookable) {
          firstBookable = toDateString(dateItem.date);
        }
      });
      setDisabledDates(datedarr);
      if (autoSelect && firstBookable) {
        dispatch(setDate(firstBookable));
      }
    } catch (error) {
      console.error("Unable to load the availability calendar.", error);
      showToast("error", "Unable to load availability, please try again");
    } finally {
      dispatch(setLoading(false));
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
      style={{ display: step === "datestep" && !loading ? "block" : "none" }}
    >
      {props.stepsVisibility?.step_1_title_visible == "true" && (
        <h1 className="fx-all-main-heading fx-select-date-heading">
          {props.stepTitles?.step_1_title || "Book your Services"}
        </h1>
      )}
      <div id="fx-tab_nav">
        <ul>
          <li>
            <a
              href="#/"
              className={isVisible == "booking" ? "selected" : ""}
              onClick={() => handleFlowSwitch("booking")}
            >
              Booking
            </a>
          </li>
          <li>
            <a
              href="#/"
              className={isVisible == "gift" ? "selected" : ""}
              onClick={() => handleFlowSwitch("gift")}
            >
              Gift
            </a>
          </li>
        </ul>

        <div
          className={
            isVisible == "booking"
              ? "fx-tabcontent fx-tabcontent-booking selected"
              : "fx-tabcontent"
          }
        >
          <div className="fx-element-box">
            <div className="fx-calendar fx-commoninput">
              <CalendarPage
                value={date}
                onChange={(e) => handleDateChange(e.value)}
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
            isVisible == "gift"
              ? "fx-tabcontent fx-tabcontent-gift selected"
              : "fx-tabcontent"
          }
        >
          <h3>Gift receiver information</h3>
          <div className="fx-giftbox">
            <div className="fx-inputgroup">
              <div className="fx-input-wrapper">
                <input
                  type="text"
                  placeholder="First Name"
                  value={receiverInfo.firstName}
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
                  <span className="fx-errortext">Enter First Name</span>
                )}
              </div>
              <div className="fx-input-wrapper">
                <input
                  type="text"
                  placeholder="Last Name"
                  value={receiverInfo.lastName}
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
                  <span className="fx-errortext">Enter Last Name</span>
                )}
              </div>
            </div>
            <div></div>
            <div className="fx-inputgroup">
              <div className="fx-input-wrapper">
                <input
                  type="email"
                  placeholder="Email"
                  value={receiverInfo.email}
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
                  <span className="fx-errortext">Enter Valid Email</span>
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
                  value={receiverInfo.country}
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
                  <span className="fx-errortext">Enter Country</span>
                )}
              </div>
              <div className="fx-input-wrapper">
                <input
                  type="text"
                  placeholder="Zip"
                  value={receiverInfo.zip}
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
                {errorlist.zip && (
                  <span className="fx-errortext">Enter Zip</span>
                )}
              </div>
            </div>
            <div className="fx-inputgroup fx-hidden">
              <div className="fx-input-wrapper">
                <input
                  type="text"
                  placeholder="Address"
                  value={receiverInfo.address}
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
                  <span className="fx-errortext">Enter Address</span>
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
