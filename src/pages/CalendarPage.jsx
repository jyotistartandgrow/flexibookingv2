import React, { useState, useEffect, useRef } from "react";
import { Calendar } from "primereact/calendar";
import { Sidebar } from "primereact/sidebar";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import { addLocale } from "primereact/api";
import useDeviceType from "../Utils/useDeviceType";

addLocale("en-monday", {
  firstDayOfWeek: 1, // Monday
});

const CalendarPage = ({
  value,
  onChange,
  dateTemplate,
  disabledDates = [],
  handleMonthChange,
  className = "fx-datepicker",
  locale = "en-monday",
  dateFormat = "dd/mm/yy",
  minDate = new Date(),
  inline = false,
  ...otherProps
}) => {
  const isDesktop = useDeviceType();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value);
    return new Date();
  });
  const calendarRef = useRef(null);

  // Function to disable/enable prev button
  const updatePrevButton = (date) => {
    if (!date) return;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const viewMonth = date.getMonth();
    const viewYear = date.getFullYear();

    const isCurrentOrPastMonth =
      viewYear < currentYear ||
      (viewYear === currentYear && viewMonth <= currentMonth);

    setTimeout(() => {
      const prevButton = document.querySelector(".p-datepicker-prev");
      if (prevButton) {
        if (isCurrentOrPastMonth) {
          prevButton.style.setProperty("pointer-events", "none", "important");
          prevButton.style.setProperty("opacity", "0.4", "important");
          prevButton.style.setProperty("cursor", "not-allowed", "important");
          prevButton.setAttribute("disabled", "true");
        } else {
          prevButton.style.removeProperty("pointer-events");
          prevButton.style.removeProperty("opacity");
          prevButton.style.removeProperty("cursor");
          prevButton.removeAttribute("disabled");
        }
      }
    }, 0);
  };

  const handleViewDateChange = (e) => {
    if (e && e.value) {
      setViewDate(e.value);
      updatePrevButton(e.value);

      // Call the passed handleMonthChange if provided
      // Pass month and year for data fetching
      if (handleMonthChange) {
        const month = e.value.getMonth(); // 0-11 (for array indexing)
        const monthNumber = month + 1; // 1-12 (for display/API)
        const year = e.value.getFullYear();

        console.log({ month, monthNumber, year, value: e.value });
        handleMonthChange({
          month: monthNumber,
          year: year,
          value: e.value,
        });
      }
    }
  };

  // Check when calendar becomes visible
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const datepicker = document.querySelector(".p-datepicker");
      if (datepicker && datepicker.style.display !== "none") {
        updatePrevButton(viewDate);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    return () => observer.disconnect();
  }, [viewDate]);

  // Update viewDate when value prop changes
  useEffect(() => {
    if (value) {
      setViewDate(new Date(value));
    }
  }, [value]);

  const formattedValue = value
    ? new Date(value).toLocaleDateString("en-GB").replace(/\//g, "/")
    : "";

  const sharedCalendarProps = {
    dateTemplate,
    minDate,
    disabledDates,
    onMonthChange: handleViewDateChange,
    onViewDateChange: handleViewDateChange,
    viewDate,
    locale,
    dateFormat,
    ...otherProps,
  };

  if (!isDesktop && !inline) {
    return (
      <>
        <input
          type="text"
          readOnly
          value={formattedValue}
          placeholder="dd/mm/yyyy"
          className={className}
          onClick={() => setSidebarVisible(true)}
          style={{ cursor: "pointer", width: "100%" }}
        />
        <Sidebar
          visible={sidebarVisible}
          onHide={() => setSidebarVisible(false)}
          position="bottom"
          className="fx-calendar-sidebar"
          style={{ height: "auto" }}
        >
          <Calendar
            value={value ? new Date(value) : null}
            onChange={(e) => {
              onChange(e);
              setSidebarVisible(false);
            }}
            className="fx-datepicker-step1"
            inline
            {...sharedCalendarProps}
          />
        </Sidebar>
      </>
    );
  }

  return (
    <Calendar
      value={value ? new Date(value) : null}
      onChange={onChange}
      dateTemplate={dateTemplate}
      className={className}
      minDate={minDate}
      disabledDates={disabledDates}
      onMonthChange={handleViewDateChange}
      onViewDateChange={handleViewDateChange}
      onShow={() => updatePrevButton(viewDate)}
      onVisible={() => updatePrevButton(viewDate)}
      viewDate={viewDate}
      ref={calendarRef}
      onClick={() => {
        calendarRef.current?.show();
        setTimeout(() => updatePrevButton(viewDate), 10);
      }}
      locale={locale}
      dateFormat={dateFormat}
      inline={inline}
      {...otherProps}
    />
  );
};

export default CalendarPage;
