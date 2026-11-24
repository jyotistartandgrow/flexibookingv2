import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { Carousel } from "primereact/carousel";
import axiosInstance from "../Utils/Interceptor";
import moment from "moment";
import {
  decodeHtml,
  formatExtrasTimeSlot,
  toPlainText,
} from "../Utils/Functions";
import extra from "../assets/extra1.jpg";

import {
  setExtracapacity,
  setExtra,
  setBookingkey,
  setHasExtras,
} from "../store/step3Slice";
import { setStep, setLoading } from "../store/step1Slice";
import { setCart } from "../store/step2Slice";
import Swal from "sweetalert2";
import useDeviceType from "../Utils/useDeviceType";

// Use the extra's own image from /extras when the API sends one; otherwise
// (or if that URL fails to load) fall back to the default extra image.
const getExtraImage = (product) =>
  typeof product?.extra_image === "string" && product.extra_image.trim()
    ? product.extra_image.trim()
    : extra;
const fallbackToDefaultExtraImage = (event) => {
  const img = event.currentTarget;
  // Swap only once, so a failing default image can't loop.
  if (img.dataset.fallback) return;
  img.dataset.fallback = "true";
  img.src = extra;
};

function ExtraProductTitle({ product }) {
  const typeLabel = String(product.type_label ?? "").trim();

  return (
    <h4 className="fx-extra-product-title">
      <span>
        {product.extra_name} {product.owner_label}
      </span>
      {typeLabel && <span className="fx-extra-type-badge">{typeLabel}</span>}
    </h4>
  );
}

// Bundle lines carry the participants chosen for each component (keyed
// "serviceId|HH:mm"); the server needs them with the same capacity line key.
const bundleGuestFields = (gift, line) =>
  !gift && line && Object.keys(line.capacity_component_guests || {}).length > 0
    ? {
        capacity_line_key: line.line_key,
        capacity_component_guests: line.capacity_component_guests,
      }
    : {};

export default function Extra(props) {
  const dispatch = useDispatch();
  const isDesktop = useDeviceType();
  const desktopCarouselRef = useRef(null);

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

  const date = useSelector((state) => state.step1.date);
  const step = useSelector((state) => state.step1.step);
  const service = useSelector((state) => state.step2.service);
  const capacity = useSelector((state) => state.step2.capacity);
  const slot = useSelector((state) => state.step2.slot);
  const cart = useSelector((state) => state.step2.cart);
  const gift = useSelector((state) => state.step1.gift);
  const openDatePurchase = useSelector((state) => state.step1.opendatepurchase);

  const [products, setProductsArr] = useState([]);
  const [isVisible, setIsVisible] = useState("grid");
  const [quantities, setQuantities] = useState({});
  const [skeloading, setLoadingske] = useState(true);

  const selectedServiceOptionId = cart?.service_option
    ? Number(cart.service_option)
    : 0;
  const selectedServiceOptionDetails = cart?.service_option_details;
  const selectedBundleId = Number(cart.service?.[0]?.bundle_id) || 0;
  const selectedVirtualServiceId =
    Number(cart.service?.[0]?.virtual_service_id) || 0;
  const selectedService = cart.service?.find(
    (item) => String(item.id) === String(service),
  );
  const selectedComponentSlot = selectedService?.selected_component_slots?.find(
    (component) => String(component.service_id) === String(service),
  );
  const extrasTimeSlot = gift
    ? ""
    : formatExtrasTimeSlot(
        selectedComponentSlot || slot || selectedService?.slot,
      );
  const totalServiceBooking =
    selectedBundleId > 0
      ? Number(cart.service?.[0]?.bundle_quantity) || Number(capacity) || 1
      : capacity;

  const toggleDiv = (type) => {
    setIsVisible(type);
  };

  // /settings: show_grid_list_button false → always default_view_type, no
  // view buttons, and the automatic rule below is skipped.
  const viewSettings = useSelector((state) => state.step1.viewSettings);
  const fixedViewType =
    viewSettings && viewSettings.showGridListButton === false
      ? viewSettings.defaultViewType
      : null;

  useEffect(() => {
    if (fixedViewType) {
      setIsVisible(fixedViewType);
      return;
    }
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
  }, [products, isDesktop, fixedViewType]);

  useEffect(() => {
    if (isVisible !== "slider" || !isDesktop) return;
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
    }, 3000);
    return () => clearInterval(interval);
  }, [isVisible, isDesktop, products]);

  useEffect(() => {
    if (step !== "extrastep") return;
    // Every extra starts at 0. Pre-filling from an earlier selection showed a
    // quantity (e.g. 1 on the first extra) that was then kept even on Skip.
    setQuantities({});
    if (date && service) {
      setLoadingske(true);
      const showExtraError = (title) =>
        Swal.fire({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          icon: "error",
          title,
        });
      (async () => {
        try {
          const { data } = await axiosInstance(
            `/extras?date=${moment(date).format(
              "YYYY-MM-DD",
            )}&service_id=${service}&all=${gift ? true : false}&bundle_id=${selectedBundleId}&time_slot=${encodeURIComponent(extrasTimeSlot)}&selected_virtual_service_id=${selectedVirtualServiceId}`,
            {
              method: "get",
            },
          );
          if (data && data.status == 200) {
            const extraList = Array.isArray(data.data)
              ? data.data
              : Array.isArray(data?.data?.extras)
                ? data.data.extras
                : [];
            dispatch(setHasExtras(extraList.length > 0));

            setProductsArr(
              extraList.map((product) => ({
                ...product,
                extra_type: String(product.extra_type ?? "").trim() || "local",
              })),
            );

            if (extraList.length == 0) {
              const addToCartRes = await axiosInstance.post(`/addtocart`, {
                ...(!gift && cart.service?.[0]?.participant_guests?.length > 0
                  ? {
                      capacity_line_key: cart.service[0].line_key,
                      capacity_guests: cart.service[0].participant_guests,
                    }
                  : {}),
                ...bundleGuestFields(gift, cart.service?.[0]),
                service_id: service,
                date: moment(date).format("YYYY-MM-DD"),
                total_service_booking: totalServiceBooking,
                time_slot: slot,
                extra_svc_ids: null,
                extra_types: null,
                no_of_persons: 0,
                gift,
                selected_bundle_id: selectedBundleId,
                selected_virtual_service_id: selectedVirtualServiceId || null,
                selected_component_slots:
                  cart.service?.[0]?.selected_component_slots || [],
                option_value_ids:
                  selectedServiceOptionId > 0 ? selectedServiceOptionId : null,
              });
              if (
                addToCartRes?.data &&
                addToCartRes.data.status == 200 &&
                addToCartRes.data.data.booking_string
              ) {
                dispatch(setExtracapacity(0));
                dispatch(setExtra(null));
                dispatch(setBookingkey(addToCartRes.data.data.booking_string));
                dispatch(
                  setStep(
                    gift && !openDatePurchase
                      ? "customizestep"
                      : "checkoutstep",
                  ),
                );
                dispatch(setLoading(false));
              } else {
                showExtraError(
                  addToCartRes?.data?.message ??
                    "There is some error , please try again",
                );
              }
            }
          } else {
            showExtraError(data?.message || "Unable to load extras");
          }
        } catch (error) {
          console.error("Unable to load extras.", error);
          showExtraError(
            error?.data?.message || "Unable to load extras, please try again",
          );
        } finally {
          setLoadingske(false);
          dispatch(setLoading(false));
        }
      })();
    }
  }, [
    date,
    service,
    capacity,
    slot,
    gift,
    openDatePurchase,
    step,
    cart,
    selectedServiceOptionId,
    selectedBundleId,
    selectedVirtualServiceId,
    totalServiceBooking,
    extrasTimeSlot,
    dispatch,
  ]);

  // Template for each carousel item
  const productTemplate = (product, pp) => {
    if ((!gift && product.cap_left > 0) || gift) {
      return (
        <div className="fx-extrabox" key={pp}>
          <div className="fx-extrapicbox">
            <img
              src={getExtraImage(product)}
              alt={product.extra_name}
              onError={fallbackToDefaultExtraImage}
            />
            {/* <p className="fx-extrapicpriceboxright">
              {decodeHtml(product.price)}
            </p> */}
          </div>
          <div className="fx-extracontentbox">
            <ExtraProductTitle product={product} />
            {/* Always render the description slot so cards keep the same layout. */}
            <p>{decodeHtml(product.extra_desc?.trim() || "")}</p>

            <div className="fx-common">
              <p className="fx-extrapicpriceboxright">
                {decodeHtml(product.price)}
              </p>
              <div className="fx-quantitybox">
                <button
                  type="button"
                  className="decrement"
                  onClick={() =>
                    slotbook(product.id, "minus", product.cap_left)
                  }
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantities[product.id] || 0}
                  defaultValue={0}
                  min={0}
                  readOnly
                />
                <button
                  type="button"
                  className="increment"
                  onClick={() => slotbook(product.id, "add", product.cap_left)}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  const slotbook = (id, type, capacity_left) => {
    const currentCount = quantities[id] || 0;
    if (type === "add") {
      if (!gift && currentCount >= capacity_left) {
        Swal.fire({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          icon: "warning",
          title: "Maximum capacity reached",
        });
        return;
      }
      setQuantities((prev) => ({ ...prev, [id]: currentCount + 1 }));
    } else if (type === "minus") {
      const newCount = currentCount - 1;
      if (newCount > 0) {
        setQuantities((prev) => ({ ...prev, [id]: newCount }));
      } else if (newCount === 0) {
        setQuantities((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    }
  };

  const bookextra = async () => {
    const selectedIds = Object.keys(quantities).filter(
      (id) => quantities[id] > 0,
    );
    if (selectedIds.length === 0) {
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        icon: "warning",
        title: "Please choose capacity",
      });
      return;
    }

    const selectedExtras = selectedIds.map((id) => ({
      product: products.find((product) => String(product.id) === id),
      id,
      quantity: quantities[id],
    }));
    const extraIdStr = selectedExtras.map((item) => item.id).join(",");
    const capacityArr = selectedExtras.map((item) => item.quantity);
    const extraTypeStr = selectedExtras
      .map((item) => item.product?.extra_type || "local")
      .join(",");
    const selectedComponentSlots =
      cart.service?.[0]?.selected_component_slots || [];
    const encodedComponentSlots = encodeURIComponent(
      JSON.stringify(selectedComponentSlots),
    );

    dispatch(setLoading(true));
    const { data } = await axiosInstance(
      `/price-format?service_id=${cart.service[0].id}&capacity=${
        cart.service[0].capacity
      }&date=${moment(date).format(
        "YYYY-MM-DD",
      )}&extra_id=${extraIdStr}&extra_capacity=${capacityArr.join(",")}&extra_types=${encodeURIComponent(extraTypeStr)}&bundle_id=${selectedBundleId}&service_option_id=${selectedServiceOptionId > 0 ? selectedServiceOptionId : null}&selected_component_slots=${encodedComponentSlots}&selected_virtual_service_id=${selectedVirtualServiceId}&gift=${gift ? true : false}`,
      {
        method: "get",
      },
    );
    const extraArr = selectedExtras.map(({ id, product, quantity }, key) => {
      return {
        id: parseInt(id),
        name: product?.extra_name,
        price: product?.price,
        total: data?.data?.price,
        total_formatted: data?.data?.extra_total[key],
        slot: "",
        capacity: quantity,
        extra_type: product?.extra_type || "local",
      };
    });
    dispatch(
      setCart({
        service: cart.service,
        extra: extraArr,
        total: data?.data?.total,
        total_formatted: data?.data?.total_formated,
        discount: 0,
        subtotal: data?.data?.total_formated,
        service_option:
          selectedServiceOptionId > 0 ? selectedServiceOptionId : null,
        service_option_details: selectedServiceOptionDetails || null,
      }),
    );

    addtocart(extraIdStr, capacityArr.join(","), extraTypeStr);
  };

  const addtocart = async (extraIdParam, bookParam, extraTypesParam = null) => {
    dispatch(setLoading(true));
    const { data } = await axiosInstance.post(`/addtocart`, {
      ...(!gift && cart.service?.[0]?.participant_guests?.length > 0
        ? {
            capacity_line_key: cart.service[0].line_key,
            capacity_guests: cart.service[0].participant_guests,
          }
        : {}),
      ...bundleGuestFields(gift, cart.service?.[0]),
      service_id: service,
      date: moment(date).format("YYYY-MM-DD"),
      total_service_booking: totalServiceBooking,
      time_slot: slot,
      extra_svc_ids: extraIdParam,
      extra_types: extraTypesParam,
      no_of_persons: bookParam,
      gift,
      selected_bundle_id: selectedBundleId,
      selected_virtual_service_id: selectedVirtualServiceId || null,
      selected_component_slots:
        cart.service?.[0]?.selected_component_slots || [],
      option_value_ids:
        selectedServiceOptionId > 0 ? selectedServiceOptionId : null,
    });
    if (data && data.status == 200 && data.data.booking_string) {
      dispatch(setExtracapacity(bookParam));
      dispatch(setExtra(extraIdParam));
      dispatch(setBookingkey(data.data.booking_string));
      dispatch(
        setStep(gift && !openDatePurchase ? "customizestep" : "checkoutstep"),
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

  const skipextra = () => {
    setQuantities({});
    addtocart(null, 0);
  };

  return (
    <>
      <div
        className="fx-leftcontentbox"
        style={{ display: step === "extrastep" ? "block" : "none" }}
      >
        <div className="fx-top-box-tab-content">
          {props.stepsVisibility?.step_3_title_visible == "true" && (
            <h1
              className="fx-all-main-heading"
              style={{
                display:
                  props.mobileHeading == "false" && !isDesktop
                    ? "none"
                    : "block",
              }}
            >
              {props.stepTitles?.step_3_title ||
                "What experience are you looking for?"}{" "}
            </h1>
          )}
        </div>
        <div id="fx-Icontab_nav">
          <ul
            style={{
              display:
                fixedViewType || (props.mobileHeading == "false" && !isDesktop)
                  ? "none"
                  : "block",
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

          {!skeloading && products.length == 0 && (
            <div className="fx-no-data">No services found</div>
          )}
          {!skeloading && products.length > 0 && (
            <>
              <div
                className={
                  isVisible == "grid"
                    ? "fx-tabcontent selected"
                    : "fx-tabcontent"
                }
              >
                <div className="fx-extracontainer">
                  {products.length > 0 &&
                    products.map((product, p1) => {
                      if ((!gift && product.cap_left > 0) || gift) {
                        return (
                          <div className="fx-extrabox" key={p1}>
                            <div className="fx-extrapicbox">
                              <img
                                src={getExtraImage(product)}
                                alt={product.extra_name}
                                onError={fallbackToDefaultExtraImage}
                              />
                              {/* <p className="fx-extrapicpriceboxright">
                                {decodeHtml(product.price)}
                              </p> */}
                            </div>
                            <div className="fx-extracontentbox">
                              <ExtraProductTitle product={product} />
                              {/* Always render the description slot so cards keep the same layout. */}
                              <p>
                                {decodeHtml(product.extra_desc?.trim() || "")}
                              </p>

                              <div className="fx-common">
                                <p className="fx-extrapicpriceboxright">
                                  {decodeHtml(product.price)}
                                </p>
                                <div className="fx-quantitybox">
                                  <button
                                    type="button"
                                    className="decrement"
                                    onClick={() =>
                                      slotbook(
                                        product.id,
                                        "minus",
                                        product.cap_left,
                                      )
                                    }
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    value={quantities[product.id] || 0}
                                    defaultValue={0}
                                    min={0}
                                    readOnly
                                  />
                                  <button
                                    type="button"
                                    className="increment"
                                    onClick={() =>
                                      slotbook(
                                        product.id,
                                        "add",
                                        product.cap_left,
                                      )
                                    }
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    })}
                </div>
              </div>

              <div
                className={
                  isVisible == "list"
                    ? "fx-tabcontent selected"
                    : "fx-tabcontent"
                }
              >
                {products.length > 0 &&
                  products.map((product, p2) => {
                    if ((!gift && product.cap_left > 0) || gift) {
                      return (
                        <div className="fx-extraboxlist" key={p2}>
                          <div className="fx-extrapicboxlist">
                            <div className="fx-extra-main-img">
                              <img
                                src={getExtraImage(product)}
                                alt={product.extra_name}
                                onError={fallbackToDefaultExtraImage}
                              />
                            </div>
                            <span className="fx-servicepiccontentbox">
                              {product.extra_name}
                            </span>
                          </div>
                          <div className="fx-extracontentboxlist">
                            <div className="fx-extra-main-contentbox">
                              <div className="fx-extra-contentbox">
                                <ExtraProductTitle product={product} />
                                {/* Always render the description slot so cards keep the same layout. */}
                                <p>
                                  {decodeHtml(product.extra_desc?.trim() || "")}
                                </p>
                              </div>
                              <p className="price">
                                {" "}
                                <span>{decodeHtml(product.price)}</span>
                              </p>
                            </div>
                            <div className="fx-common">
                              <div className="fx-quantitybox">
                                <button
                                  type="button"
                                  className="decrement"
                                  onClick={() =>
                                    slotbook(
                                      product.id,
                                      "minus",
                                      product.cap_left,
                                    )
                                  }
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  value={quantities[product.id] || 0}
                                  defaultValue={0}
                                  min={0}
                                  readOnly
                                />
                                <button
                                  type="button"
                                  className="increment"
                                  onClick={() =>
                                    slotbook(
                                      product.id,
                                      "add",
                                      product.cap_left,
                                    )
                                  }
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
              </div>

              <div
                className={
                  isVisible == "slider"
                    ? "fx-tabcontent selected"
                    : "fx-tabcontent"
                }
              >
                <div className="slider responsive">
                  {!isDesktop ? (
                    <div className="fx-mobile-swipe-carousel">
                      {products
                        .filter((p) => (!gift && p.cap_left > 0) || gift)
                        .map((product, idx) => (
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
                        className={`fx-desktop-swipe-carousel${products.filter((p) => (!gift && p.cap_left > 0) || gift).length < 4 ? " fx-dswipe-few" : ""}`}
                        ref={desktopCarouselRef}
                      >
                        {products
                          .filter((p) => (!gift && p.cap_left > 0) || gift)
                          .map((product, idx) => (
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
            </>
          )}
        </div>
      </div>
      <div
        className="fx-bottom-bar"
        style={{ display: step === "extrastep" ? "block" : "none" }}
      >
        <input
          type="submit"
          className="btn-secondary fx-skip"
          value="Skip"
          onClick={() => skipextra()}
        />
        <input
          type="submit"
          className="btn-primary fx-continue"
          value="Continue"
          onClick={() => bookextra()}
        />
      </div>
    </>
  );
}
