import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { Sidebar as Calendarsidebar } from "primereact/sidebar";
import axiosInstance from "../Utils/Interceptor";
import moment from "moment";
import { decodeHtml } from "../Utils/Functions";
import { Dialog } from "primereact/dialog";
import { OverlayPanel } from "primereact/overlaypanel";
import { setDate, setStep, setLoading } from "../store/step1Slice";
import { setBookingkey } from "../store/step3Slice";
import {
  setTimeslot,
  setCapacity,
  setService,
  setCart,
} from "../store/step2Slice";
import Swal from "sweetalert2";
import useDeviceType from "../Utils/useDeviceType";
import CalendarPage from "./CalendarPage";

export default function Service(props) {
  const dispatch = useDispatch();
  const op = useRef(null);

  const date = useSelector((state) => state.step1.date);
  const step = useSelector((state) => state.step1.step);
  const gift = useSelector((state) => state.step1.gift);
  const all = useSelector((state) => state.step1.all);
  const category = useSelector((state) => state.step1.category);
  const serviceID = useSelector((state) => state.step2.service);
  const extraid = useSelector((state) => state.step3.extra);
  const extracapacity = useSelector((state) => state.step3.extracapacity);
  const cart = useSelector((state) => state.step2.cart);
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
  const [giftQuantity, setGiftQuantity] = useState(1);
  const [slot, setSlot] = useState("");
  const [readmorecl, setReadmorecl] = useState(false);
  const [skeloading, setLoadingske] = useState(false);
  const [currentitem, setCurrentItem] = useState({});
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const categoryPillsRef = useRef(null);
  const [showCategoryScrollControls, setShowCategoryScrollControls] =
    useState(false);
  const [canScrollCategoryLeft, setCanScrollCategoryLeft] = useState(false);
  const [canScrollCategoryRight, setCanScrollCategoryRight] = useState(false);
  const prevDate = useRef(date);
  const isInitialMount = useRef(true);
  const isDesktop = useDeviceType();
  const desktopCarouselRef = useRef(null);
  const [isDesktopCarouselHovered, setIsDesktopCarouselHovered] =
    useState(false);

  const scrollDesktop = (dir) => {
    const el = desktopCarouselRef.current;
    if (!el) return;
    const itemWidth =
      el.querySelector(".fx-desktop-swipe-item")?.offsetWidth || 0;
    const gap = 16;
    el.scrollBy({
      left: dir === "next" ? itemWidth + gap : -(itemWidth + gap),
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (isVisible !== "slider" || !isDesktop || isDesktopCarouselHovered)
      return;
    const interval = setInterval(() => {
      const el = desktopCarouselRef.current;
      if (!el) return;
      const itemWidth =
        el.querySelector(".fx-desktop-swipe-item")?.offsetWidth || 0;
      const gap = 16;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 1) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: itemWidth + gap, behavior: "smooth" });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [
    isVisible,
    isDesktop,
    products,
    selectedCategory,
    isDesktopCarouselHovered,
  ]);

  const toggleDiv = (type) => {
    setIsVisible(type);
  };

  const updateCategoryScrollState = () => {
    const el = categoryPillsRef.current;
    if (!el) {
      setShowCategoryScrollControls(false);
      setCanScrollCategoryLeft(false);
      setCanScrollCategoryRight(false);
      return;
    }

    const hasOverflow = el.scrollWidth > el.clientWidth + 1;
    setShowCategoryScrollControls(hasOverflow);
    setCanScrollCategoryLeft(hasOverflow && el.scrollLeft > 1);
    setCanScrollCategoryRight(
      hasOverflow && el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    );
  };

  const scrollCategoryPills = (direction) => {
    const el = categoryPillsRef.current;
    if (!el) return;

    const scrollAmount = Math.max(180, Math.floor(el.clientWidth * 0.5));
    el.scrollBy({
      left: direction === "right" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  // Auto-set default view based on service count and device type
  useEffect(() => {
    if (products.length === 0) return;
    if (isDesktop) {
      if (products.length === 1) setIsVisible("list");
      else if (products.length <= 8) setIsVisible("grid");
      else if (products.length <= 12) setIsVisible("slider");
      else setIsVisible("list");
    } else {
      if (products.length <= 2) setIsVisible("grid");
      else if (products.length <= 5) setIsVisible("slider");
      else setIsVisible("list");
    }
  }, [products, isDesktop]);

  // Extract unique categories from products
  useEffect(() => {
    const cats = [
      ...new Set(
        products.map((p) => p.category_name || p.category).filter(Boolean),
      ),
    ];
    setCategories(cats);
    setSelectedCategory("all");
  }, [products]);

  useEffect(() => {
    const el = categoryPillsRef.current;
    if (!el) return;

    const onScroll = () => updateCategoryScrollState();
    const onResize = () => updateCategoryScrollState();

    updateCategoryScrollState();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [categories, isDesktop, products.length, skeloading]);

  useEffect(() => {
    const el = categoryPillsRef.current;
    if (!el) return;

    const activePill = el.querySelector(".fx-category-pill-active");
    if (activePill) {
      activePill.scrollIntoView({ behavior: "smooth", inline: "nearest" });
    }
  }, [selectedCategory]);

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
      // Fetch products on initial mount or when date changes
      if (
        isInitialMount.current ||
        date !== prevDate.current ||
        category !== prevDate.currentCategory
      ) {
        setBook(0);
        setSlot("");
        console.log("Selected date in Service component:", date);
        fetchProductsByDate(date);
        isInitialMount.current = false;
      }
      if (serviceid) {
        dispatch(setLoading(true));
        servicedetail(serviceid);
      }
      prevDate.current = date;
      prevDate.currentCategory = category;
    }
  }, [date, step, serviceid, category]);

  const fetchProductsByDate = async (selectedDate) => {
    setLoadingske(true);
    let allService = gift ? true : false;
    allService = all ? true : allService;
    const { data } = await axiosInstance(
      `/services?date=${moment(selectedDate).format(
        "YYYY-MM-DD",
      )}&category=${category}&all=${allService}`,
      {
        method: "get",
      },
    );
    if (data && data.status == 200 && data.total_services > 0) {
      setProductsArr(data.data);
      setLoadingske(false);
    } else {
      setProductsArr([]);
      setLoadingske(false);
      Swal.fire({
        toast: true,
        position: "top-end", // or 'bottom-end', 'top-start', etc.
        showConfirmButton: false,
        timer: 3000, // auto-close after 3 seconds
        icon: "warning", // 'success', 'error', 'warning', 'info', 'question'
        title: data?.message || "No services found for the selected date",
      });
    }
  };

  const servicedetail = async (id) => {
    dispatch(setLoading(true));
    setReadmorecl(false);
    setGiftQuantity(1);
    setServiceId(id);
    let allService = gift ? true : false;
    allService = all ? true : allService;
    const { data } = await axiosInstance(
      `/service-details?date=${moment(date).format(
        "YYYY-MM-DD",
      )}&service_id=${id}&all=${allService}`,
      {
        method: "get",
      },
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
        const serviceDateSlots = data?.data?.date_slots || [];
        setDateslot(serviceDateSlots);

        const selectedDateExists = serviceDateSlots.some((slotItem) =>
          moment(slotItem?.date).isSame(moment(date).format("YYYY-MM-DD"), "day"),
        );

        if (!selectedDateExists && serviceDateSlots[0]?.date) {
          dispatch(setDate(serviceDateSlots[0].date));
        }
      }

      if (!gift) {
        const monthYear = moment().format("YYYY-MM");
        getslotavailabilitycalendar(monthYear, id);
      } else {
        dispatch(setLoading(false));
      }
    }
  };

  const getslotavailabilitycalendar = async (monthYear, id) => {
    /* Slot availability calendar */
    const { data: dataa } = await axiosInstance(
      `/slot-availability-calendar?month=${monthYear}&service_id=${id}`,
      {
        method: "get",
      },
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
      // Reset to current month
      return;
    }
    dispatch(setLoading(true));
    getslotavailabilitycalendar(`${e.year}-${month}`, serviceid);
  };

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
      const matchedObj = calendarslots?.find((item) => {
        const itemDate = item?.date
          ? moment(item.date).format("YYYY-MM-DD")
          : null;
        return itemDate === dateStr;
      });
      price = matchedObj ? decodeHtml(matchedObj.price).split(",")[0] : "";

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

  const getslotbydate = async (date) => {
    dispatch(setDate(date));
  };

  const parsePriceToNumber = (priceValue) => {
    const decoded = decodeHtml(priceValue || "")
      .toString()
      .trim();
    let normalized = decoded.replace(/[^\d,.-]/g, "");

    // Support both comma and dot decimal formats in API price strings.
    if (normalized.includes(",") && normalized.includes(".")) {
      if (normalized.lastIndexOf(",") > normalized.lastIndexOf(".")) {
        normalized = normalized.replace(/\./g, "").replace(",", ".");
      } else {
        normalized = normalized.replace(/,/g, "");
      }
    } else if (normalized.includes(",")) {
      normalized = normalized.replace(",", ".");
    }

    const numericValue = Number(normalized);
    return Number.isNaN(numericValue) ? 0 : numericValue;
  };

  // Template for each carousel item
  const productTemplate = (product) => {
    return (
      <div
        className={
          props.showBookNowButton == "true"
            ? "fx-servicebox fx-servicebox-add-button"
            : "fx-servicebox fx-bundle-content"
        }
        onClick={() => servicedetail(product.id)}
      >
        <div className="fx-tooltip-wrapper">
          <div className="fx-top-icon">d</div>
          <div className="fx-tooltip-box">
            dewfwef
          </div>
        </div>
        <div className="fx-servicepicbox">
          <img src={product.svc_img} alt={product.service_name} />
          {props.categoryLabelVisibility == "true" && (
            <span className="fx-servicepiccontentbox">
              {product.category_name}
            </span>
          )}
        </div>
        <div className="fx-servicecontentbox">
          <h4>{product.service_name}</h4>
          <p>{decodeHtml(product.svc_short_desc)}</p>
          <p className="price">
            <span
              className="fx-price-form"
              style={{ display: gift ? "none" : "inline" }}
            >
              from
            </span>
            <span className="fx-price-one">
              {decodeHtml(product.svc_price).split(",")[0]}
            </span>
            {parsePriceToNumber(product.svc_default_price) >
              parsePriceToNumber(product.svc_price) && (
              <span className="fx-price-two">
                {decodeHtml(product.svc_default_price).split(",")[0]}
              </span>
            )}
            {props.showBookNowButton !== "true" && (
              <i className="pi pi-chevron-right"></i>
            )}
          </p>
          {props.showBookNowButton == "true" && (
            <div
              className="booknowbtn"
              onClick={() => servicedetail(product.id)}
            >
              <a href="#">{gift ? "Select Gift" : "Book Now"}</a>
            </div>
          )}
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
      }&capacity=${book}&date=${moment(date).format("YYYY-MM-DD")}&extra_id=${extraid}&extra_capacity=${extracapacity}`,
      {
        method: "get",
      },
    );
    let cartobj = {
      id: data?.data?.service_id,
      name: productDetails.service_title,
      price: productDetails.svc_price,
      total: data?.data?.service_total,
      total_formatted: data?.data?.service_total,
      slot: slot,
      capacity: data?.data?.service_capacity,
    };
    let extraobj = cart.extra ? cart.extra : [];
    if (cart.extra && cart.extra.length > 0 && !data?.data?.extra_id) {
      extraobj = [];
    }
    dispatch(
      setCart({
        ...cart,
        service: [cartobj],
        extra: extraobj,
        total: data?.data?.total,
        total_formatted: data?.data?.total_formated,
        discount: 0,
        subtotal: data?.data?.total_formated,
      }),
    );
    dispatch(setTimeslot(slot));
    dispatch(setCapacity(book));
    dispatch(setService(serviceid));
    setVisible(false);
    hasExtra();
  };

  const giftbookservice = async () => {
    if (giftQuantity < 1) {
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        icon: "warning",
        title: "Please choose at least 1 quantity",
      });
      return;
    }

    dispatch(setLoading(true));
    const { data } = await axiosInstance(
      `/price-format?service_id=${productDetails.id}&capacity=${giftQuantity}&date=${moment(
        date,
      ).format(
        "YYYY-MM-DD",
      )}&extra_id=${extraid}&extra_capacity=${extracapacity}`,
      {
        method: "get",
      },
    );
    let cartobj = {
      id: productDetails.id,
      name: productDetails.service_title,
      price: productDetails.svc_price,
      total: data?.data?.service_total,
      total_formatted: data?.data?.service_total,
      slot: "",
      capacity: giftQuantity,
    };
    let extraobj = cart.extra ? cart.extra : [];
    if (cart.extra && cart.extra.length > 0 && !data?.data?.extra_id) {
      extraobj = [];
    }
    dispatch(
      setCart({
        ...cart,
        service: [cartobj],
        extra: extraobj,
        total: data?.data?.total,
        total_formatted: data?.data?.total_formated,
        discount: 0,
        subtotal: data?.data?.total_formated,
      }),
    );
    dispatch(setTimeslot(""));
    dispatch(setCapacity(giftQuantity));
    dispatch(setService(serviceid));
    setVisible(false);
    hasExtra();
  };

  const hasExtra = async () => {
    dispatch(setLoading(true));
    const { data } = await axiosInstance(
      `/has-extra?date=${moment(date).format(
        "YYYY-MM-DD",
      )}&service_id=${serviceid}&all=${gift ? true : false}`,
      {
        method: "get",
      },
    );
    if (data && data.status == 200) {
      if (data.has_extra) {
        dispatch(setStep("extrastep"));
        dispatch(setLoading(false));
      } else {
        addtocart();
      }
    } else {
      dispatch(setLoading(false));
      Swal.fire({
        toast: true,
        position: "top-end", // or 'bottom-end', 'top-start', etc.
        showConfirmButton: false,
        timer: 3000, // auto-close after 3 seconds
        icon: "error", // 'success', 'error', 'warning', 'info', 'question'
        title: "Failed to fetch extras",
      });
    }
  };

  const addtocart = async () => {
    dispatch(setLoading(true));
    const { data } = await axiosInstance.post(`/addtocart`, {
      service_id: serviceid,
      date: moment(date).format("YYYY-MM-DD"),
      total_service_booking: gift ? giftQuantity : book,
      time_slot: slot,
      extra_svc_ids: [],
      no_of_persons: 0,
      gift,
    });
    if (data && data.status == 200 && data.data.booking_string) {
      dispatch(setBookingkey(data.data.booking_string));
      dispatch(setStep("checkoutstep"));
      dispatch(setLoading(false));
    } else {
      Swal.fire({
        toast: true,
        position: "top-end", // or 'bottom-end', 'top-start', etc.
        showConfirmButton: false,
        timer: 3000, // auto-close after 3 seconds
        icon: "error", // 'success', 'error', 'warning', 'info', 'question'
        title: data?.message ?? "There is some error , please try again",
      });
      dispatch(setLoading(false));
    }
  };

  const displayedProducts =
    selectedCategory === "all"
      ? products
      : products.filter(
          (p) => (p.category_name || p.category) === selectedCategory,
        );

  const slotObj = dateslot.find((s) =>
    moment(moment(date).format("YYYY-MM-DD")).isSame(s.date),
  );

  const shouldShowCategoryFilter =
    !skeloading &&
    categories.length >= 2 &&
    (isDesktop ? products.length >= 9 : products.length >= 6);

  const updateGiftQuantity = (type) => {
    setGiftQuantity((prev) => {
      const current = Number(prev) || 1;
      if (type === "minus") {
        return Math.max(1, current - 1);
      }
      return current + 1;
    });
  };

  // Auto-select the first tab that has available slots
  useEffect(() => {
    if (!slotObj) return;
    const slots = slotObj?.slots;
    if (slots?.single_time_slot?.slot_type) {
      setSlotVisible("all");
    } else if (slots?.morning && slots.morning.length > 0) {
      setSlotVisible("morning");
    } else if (slots?.afternoon && slots.afternoon.length > 0) {
      setSlotVisible("afternoon");
    } else {
      setSlotVisible("all");
    }
  }, [slotObj]);

  return (
    <div
      className="fx-leftcontentbox"
      style={{ display: step === "servicesstep" ? "block" : "none" }}
    >
      <div className="fx-top-box-tab-content">
        {props.stepsVisibility?.step_2_title_visible == "true" && (
          <h1
            className="fx-all-main-heading"
            style={{
              display:
                props.mobileHeading == "false" && !isDesktop ? "none" : "block",
            }}
          >
            {props.stepTitles?.step_2_title ||
              "What experience are you looking for?"}{" "}
          </h1>
        )}
        {/* Category filter toggle button + dropdown */}
        {/* Category filter pills */}
        {shouldShowCategoryFilter && (
          <div className="fx-category-pills-row">
            {showCategoryScrollControls && (
              <button
                type="button"
                className="fx-category-scroll-arrow"
                onClick={() => scrollCategoryPills("left")}
                disabled={!canScrollCategoryLeft}
                aria-label="Scroll categories left"
              >
                <i className="pi pi-chevron-left"></i>
              </button>
            )}

            <div className="fx-category-pills-bar" ref={categoryPillsRef}>
              <button
                className={`fx-category-pill${selectedCategory === "all" ? " fx-category-pill-active" : ""}`}
                onClick={() => setSelectedCategory("all")}
              >
                All
              </button>
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  className={`fx-category-pill${selectedCategory === cat ? " fx-category-pill-active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {showCategoryScrollControls && (
              <button
                type="button"
                className="fx-category-scroll-arrow"
                onClick={() => scrollCategoryPills("right")}
                disabled={!canScrollCategoryRight}
                aria-label="Scroll categories right"
              >
                <i className="pi pi-chevron-right"></i>
              </button>
            )}
          </div>
        )}
      </div>
      <div id="fx-Icontab_nav">
        <ul
          style={{
            display:
              props.mobileHeading == "false" && !isDesktop ? "none" : "block",
          }}
        >
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
            isVisible == "grid" && !skeloading
              ? "fx-tabcontent selected"
              : "fx-tabcontent"
          }
        >
          <div className="fx-servicecontainer">
            {displayedProducts.length > 0 &&
              displayedProducts.map((product, p1) => {
                return (
                  <div
                    className={
                      props.showBookNowButton == "true"
                        ? "fx-servicebox fx-servicebox-add-button"
                        : "fx-servicebox fx-bundle-content"
                    }
                    key={p1}
                    onClick={() => servicedetail(product.id)}
                  >
                     <div className="fx-tooltip-wrapper">
                      <div className="fx-top-icon">d</div>
                      <div className="fx-tooltip-box">
                        dewfwef
                      </div>
                    </div>
                    <div className="fx-servicepicbox">
                      <div class="fx-image-loader"></div>
                      <img src={product.svc_img} alt={product.service_name} />
                      {props.categoryLabelVisibility == "true" && (
                        <span className="fx-servicepiccontentbox">
                          {product.category_name}
                        </span>
                      )}
                    </div>
                    <div className="fx-servicecontentbox">
                      <h4>{product.service_name}</h4>
                      <p>{product.svc_short_desc}</p>
                      <p className="price">
                        <span
                          className="fx-price-form"
                          style={{ display: gift ? "none" : "block" }}
                        >
                          from
                        </span>
                        <span className="fx-price-one">
                          {decodeHtml(product.svc_price).split(",")[0]}
                        </span>
                        {parsePriceToNumber(product.svc_default_price) >
                          parsePriceToNumber(product.svc_price) && (
                          <span className="fx-price-two">
                            {
                              decodeHtml(product.svc_default_price).split(
                                ",",
                              )[0]
                            }
                          </span>
                        )}
                        {props.showBookNowButton !== "true" && (
                          <i className="pi pi-chevron-right"></i>
                        )}
                      </p>

                      {props.showBookNowButton == "true" && (
                        <div
                          className="booknowbtn"
                          onClick={() => servicedetail(product.id)}
                        >
                          <a href="#">{gift ? "Select Gift" : "Book Now"}</a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
        <div
          className={
            isVisible == "list" && !skeloading
              ? "fx-tabcontent selected"
              : "fx-tabcontent"
          }
        >
          {displayedProducts.length > 0 &&
            displayedProducts.map((product, p2) => {
              return (
                <div
                  className="fx-serviceboxlist"
                  key={p2}
                  onClick={() => servicedetail(product.id)}
                >
                  <div className="fx-servicepicboxlist">
                    <div className="fx-list-img-box">
                      <img src={product.svc_img} alt={product.service_name} />
                    </div>
                    {props.categoryLabelVisibility == "true" && (
                      <span className="fx-servicepiccontentbox">
                        {product.category_name}
                      </span>
                    )}
                  </div>
                  <div className="fx-servicecontentboxlist">
                    <div className="list-view-text-content">
                      <h4>{product.service_name}</h4>
                      <p>{product.svc_short_desc}</p>
                    </div>
                    <p className="price">
                      <span
                        className="fx-price-form"
                        style={{ display: gift ? "none" : "block" }}
                      >
                        from
                      </span>
                      <span className="fx-price-one">
                        {decodeHtml(product.svc_price).split(",")[0]}
                      </span>
                      {parsePriceToNumber(product.svc_default_price) >
                        parsePriceToNumber(product.svc_price) && (
                        <span className="fx-price-two">
                          {decodeHtml(product.svc_default_price).split(",")[0]}
                        </span>
                      )}
                      <i className="pi pi-chevron-right"></i>
                    </p>
                    {/* <span
                      className="booknowbtn"
                      onClick={() => servicedetail(product.id)}
                    >
                      {gift ? "Select Gift" : "fr"}
                    </span> */}
                  </div>
                </div>
              );
            })}
        </div>

        <div
          className={
            isVisible == "slider" && !skeloading
              ? "fx-tabcontent selected"
              : "fx-tabcontent"
          }
        >
          <div className="slider responsive">
            {!isDesktop ? (
              <div className="fx-mobile-swipe-carousel">
                {displayedProducts.map((product, idx) => (
                  <div key={idx} className="fx-mobile-swipe-item">
                    {productTemplate(product)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="fx-desktop-swipe-wrapper">
                <button
                  className="fx-dswipe-arrow fx-dswipe-prev"
                  onClick={() => scrollDesktop("prev")}
                >
                  <i className="pi pi-chevron-left"></i>
                </button>
                <div
                  className={`fx-desktop-swipe-carousel${displayedProducts.length < 4 ? " fx-dswipe-few" : ""}`}
                  ref={desktopCarouselRef}
                  onMouseEnter={() => setIsDesktopCarouselHovered(true)}
                  onMouseLeave={() => setIsDesktopCarouselHovered(false)}
                >
                  {displayedProducts.map((product, idx) => (
                    <div key={idx} className="fx-desktop-swipe-item">
                      {productTemplate(product)}
                    </div>
                  ))}
                </div>
                <button
                  className="fx-dswipe-arrow fx-dswipe-next"
                  onClick={() => scrollDesktop("next")}
                >
                  <i className="pi pi-chevron-right"></i>
                </button>
              </div>
            )}
          </div>
        </div>
        <div
          className="fx-bottom-bar"
          style={{
            display:
              step === "servicesstep" && serviceID && !skeloading
                ? "block"
                : "none",
          }}
        >
          <input
            type="submit"
            className="btn-primary fx-continue"
            value="Continue"
            onClick={() => dispatch(setStep("extrastep"))}
          />
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
          contentClassName="fx-expand-details-popup"
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
                  <div className="fix-maximiz-popup-img">
                    <img
                      src={productDetails.svc_img}
                      alt={productDetails.service_title}
                    />
                  </div>
                )}
                <span className="fx-servicepiccontentbox">
                  {productDetails.service_title}
                </span>
                <p className="fx-pricebox">
                  {decodeHtml(productDetails.svc_price).split(",")[0]}
                </p>
              </div>

              <div
                className={
                  gift ? "fx-rightpopup-middle fx-rightpopup" : "fx-rightpopup"
                }
              >
                <div className="fx-right-box-detsila">
                  {gift && (
                    <div className="fx-center-content">
                      <h4>{productDetails.service_title}</h4>
                      <a
                        className="close"
                        href="#"
                        onClick={() => setVisible(false)}
                      >
                        &times;
                      </a>

                      <p>
                        <span
                          className={
                            readmorecl || gift ? "fx-expand-readmore" : "fx-des"
                          }
                        >
                          {decodeHtml(productDetails.svc_long_desc)}
                        </span>
                        {productDetails.svc_long_desc != "N/A" &&
                          (productDetails.svc_long_desc?.trim().split(/\s+/)
                            .length ?? 0) > 25 && !gift && (
                            <span
                              className="readmore"
                              onClick={() => setReadmorecl(!readmorecl)}
                            >
                              {readmorecl ? "Read Less" : "Read More"}
                            </span>
                          )}
                      </p>

                      <div className="fx-common">
                        <h5>Quantity</h5>
                        <div className="fx-quantitybox">
                          <button
                            type="button"
                            className="decrement"
                            onClick={() => updateGiftQuantity("minus")}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={giftQuantity}
                            readOnly
                          />
                          <button
                            type="button"
                            className="increment"
                            onClick={() => updateGiftQuantity("add")}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {!gift && (
                    <>
                      <h4>{productDetails.service_title}</h4>
                      <a
                        className="close"
                        href="#"
                        onClick={() => setVisible(false)}
                      >
                        &times;
                      </a>
                      <p>
                        <span
                          className={
                            readmorecl || gift ? "fx-expand-readmore" : "fx-des"
                          }
                        >
                          {decodeHtml(productDetails.svc_long_desc)}
                        </span>
                        {productDetails.svc_long_desc != "N/A" &&
                          (productDetails.svc_long_desc?.trim().split(/\s+/)
                            .length ?? 0) > 25 && (
                            <span
                              className="readmore"
                              onClick={() => setReadmorecl(!readmorecl)}
                            >
                              {readmorecl ? "Read Less" : "Read More"}
                            </span>
                          )}
                      </p>{" "}
                      <p className="datetext">
                        {moment(date).format("MMM YYYY")}
                      </p>
                      <div className="calendarboxbar">
                        {dateslot &&
                          dateslot.map((slot, k) => (
                            <div
                              key={k}
                              className={
                                moment(
                                  moment(date).format("YYYY-MM-DD"),
                                ).isSame(slot.date)
                                  ? "calendarbox active"
                                  : "calendarbox"
                              }
                              onClick={() => getslotbydate(slot.date)}
                            >
                              {moment(slot.date).format("ddd")}
                              <br />
                              <span>{moment(slot.date).format("DD")}</span>
                              <div className="fx-date-progress-bar"></div>
                            </div>
                          ))}
                        <div className="calendarbox">
                          <i
                            className="pi pi-calendar"
                            alt="Open Calendar"
                            id="fx-openCalendar"
                            onClick={(e) =>
                              isDesktop
                                ? op.current.toggle(e)
                                : setCalendarVisible(true)
                            }
                          ></i>

                          <div id="fx-calendarContainer">
                            {isDesktop ? (
                              <OverlayPanel
                                ref={op}
                                className="fx-calendar-box"
                              >
                                <CalendarPage
                                  inline
                                  value={date}
                                  onChange={(e) => {
                                    dispatch(setDate(e.value));
                                    op.current.hide();
                                  }}
                                  dateTemplate={dateTemplate}
                                  disabledDates={disabledDates}
                                  handleMonthChange={handleMonthChange}
                                />
                              </OverlayPanel>
                            ) : (
                              <Calendarsidebar
                                visible={calendarVisible}
                                onHide={() => setCalendarVisible(false)}
                                position="bottom"
                                className="fx-calendar-sidebar"
                              >
                                <CalendarPage
                                  inline
                                  value={date}
                                  onChange={(e) => {
                                    dispatch(setDate(e.value));
                                    setCalendarVisible(false);
                                  }}
                                  dateTemplate={dateTemplate}
                                  disabledDates={disabledDates}
                                  handleMonthChange={handleMonthChange}
                                />
                              </Calendarsidebar>
                            )}
                          </div>
                        </div>
                      </div>
                      <div id="fx-modaltab_nav">
                        {!slotObj?.slots.single_time_slot.slot_type && (
                          <>
                            <ul>
                              <li
                                className={
                                  slotVisible == "morning" ? "selected" : ""
                                }
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
                              <li
                                className={
                                  slotVisible == "all" ? "selected" : ""
                                }
                              >
                                <a
                                  href="#"
                                  className={
                                    slotVisible == "all" ? "selected" : ""
                                  }
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
                                  const slotItems =
                                    slotObj?.slots?.morning || [];

                                  if (!slotObj || slotItems.length === 0) {
                                    return (
                                      <p className="fx-noslots">
                                        {" "}
                                        No slots available
                                      </p>
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
                                        <div className="time">
                                          {item.time_slot}
                                        </div>
                                        {/* <img
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
                                      })()}*/}
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
                                                  slot == item.time_slot
                                                    ? book
                                                    : 0
                                                }
                                                defaultValue={0}
                                                min={0}
                                                max={item.capacity_left}
                                              />
                                              <button
                                                type="button"
                                                className="increment"
                                                onClick={() =>
                                                  slotbook("add", item)
                                                }
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
                                  const slotAfItems =
                                    slotObj?.slots?.afternoon || [];

                                  if (!slotObj || slotAfItems.length === 0) {
                                    return (
                                      <p className="fx-noslots">
                                        {" "}
                                        No slots available
                                      </p>
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
                                        <div className="time">
                                          {item.time_slot}
                                        </div>
                                        {/* <img
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
                                      })()}*/}
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
                                                  slot === item.time_slot
                                                    ? book
                                                    : 0
                                                }
                                              />

                                              <button
                                                type="button"
                                                className="increment"
                                                onClick={() =>
                                                  slotbook("add", item)
                                                }
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
                            </div>
                          </>
                        )}
                        <div
                          className={
                            slotVisible == "all" ||
                            dateslot.find((s) =>
                              moment(moment(date).format("YYYY-MM-DD")).isSame(
                                s.date,
                              ),
                            )?.slots.single_time_slot.slot_type
                              ? "fx-tabcontent selected"
                              : "fx-tabcontent"
                          }
                        >
                          <h5>Choose the time</h5>
                          <div className="fx-timelistboxbar">
                            {(() => {
                              const slotItems =
                                slotObj?.slots?.time_slots || [];
                              const singleslotItem =
                                slotObj?.slots?.single_time_slot || {};

                              if (
                                (!slotObj || slotItems.length === 0) &&
                                (!singleslotItem ||
                                  singleslotItem.length === 0 ||
                                  singleslotItem.time_slot == "" ||
                                  singleslotItem.time_slot <= 0)
                              ) {
                                return (
                                  <p className="fx-noslots">
                                    {" "}
                                    No slots available
                                  </p>
                                );
                              }

                              if (singleslotItem && singleslotItem.time_slot) {
                                return (
                                  <div
                                    className={
                                      slot == singleslotItem.time_slot &&
                                      book > 0
                                        ? "fx-timelistbox fx-slotbox-active"
                                        : "fx-timelistbox"
                                    }
                                  >
                                    <div className="fx-timeslotsection">
                                      <div className="time">
                                        {singleslotItem.time_slot}
                                      </div>
                                      {/* <img
                                      className="fx-offericon"
                                      src={percentage}
                                    />
                                    {(() => {
                                      let percentIcon = null;
                                      if (
                                        singleslotItem.capacity_left_percent >
                                          0 &&
                                        singleslotItem.capacity_left_percent <=
                                          30
                                      ) {
                                        percentIcon = percentthirty;
                                      } else if (
                                        singleslotItem.capacity_left_percent >
                                          30 &&
                                        singleslotItem.capacity_left_percent <=
                                          60
                                      ) {
                                        percentIcon = percentsixty;
                                      } else if (
                                        singleslotItem.capacity_left_percent >
                                        60
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
                                    })()}*/}
                                    </div>

                                    <div className="fx-common">
                                      <div className="fx-quantitybox">
                                        {singleslotItem.slot_type ==
                                          "active" && (
                                          <>
                                            <button
                                              type="button"
                                              className="decrement"
                                              onClick={() =>
                                                slotbook(
                                                  "minus",
                                                  singleslotItem,
                                                )
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
                                    {/* <img
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
                                  })()}*/}
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
                                            onClick={() =>
                                              slotbook("add", item)
                                            }
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
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div
                  className="fx-popup-rightslot-continuebtn"
                  style={{
                    display:
                      slotVisible == "morning" && !gift ? "block" : "none",
                  }}
                >
                  <div
                    className={
                      slotVisible == "morning" && book > 0
                        ? "continuebtn"
                        : "continuebtn fx-disable-button"
                    }
                    onClick={() =>
                      slotVisible == "morning" && book > 0 ? bookservice() : ""
                    }
                  >
                    Continue
                  </div>
                </div>
                <div
                  className="fx-popup-rightslot-continuebtn"
                  style={{
                    display:
                      slotVisible == "afternoon" && !gift ? "block" : "none",
                  }}
                >
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
                <div
                  className="fx-popup-rightslot-continuebtn"
                  style={{
                    display:
                      (slotVisible == "all" ||
                        dateslot.find((s) =>
                          moment(moment(date).format("YYYY-MM-DD")).isSame(
                            s.date,
                          ),
                        )?.slots.single_time_slot.slot_type) &&
                      !gift
                        ? "block"
                        : "none",
                  }}
                >
                  <div
                    className={
                      (slotVisible == "all" ||
                        dateslot.find((s) =>
                          moment(moment(date).format("YYYY-MM-DD")).isSame(
                            s.date,
                          ),
                        )?.slots.single_time_slot.slot_type) &&
                      book > 0
                        ? "continuebtn"
                        : "continuebtn fx-disable-button"
                    }
                    onClick={() =>
                      (slotVisible == "all" ||
                        dateslot.find((s) =>
                          moment(moment(date).format("YYYY-MM-DD")).isSame(
                            s.date,
                          ),
                        )?.slots.single_time_slot.slot_type) &&
                      book > 0
                        ? bookservice()
                        : ""
                    }
                  >
                    Continue
                  </div>
                </div>
                {gift && (
                  <div
                    className="continuebtn"
                    onClick={() => giftbookservice()}
                  >
                    Continue
                  </div>
                )}
              </div>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
}
