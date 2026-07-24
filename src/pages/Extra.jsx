import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { Carousel } from "primereact/carousel";
import axiosInstance from "../Utils/Interceptor";
import moment from "moment";
import { decodeHtml } from "../Utils/Functions";
import extra from "../assets/extra1.jpg";
import { setExtracapacity, setExtra, setBookingkey } from "../store/step3Slice";
import { setStep, setLoading } from "../store/step1Slice";
import { setCart } from "../store/step2Slice";
import Swal from "sweetalert2";
import useDeviceType from "../Utils/useDeviceType";

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
  const extracapacity = useSelector((state) => state.step3.extracapacity);
  const extraID = useSelector((state) => state.step3.extra);

  const [products, setProductsArr] = useState([]);
  const [isVisible, setIsVisible] = useState("grid");
  const [quantities, setQuantities] = useState({});
  const [skeloading, setLoadingske] = useState(true);

  const toggleDiv = (type) => {
    setIsVisible(type);
  };

  useEffect(() => {
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
    const initQ = {};
    if (extraID && extracapacity) {
      const ids = String(extraID)
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      const caps = String(extracapacity)
        .split(",")
        .map((c) => parseInt(c.trim()))
        .filter(Boolean);
      ids.forEach((id, i) => {
        if (caps[i] > 0) initQ[parseInt(id)] = caps[i];
      });
    } else if (Array.isArray(cart.extra) && cart.extra.length > 0) {
      cart.extra.forEach((item) => {
        if (item?.id && item?.capacity > 0) {
          initQ[item.id] = item.capacity;
        }
      });
    }
    setQuantities(initQ);
    if (date && service) {
      setLoadingske(true);
      (async () => {
        const { data } = await axiosInstance(
          `/extras?date=${moment(date).format(
            "YYYY-MM-DD",
          )}&service_id=${service}&all=${gift ? true : false}&bundle_id=${cart.service[0]?.bundle_id || 0}`,
          {
            method: "get",
          },
        );
        if (data && data.status == 200) {
          if (data.data.length == 0) {
            const addToCartRes = await axiosInstance.post(`/addtocart`, {
              service_id: service,
              date: moment(date).format("YYYY-MM-DD"),
              total_service_booking: capacity,
              time_slot: slot,
              extra_svc_ids: null,
              no_of_persons: 0,
              gift,
            });
            if (
              addToCartRes?.data &&
              addToCartRes.data.status == 200 &&
              addToCartRes.data.data.booking_string
            ) {
              dispatch(setExtracapacity(0));
              dispatch(setExtra(null));
              dispatch(setBookingkey(addToCartRes.data.data.booking_string));
              dispatch(setStep("checkoutstep"));
              dispatch(setLoading(false));
            }
          } else {
            setProductsArr(data.data);
          }
        }
        setLoadingske(false);
      })();
    }
  }, [date, service, capacity, slot, gift, step, extraID, extracapacity, cart.extra, dispatch]);

  // Template for each carousel item
  const productTemplate = (product, pp) => {
    if ((!gift && product.cap_left > 0) || gift) {
      return (
        <div className="fx-extrabox" key={pp}>
          <div className="fx-extrapicbox">
            <img src={extra} alt={product.extra_name} />
            {/* <p className="fx-extrapicpriceboxright">
              {decodeHtml(product.price)}
            </p> */}
          </div>
          <div className="fx-extracontentbox">
            <h4>{product.extra_name}</h4>
            <p>{decodeHtml(product.extra_desc)}</p>

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

    const extraIdStr = selectedIds.join(",");
    const capacityArr = selectedIds.map((id) => quantities[id]);

    dispatch(setLoading(true));
    const { data } = await axiosInstance(
      `/price-format?service_id=${cart.service[0].id}&capacity=${
        cart.service[0].capacity
      }&date=${moment(date).format(
        "YYYY-MM-DD",
      )}&extra_id=${extraIdStr}&extra_capacity=${capacityArr.join(",")}&bundle_id=${cart.service[0]?.bundle_id || 0}`,
      {
        method: "get",
      },
    );
    const extraArr = selectedIds.map((id, key) => {
      const product = products.find((p) => p.id == id);
      return {
        id: parseInt(id),
        name: product?.extra_name,
        price: product?.price,
        total: data?.data?.price,
        total_formatted: data?.data?.extra_total[key],
        slot: "",
        capacity: quantities[id],
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
      }),
    );

    addtocart(extraIdStr, capacityArr.join(","));
  };

  const addtocart = async (extraIdParam, bookParam) => {
    dispatch(setLoading(true));
    const { data } = await axiosInstance.post(`/addtocart`, {
      service_id: service,
      date: moment(date).format("YYYY-MM-DD"),
      total_service_booking: capacity,
      time_slot: slot,
      extra_svc_ids: extraIdParam,
      no_of_persons: bookParam,
      gift,
      bundle_id: cart.service[0]?.bundle_id || 0,
    });
    if (data && data.status == 200 && data.data.booking_string) {
      dispatch(setExtracapacity(bookParam));
      dispatch(setExtra(extraIdParam));
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

  const skipextra = () => {
    setQuantities({});
    addtocart(null, 0);
    dispatch(setStep("checkoutstep"));
    dispatch(setLoading(false));
  };

  return (
    <>
      <div
        className="fx-leftcontentbox"
        style={{ display: step === "extrastep" ? "block" : "none" }}
      >
        {props.stepsVisibility?.step_3_title_visible == "true" && (
          <h1
            className="fx-all-main-heading"
            style={{
              display:
                props.mobileHeading == "false" && !isDesktop ? "none" : "block",
            }}
          >
            {props.stepTitles?.step_3_title ||
              "What experience are you looking for?"}{" "}
          </h1>
        )}
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
                              <img src={extra} alt={product.extra_name} />
                              {/* <p className="fx-extrapicpriceboxright">
                                {decodeHtml(product.price)}
                              </p> */}
                            </div>
                            <div className="fx-extracontentbox">
                              <h4>{product.extra_name}</h4>
                              <p>{decodeHtml(product.extra_desc)}</p>

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
                              <img src={extra} alt={product.extra_name} />
                            </div>
                            <span className="fx-servicepiccontentbox">
                              {product.extra_name}
                            </span>
                          </div>
                          <div className="fx-extracontentboxlist">
                            <div className="fx-extra-main-contentbox">
                              <div className="fx-extra-contentbox">
                                <h4>{product.extra_name}</h4>
                                <p>{decodeHtml(product.extra_desc)}</p>
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
