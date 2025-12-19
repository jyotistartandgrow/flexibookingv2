import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { Carousel } from "primereact/carousel";
import { addLocale } from "primereact/api";
import calendar from "../assets/simple-line-icons_calender.svg";
import percentage from "../assets/ic_round-discount.svg";
import percentthirty from "../assets/icons8-clock 9.svg";
import percentsixty from "../assets/icons8-clock 8.svg";
import percentninty from "../assets/icons8-clock 7.svg";
import axiosInstance from "../Utils/Interceptor";
import moment from "moment";
import { decodeHtml } from "../Utils/Functions";
import { Dialog } from "primereact/dialog";
import { Calendar } from "primereact/calendar";
import { Tooltip } from "primereact/tooltip";
import { OverlayPanel } from "primereact/overlaypanel";
import { setDate, setStep, setLoading } from "../store/step1Slice";
import {
  setTimeslot,
  setCapacity,
  setService,
  setCart,
} from "../store/step2Slice";
import Swal from "sweetalert2";

addLocale("en-monday", {
  firstDayOfWeek: 1, // Monday
});

export default function Service() {
  const dispatch = useDispatch();
  const op = useRef(null);

  const date = useSelector((state) => state.step1.date);
  const step = useSelector((state) => state.step1.step);
  const category = useSelector((state) => state.step1.category);
  const [products, setProductsArr] = useState([]);
  const [visible, setVisible] = useState(false);
  const [productDetails, setProductDetails] = useState({});
  const [dateslot, setDateslot] = useState([]);
  const [isVisible, setIsVisible] = useState("grid");
  const [slotVisible, setSlotVisible] = useState("morning");
  const [disabledDates, setDisabledDates] = useState([]);
  const [calendarslots, setCalendarslots] = useState([]);
  const [serviceid, setServiceId] = useState(null);
  const [book, setBook] = useState(0);
  const [slot, setSlot] = useState("");
  const [readmorecl, setReadmorecl] = useState(false);
  const [skeloading, setLoadingske] = useState(false);
  const [currentitem, setCurrentItem] = useState({});
  const prevDate = useRef(date);

  const toggleDiv = (type) => {
    setIsVisible(type);
  };

  // Reset service id on step change
  useEffect(() => {
    setServiceId(null);
  }, [step]);

  useEffect(() => {
    if (step !== "servicesstep") return;

    if (!date) {
      dispatch(setDate(moment().format("YYYY-MM-DD")));
    }
    if (date) {
      if (date !== prevDate.current) {
        setBook(0);
        setSlot("");
        console.log("Selected date in Service component:", date);
        fetchProductsByDate(date);
      }
      if (serviceid) {
        dispatch(setLoading(true));
        servicedetail(serviceid);
      }
      prevDate.current = date;
    }
  }, [date, step, serviceid]);

  const fetchProductsByDate = async (selectedDate) => {
    setLoadingske(true);
    const { data } = await axiosInstance(
      `/services?date=${moment(selectedDate).format(
        "YYYY-MM-DD"
      )}&category=${category}`,
      {
        method: "get",
      }
    );
    if (data && data.status == 200 && data.total_services > 0) {
      setProductsArr(data.data);
      setLoadingske(false);
    }
  };

  const servicedetail = async (id) => {
    dispatch(setLoading(true));
    setServiceId(id);
    const { data } = await axiosInstance(
      `/service-details?date=${moment(date).format(
        "YYYY-MM-DD"
      )}&service_id=${id}`,
      {
        method: "get",
      }
    );

    if (data && data.status == 200) {
      if (data.data.length == 0) {
        Swal.fire({
          toast: true,
          position: "top-end", // or 'bottom-end', 'top-start', etc.
          showConfirmButton: false,
          timer: 3000, // auto-close after 3 seconds
          icon: "warning", // 'success', 'error', 'warning', 'info', 'question'
          title: data?.message,
        });
        dispatch(setLoading(false));
        return;
      }
      setProductDetails(data?.data);
      setVisible(true);

      if (data?.data?.date_slots) {
        setDateslot(data?.data?.date_slots);
      }

      const monthYear = moment().format("YYYY-MM");
      getslotavailabilitycalendar(monthYear, id);
    }
  };

  const getslotavailabilitycalendar = async (monthYear, id) => {
    /* Slot availability calendar */
    const { data: dataa } = await axiosInstance(
      `/slot-availability-calendar?month=${monthYear}&service_id=${id}`,
      {
        method: "get",
      }
    );

    if (dataa?.data) {
      const datedarr = [];
      setCalendarslots(dataa?.data);
      dataa?.data.forEach((dateItem) => {
        if (dateItem.is_bookable === false) {
          const dateObj = new Date(dateItem.date);
          datedarr.push(dateObj);
        }
      });
      setDisabledDates(datedarr);
      dispatch(setLoading(false));
    }
  };

  const handleMonthChange = (e) => {
    dispatch(setLoading(true));
    const month = String(e.month).padStart(2, "0"); // ensure 01–12
    getslotavailabilitycalendar(`${e.year}-${month}`, serviceid);
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
      const matchedObj = calendarslots?.find((item) => {
        const itemDate = item?.date
          ? moment(item.date).format("YYYY-MM-DD")
          : null;
        return itemDate === dateStr;
      });

      if (matchedObj) {
        // example: set tooltip based on matched object's properties
        if (matchedObj.single_time_slot) {
          tooltipText = `1 Slot, (${matchedObj.total_capacity_left}) Capacity`;
        } else if (matchedObj.time_slots) {
          tooltipText = `${matchedObj.time_slots.length} Slots, (${matchedObj.total_capacity_left}) Capacity`;
        } else {
          tooltipText = `0 Slot`;
        }
        tooltipText = `${tooltipText}`;
        availabilityPercent = matchedObj.capacity_left_percentage;
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

  const getslotbydate = async (date) => {
    dispatch(setDate(date));
  };

  // Template for each carousel item
  const productTemplate = (product) => {
    return (
      <div className="fx-servicebox">
        <div className="fx-servicepicbox">
          <img src={product.svc_img} alt={product.service_name} />
          <span className="fx-servicepiccontentbox">
            {product.service_name}
          </span>
        </div>
        <div className="fx-servicecontentbox">
          <h4>{product.service_name}</h4>
          <p>{decodeHtml(product.svc_short_desc)}</p>
          <p className="price">
            from <span>{decodeHtml(product.svc_price)}</span>
          </p>
          <div className="booknowbtn">
            <a href="#" onClick={() => servicedetail(product.id)}>
              Book Now
            </a>
          </div>
        </div>
      </div>
    );
  };

  const slotbook = (type, itemm) => {
    setCurrentItem(itemm);
    const currentslot = slot;
    let currentbook = book;
    setSlot(itemm.time_slot);
    if (currentslot != itemm.time_slot) {
      currentbook = 0;
      setBook(0);
    }

    if (type == "add") {
      if (currentbook >= itemm.capacity_left) {
        Swal.fire({
          toast: true,
          position: "top-end", // or 'bottom-end', 'top-start', etc.
          showConfirmButton: false,
          timer: 3000, // auto-close after 3 seconds
          icon: "warning", // 'success', 'error', 'warning', 'info', 'question'
          title: "Maximum capacity reached",
        });
        return;
      }
      setBook(parseInt(currentbook) + parseInt(1));
    } else if (type == "minus") {
      let count = parseInt(currentbook) - parseInt(1);
      if (count >= 0) {
        setBook(count);
      }
    }
  };

  const bookservice = async () => {
    if (book == 0 || !slot) {
      Swal.fire({
        toast: true,
        position: "top-end", // or 'bottom-end', 'top-start', etc.
        showConfirmButton: false,
        timer: 3000, // auto-close after 3 seconds
        icon: "warning", // 'success', 'error', 'warning', 'info', 'question'
        title: "Please choose slot and capacity",
      });
      return;
    }

    if (book < currentitem.min_capacity) {
      Swal.fire({
        toast: true,
        position: "top-end", // or 'bottom-end', 'top-start', etc.
        showConfirmButton: false,
        timer: 3000, // auto-close after 3 seconds
        icon: "warning", // 'success', 'error', 'warning', 'info', 'question'
        title: "Minimum capacity to book is " + currentitem.min_capacity,
      });
      return;
    }

    dispatch(setLoading(true));
    const { data } = await axiosInstance(
      `/price-format?service_id=${
        productDetails.id
      }&capacity=${book}&date=${moment(date).format("YYYY-MM-DD")}`,
      {
        method: "get",
      }
    );
    let cartobj = {
      id: productDetails.id,
      name: productDetails.service_name,
      price: productDetails.svc_price,
      total: data?.data?.service_total,
      total_formatted: data?.data?.service_total,
      slot: slot,
      capacity: book,
    };
    dispatch(
      setCart({
        service: [cartobj],
        total: data?.data?.total,
        total_formatted: data?.data?.total_formated,
        discount: 0,
        subtotal: data?.data?.total_formated,
      })
    );
    dispatch(setTimeslot(slot));
    dispatch(setCapacity(book));
    dispatch(setService(serviceid));
    setVisible(false);
    dispatch(setStep("extrastep"));
    dispatch(setLoading(false));
  };

  const slotObj = dateslot.find((s) =>
    moment(moment(date).format("YYYY-MM-DD")).isSame(s.date)
  );
  return (
    <div
      className="fx-leftcontentbox"
      style={{ display: step === "servicesstep" ? "block" : "none" }}
    >
      <h1 className="fx-main-heading">What experience are you looking for?</h1>
      <div id="fx-Icontab_nav">
        <ul>
          <li className="selected">
            <a
              href="#"
              className={isVisible == "grid" ? "selected" : ""}
              onClick={() => toggleDiv("grid")}
            >
              <i className="pi pi-th-large"></i>
            </a>
          </li>
          <li>
            <a
              href="#"
              className={isVisible == "list" ? "selected" : ""}
              onClick={() => toggleDiv("list")}
            >
              <i className="pi pi-list"></i>
            </a>
          </li>
          <li>
            <a
              href="#"
              className={isVisible == "slider" ? "selected" : ""}
              onClick={() => toggleDiv("slider")}
            >
              <i className="pi pi-sliders-h"></i>
            </a>
          </li>
        </ul>
        <div className={`fx-skeleton-row ${skeloading ? "show" : "hide"}`}>
          <div className="fx-card-skeleton">
            <div className="fx-sk-img"></div>
            <div className="fx-sk-tag"></div>
            <div className="fx-sk-title"></div>
            <div className="fx-sk-text"></div>
            <div className="fx-sk-text short"></div>
            <div className="fx-sk-price"></div>
            <div className="fx-sk-button"></div>
          </div>

          <div className="fx-card-skeleton">
            <div className="fx-sk-img"></div>
            <div className="fx-sk-tag"></div>
            <div className="fx-sk-title"></div>
            <div className="fx-sk-text"></div>
            <div className="fx-sk-text short"></div>
            <div className="fx-sk-price"></div>
            <div className="fx-sk-button"></div>
          </div>

          <div className="fx-card-skeleton">
            <div className="fx-sk-img"></div>
            <div className="fx-sk-tag"></div>
            <div className="fx-sk-title"></div>
            <div className="fx-sk-text"></div>
            <div className="fx-sk-text short"></div>
            <div className="fx-sk-price"></div>
            <div className="fx-sk-button"></div>
          </div>

          <div className="fx-card-skeleton">
            <div className="fx-sk-img"></div>
            <div className="fx-sk-tag"></div>
            <div className="fx-sk-title"></div>
            <div className="fx-sk-text"></div>
            <div className="fx-sk-text short"></div>
            <div className="fx-sk-price"></div>
            <div className="fx-sk-button"></div>
          </div>
        </div>
        <div
          className={`fx-no-data ${
            !skeloading && products.length == 0 ? "show" : "hide"
          }`}
        >
          No services found
        </div>

        <div
          className={
            isVisible == "grid" ? "fx-tabcontent selected" : "fx-tabcontent"
          }
        >
          <div className="fx-servicecontainer">
            {products.length > 0 &&
              products.map((product, p1) => {
                return (
                  <div className="fx-servicebox" key={p1}>
                    <div className="fx-servicepicbox">
                      <img src={product.svc_img} alt={product.service_name} />
                      <span className="fx-servicepiccontentbox">
                        {product.service_name}
                      </span>
                    </div>
                    <div className="fx-servicecontentbox">
                      <h4>{product.service_name}</h4>
                      <p>{product.svc_short_desc}</p>
                      <p className="price">
                        from <span>{decodeHtml(product.svc_price)}</span>
                      </p>
                      <div className="booknowbtn">
                        <a href="#" onClick={() => servicedetail(product.id)}>
                          Book Now
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
        <div
          className={
            isVisible == "list" ? "fx-tabcontent selected" : "fx-tabcontent"
          }
        >
          {products.length > 0 &&
            products.map((product, p2) => {
              return (
                <div className="fx-serviceboxlist" key={p2}>
                  <div className="fx-servicepicboxlist">
                    <img src={product.svc_img} alt={product.service_name} />
                    <span className="fx-servicepiccontentbox">
                      {product.service_name}
                    </span>
                  </div>
                  <div className="fx-servicecontentboxlist">
                    <h4>{product.service_name}</h4>
                    <p>{product.svc_short_desc}</p>
                    <p className="price">
                      from <span>{decodeHtml(product.svc_price)}</span>
                    </p>
                    <span
                      className="booknowbtn"
                      onClick={() => servicedetail(product.id)}
                    >
                      Book Now
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
        <div
          className={
            isVisible == "slider" ? "fx-tabcontent selected" : "fx-tabcontent"
          }
        >
          <div className="slider responsive">
            <Carousel
              value={products}
              itemTemplate={productTemplate}
              numVisible={4}
              numScroll={3}
              circular
              autoplayInterval={3000}
            />
          </div>
        </div>
        <Dialog
          visible={visible}
          onHide={() => {
            if (!visible) return;
            setVisible(false);
          }}
          maximizable
          // style={{ width: "50vw" }}
          // breakpoints={{ "960px": "75vw", "641px": "100vw" }}
          className="fx-booking fx-main-modal-box"
        >
          <div
            className="fx-overlay"
            style={{
              opacity: visible ? 1 : 0,
              visibility: visible ? "visible" : "hidden",
            }}
          >
            <div className="fx-popup">
              <div className="fx-leftpopup">
                {productDetails.svc_img && (
                  <img
                    src={productDetails.svc_img}
                    alt={productDetails.service_name}
                  />
                )}
                <span className="fx-servicepiccontentbox">
                  {productDetails.service_name}
                </span>
                <p className="fx-pricebox">
                  {decodeHtml(productDetails.svc_price)}
                </p>
              </div>
              <div className="fx-rightpopup">
                <h4>{productDetails.service_name}</h4>
                <a className="close" href="#" onClick={() => setVisible(false)}>
                  &times;
                </a>

                <p>
                  <span
                    className={readmorecl ? "fx-expand-readmore" : "fx-des"}
                  >
                    {decodeHtml(productDetails.svc_long_desc)}
                  </span>
                  <span
                    className="readmore"
                    onClick={() => setReadmorecl(!readmorecl)}
                  >
                    {readmorecl ? "Read Less" : "Read More"}
                  </span>
                </p>
                <p className="datetext">{moment(date).format("MMM YYYY")}</p>
                <div className="calendarboxbar">
                  {dateslot &&
                    dateslot.map((slot, k) => (
                      <div
                        key={k}
                        className={
                          moment(moment(date).format("YYYY-MM-DD")).isSame(
                            slot.date
                          )
                            ? "calendarbox active"
                            : "calendarbox"
                        }
                        onClick={() => getslotbydate(slot.date)}
                      >
                        {moment(slot.date).format("ddd")}
                        <br />
                        <span>{moment(slot.date).format("DD")}</span>
                        <hr />
                      </div>
                    ))}
                  <div className="calendarbox">
                    <img
                      src={calendar}
                      alt="Open Calendar"
                      id="fx-openCalendar"
                      onClick={(e) => op.current.toggle(e)}
                    />
                    <div id="fx-calendarContainer">
                      <OverlayPanel ref={op}>
                        <Calendar
                          inline
                          value={date}
                          onChange={(e) => {
                            dispatch(setDate(e.value));
                            op.current.toggle(e);
                          }}
                          dateTemplate={dateTemplate}
                          className="fx-datepicker"
                          minDate={new Date()}
                          disabledDates={disabledDates}
                          onMonthChange={handleMonthChange}
                          dateFormat="dd/mm/yy"
                          locale="en-monday"
                        />
                      </OverlayPanel>
                    </div>
                  </div>
                </div>

                <div id="fx-modaltab_nav">
                  {!slotObj?.slots.single_time_slot.slot_type && (
                    <>
                      <ul>
                        <li
                          className={slotVisible == "morning" ? "selected" : ""}
                        >
                          <a
                            href="#"
                            className={
                              slotVisible == "morning" ? "selected" : ""
                            }
                            onClick={() => setSlotVisible("morning")}
                          >
                            Morning
                          </a>
                        </li>
                        <li
                          className={
                            slotVisible == "afternoon" ? "selected" : ""
                          }
                        >
                          <a
                            href="#"
                            className={
                              slotVisible == "afternoon" ? "selected" : ""
                            }
                            onClick={() => setSlotVisible("afternoon")}
                          >
                            Afternoon
                          </a>
                        </li>
                        <li className={slotVisible == "all" ? "selected" : ""}>
                          <a
                            href="#"
                            className={slotVisible == "all" ? "selected" : ""}
                            onClick={() => setSlotVisible("all")}
                          >
                            All
                          </a>
                        </li>
                      </ul>

                      <div
                        className={
                          slotVisible == "morning"
                            ? "fx-tabcontent selected"
                            : "fx-tabcontent"
                        }
                      >
                        <h5>Choose the time</h5>
                        <div className="fx-timelistboxbar">
                          {(() => {
                            const slotItems = slotObj?.slots?.morning || [];

                            if (!slotObj || slotItems.length === 0) {
                              return (
                                <div className="fx-timelistbox">
                                  No slots available
                                </div>
                              );
                            }

                            return slotItems.map((item, idx) => (
                              <div
                                className={
                                  slot == item.time_slot && book > 0
                                    ? "fx-timelistbox fx-slotbox-active"
                                    : "fx-timelistbox"
                                }
                                key={idx}
                              >
                                <div className="fx-timeslotsection">
                                  <div className="time">{item.time_slot}</div>
                                  <img
                                    className="fx-offericon"
                                    src={percentage}
                                  />
                                  {(() => {
                                    let percentIcon = null;
                                    if (
                                      item.capacity_left_percent > 0 &&
                                      item.capacity_left_percent <= 30
                                    ) {
                                      percentIcon = percentthirty;
                                    } else if (
                                      item.capacity_left_percent > 30 &&
                                      item.capacity_left_percent <= 60
                                    ) {
                                      percentIcon = percentsixty;
                                    } else if (
                                      item.capacity_left_percent > 60
                                    ) {
                                      percentIcon = percentninty;
                                    }
                                    return (
                                      <div
                                        className="fx-slotquantity"
                                        style={{
                                          ...(percentIcon && {
                                            backgroundImage: `url("${percentIcon}")`,
                                          }),
                                          backgroundSize: "cover",
                                        }}
                                      >
                                        {item.capacity_left}
                                      </div>
                                    );
                                  })()}
                                </div>

                                <div className="fx-common">
                                  <div className="fx-quantitybox">
                                    {item.slot_type == "active" && (
                                      <>
                                        <button
                                          type="button"
                                          className="decrement"
                                          onClick={() =>
                                            slotbook("minus", item)
                                          }
                                        >
                                          -
                                        </button>
                                        <input
                                          type="number"
                                          value={
                                            slot == item.time_slot ? book : 0
                                          }
                                          defaultValue={0}
                                          min={0}
                                          max={item.capacity_left}
                                        />
                                        <button
                                          type="button"
                                          className="increment"
                                          onClick={() => slotbook("add", item)}
                                        >
                                          +
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                        <div
                          className={
                            slotVisible == "morning" && book > 0
                              ? "continuebtn"
                              : "continuebtn fx-disable-button"
                          }
                          onClick={() =>
                            slotVisible == "morning" && book > 0
                              ? bookservice()
                              : ""
                          }
                        >
                          Continue
                        </div>
                      </div>
                      <div
                        className={
                          slotVisible == "afternoon"
                            ? "fx-tabcontent selected"
                            : "fx-tabcontent"
                        }
                      >
                        <h5>Choose the time</h5>
                        <div className="fx-timelistboxbar">
                          {(() => {
                            const slotAfItems = slotObj?.slots?.afternoon || [];

                            if (!slotObj || slotAfItems.length === 0) {
                              return (
                                <div className="fx-timelistbox">
                                  No slots available
                                </div>
                              );
                            }

                            return slotAfItems.map((item, idx) => (
                              <div
                                className={
                                  slot == item.time_slot && book > 0
                                    ? "fx-timelistbox fx-slotbox-active"
                                    : "fx-timelistbox"
                                }
                                key={"af=" + idx}
                              >
                                <div className="fx-timeslotsection">
                                  <div className="time">{item.time_slot}</div>
                                  <img
                                    className="fx-offericon"
                                    src={percentage}
                                  />
                                  {(() => {
                                    let percentIcon = null;
                                    if (
                                      item.capacity_left_percent > 0 &&
                                      item.capacity_left_percent <= 30
                                    ) {
                                      percentIcon = percentthirty;
                                    } else if (
                                      item.capacity_left_percent > 30 &&
                                      item.capacity_left_percent <= 60
                                    ) {
                                      percentIcon = percentsixty;
                                    } else if (
                                      item.capacity_left_percent > 60
                                    ) {
                                      percentIcon = percentninty;
                                    }
                                    return (
                                      <div
                                        className="fx-slotquantity"
                                        style={{
                                          ...(percentIcon && {
                                            backgroundImage: `url("${percentIcon}")`,
                                          }),
                                          backgroundSize: "cover",
                                        }}
                                      >
                                        {item.capacity_left}
                                      </div>
                                    );
                                  })()}
                                </div>

                                <div className="fx-common">
                                  <div className="fx-quantitybox">
                                    {item.slot_type == "active" && (
                                      <>
                                        <button
                                          type="button"
                                          className="decrement"
                                          onClick={() =>
                                            slotbook("minus", item)
                                          }
                                        >
                                          -
                                        </button>

                                        <input
                                          type="number"
                                          min={0}
                                          max={item.capacity_left}
                                          value={
                                            slot === item.time_slot ? book : 0
                                          }
                                        />

                                        <button
                                          type="button"
                                          className="increment"
                                          onClick={() => slotbook("add", item)}
                                        >
                                          +
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                        <div
                          className={
                            slotVisible == "afternoon" && book > 0
                              ? "continuebtn"
                              : "continuebtn fx-disable-button"
                          }
                          onClick={() =>
                            slotVisible == "afternoon" && book > 0
                              ? bookservice()
                              : ""
                          }
                        >
                          Continue
                        </div>
                      </div>
                    </>
                  )}
                  <div
                    className={
                      slotVisible == "all" ||
                      dateslot.find((s) =>
                        moment(moment(date).format("YYYY-MM-DD")).isSame(s.date)
                      )?.slots.single_time_slot.slot_type
                        ? "fx-tabcontent selected"
                        : "fx-tabcontent"
                    }
                  >
                    <h5>Choose the time</h5>
                    <div className="fx-timelistboxbar">
                      {(() => {
                        const slotItems = slotObj?.slots?.time_slots || [];
                        const singleslotItem =
                          slotObj?.slots?.single_time_slot || {};

                        if (
                          (!slotObj || slotItems.length === 0) &&
                          (!singleslotItem ||
                            singleslotItem.length === 0 ||
                            singleslotItem.time_slot == "")
                        ) {
                          return (
                            <div className="fx-timelistbox">
                              No slots available
                            </div>
                          );
                        }

                        if (singleslotItem && singleslotItem.time_slot) {
                          return (
                            <div
                              className={
                                slot == singleslotItem.time_slot && book > 0
                                  ? "fx-timelistbox fx-slotbox-active"
                                  : "fx-timelistbox"
                              }
                            >
                              <div className="fx-timeslotsection">
                                <div className="time">
                                  {singleslotItem.time_slot}
                                </div>
                                <img
                                  className="fx-offericon"
                                  src={percentage}
                                />
                                {(() => {
                                  let percentIcon = null;
                                  if (
                                    singleslotItem.capacity_left_percent > 0 &&
                                    singleslotItem.capacity_left_percent <= 30
                                  ) {
                                    percentIcon = percentthirty;
                                  } else if (
                                    singleslotItem.capacity_left_percent > 30 &&
                                    singleslotItem.capacity_left_percent <= 60
                                  ) {
                                    percentIcon = percentsixty;
                                  } else if (
                                    singleslotItem.capacity_left_percent > 60
                                  ) {
                                    percentIcon = percentninty;
                                  }
                                  return (
                                    <div
                                      className="fx-slotquantity"
                                      style={{
                                        ...(percentIcon && {
                                          backgroundImage: `url("${percentIcon}")`,
                                        }),
                                        backgroundSize: "cover",
                                      }}
                                    >
                                      {singleslotItem.capacity_left}
                                    </div>
                                  );
                                })()}
                              </div>

                              <div className="fx-common">
                                <div className="fx-quantitybox">
                                  {singleslotItem.slot_type == "active" && (
                                    <>
                                      <button
                                        type="button"
                                        className="decrement"
                                        onClick={() =>
                                          slotbook("minus", singleslotItem)
                                        }
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        value={
                                          slot == singleslotItem.time_slot
                                            ? book
                                            : 0
                                        }
                                        defaultValue={0}
                                        min={0}
                                        max={singleslotItem.capacity_left}
                                      />
                                      <button
                                        type="button"
                                        className="increment"
                                        onClick={() =>
                                          slotbook("add", singleslotItem)
                                        }
                                      >
                                        +
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return slotItems.map((item, idx) => (
                          <div
                            className={
                              slot == item.time_slot && book > 0
                                ? "fx-timelistbox fx-slotbox-active"
                                : "fx-timelistbox"
                            }
                            key={idx}
                          >
                            <div className="fx-timeslotsection">
                              <div className="time">{item.time_slot}</div>
                              <img className="fx-offericon" src={percentage} />
                              {(() => {
                                let percentIcon = null;
                                if (
                                  item.capacity_left_percent > 0 &&
                                  item.capacity_left_percent <= 30
                                ) {
                                  percentIcon = percentthirty;
                                } else if (
                                  item.capacity_left_percent > 30 &&
                                  item.capacity_left_percent <= 60
                                ) {
                                  percentIcon = percentsixty;
                                } else if (item.capacity_left_percent > 60) {
                                  percentIcon = percentninty;
                                }
                                return (
                                  <div
                                    className="fx-slotquantity"
                                    style={{
                                      ...(percentIcon && {
                                        backgroundImage: `url("${percentIcon}")`,
                                      }),
                                      backgroundSize: "cover",
                                    }}
                                  >
                                    {item.capacity_left}
                                  </div>
                                );
                              })()}
                            </div>

                            <div className="fx-common">
                              <div className="fx-quantitybox">
                                {item.slot_type == "active" && (
                                  <>
                                    <button
                                      type="button"
                                      className="decrement"
                                      onClick={() => slotbook("minus", item)}
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      value={slot == item.time_slot ? book : 0}
                                      defaultValue={0}
                                      min={0}
                                      max={item.capacity_left}
                                    />
                                    <button
                                      type="button"
                                      className="increment"
                                      onClick={() => slotbook("add", item)}
                                    >
                                      +
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                    <div
                      className={
                        slotVisible == "all" && book > 0
                          ? "continuebtn"
                          : "continuebtn fx-disable-button"
                      }
                      onClick={() =>
                        slotVisible == "all" && book > 0 ? bookservice() : ""
                      }
                    >
                      Continue
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
}
