import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axiosInstance from "../Utils/Interceptor";
import moment from "moment";
import { setDate, setGift, setLoading } from "../store/step1Slice";
import { setService } from "../store/step2Slice";
import { decodeHtml } from "../Utils/Functions";
import Service from "./Service";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const toIso = (year, monthIndex, day) => {
  const month = String(monthIndex + 1).padStart(2, "0");
  const date = String(day).padStart(2, "0");
  return `${year}-${month}-${date}`;
};

const buildWeekdayWeeks = (year, monthIndex) => {
  const lastDate = new Date(year, monthIndex + 1, 0).getDate();
  const weeks = [];
  let week = [null, null, null, null, null, null, null];
  let hasDay = false;

  for (let day = 1; day <= lastDate; day += 1) {
    const jsDay = new Date(year, monthIndex, day).getDay();
    const mondayFirstIndex = (jsDay + 6) % 7;

    week[mondayFirstIndex] = day;
    hasDay = true;

    if (jsDay === 0) {
      weeks.push(week);
      week = [null, null, null, null, null, null, null];
      hasDay = false;
    }
  }

  if (hasDay) weeks.push(week);
  return weeks;
};

const displayPrice = (price) =>
  price === null || price === undefined || price === ""
    ? ""
    : decodeHtml(String(price));

const hasScheduleValue = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") {
    return Object.keys(value).length > 0;
  }
  return value !== null && value !== undefined && value !== "";
};

const isDateBookable = (availability) =>
  Boolean(
    availability &&
    availability.is_bookable !== false &&
    [
      availability.time_slots,
      availability.single_time_slot,
      availability.bundle_time_slots,
    ].some(hasScheduleValue),
  );

const formatSelectedDate = (iso) => {
  const date = new Date(`${iso}T00:00:00`);
  const weekday = date.toLocaleDateString("en-GB", { weekday: "short" });
  const month = date.toLocaleDateString("en-GB", { month: "long" });
  return `${weekday}, ${date.getDate()} ${month} ${date.getFullYear()}`;
};

function InfoIcon() {
  return (
    <svg className="fx-info" viewBox="0 0 14 14" aria-hidden="true">
      <circle cx="7" cy="7" r="6" />
      <path d="M7 6.15V10.1" />
      <circle className="fx-info-dot" cx="7" cy="4.15" r="0.7" />
    </svg>
  );
}

function Chevron({ direction }) {
  const path =
    direction === "left"
      ? "M8.6 2.8 4.4 7l4.2 4.2"
      : direction === "right"
        ? "M5.4 2.8 9.6 7l-4.2 4.2"
        : "M2.8 5.2 7 9.2l4.2-4";

  return (
    <svg viewBox="0 0 14 14" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2.1 6.15 4.7 8.7 9.9 3.35" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="fx-calendar-icon" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2.2" y="3.1" width="11.6" height="10.6" rx="1.6" />
      <path d="M2.2 6.4h11.6M5.1 1.8v2.4M10.9 1.8v2.4" />
    </svg>
  );
}

export default function DateTab(props) {
  const dispatch = useDispatch();
  const storedDate = useSelector((state) => state.step1.date);
  const step = useSelector((state) => state.step1.step);
  const initialDate = moment(storedDate).isValid()
    ? moment(storedDate)
    : moment();
  const [selectedDate, setSelectedDate] = useState(
    moment(storedDate).isValid() ? initialDate.format("YYYY-MM-DD") : "",
  );
  const selectedDateRef = useRef(selectedDate);
  const detailRequestIdRef = useRef(0);
  const [visibleMonth, setVisibleMonth] = useState({
    year: initialDate.year(),
    month: initialDate.month(),
  });
  const [serviceDetails, setServiceDetails] = useState(null);
  const [calendarSlots, setCalendarSlots] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [popupRequest, setPopupRequest] = useState(0);

  const serviceid = String(props.service_id ?? "").trim();

  const weeks = useMemo(
    () => buildWeekdayWeeks(visibleMonth.year, visibleMonth.month),
    [visibleMonth],
  );

  const monthLabel = new Date(
    visibleMonth.year,
    visibleMonth.month,
    1,
  ).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const availabilityByDate = useMemo(
    () =>
      new Map(
        calendarSlots
          .filter((item) => item?.date)
          .map((item) => [moment(item.date).format("YYYY-MM-DD"), item]),
      ),
    [calendarSlots],
  );

  const shiftMonth = (delta) => {
    setVisibleMonth((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  const loadServiceDetails = useCallback(
    async (requestDate) => {
      const requestId = detailRequestIdRef.current + 1;
      detailRequestIdRef.current = requestId;
      setDetailsLoading(true);
      dispatch(setLoading(true));
      setErrorMessage("");
      try {
        const { data } = await axiosInstance.get(
          `/service-details?date=${requestDate}&service_id=${encodeURIComponent(serviceid)}&all=false&is_bundle=false&bundle_id=0`,
        );
        if (requestId !== detailRequestIdRef.current) return;
        if (data?.status == 200 && data?.data && data.data.length !== 0) {
          setServiceDetails(data.data);
          dispatch(setService(data.data.id || serviceid));
        } else {
          setServiceDetails(null);
          setErrorMessage(data?.message || "Unable to load service details.");
        }
      } catch (error) {
        if (requestId !== detailRequestIdRef.current) return;
        setServiceDetails(null);
        setErrorMessage(
          error?.response?.data?.message || "Unable to load service details.",
        );
      } finally {
        if (requestId === detailRequestIdRef.current) {
          setDetailsLoading(false);
          dispatch(setLoading(false));
        }
      }
    },
    [dispatch, serviceid],
  );

  const selectDate = useCallback(
    (nextDate) => {
      selectedDateRef.current = nextDate;
      setSelectedDate(nextDate);
      dispatch(setDate(nextDate));
      if (nextDate) loadServiceDetails(nextDate);
    },
    [dispatch, loadServiceDetails],
  );

  useEffect(() => {
    if (!serviceid) {
      setServiceDetails(null);
      setErrorMessage("A service ID is required to load this calendar.");
      return;
    }

    loadServiceDetails(moment().format("YYYY-MM-DD"));
  }, [loadServiceDetails, serviceid]);

  useEffect(() => {
    if (!serviceid) {
      setCalendarSlots([]);
      return;
    }

    let active = true;
    const month = `${visibleMonth.year}-${String(visibleMonth.month + 1).padStart(2, "0")}`;

    setCalendarLoading(true);
    dispatch(setLoading(true));
    axiosInstance
      .get(
        `/slot-availability-calendar?month=${month}&service_id=${encodeURIComponent(serviceid)}&is_bundle=false&bundle_id=0`,
      )
      .then(({ data }) => {
        if (!active) return;
        const slots = Array.isArray(data?.data) ? data.data : [];
        setCalendarSlots(slots);

        const currentSelectedDate = selectedDateRef.current;
        const selectedIsBookable = slots.some(
          (item) =>
            moment(item?.date).format("YYYY-MM-DD") === currentSelectedDate &&
            isDateBookable(item),
        );
        if (selectedIsBookable) {
          loadServiceDetails(currentSelectedDate);
          return;
        }

        const firstBookable = slots.find(
          (item) =>
            item?.date &&
            isDateBookable(item) &&
            !moment(item.date).isBefore(moment(), "day"),
        );
        selectDate(
          firstBookable ? moment(firstBookable.date).format("YYYY-MM-DD") : "",
        );
      })
      .catch((error) => {
        if (!active) return;
        setCalendarSlots([]);
        setErrorMessage(
          error?.response?.data?.message ||
            "Unable to load calendar availability.",
        );
      })
      .finally(() => {
        if (active) {
          setCalendarLoading(false);
          dispatch(setLoading(false));
        }
      });

    return () => {
      active = false;
    };
  }, [dispatch, loadServiceDetails, selectDate, serviceid, visibleMonth]);

  const selectedAvailability = selectedDate
    ? availabilityByDate.get(selectedDate)
    : null;
  const servicePrice = displayPrice(serviceDetails?.svc_price);
  const selectedPrice = displayPrice(
    selectedAvailability?.price || serviceDetails?.svc_price,
  );
  const currentMonthStart = moment().startOf("month");
  const visibleMonthStart = moment({
    year: visibleMonth.year,
    month: visibleMonth.month,
    date: 1,
  });
  const canGoToPreviousMonth = visibleMonthStart.isAfter(currentMonthStart);

  return (
    <>
      <section
        className="fx-booking-card"
        style={{ display: step === "datestep" ? "block" : "none" }}
      >
        <header className="fx-header">
          <div className="fx-title-row">
            <h2
              className="fx-title"
              style={{ color: serviceDetails?.svc_name_colour || undefined }}
            >
              {serviceDetails?.service_title ||
                (detailsLoading ? "Loading service..." : "Service")}
            </h2>
            <InfoIcon />
            {serviceDetails?.category_name && (
              <span className="fx-variants">
                <span>{serviceDetails.category_name}</span>
              </span>
            )}
            <div className="fx-total-price">{servicePrice || "-"}</div>
          </div>
          <p className="fx-description">
            {serviceDetails
              ? decodeHtml(
                  serviceDetails.svc_long_desc ||
                    serviceDetails.svc_short_desc ||
                    "",
                )
              : errorMessage}
          </p>
        </header>

        <div className="fx-divider" />

        <div className="fx-date-heading">
          <strong>Choose your date</strong>
          <span>Monday – Sunday</span>
        </div>

        <div className="fx-calendar">
          <div className="fx-month-nav">
            <button
              type="button"
              className="fx-nav"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
              disabled={!canGoToPreviousMonth}
            >
              <Chevron direction="left" />
            </button>
            <h3 className="fx-month-label">{monthLabel}</h3>
            <button
              type="button"
              className="fx-nav"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
            >
              <Chevron direction="right" />
            </button>
          </div>

          <div className="fx-weekdays" aria-hidden="true">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="fx-weeks" role="grid" aria-label={monthLabel}>
            {weeks.map((week, weekIndex) => (
              <div
                className="fx-week"
                role="row"
                key={`${visibleMonth.year}-${visibleMonth.month}-${weekIndex}`}
              >
                {week.map((day, column) => {
                  if (!day) {
                    return (
                      <div
                        className="fx-day-empty"
                        key={`${weekIndex}-${column}`}
                      />
                    );
                  }

                  const iso = toIso(visibleMonth.year, visibleMonth.month, day);
                  const availability = availabilityByDate.get(iso);
                  const unavailable =
                    !isDateBookable(availability) ||
                    moment(iso).isBefore(moment(), "day");
                  const selected = iso === selectedDate;
                  const datePrice = displayPrice(
                    availability?.price || serviceDetails?.svc_price,
                  );

                  return (
                    <button
                      key={iso}
                      type="button"
                      role="gridcell"
                      className={[
                        "fx-day",
                        unavailable ? "is-unavailable" : "is-available",
                        selected ? "is-selected" : "",
                      ].join(" ")}
                      aria-pressed={selected}
                      aria-disabled={unavailable}
                      disabled={unavailable}
                      onClick={() => selectDate(iso)}
                    >
                      <span className="fx-day-number">
                        {day}
                        {selected ? <CheckIcon /> : null}
                      </span>
                      <span className="fx-day-price">{datePrice}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {calendarLoading && (
          <p className="fx-calendar-message">Loading availability...</p>
        )}
        {!calendarLoading &&
          !calendarSlots.some(isDateBookable) &&
          serviceid && (
            <p className="fx-calendar-message">
              No dates are available for this month.
            </p>
          )}

        <div className="fx-legend">
          <span className="fx-legend-item">
            <i className="fx-dot fx-dot-available" />
            Available
          </span>
          <span className="fx-legend-item">
            <i className="fx-dot fx-dot-unavailable" />
            Unavailable
          </span>
          <span className="fx-legend-item">
            <i className="fx-selected-mark">
              <CheckIcon />
            </i>
            Selected
          </span>
        </div>

        {selectedDate && (
          <div className="fx-selected">
            <div className="fx-selected-left">
              <CalendarIcon />
              <div className="fx-selected-info">
                <span>Selected date</span>
                <strong>{formatSelectedDate(selectedDate)}</strong>
              </div>
            </div>
            <strong className="fx-selected-price">{selectedPrice}</strong>
          </div>
        )}

        <div className="fx-calendar-actions">
          <button
            type="button"
            className="fx-proceed"
            disabled={!selectedDate || detailsLoading || calendarLoading}
            onClick={() => {
              dispatch(setDate(selectedDate));
              dispatch(setService(serviceDetails?.id || serviceid));
              dispatch(setGift(false));
              setPopupRequest((request) => request + 1);
            }}
          >
            <span>Proceed</span>
            <span className="fx-arrow" aria-hidden="true">
              →
            </span>
          </button>
          <button
            type="button"
            className="fx-gift-action"
            disabled={!selectedDate || detailsLoading || calendarLoading}
            onClick={() => {
              dispatch(setDate(selectedDate));
              dispatch(setService(serviceDetails?.id || serviceid));
              dispatch(setGift(true));
              setPopupRequest((request) => request + 1);
            }}
          >
            Gift
          </button>
        </div>
      </section>
      <Service
        {...props}
        popupOnly
        requestedServiceId={props.service_id}
        openRequest={popupRequest}
      />
    </>
  );
}
