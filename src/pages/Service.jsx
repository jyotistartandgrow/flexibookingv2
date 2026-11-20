import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { Sidebar as Calendarsidebar } from "primereact/sidebar";
import axiosInstance from "../Utils/Interceptor";
import moment from "moment";
import {
  decodeHtml,
  formatExtrasTimeSlot,
  toPlainText,
} from "../Utils/Functions";
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
import ServiceCard from "../components/ServiceCard";
import ServiceSlotSelection from "../components/ServiceSlotSelection";
import ServiceParticipants from "../components/ServiceParticipants";
import BundleParticipants from "../components/BundleParticipants";
import VirtualServiceParticipants from "../components/VirtualServiceParticipants";
import {
  buildBundleParticipantsRequest,
  buildVirtualParticipantsRequest,
  useBundleParticipants,
  useComponentParticipants,
} from "../Utils/bundleParticipants";
import "../styles/service-participants.scss";
import {
  getParticipantSlotStart,
  getParticipantSelection,
  normalizeParticipantGroups,
} from "../Utils/participants";

export default function Service(props) {
  const dispatch = useDispatch();
  const op = useRef(null);

  const date = useSelector((state) => state.step1.date);
  const step = useSelector((state) => state.step1.step);
  const gift = useSelector((state) => state.step1.gift);
  const opendatepurchase = useSelector((state) => state.step1.opendatepurchase);
  const all = useSelector((state) => state.step1.all);
  const category = useSelector((state) => state.step1.category);
  const serviceID = useSelector((state) => state.step2.service);
  const extraid = useSelector((state) => state.step3.extra);
  const extracapacity = useSelector((state) => state.step3.extracapacity);
  const cart = useSelector((state) => state.step2.cart);
  const redeemBooking = useSelector((state) => state.step1.redeemBooking);
  const extraTypeStr = extraid
    ? String(extraid)
        .split(",")
        .map(
          (id) =>
            cart.extra?.find((item) => String(item.id) === id.trim())
              ?.extra_type || "local",
        )
        .join(",")
    : "";
  const [products, setProductsArr] = useState([]);
  const [visible, setVisible] = useState(false);
  const [productDetails, setProductDetails] = useState({});
  const [detailsDate, setDetailsDate] = useState("");
  const [detailsPending, setDetailsPending] = useState(false);
  const [dateslot, setDateslot] = useState([]);
  const [isVisible, setIsVisible] = useState("grid");
  const [slotVisible, setSlotVisible] = useState("morning");
  const [disabledDates, setDisabledDates] = useState([]);
  const [calendarslots, setCalendarslots] = useState([]);
  const [serviceid, setServiceId] = useState(null);
  const [book, setBook] = useState(0);
  const [showParticipantStep, setShowParticipantStep] = useState(false);
  const [participants, setParticipants] = useState({});
  const [participantConfig, setParticipantConfig] = useState(null);
  const [participantConfigKey, setParticipantConfigKey] = useState("");
  const [participantLoading, setParticipantLoading] = useState(false);
  const [participantError, setParticipantError] = useState("");
  const [participantRetry, setParticipantRetry] = useState(0);
  const participantLineKey = useRef(null);
  const participantDefaultsKey = useRef(null);
  const [giftQuantity, setGiftQuantity] = useState(1);
  const [slot, setSlot] = useState("");
  const [readmorecl, setReadmorecl] = useState(false);
  const [skeloading, setLoadingske] = useState(false);
  const [currentitem, setCurrentItem] = useState({});
  const [loadedServiceImages, setLoadedServiceImages] = useState({});
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
  const [bundleId, setBundleId] = useState(0);
  const [virtualServiceId, setVirtualServiceId] = useState(0);
  const [serviceOptionChoices, setServiceOptionChoices] = useState(null);
  const [selectedServiceOptionId, setSelectedServiceOptionId] = useState(0);
  const [serviceOptionsConfirmed, setServiceOptionsConfirmed] = useState(false);
  const [showBundleSlots, setShowBundleSlots] = useState(false);
  const [bundleSchedule, setBundleSchedule] = useState(null);
  const [bundleSelectedSlots, setBundleSelectedSlots] = useState([]);
  const [bundleSlotTabs, setBundleSlotTabs] = useState({});
  const [bundleQuantity, setBundleQuantity] = useState(1);
  const [bundleScheduleLoading, setBundleScheduleLoading] = useState(false);
  const [expandedBundlePosition, setExpandedBundlePosition] = useState(null);
  const [selectedSlotContext, setSelectedSlotContext] = useState({
    serviceId: null,
    bundleId: 0,
    virtualServiceId: 0,
  });

  const normalizeBundleId = (value) => {
    const numericBundleId = Number(value);
    return numericBundleId > 0 ? numericBundleId : 0;
  };

  const detailCapacity = productDetails?.svc_total_cap_left;
  const hasNoServiceCapacity =
    detailCapacity !== null &&
    detailCapacity !== undefined &&
    String(detailCapacity).trim() !== "" &&
    Number(detailCapacity) === 0;
  const isPopupBookingDisabled =
    !gift &&
    (detailsPending ||
      detailsDate !== moment(date).format("YYYY-MM-DD") ||
      hasNoServiceCapacity);

  const selectedSlotCapacity = Math.max(
    0,
    Number(currentitem.capacity_left) || 0,
  );
  const participantStart = getParticipantSlotStart(currentitem);
  const participantRequestKey = JSON.stringify([
    serviceid,
    moment(date).format("YYYY-MM-DD"),
    participantStart,
    selectedServiceOptionId,
    slot,
  ]);
  const participantConfigReady =
    participantConfigKey === participantRequestKey &&
    Boolean(participantConfig) &&
    !participantLoading &&
    !participantError;
  const participantGroups = normalizeParticipantGroups(participantConfig);
  const participantSelection = getParticipantSelection(
    participantConfig,
    participantGroups,
    participants,
    selectedSlotCapacity,
    detailCapacity,
  );
  const validParticipantQuantity =
    participantConfigReady && participantSelection.valid;
  const canContinueToParticipants =
    !isPopupBookingDisabled &&
    selectedSlotCapacity > 0 &&
    Boolean(slot) &&
    selectedSlotContext.serviceId === serviceid &&
    selectedSlotContext.bundleId === normalizeBundleId(bundleId) &&
    selectedSlotContext.virtualServiceId === virtualServiceId;

  // Virtual services: the booking quantity is chosen directly, and visitors per
  // included service come from the component-participants API (as for bundles).
  const isVirtualSelection = virtualServiceId > 0 && !gift;
  const virtualMinQuantity = Math.max(1, Number(currentitem.min_capacity) || 1);
  const virtualMaxQuantity = Math.max(
    0,
    Math.min(
      selectedSlotCapacity,
      Number(currentitem.max_capacity) > 0
        ? Number(currentitem.max_capacity)
        : Infinity,
      detailCapacity !== null &&
        detailCapacity !== undefined &&
        String(detailCapacity).trim() !== ""
        ? Number(detailCapacity)
        : Infinity,
    ),
  );
  const virtualQuantityValid =
    book >= virtualMinQuantity && book <= virtualMaxQuantity;
  const virtualParticipants = useComponentParticipants(
    isVirtualSelection &&
      visible &&
      showParticipantStep &&
      canContinueToParticipants &&
      virtualQuantityValid
      ? buildVirtualParticipantsRequest({
          serviceId: serviceid,
          virtualServiceId,
          date: moment(date).format("YYYY-MM-DD"),
          quantity: book,
          timeSlot: slot,
          lineKey: participantLineKey.current,
        })
      : null,
  );
  const virtualParticipantsBlocking =
    !virtualParticipants.visible ||
    virtualParticipants.loading ||
    virtualParticipants.checking ||
    Boolean(virtualParticipants.error) ||
    (virtualParticipants.required && !virtualParticipants.valid);

  const canContinueService = isVirtualSelection
    ? canContinueToParticipants &&
      virtualQuantityValid &&
      !virtualParticipantsBlocking
    : canContinueToParticipants &&
      validParticipantQuantity &&
      book === participantSelection.total;
  const participantQuantityMessage = participantSelection.message;

  const serviceOptionList = serviceOptionChoices
    ? [
        serviceOptionChoices.base_option,
        ...(Array.isArray(serviceOptionChoices.options)
          ? serviceOptionChoices.options
          : []),
      ].filter(Boolean)
    : [];

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
      else setIsVisible("slider");
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
    if (props.popupOnly) return;
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
        if (serviceid) {
          dispatch(setLoading(true));
          servicedetail(serviceid, bundleId, virtualServiceId);
        }
        isInitialMount.current = false;
      }
      prevDate.current = date;
      prevDate.currentCategory = category;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    date,
    step,
    serviceid,
    category,
    bundleId,
    virtualServiceId,
    props.popupOnly,
  ]);

  const fetchProductsByDateRequest = async (selectedDate) => {
    setLoadingske(true);
    let allService = gift ? true : false;
    allService = all ? true : allService;
    // data-service-ids="1,2,3" limits the list to those services. The API
    // rejects anything but positive IDs, so drop blanks/invalid entries.
    const serviceIdsFilter = (
      Array.isArray(props.serviceIds) ? props.serviceIds : []
    )
      .map((id) => String(id).trim())
      .filter((id) => /^[1-9][0-9]*$/.test(id))
      .join(",");
    const { data } = await axiosInstance(
      `/services?date=${moment(selectedDate).format(
        "YYYY-MM-DD",
      )}&category=${category}&all=${allService}&gift=${gift ? true : false}${serviceIdsFilter ? `&service_id=${serviceIdsFilter}` : ""}`,
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
        titleText: toPlainText(
          data?.message || "No services found for the selected date",
        ),
      });
    }
  };

  const getVirtualServiceId = (product) =>
    product?.product_type === "virtual_service"
      ? normalizeBundleId(
          product.virtual_service_id ??
            product.selected_virtual_service_id ??
            product.product_id,
        )
      : 0;

  const openProductDetails = (product) => {
    servicedetail(
      product.id,
      product.bundle_id ?? 0,
      getVirtualServiceId(product),
    );
  };

  const servicedetailRequest = async (
    id,
    selectedBundleId = 0,
    selectedVirtualId = 0,
  ) => {
    participantDefaultsKey.current = null;
    setShowParticipantStep(false);
    setParticipants({});
    setParticipantConfig(null);
    setParticipantError("");
    setBook(0);
    setSlot("");
    setCurrentItem({});
    const requestDate = moment(date).format("YYYY-MM-DD");
    setDetailsPending(true);
    const normalizedVirtualId = normalizeBundleId(selectedVirtualId);
    const normalizedBundleId =
      normalizedVirtualId > 0 ? 0 : normalizeBundleId(selectedBundleId);
    setShowBundleSlots(false);
    setBundleSchedule(null);
    setBundleSelectedSlots([]);
    setBundleSlotTabs({});
    setBundleQuantity(1);
    setExpandedBundlePosition(null);
    if (!visible) {
      setServiceOptionsConfirmed(false);
    }
    const isSameDetailContext =
      serviceid === id &&
      normalizeBundleId(bundleId) === normalizedBundleId &&
      virtualServiceId === normalizedVirtualId;
    if (!visible || !isSameDetailContext || !participantLineKey.current) {
      participantLineKey.current = `v1:${crypto.randomUUID()}`;
    }
    const savedService = cart.service?.find(
      (item) =>
        String(item.id) === String(id) &&
        normalizeBundleId(item.bundle_id) === normalizedBundleId &&
        normalizeBundleId(item.virtual_service_id) === normalizedVirtualId,
    );
    const savedComponentSlot = savedService?.selected_component_slots?.find(
      (component) => String(component.service_id) === String(id),
    );
    const extrasTimeSlot = gift
      ? ""
      : formatExtrasTimeSlot(
          (isSameDetailContext && slot) ||
            savedComponentSlot ||
            savedService?.slot,
        );

    if (!isSameDetailContext) {
      setSlot("");
      setBook(0);
      setCurrentItem({});
      setSelectedSlotContext({
        serviceId: null,
        bundleId: 0,
        virtualServiceId: 0,
      });
      if (serviceid !== id || virtualServiceId !== normalizedVirtualId) {
        setServiceOptionChoices(null);
        setSelectedServiceOptionId(0);
      }
    }

    dispatch(setLoading(true));
    setReadmorecl(false);
    setGiftQuantity(1);
    setServiceId(id);
    setBundleId(normalizedBundleId);
    setVirtualServiceId(normalizedVirtualId);
    let allService = gift ? true : false;
    allService = all ? true : allService;
    const [{ data }, extrasResponse] = await Promise.all([
      axiosInstance(
        `/service-details?date=${moment(date).format(
          "YYYY-MM-DD",
        )}&service_id=${id}${normalizedVirtualId > 0 ? `&virtual_service_id=${normalizedVirtualId}` : ""}&all=${allService}&is_bundle=${normalizedBundleId > 0 ? true : false}&bundle_id=${normalizedBundleId}`,
        {
          method: "get",
        },
      ),
      axiosInstance(
        `/extras?date=${moment(date).format(
          "YYYY-MM-DD",
        )}&service_id=${id}&all=${gift ? true : false}&bundle_id=${normalizedBundleId}&time_slot=${encodeURIComponent(extrasTimeSlot)}&selected_virtual_service_id=${normalizedVirtualId}`,
        {
          method: "get",
        },
      ).catch(() => null),
    ]);

    const extrasData = extrasResponse?.data;
    if (extrasData?.status == 200) {
      const choices =
        extrasData?.service_option_choices ||
        extrasData?.data?.service_option_choices;
      setServiceOptionChoices(choices?.mode === "choice" ? choices : null);
      if (choices?.mode === "choice") {
        const options = [
          choices.base_option,
          ...(Array.isArray(choices.options) ? choices.options : []),
        ].filter(Boolean);
        const savedOptionId = normalizeBundleId(cart?.service_option?.id);
        const selectedOption =
          options.find(
            (option) => normalizeBundleId(option?.id) === savedOptionId,
          ) ||
          options.find((option) => option?.is_default) ||
          choices.base_option ||
          options[0];
        const selectedOptionId = normalizeBundleId(selectedOption?.id);
        setSelectedServiceOptionId(selectedOptionId);
        if (selectedOption) {
          dispatch(
            setCart({
              ...cart,
              service_option: selectedOptionId,
              service_option_details: selectedOption,
            }),
          );
        }
      }
    }

    if (data && data.status == 200) {
      if (data.data.length == 0) {
        setProductDetails({});
        setDetailsDate("");
        setDetailsPending(false);
        Swal.fire({
          toast: true,
          position: "top-end", // or 'bottom-end', 'top-start', etc.
          showConfirmButton: false,
          timer: 3000, // auto-close after 3 seconds
          icon: "warning", // 'success', 'error', 'warning', 'info', 'question'
          titleText: toPlainText(data?.message),
        });
        dispatch(setLoading(false));
        return;
      }
      setProductDetails(data?.data);
      const capacityLeft = data?.data?.svc_total_cap_left;
      if (
        capacityLeft !== null &&
        capacityLeft !== undefined &&
        String(capacityLeft).trim() !== "" &&
        Number(capacityLeft) === 0
      ) {
        setSlot("");
        setBook(0);
        setCurrentItem({});
      }
      setDetailsDate(requestDate);
      setDetailsPending(false);
      setVisible(true);

      if (data?.data?.date_slots) {
        const serviceDateSlots = data?.data?.date_slots || [];
        setDateslot(serviceDateSlots);

        const selectedDateExists = serviceDateSlots.some((slotItem) =>
          moment(slotItem?.date).isSame(
            moment(date).format("YYYY-MM-DD"),
            "day",
          ),
        );

        if (!selectedDateExists && serviceDateSlots[0]?.date) {
          dispatch(setDate(serviceDateSlots[0].date));
        }
      }

      if (!gift && normalizedVirtualId > 0) {
        setCalendarslots(
          (data.data.date_slots || []).map((item) => ({
            ...item,
            ...item.slots,
          })),
        );
        setDisabledDates([]);
        dispatch(setLoading(false));
      } else if (!gift) {
        const monthYear = moment().format("YYYY-MM");
        getslotavailabilitycalendar(
          monthYear,
          id,
          normalizedBundleId,
          normalizedVirtualId,
        );
      } else {
        dispatch(setLoading(false));
      }
    } else {
      setDetailsPending(false);
      dispatch(setLoading(false));
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        icon: "error",
        titleText: toPlainText(
          data?.message || "Unable to load service details",
        ),
      });
    }
  };

  const getslotavailabilitycalendarRequest = async (
    monthYear,
    id,
    selectedBundleId = bundleId,
    selectedVirtualId = virtualServiceId,
  ) => {
    const normalizedBundleId = normalizeBundleId(selectedBundleId);
    /* Slot availability calendar */
    const { data: dataa } = await axiosInstance(
      selectedVirtualId > 0
        ? `/service-details?service_id=${id}&virtual_service_id=${selectedVirtualId}&date=${moment.max(moment(`${monthYear}-01`), moment().startOf("day")).format("YYYY-MM-DD")}`
        : `/slot-availability-calendar?month=${monthYear}&service_id=${id}&is_bundle=${normalizedBundleId > 0 ? true : false}&bundle_id=${normalizedBundleId}`,
      {
        method: "get",
      },
    );

    if (dataa?.data) {
      const datedarr = [];
      const calendarDays =
        selectedVirtualId > 0
          ? (dataa.data.date_slots || []).map((item) => ({
              ...item,
              ...item.slots,
            }))
          : dataa.data;
      setCalendarslots(calendarDays);
      calendarDays.forEach((dateItem) => {
        if (dateItem.is_bookable === false) {
          // moment parses "YYYY-MM-DD" as local midnight; new Date() would use UTC
          // and shift the day for users west of UTC.
          datedarr.push(moment(dateItem.date).toDate());
        }
      });
      setDisabledDates(datedarr);
    }
    dispatch(setLoading(false));
  };

  useEffect(() => {
    if (!props.popupOnly || !props.openRequest || !props.requestedServiceId) {
      return;
    }

    servicedetail(
      props.requestedServiceId,
      props.requestedBundleId ?? 0,
      props.requestedVirtualServiceId ?? 0,
    );
    // The request counter deliberately controls each external popup launch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.openRequest,
    props.popupOnly,
    props.requestedServiceId,
    props.requestedBundleId,
    props.requestedVirtualServiceId,
  ]);

  useEffect(() => {
    if (props.popupOnly && visible && serviceid) {
      setSlot("");
      setBook(0);
      servicedetail(serviceid, bundleId, virtualServiceId);
    }
    // Refresh the popup details when its selected date changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  useEffect(() => {
    if (
      !showParticipantStep ||
      !visible ||
      gift ||
      bundleId > 0 ||
      virtualServiceId > 0 ||
      !serviceid ||
      !participantStart
    )
      return;

    const controller = new AbortController();
    let active = true;
    setParticipantLoading(true);
    setParticipantError("");

    const loadParticipants = async () => {
      try {
        const { data: response } = await axiosInstance.get(
          `/services/${serviceid}/participants`,
          {
            params: {
              date: moment(date).format("YYYY-MM-DD"),
              start: participantStart,
              line_key: participantLineKey.current,
              option_value_ids:
                selectedServiceOptionId > 0 ? selectedServiceOptionId : "",
            },
            signal: controller.signal,
          },
        );
        if (!active) return;
        if (response?.status !== 200 || !response?.data?.categories) {
          throw new Error(
            response?.message ||
              "Participant options are unavailable for this slot.",
          );
        }
        setParticipantConfig(response.data);
        setParticipantConfigKey(participantRequestKey);
        if (participantDefaultsKey.current !== participantRequestKey) {
          const adult = normalizeParticipantGroups(response.data).find(
            (group) => group.category === "adult" && !group.disabled,
          );
          setParticipants(adult ? { [adult.key]: 1 } : {});
          setBook(adult ? 1 : 0);
          participantDefaultsKey.current = participantRequestKey;
        }
      } catch (error) {
        if (!active) return;
        setParticipantConfig(null);
        setParticipantError(
          error?.data?.message ||
            error?.response?.data?.message ||
            error?.message ||
            "Unable to load participant options. Please try again.",
        );
      } finally {
        if (active) setParticipantLoading(false);
      }
    };
    loadParticipants();
    return () => {
      active = false;
      controller.abort();
    };
  }, [
    showParticipantStep,
    visible,
    gift,
    bundleId,
    virtualServiceId,
    serviceid,
    date,
    participantStart,
    selectedServiceOptionId,
    participantRequestKey,
    participantRetry,
  ]);

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

  const formatCalculatedPrice = (price, formattedPrice, quantity) => {
    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice)) return "";

    const decodedTemplate = decodeHtml(formattedPrice || "").toString();
    const firstDigitIndex = decodedTemplate.search(/\d/);
    const lastDigitIndex = Math.max(
      decodedTemplate.lastIndexOf("0"),
      decodedTemplate.lastIndexOf("1"),
      decodedTemplate.lastIndexOf("2"),
      decodedTemplate.lastIndexOf("3"),
      decodedTemplate.lastIndexOf("4"),
      decodedTemplate.lastIndexOf("5"),
      decodedTemplate.lastIndexOf("6"),
      decodedTemplate.lastIndexOf("7"),
      decodedTemplate.lastIndexOf("8"),
      decodedTemplate.lastIndexOf("9"),
    );
    const decimalSeparator = decodedTemplate.includes(",") ? "," : ".";
    const total = (numericPrice * quantity)
      .toFixed(2)
      .replace(".", decimalSeparator);

    if (firstDigitIndex === -1 || lastDigitIndex === -1) return total;

    return `${decodedTemplate.slice(0, firstDigitIndex)}${total}${decodedTemplate.slice(lastDigitIndex + 1)}`;
  };

  const getBundleIncludedCount = (product) => {
    const rawCount = product?.is_bundle;
    const count = Number(rawCount);
    return count > 0 ? count : 0;
  };

  const getServiceCardClassName = (product) => {
    const includedCount = getBundleIncludedCount(product);
    const productBundleId = normalizeBundleId(product?.bundle_id);

    const classes = [
      props.showBookNowButton == "true"
        ? "fx-servicebox fx-servicebox-add-button"
        : "fx-servicebox fx-bundle-content",
    ];

    if (
      serviceid === product.id &&
      normalizeBundleId(bundleId) === productBundleId &&
      virtualServiceId === getVirtualServiceId(product)
    ) {
      classes.push("fx-servicebox-selected");
    }
    if (includedCount > 0) {
      classes.push("fx-servicebox-has-tooltip");
      classes.push("fx-servicebox-bundle-highlight");
    }
    return classes.join(" ");
  };

  const getListCardClassName = (product) => {
    const includedCount = getBundleIncludedCount(product);
    const classes = ["fx-serviceboxlist"];

    if (includedCount > 0) {
      classes.push("fx-servicebox-has-tooltip");
      classes.push("fx-servicebox-bundle-highlight");
    }

    return classes.join(" ");
  };

  const renderBundleTooltip = (product) => {
    const includedCount = getBundleIncludedCount(product);
    if (includedCount <= 0) return null;

    const tooltipText =
      product?.bundle_tooltip ||
      product?.svc_long_desc ||
      "Open this experience to view all included details, options, and pricing information.";

    return (
      <div className="fx-tooltip-wrapper">
        <div className="fx-top-icon" aria-hidden="true">
          <i className="pi pi-gift"></i>
        </div>
        <div className="fx-tooltip-box" role="tooltip">
          {tooltipText}
        </div>{" "}
      </div>
    );
  };

  // Template for each carousel item
  const productTemplate = (product) => {
    return (
      <ServiceCard
        product={product}
        className={getServiceCardClassName(product)}
        onClick={() => openProductDetails(product)}
        decoration={renderBundleTooltip(product)}
        showCategory={props.categoryLabelVisibility == "true"}
        imageLoaded={Boolean(loadedServiceImages[product.id])}
        onImageLoad={() => markServiceImageLoaded(product.id)}
        description={decodeHtml(product.svc_short_desc)}
      >
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openProductDetails(product);
            }}
          >
            <a href="#" onClick={(e) => e.preventDefault()}>
              {gift ? "Select Gift" : "Book Now"}
            </a>
          </div>
        )}
      </ServiceCard>
    );
  };

  const selectServiceTimeSlot = (item) => {
    if (
      isPopupBookingDisabled ||
      item?.slot_type !== "active" ||
      Number(item.capacity_left) <= 0
    )
      return;
    if (slot !== item.time_slot) {
      participantDefaultsKey.current = null;
      setParticipants({});
      setParticipantConfig(null);
      setParticipantError("");
      setBook(0);
    }
    setCurrentItem(item);
    setSlot(item.time_slot);
    setSelectedSlotContext({
      serviceId: serviceid,
      bundleId: normalizeBundleId(bundleId),
      virtualServiceId,
    });
  };

  const changeParticipantCount = (group, delta) => {
    if (isPopupBookingDisabled || !participantConfigReady) return;
    const policy = participantGroups.find((item) => item.key === group);
    if (!policy || policy.disabled) return;
    const nextCount = (participants[group] || 0) + delta;
    if (nextCount < 0) return;
    const nextParticipants = { ...participants, [group]: nextCount };
    const nextSelection = getParticipantSelection(
      participantConfig,
      participantGroups,
      nextParticipants,
      selectedSlotCapacity,
      detailCapacity,
    );
    if (
      delta > 0 &&
      (nextSelection.total > nextSelection.maximum ||
        nextSelection.counting > nextSelection.physicalCapacity)
    )
      return;
    setParticipants(nextParticipants);
    setBook(nextSelection.total);
  };

  const getBundleScheduleFromResponse = (responseData) => {
    const candidates = [
      responseData?.bundle_slots,
      responseData?.data?.bundle_slots,
      responseData?.bundle_time_slots,
      responseData?.data?.bundle_time_slots,
      responseData?.slots?.bundle_time_slots,
      responseData?.data?.slots?.bundle_time_slots,
      responseData?.data,
      responseData,
    ];

    const directSchedule = candidates.find(
      (candidate) =>
        candidate &&
        Array.isArray(candidate.components) &&
        Object.prototype.hasOwnProperty.call(candidate, "bookable"),
    );
    if (directSchedule) {
      return {
        ...directSchedule,
        bundle_capacity_left:
          responseData?.data?.bundle_capacity_left ??
          responseData?.bundle_capacity_left ??
          directSchedule.bundle_capacity_left,
      };
    }

    const dateSlotCollections = [
      responseData?.date_slots,
      responseData?.data?.date_slots,
    ];
    for (const collection of dateSlotCollections) {
      const matchingDateSlot = collection?.find(
        (dateSlot) => dateSlot?.date === moment(date).format("YYYY-MM-DD"),
      );
      if (matchingDateSlot?.slots?.bundle_time_slots) {
        return matchingDateSlot.slots.bundle_time_slots;
      }
    }

    return null;
  };

  const getDefaultBundleTab = (component) => {
    if (component?.available_slots?.morning?.length) return "morning";
    if (component?.available_slots?.afternoon?.length) return "afternoon";
    return "all";
  };

  const selectBundleComponentSlot = async (component, slotItem) => {
    if (isPopupBookingDisabled) return;
    if (component?.state === "waiting" || bundleScheduleLoading) return;

    const componentPosition = Number(component?.component_position);
    const selectedSlot = {
      bundle_item_id: component?.bundle_item_id,
      service_id: component?.service_id,
      component_position: componentPosition,
      slot_label: slotItem?.slot_label,
      from: slotItem?.from,
      to: slotItem?.to,
    };
    const nextSelectedSlots = [
      ...selectedBundleComponentSlots.filter(
        (item) => Number(item?.component_position) < componentPosition,
      ),
      selectedSlot,
    ];

    setBundleScheduleLoading(true);
    dispatch(setLoading(true));
    try {
      const { data: responseData } = await axiosInstance.post(
        "/bundle-component-schedule",
        {
          service_id: productDetails.id,
          bundle_id: bundleId,
          date: moment(date).format("YYYY-MM-DD"),
          total_service_booking: bundleQuantity,
          time_slot: slotItem?.slot_label,
          selected_component_slots: nextSelectedSlots,
        },
      );
      const nextSchedule = getBundleScheduleFromResponse(responseData);

      if (!nextSchedule) {
        throw new Error(
          responseData?.message || "Unable to load the next bundle component",
        );
      }

      setBundleSelectedSlots(
        Array.isArray(nextSchedule.selected_component_slots) &&
          nextSchedule.selected_component_slots.length > 0
          ? nextSchedule.selected_component_slots
          : nextSelectedSlots,
      );
      setBundleSchedule({
        ...nextSchedule,
        components: nextSchedule.components.map((nextComponent) => {
          if (nextComponent?.state !== "selected") return nextComponent;

          const previousComponent = bundleComponents.find(
            (currentComponent) =>
              Number(currentComponent?.component_position) ===
              Number(nextComponent?.component_position),
          );
          return previousComponent
            ? {
                ...nextComponent,
                available_slots: previousComponent.available_slots,
              }
            : nextComponent;
        }),
      });
      setExpandedBundlePosition(Number(nextSchedule.active_position) || 0);
    } catch (error) {
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        icon: "error",
        title:
          error?.response?.data?.message ||
          error?.message ||
          "Unable to load the next bundle component",
      });
    } finally {
      setBundleScheduleLoading(false);
      dispatch(setLoading(false));
    }
  };

  const bookBundleService = async () => {
    if (isPopupBookingDisabled) return;
    if (!bundleAllSelected || selectedBundleComponentSlots.length === 0) {
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        icon: "warning",
        title:
          bundleTimeSlots?.blocker_message ||
          "Please choose every bundle component slot",
      });
      return;
    }

    if (bundleParticipantsBlocking) {
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        icon: "info",
        title: "Please choose the participants for each included service",
      });
      return;
    }
    // Re-check the chosen parties against live capacity before pricing.
    if (bundleParticipants.required && !(await bundleParticipants.validate())) {
      return;
    }

    dispatch(setLoading(true));
    try {
      const encodedComponentSlots = encodeURIComponent(
        JSON.stringify(selectedBundleComponentSlots),
      );
      const { data } = await axiosInstance(
        `/price-format?service_id=${productDetails.id}&capacity=${bundleQuantity}&date=${moment(
          date,
        ).format(
          "YYYY-MM-DD",
        )}&extra_id=${extraid}&extra_capacity=${extracapacity}&extra_types=${encodeURIComponent(extraTypeStr)}&is_bundle=true&bundle_id=${bundleId}&service_option_id=${selectedServiceOptionId}&selected_component_slots=${encodedComponentSlots}`,
        { method: "get" },
      );
      cartupdate(data);
      dispatch(setTimeslot(""));
      dispatch(setCapacity(bundleQuantity));
      dispatch(setService(serviceid));
      setVisible(false);
      hasExtra();
    } catch (error) {
      dispatch(setLoading(false));
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        icon: "error",
        title:
          error?.response?.data?.message ||
          "Unable to calculate the bundle price",
      });
    }
  };

  const bookserviceRequest = async () => {
    if (!canContinueService) {
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

    if (isVirtualSelection) {
      if (!virtualQuantityValid || virtualParticipantsBlocking) return;
      // Re-check the chosen visitors against live capacity before pricing.
      if (
        virtualParticipants.required &&
        !(await virtualParticipants.validate())
      )
        return;
    } else if (
      book <
      (participantConfig?.quantity_rules?.minimum_quantity ??
        currentitem.min_capacity)
    ) {
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
      }&capacity=${book}&date=${moment(date).format("YYYY-MM-DD")}&time_slot=${encodeURIComponent(slot)}&extra_id=${extraid}&extra_capacity=${extracapacity}&extra_types=${encodeURIComponent(extraTypeStr)}&is_bundle=${bundleId > 0 ? true : false}&bundle_id=${bundleId}&service_option_id=${selectedServiceOptionId}&selected_virtual_service_id=${virtualServiceId}`,
      {
        method: "get",
      },
    );
    cartupdate(data);
    dispatch(setTimeslot(slot));
    dispatch(setCapacity(book));
    dispatch(setService(serviceid));
    setVisible(false);
    hasExtra();
  };

  const cartupdate = (data) => {
    let cartobj = {};
    if (
      bundleId > 0 &&
      (!data?.data?.bundle_items || !data?.data?.bundle_components)
    ) {
      const pricedBundleComponents =
        [
          data?.data?.bundle_items?.items,
          data?.data?.bundle_components,
          data?.data?.bundle_component_details,
          data?.data?.bundle_details?.components,
          data?.data?.components,
        ].find(Array.isArray) || [];
      const cartBundleComponents = bundleComponents.map((component) => {
        const componentPosition = Number(component?.component_position);
        const selectedComponentSlot = selectedBundleComponentSlots.find(
          (selectedItem) =>
            Number(selectedItem?.component_position) === componentPosition,
        );
        const pricedComponent = pricedBundleComponents.find(
          (pricedItem) =>
            Number(pricedItem?.bundle_item_id ?? pricedItem?.id) ===
              Number(component?.bundle_item_id) ||
            Number(
              pricedItem?.component_position ??
                Number(pricedItem?.item_position) + 1,
            ) === componentPosition,
        );
        const componentAvailableSlots = Object.values(
          component?.available_slots || {},
        )
          .filter(Array.isArray)
          .flat();
        const selectedAvailableSlot = componentAvailableSlots.find(
          (availableSlot) =>
            availableSlot?.slot_label === selectedComponentSlot?.slot_label,
        );
        const componentQuantity =
          (Number(component?.quantity) || 0) * bundleQuantity;
        const slotUnitPrice =
          pricedComponent?.item_price ??
          selectedAvailableSlot?.slot_price ??
          pricedComponent?.unit_price ??
          pricedComponent?.price ??
          component?.unit_price ??
          component?.price;
        const slotUnitPriceFormatted =
          pricedComponent?.unit_price_formatted ||
          pricedComponent?.price_formatted ||
          selectedAvailableSlot?.slot_price_formatted ||
          component?.unit_price_formatted ||
          component?.price_formatted ||
          "";
        const calculatedLineTotal = formatCalculatedPrice(
          slotUnitPrice,
          slotUnitPriceFormatted,
          componentQuantity,
        );
        const apiLineTotalFormatted = formatCalculatedPrice(
          pricedComponent?.line_total,
          data?.data?.total_formated,
          1,
        );

        return {
          bundle_item_id: component?.bundle_item_id,
          service_id: component?.service_id,
          component_position: componentPosition,
          component_label: component?.component_label,
          service_name: component?.service_name,
          quantity: componentQuantity,
          date: moment(date).format("YYYY-MM-DD"),
          slot_label: selectedComponentSlot?.slot_label || "",
          from: selectedComponentSlot?.from || "",
          to: selectedComponentSlot?.to || "",
          unit_price: slotUnitPrice,
          unit_price_formatted: slotUnitPriceFormatted,
          line_total_formatted:
            pricedComponent?.line_total_formatted ||
            pricedComponent?.total_formatted ||
            apiLineTotalFormatted ||
            component?.line_total_formatted ||
            component?.total_formatted ||
            calculatedLineTotal ||
            pricedComponent?.line_total ||
            pricedComponent?.total ||
            "",
        };
      });
      const bundleTotals = data?.data?.bundle_items?.totals;

      cartobj = {
        id: data?.data?.service_id || productDetails.id,
        name: productDetails.service_title,
        price: productDetails.svc_price,
        total: data?.data?.service_total,
        total_formatted: data?.data?.service_total,
        slot: "",
        capacity: data?.data?.service_capacity || bundleQuantity,
        bundle_quantity: bundleQuantity,
        bundle_id: bundleId,
        selected_component_slots: selectedBundleComponentSlots,
        bundle_components: cartBundleComponents,
        line_key: participantLineKey.current,
        capacity_component_guests: bundleParticipants.required
          ? bundleParticipants.guests
          : {},
        bundle_pricing: bundleTotals
          ? {
              subtotal: bundleTotals.subtotal,
              subtotal_formatted: formatCalculatedPrice(
                bundleTotals.subtotal,
                data?.data?.total_formated,
                1,
              ),
              discount_type: bundleTotals.discount_type,
              discount_value: bundleTotals.discount_value,
              discount_amount: bundleTotals.discount_amount,
              discount_amount_formatted: formatCalculatedPrice(
                bundleTotals.discount_amount,
                data?.data?.total_formated,
                1,
              ),
              final_price: bundleTotals.final_price,
              final_price_formatted:
                data?.data?.service_total || data?.data?.total_formated,
            }
          : null,
      };
    } else {
      cartobj = {
        id: data?.data?.service_id,
        name: productDetails.service_title,
        price: productDetails.svc_price,
        total: data?.data?.service_total,
        total_formatted: data?.data?.service_total,
        slot: slot,
        capacity: data?.data?.service_capacity,
        bundle_id: bundleId > 0 ? bundleId : null,
        product_type: virtualServiceId > 0 ? "virtual_service" : "service",
        product_id: virtualServiceId > 0 ? virtualServiceId : productDetails.id,
        virtual_service_id: virtualServiceId || null,
        selected_virtual_service_id: virtualServiceId || null,
        components: virtualServiceId > 0 ? productDetails.components || [] : [],
        participants: gift || isVirtualSelection ? null : { ...participants },
        participant_guests:
          gift || isVirtualSelection ? [] : participantSelection.guests,
        participant_configuration:
          gift || isVirtualSelection ? null : participantConfig,
        capacity_component_guests:
          isVirtualSelection && virtualParticipants.required
            ? virtualParticipants.guests
            : {},
        line_key: participantLineKey.current,
      };
    }
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
  };

  const giftbookserviceRequest = async () => {
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
      )}&extra_id=${extraid}&extra_capacity=${extracapacity}&extra_types=${encodeURIComponent(extraTypeStr)}&is_bundle=${bundleId > 0 ? true : false}&bundle_id=${bundleId}&service_option_id=${selectedServiceOptionId}&selected_virtual_service_id=${virtualServiceId}`,
      {
        method: "get",
      },
    );

    cartupdate(data);
    dispatch(setTimeslot(""));
    dispatch(setCapacity(giftQuantity));
    dispatch(setService(serviceid));
    setVisible(false);
    hasExtra();
  };

  const hasExtraRequest = async () => {
    const selectedComponentSlot = selectedBundleComponentSlots.find(
      (component) => String(component.service_id) === String(serviceid),
    );
    const timeSlot = gift
      ? ""
      : formatExtrasTimeSlot(bundleId > 0 ? selectedComponentSlot : slot);
    dispatch(setLoading(true));
    const { data } = await axiosInstance(
      `/has-extra?date=${moment(date).format(
        "YYYY-MM-DD",
      )}&service_id=${serviceid}&all=${gift ? true : false}&bundle_id=${bundleId}&time_slot=${encodeURIComponent(timeSlot)}&selected_virtual_service_id=${virtualServiceId}`,
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

  const addtocartRequest = async () => {
    dispatch(setLoading(true));
    const { data } = await axiosInstance.post(`/addtocart`, {
      ...(!gift &&
      bundleId === 0 &&
      virtualServiceId === 0 &&
      participantSelection.guests.length > 0
        ? {
            capacity_line_key: participantLineKey.current,
            capacity_guests: participantSelection.guests,
          }
        : {}),
      ...(!gift && bundleId > 0 && bundleParticipants.required
        ? {
            capacity_line_key: participantLineKey.current,
            capacity_component_guests: bundleParticipants.guests,
          }
        : {}),
      ...(isVirtualSelection && virtualParticipants.required
        ? {
            capacity_line_key: participantLineKey.current,
            capacity_component_guests: virtualParticipants.guests,
          }
        : {}),
      service_id: serviceid,
      date: moment(date).format("YYYY-MM-DD"),
      total_service_booking:
        bundleId > 0 ? bundleQuantity : gift ? giftQuantity : book,
      time_slot: slot,
      extra_svc_ids: [],
      extra_types: null,
      no_of_persons: 0,
      gift,
      selected_bundle_id: bundleId > 0 ? bundleId : null,
      selected_virtual_service_id: virtualServiceId || null,
      selected_component_slots:
        bundleId > 0 ? selectedBundleComponentSlots : [],
      option_value_ids:
        selectedServiceOptionId > 0 ? selectedServiceOptionId : null,
    });
    if (data && data.status == 200 && data.data.booking_string) {
      dispatch(setBookingkey(data.data.booking_string));
      dispatch(
        setStep(gift && !opendatepurchase ? "customizestep" : "checkoutstep"),
      );
      dispatch(setLoading(false));
    } else {
      Swal.fire({
        toast: true,
        position: "top-end", // or 'bottom-end', 'top-start', etc.
        showConfirmButton: false,
        timer: 3000, // auto-close after 3 seconds
        icon: "error", // 'success', 'error', 'warning', 'info', 'question'
        titleText: toPlainText(
          data?.message ?? "There is some error , please try again",
        ),
      });
      dispatch(setLoading(false));
    }
  };

  // Every API step below can fail (network, 5xx, nonce refresh failure). Without a
  // guard the rejected promise leaves the fullscreen loader on forever.
  const guardRequest =
    (request, fallbackMessage) =>
    async (...args) => {
      try {
        return await request(...args);
      } catch (error) {
        console.error(fallbackMessage, error);
        setLoadingske(false);
        setDetailsPending(false);
        dispatch(setLoading(false));
        Swal.fire({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          icon: "error",
          titleText: toPlainText(
            error?.data?.message ||
              error?.response?.data?.message ||
              fallbackMessage,
          ),
        });
        return undefined;
      }
    };
  const fetchProductsByDate = guardRequest(
    fetchProductsByDateRequest,
    "Unable to load services for the selected date",
  );
  const servicedetail = guardRequest(
    servicedetailRequest,
    "Unable to load service details",
  );
  const getslotavailabilitycalendar = guardRequest(
    getslotavailabilitycalendarRequest,
    "Unable to load slot availability",
  );
  const bookservice = guardRequest(
    bookserviceRequest,
    "Unable to calculate the price",
  );
  const giftbookservice = guardRequest(
    giftbookserviceRequest,
    "Unable to calculate the price",
  );
  const hasExtra = guardRequest(hasExtraRequest, "Failed to fetch extras");
  const addtocart = guardRequest(
    addtocartRequest,
    "Unable to add the service to the cart",
  );

  const displayedProducts =
    selectedCategory === "all"
      ? products
      : products.filter(
          (p) => (p.category_name || p.category) === selectedCategory,
        );

  const selectedDate = moment(date).format("YYYY-MM-DD");
  const slotObj = dateslot.find((s) => s?.date === selectedDate);
  const bundleTimeSlots =
    bundleSchedule || slotObj?.slots?.bundle_time_slots || null;
  const bundleComponents = Array.isArray(bundleTimeSlots?.components)
    ? bundleTimeSlots.components
    : [];
  const selectedBundleComponentSlots =
    Array.isArray(bundleTimeSlots?.selected_component_slots) &&
    bundleTimeSlots.selected_component_slots.length > 0
      ? bundleTimeSlots.selected_component_slots
      : bundleSelectedSlots;
  const bundleAllSelected =
    !isPopupBookingDisabled &&
    Boolean(
      bundleTimeSlots?.bookable ||
      (Number(bundleTimeSlots?.total_count) > 0 &&
        selectedBundleComponentSlots.length >=
          Number(bundleTimeSlots?.total_count)),
    );
  const maxBundleQuantity = Math.max(
    1,
    Number(bundleTimeSlots?.bundle_capacity_left) || 1,
  );
  const openBundlePosition =
    expandedBundlePosition ?? (Number(bundleTimeSlots?.active_position) || 0);

  const shouldShowCategoryFilter =
    !skeloading &&
    categories.length >= 2 &&
    (isDesktop ? products.length >= 9 : products.length >= 6);

  const isBundleSelection = normalizeBundleId(bundleId) > 0;

  // Once every bundle component has a slot, load the participant rules for each
  // component (POST bm-capacity/v1/services/{id}/component-participants).
  const bundleParticipants = useBundleParticipants(
    isBundleSelection && showBundleSlots && bundleAllSelected && !gift
      ? buildBundleParticipantsRequest({
          serviceId: serviceid,
          bundleId: normalizeBundleId(bundleId),
          date: moment(date).format("YYYY-MM-DD"),
          quantity: bundleQuantity,
          componentSlots: selectedBundleComponentSlots,
          lineKey: participantLineKey.current,
        })
      : null,
  );
  const bundleParticipantsBlocking =
    bundleParticipants.visible &&
    (bundleParticipants.loading ||
      bundleParticipants.checking ||
      Boolean(bundleParticipants.error) ||
      (bundleParticipants.required && !bundleParticipants.valid));

  const updateGiftQuantity = (type) => {
    setGiftQuantity((prev) => {
      const current = Number(prev) || 1;
      if (type === "minus") {
        return Math.max(1, current - 1);
      }
      return current + 1;
    });
  };

  const markServiceImageLoaded = (id) => {
    setLoadedServiceImages((prev) => {
      if (prev[id]) return prev;
      return { ...prev, [id]: true };
    });
  };

  const selectServiceOption = (option) => {
    const optionId = normalizeBundleId(option?.id);
    setSelectedServiceOptionId(optionId);
    dispatch(
      setCart({
        ...cart,
        service_option: optionId,
        service_option_details: option,
      }),
    );
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

  useEffect(() => {
    setBundleQuantity((quantity) =>
      Math.min(Math.max(1, quantity), maxBundleQuantity),
    );
  }, [maxBundleQuantity]);

  return (
    <div
      className="fx-leftcontentbox"
      style={{
        display: props.popupOnly
          ? "none"
          : step === "servicesstep"
            ? "block"
            : "none",
      }}
    >
      <div className="fx-top-box-tab-content">
        {!redeemBooking &&
          props.stepsVisibility?.step_2_title_visible == "true" && (
            <h1
              className="fx-all-main-heading"
              style={{
                display:
                  props.mobileHeading == "false" && !isDesktop
                    ? "none"
                    : "block",
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
          </div>

          <div className="fx-card-skeleton">
            <div className="fx-sk-img"></div>
            <div className="fx-sk-tag"></div>
            <div className="fx-sk-title"></div>
            <div className="fx-sk-text"></div>
            <div className="fx-sk-text short"></div>
            <div className="fx-sk-price"></div>
          </div>

          <div className="fx-card-skeleton">
            <div className="fx-sk-img"></div>
            <div className="fx-sk-tag"></div>
            <div className="fx-sk-title"></div>
            <div className="fx-sk-text"></div>
            <div className="fx-sk-text short"></div>
            <div className="fx-sk-price"></div>
          </div>

          <div className="fx-card-skeleton">
            <div className="fx-sk-img"></div>
            <div className="fx-sk-tag"></div>
            <div className="fx-sk-title"></div>
            <div className="fx-sk-text"></div>
            <div className="fx-sk-text short"></div>
            <div className="fx-sk-price"></div>
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
                  <ServiceCard
                    product={product}
                    className={getServiceCardClassName(product)}
                    key={p1}
                    onClick={() => openProductDetails(product)}
                    decoration={renderBundleTooltip(product)}
                    showCategory={props.categoryLabelVisibility == "true"}
                    imageLoaded={Boolean(loadedServiceImages[product.id])}
                    onImageLoad={() => markServiceImageLoaded(product.id)}
                  >
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
                      {props.showBookNowButton !== "true" && (
                        <i className="pi pi-chevron-right"></i>
                      )}
                    </p>

                    {props.showBookNowButton == "true" && (
                      <div
                        className="booknowbtn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openProductDetails(product);
                        }}
                      >
                        <a href="#" onClick={(e) => e.preventDefault()}>
                          {gift ? "Select Gift" : "Book Now"}
                        </a>
                      </div>
                    )}
                  </ServiceCard>
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
                  className={getListCardClassName(product)}
                  key={p2}
                  onClick={() => openProductDetails(product)}
                >
                  <div className="fx-servicepicboxlist">
                    <div className="fx-list-img-box">
                      {!loadedServiceImages[product.id] && (
                        <div className="fx-image-loader"></div>
                      )}
                      <img
                        src={product.svc_img}
                        alt={product.service_title || product.service_name}
                        onLoad={() => markServiceImageLoaded(product.id)}
                        onError={() => markServiceImageLoaded(product.id)}
                      />
                    </div>
                    {renderBundleTooltip(product)}
                    {props.categoryLabelVisibility == "true" && (
                      <span className="fx-servicepiccontentbox">
                        {product.category_name}
                      </span>
                    )}
                  </div>
                  <div className="fx-servicecontentboxlist">
                    <div className="list-view-text-content">
                      {/* List view has room for the full name (service_name is truncated by the API). */}
                      <h4>{product.service_title || product.service_name}</h4>
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
            setShowBundleSlots(false);
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
              {serviceOptionList.length > 0 && !serviceOptionsConfirmed && (
                <div className="fx-service-details-content-box">
                  <h1>Service Variant</h1>
                  {serviceOptionChoices?.description && (
                    <div className="fx-info-box">
                      <span className="fx-info-icon">i</span>
                      <span>{serviceOptionChoices.description}</span>
                    </div>
                  )}

                  <div className="fx-service-grid">
                    {serviceOptionList.map((option) => {
                      const optionId = normalizeBundleId(option?.id);
                      const isSelected = optionId === selectedServiceOptionId;
                      return (
                        <label className="fx-service-card" key={optionId}>
                          <input
                            type="radio"
                            name="service-option"
                            checked={isSelected}
                            onChange={() => selectServiceOption(option)}
                          />
                          <h3 className="fx-service-title">
                            {decodeHtml(option?.name || "Option")}
                          </h3>
                          <div className="fx-service-description-box">
                            {/* Always render, even when empty, so option cards line up. */}
                            <p className="fx-service-description">
                              {decodeHtml(option?.description || "")}
                            </p>
                          </div>
                          <div className="fx-service-price">
                            {option?.effective_price_display ||
                              decodeHtml(String(option?.effective_price ?? ""))}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className="fx-service-option-continue"
                    onClick={() => setServiceOptionsConfirmed(true)}
                  >
                    Continue
                  </button>
                </div>
              )}
              {(serviceOptionList.length === 0 || serviceOptionsConfirmed) && (
                <>
                  <div
                    className="fx-service-details-popup"
                    style={{
                      display:
                        isBundleSelection && showBundleSlots
                          ? "none"
                          : undefined,
                    }}
                  >
                    <div className="fx-leftpopup">
                      {serviceOptionList.length > 0 && (
                        <button
                          type="button"
                          className="fx-service-option-back"
                          onClick={() => setServiceOptionsConfirmed(false)}
                        >
                          <i
                            className="pi pi-arrow-left"
                            aria-hidden="true"
                          ></i>
                          Back
                        </button>
                      )}
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
                        gift
                          ? "fx-rightpopup-middle fx-rightpopup"
                          : "fx-rightpopup"
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
                                  readmorecl || gift
                                    ? "fx-expand-readmore"
                                    : "fx-des"
                                }
                              >
                                {decodeHtml(productDetails.svc_long_desc)}
                              </span>
                              {productDetails.svc_long_desc != "N/A" &&
                                (productDetails.svc_long_desc
                                  ?.trim()
                                  .split(/\s+/).length ?? 0) > 25 &&
                                !gift && (
                                  <span
                                    className="readmore"
                                    onClick={() => setReadmorecl(!readmorecl)}
                                  >
                                    {readmorecl ? "Read Less" : "Read More"}
                                  </span>
                                )}
                            </p>

                            <div className="fx-common">
                              {/* <h5>Quantity</h5> */}
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
                                  readmorecl || gift
                                    ? "fx-expand-readmore"
                                    : "fx-des"
                                }
                              >
                                {decodeHtml(productDetails.svc_long_desc)}
                              </span>
                              {productDetails.svc_long_desc != "N/A" &&
                                (productDetails.svc_long_desc
                                  ?.trim()
                                  .split(/\s+/).length ?? 0) > 25 && (
                                  <span
                                    className="readmore"
                                    onClick={() => setReadmorecl(!readmorecl)}
                                  >
                                    {readmorecl ? "Read Less" : "Read More"}
                                  </span>
                                )}
                            </p>{" "}
                            <div
                              style={{
                                display: showParticipantStep
                                  ? "none"
                                  : undefined,
                              }}
                            >
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
                                      <span>
                                        {moment(slot.date).format("DD")}
                                      </span>
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
                              {bundleId > 0 && (
                                <div className="fx-bundle-box">
                                  <div className="fx-bundle-title">
                                    <svg
                                      className="fx-bundle-icon"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                    >
                                      <path d="M20 7h-3.17l-1.41-1.41A1.98 1.98 0 0 0 14 5h-4c-.7 0-1.3.3-1.42.59L7.17 7H4a2 2 0 0 0-2 2v9c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2Zm-8 9a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
                                    </svg>

                                    <span>What's included in this bundle</span>
                                  </div>

                                  {bundleComponents.map((component, index) => (
                                    <div
                                      className="fx-bundle-item"
                                      key={
                                        component?.bundle_item_id ??
                                        `${component?.service_id ?? "component"}-${index}`
                                      }
                                    >
                                      <h3 className="fx-bundle-item-title">
                                        {decodeHtml(
                                          component?.component_label || "",
                                        )}
                                      </h3>
                                      <p className="fx-bundle-item-description">
                                        <span>
                                          {decodeHtml(
                                            component?.service_name || "",
                                          )}
                                        </span>
                                        <span>
                                          {decodeHtml(
                                            component?.quantity_label || "",
                                          )}
                                        </span>
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {bundleId == 0 && (
                                <ServiceSlotSelection
                                  availability={slotObj?.slots}
                                  selectedSlot={slot}
                                  tab={slotVisible}
                                  onTabChange={setSlotVisible}
                                  onSelect={selectServiceTimeSlot}
                                  disabled={isPopupBookingDisabled}
                                  fallbackPrice={productDetails.svc_price}
                                />
                              )}
                            </div>
                            {showParticipantStep &&
                              bundleId === 0 &&
                              isVirtualSelection && (
                                <VirtualServiceParticipants
                                  slot={slot}
                                  price={decodeHtml(
                                    String(
                                      currentitem.slot_price_formatted ||
                                        currentitem.formatted_price ||
                                        productDetails.svc_price ||
                                        "",
                                    ),
                                  )}
                                  quantity={book}
                                  minQuantity={virtualMinQuantity}
                                  maxQuantity={virtualMaxQuantity}
                                  onQuantityChange={(next) =>
                                    setBook(
                                      Math.min(
                                        virtualMaxQuantity,
                                        Math.max(virtualMinQuantity, next),
                                      ),
                                    )
                                  }
                                  onBack={() => setShowParticipantStep(false)}
                                  disabled={isPopupBookingDisabled}
                                  selection={virtualParticipants}
                                />
                              )}
                            {showParticipantStep &&
                              bundleId === 0 &&
                              !isVirtualSelection && (
                                <ServiceParticipants
                                  slot={slot}
                                  price={decodeHtml(
                                    String(
                                      currentitem.slot_price_formatted ||
                                        currentitem.formatted_price ||
                                        productDetails.svc_price ||
                                        "",
                                    ),
                                  )}
                                  counts={participants}
                                  groups={participantGroups}
                                  onChange={changeParticipantCount}
                                  onBack={() => setShowParticipantStep(false)}
                                  disabled={
                                    isPopupBookingDisabled ||
                                    !participantConfigReady
                                  }
                                  loading={
                                    participantLoading ||
                                    (!participantConfigReady &&
                                      !participantError)
                                  }
                                  error={participantError}
                                  onRetry={() =>
                                    setParticipantRetry((retry) => retry + 1)
                                  }
                                  maxQuantity={participantSelection.maximum}
                                  counting={participantSelection.counting}
                                  physicalCapacity={
                                    participantSelection.physicalCapacity
                                  }
                                  formatPrice={(value) =>
                                    formatCalculatedPrice(
                                      value,
                                      productDetails.svc_price,
                                      1,
                                    )
                                  }
                                  totalPrice={formatCalculatedPrice(
                                    participantSelection.price,
                                    productDetails.svc_price,
                                    1,
                                  )}
                                  total={book}
                                  validQuantity={validParticipantQuantity}
                                  quantityMessage={participantQuantityMessage}
                                />
                              )}
                          </>
                        )}
                      </div>

                      {bundleId > 0 && !gift && (
                        <div className="fx-popup-rightslot-continuebtn">
                          <div
                            className={`continuebtn fx-bundle-cnt${isPopupBookingDisabled ? " fx-disable-button" : ""}`}
                            aria-disabled={isPopupBookingDisabled}
                            onClick={() => {
                              if (!isPopupBookingDisabled)
                                setShowBundleSlots(true);
                            }}
                          >
                            Continue
                          </div>
                        </div>
                      )}
                      {bundleId == 0 && !gift && (
                        <div className="fx-popup-rightslot-continuebtn fx-service-step-footer">
                          {showParticipantStep && (
                            <button
                              type="button"
                              className="fx-service-back-to-slots"
                              onClick={() => setShowParticipantStep(false)}
                            >
                              Back to Slots
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={
                              showParticipantStep
                                ? !canContinueService
                                : !canContinueToParticipants
                            }
                            className={`continuebtn${(showParticipantStep ? canContinueService : canContinueToParticipants) ? "" : " fx-disable-button"}`}
                            onClick={() => {
                              if (showParticipantStep) {
                                bookservice();
                              } else if (canContinueToParticipants) {
                                // Virtual services start at the slot's minimum quantity.
                                if (
                                  isVirtualSelection &&
                                  !virtualQuantityValid
                                ) {
                                  setBook(
                                    Math.min(
                                      virtualMaxQuantity,
                                      virtualMinQuantity,
                                    ),
                                  );
                                }
                                setShowParticipantStep(true);
                              }
                            }}
                          >
                            Continue
                          </button>
                        </div>
                      )}
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
                </>
              )}
              <div
                className="fx-slot-bundle-modal-box fx-service-bundle-slots"
                style={{
                  display:
                    isBundleSelection && showBundleSlots ? undefined : "none",
                }}
              >
                <div className="fx-booking-modal-header">
                  <div className="fx-bundle-modal-heading">
                    <h2 className="fx-booking-modal-title">
                      {decodeHtml(bundleTimeSlots?.title || "Bundle slots")}
                    </h2>
                    <p>{decodeHtml(bundleTimeSlots?.description || "")}</p>
                  </div>
                  <div className="fx-bundle-header-actions">
                    <span className="fx-bundle-progress">
                      {decodeHtml(bundleTimeSlots?.progress || "")}
                    </span>
                  </div>
                </div>

                <div className="fx-booking-modal-content">
                  <div className="fx-service-slots-details">
                    {bundleComponents.map((component, index) => {
                      const position = Number(component?.component_position);
                      const componentQuantity = Number(component?.quantity);
                      const componentQuantityLabel = Number.isFinite(
                        componentQuantity,
                      )
                        ? `Quantity: ${componentQuantity * bundleQuantity}`
                        : component?.quantity_label || "";
                      const selectedComponentSlot =
                        selectedBundleComponentSlots.find(
                          (item) =>
                            Number(item?.component_position) === position,
                        );
                      const selectedSlotLabel =
                        component?.selected_slot?.slot_label ||
                        component?.selected_slot?.time_slot ||
                        (component?.selected_slot?.from &&
                        component?.selected_slot?.to
                          ? `${component.selected_slot.from} - ${component.selected_slot.to}`
                          : "") ||
                        (typeof component?.selected_slot === "string"
                          ? component.selected_slot
                          : "") ||
                        selectedComponentSlot?.slot_label;
                      const isSelected =
                        component?.state === "selected" ||
                        Boolean(selectedSlotLabel);
                      const isWaiting = component?.state === "waiting";
                      const isExpanded =
                        !isWaiting && openBundlePosition === position;
                      const activeTab =
                        bundleSlotTabs[position] ||
                        getDefaultBundleTab(component);
                      const componentSlots = Array.isArray(
                        component?.available_slots?.[activeTab],
                      )
                        ? component.available_slots[activeTab]
                        : [];
                      const allComponentSlots = Array.isArray(
                        component?.available_slots?.all,
                      )
                        ? component.available_slots.all
                        : Object.values(component?.available_slots || {})
                            .filter(Array.isArray)
                            .flat()
                            .filter(
                              (slotItem, slotIndex, slots) =>
                                slots.findIndex(
                                  (candidate) =>
                                    candidate?.slot_label ===
                                    slotItem?.slot_label,
                                ) === slotIndex,
                            );

                      return (
                        <div
                          className={`fx-massage-card${isExpanded ? " fx-expanded" : ""}${isWaiting ? " fx-waiting" : ""}${isSelected ? " fx-component-selected" : ""}`}
                          key={
                            component?.bundle_item_id ??
                            `${component?.service_id}-${index}`
                          }
                        >
                          <div
                            className="fx-massage-card-header"
                            onClick={() => {
                              if (!isWaiting) {
                                setExpandedBundlePosition(
                                  isExpanded ? 0 : position,
                                );
                              }
                            }}
                          >
                            <div className="fx-massage-card-info">
                              <div className="fx-component-label-row">
                                <span
                                  className={`fx-component-status fx-status-${component?.state || "waiting"}`}
                                >
                                  {decodeHtml(component?.status_label || "")}
                                </span>
                              </div>
                              <div className="fx-bundle-component-title-row">
                                <h3 className="fx-massage-title">
                                  {decodeHtml(component?.service_name || "")}
                                </h3>
                                <p className="fx-massage-description">
                                  {decodeHtml(componentQuantityLabel)}
                                </p>
                              </div>
                            </div>
                            {!isWaiting && (
                              <span className="fx-massage-accordion-icon"></span>
                            )}
                          </div>

                          {isWaiting && (
                            <p className="fx-component-waiting-message">
                              {decodeHtml(
                                component?.message ||
                                  `Choose slot after completing Component ${Math.max(1, position - 1)}`,
                              )}
                            </p>
                          )}

                          {isExpanded && (
                            <div className="fx-massage-card-content">
                              {allComponentSlots.length > 1 && (
                                <div className="fx-bundle-slot-tabs">
                                  {[
                                    ["morning", "Morning"],
                                    ["afternoon", "Afternoon"],
                                    ["all", "All day"],
                                  ].map(([tabKey, tabLabel]) => (
                                    <button
                                      className={
                                        activeTab === tabKey ? "fx-active" : ""
                                      }
                                      key={tabKey}
                                      type="button"
                                      onClick={() =>
                                        setBundleSlotTabs((previousTabs) => ({
                                          ...previousTabs,
                                          [position]: tabKey,
                                        }))
                                      }
                                    >
                                      {tabLabel}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {componentSlots.length > 0 ? (
                                <div className="fx-time-slots">
                                  {componentSlots.map((slotItem, slotIndex) => (
                                    <button
                                      className={`fx-time-slot${selectedSlotLabel === slotItem?.slot_label ? " fx-selected" : ""}`}
                                      disabled={bundleScheduleLoading}
                                      key={`${slotItem?.slot_label}-${slotIndex}`}
                                      type="button"
                                      onClick={() =>
                                        selectBundleComponentSlot(
                                          component,
                                          slotItem,
                                        )
                                      }
                                    >
                                      <span className="fx-slot-time">
                                        {selectedSlotLabel ===
                                          slotItem?.slot_label && (
                                          <i
                                            className="pi pi-check"
                                            aria-hidden="true"
                                          ></i>
                                        )}
                                        <span>{slotItem?.slot_label}</span>
                                      </span>
                                      {slotItem?.capacity_label && (
                                        <small>{slotItem.capacity_label}</small>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <p className="fx-no-bundle-slots">
                                  No {activeTab} slots available
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p
                    className={`fx-bundle-selection-message${bundleAllSelected ? " fx-complete" : ""}`}
                  >
                    {bundleAllSelected
                      ? "All component slots are selected. Choose quantity to continue."
                      : bundleTimeSlots?.blocker_message ||
                        "Choose every bundle component slot."}
                  </p>

                  {/* Bundle quantity is fixed at 1; visitors are chosen per component below. */}
                  {bundleAllSelected && (
                    <BundleParticipants selection={bundleParticipants} />
                  )}
                </div>
                <div className="fx-booking-modal-footer">
                  <span
                    className="fx-back-btn"
                    type="button"
                    onClick={() => setShowBundleSlots(false)}
                  >
                    <i className="pi pi-arrow-left" aria-hidden="true"></i>
                    Back
                  </span>

                  <span className="fx-bundle-footer-message">
                    {!bundleAllSelected
                      ? "Complete all components to continue"
                      : bundleParticipants.checking
                        ? "Checking availability…"
                        : bundleParticipantsBlocking
                          ? "Choose participants to continue"
                          : "Ready to continue"}
                  </span>

                  <span
                    className="fx-continue-btn"
                    disabled={
                      !bundleAllSelected ||
                      bundleScheduleLoading ||
                      bundleParticipantsBlocking
                    }
                    type="button"
                    onClick={bookBundleService}
                  >
                    Continue
                    <i className="pi pi-arrow-right" aria-hidden="true"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
}
