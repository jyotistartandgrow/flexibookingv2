import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { Carousel } from "primereact/carousel";
import calendar from "../assets/simple-line-icons_calender.svg";
import percentage from "../assets/ic_round-discount.svg";
import axiosInstance from "../Utils/Interceptor";
import moment from "moment";
import { decodeHtml } from "../Utils/Functions";
import { Dialog } from "primereact/dialog";
import { Calendar } from "primereact/calendar";
import { Tooltip } from "primereact/tooltip";
import { OverlayPanel } from "primereact/overlaypanel";
import { setDate } from "../store/step1Slice";
import { setTimeslot, setCapacity, setService } from "../store/step2Slice";
import Swal from "sweetalert2";

export default function Service({ step, setStep }) {
  const dispatch = useDispatch();
  const op = useRef(null);

  const date = useSelector((state) => state.step1.date);
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

  const toggleDiv = (type) => {
    setIsVisible(type);
  };

  useEffect(() => {
    console.log("Selected date in Service component:", date);
    if (date) {
      fetchProductsByDate(date);
      if (serviceid) {
        servicedetail(serviceid);
      }
    }
  }, [date]);

  const fetchProductsByDate = async (selectedDate) => {
    const { data } = await axiosInstance(
      `/services?date=${moment(selectedDate).format("YYYY-MM-DD")}`,
      {
        method: "get",
      }
    );
    if (data && data.status == 200 && data.total_services > 0) {
      setProductsArr(data.data);
    }
  };

  const servicedetail = async (id) => {
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
    }
  };

  const handleMonthChange = (e) => {
    getslotavailabilitycalendar(e.year + "-" + e.month, serviceid);
  };

  const dateTemplate = (dateMeta) => {
    // dateMeta = { day, month, year, today, selectable, otherMonth }
    let tooltipText = "";
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
        tooltipText =
          matchedObj.time_slots.length ||
          matchedObj.single_time_slot.length ||
          0;
        tooltipText = `${tooltipText} Slots Available`;
      }
    }

    return (
      <div id={tooltipId} className="relative w-full h-full">
        <div className="custom-day" data-pr-tooltip={tooltipText}>
          {day}
        </div>
        <Tooltip target=".custom-day" />
      </div>
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
  };

  const slotbook = (timeslot, type) => {
    const currentslot = slot;
    let currentbook = book;
    setSlot(timeslot);
    if (currentslot != timeslot) {
      currentbook = 0;
      setBook(0);
    }
    if (type == "add") {
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

    dispatch(setTimeslot(slot));
    dispatch(setCapacity(book));
    dispatch(setService(serviceid));
    setVisible(false);
    setStep("extrastep");
  };

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
          style={{ width: "50vw" }}
          breakpoints={{ "960px": "75vw", "641px": "100vw" }}
          className="fx-booking"
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
                <img
                  src={productDetails.svc_img}
                  alt={productDetails.service_name}
                />
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
                  {productDetails.svc_long_desc}
                  <span className="readmore">Read More</span>
                </p>
                <p className="datetext">{moment(date).format("MMM YYYY")}</p>
                <div className="calendarboxbar">
                  {dateslot &&
                    dateslot.map((slot, k) => (
                      <div
                        key={k}
                        className={
                          moment(date).isSame(slot.date)
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
                        />
                      </OverlayPanel>
                    </div>
                  </div>
                </div>

                <div id="fx-modaltab_nav">
                  <ul>
                    <li className={slotVisible == "morning" ? "selected" : ""}>
                      <a
                        href="#"
                        className={slotVisible == "morning" ? "selected" : ""}
                        onClick={() => setSlotVisible("morning")}
                      >
                        Morning
                      </a>
                    </li>
                    <li
                      className={slotVisible == "afternoon" ? "selected" : ""}
                    >
                      <a
                        href="#"
                        className={slotVisible == "afternoon" ? "selected" : ""}
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
                        const slotObj = dateslot.find((s) =>
                          moment(date).isSame(s.date)
                        );
                        const slotItems = slotObj?.slots?.morning || [];

                        if (!slotObj || slotItems.length === 0) {
                          return (
                            <div className="fx-timelistbox">
                              No slots available
                            </div>
                          );
                        }

                        return slotItems.map((item, idx) => {
                          return (
                            <div className="fx-timelistbox" key={idx}>
                              <div className="fx-timeslotsection">
                                <div className="time">{item.time_slot}</div>
                                <img
                                  className="fx-offericon"
                                  src={percentage}
                                />
                                <div className="fx-slotquantity">
                                  {item.capacity_left}
                                </div>
                              </div>

                              <div className="fx-common">
                                <div className="fx-quantitybox">
                                  {item.slot_type == "active" && (
                                    <>
                                      <button
                                        type="button"
                                        className="decrement"
                                        onClick={() =>
                                          slotbook(item.time_slot, "minus")
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
                                      />
                                      <button
                                        type="button"
                                        className="increment"
                                        onClick={() =>
                                          slotbook(item.time_slot, "add")
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
                        });
                      })()}
                    </div>
                    <div className="continuebtn" onClick={() => bookservice()}>
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
                        const slotObj = dateslot.find((s) =>
                          moment(date).isSame(s.date)
                        );
                        const slotItems = slotObj?.slots?.afternoon || [];

                        if (!slotObj || slotItems.length === 0) {
                          return (
                            <div className="fx-timelistbox">
                              No slots available
                            </div>
                          );
                        }

                        slotItems.map((item, idx) => {
                          return (
                            <div className="fx-timelistbox" key={idx}>
                              <div className="fx-timeslotsection">
                                <div className="time">{item.time_slot}</div>
                                <img
                                  className="fx-offericon"
                                  src={percentage}
                                />
                                <div className="fx-slotquantity">
                                  {item.capacity_left}
                                </div>
                              </div>

                              <div className="fx-common">
                                <div className="fx-quantitybox">
                                  {item.slot_type == "active" && (
                                    <>
                                      <button
                                        type="button"
                                        className="decrement"
                                        onClick={() =>
                                          slotbook(item.time_slot, "minus")
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
                                      />
                                      <button
                                        type="button"
                                        className="increment"
                                        onClick={() =>
                                          slotbook(item.time_slot, "add")
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
                        });
                      })()}
                    </div>
                    <div className="continuebtn" onClick={() => bookservice()}>
                      Continue
                    </div>
                  </div>
                  <div
                    className={
                      slotVisible == "all"
                        ? "fx-tabcontent selected"
                        : "fx-tabcontent"
                    }
                  >
                    <h5>Choose the time</h5>
                    <div className="fx-timelistboxbar">
                      {(() => {
                        const slotObj = dateslot.find((s) =>
                          moment(date).isSame(s.date)
                        );
                        const slotItems = slotObj?.slots?.time_slots || [];

                        if (!slotObj || slotItems.length === 0) {
                          return (
                            <div className="fx-timelistbox">
                              No slots available
                            </div>
                          );
                        }

                        return slotItems.map((item, idx) => {
                          return (
                            <div className="fx-timelistbox" key={idx}>
                              <div className="fx-timeslotsection">
                                <div className="time">{item.time_slot}</div>
                                <img
                                  className="fx-offericon"
                                  src={percentage}
                                />
                                <div className="fx-slotquantity">
                                  {item.capacity_left}
                                </div>
                              </div>

                              <div className="fx-common">
                                <div className="fx-quantitybox">
                                  {item.slot_type == "active" && (
                                    <>
                                      <button
                                        type="button"
                                        className="decrement"
                                        onClick={() =>
                                          slotbook(item.time_slot, "minus")
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
                                      />
                                      <button
                                        type="button"
                                        className="increment"
                                        onClick={() =>
                                          slotbook(item.time_slot, "add")
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
                        });
                      })()}
                    </div>
                    <div className="continuebtn" onClick={() => bookservice()}>
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
