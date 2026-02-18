import { useState, useEffect } from "react";
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

export default function Service() {
  const dispatch = useDispatch();

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
  const [book, setBook] = useState(extracapacity ? extracapacity : 0);
  const [extraid, setExtraid] = useState(null);
  const [skeloading, setLoadingske] = useState(true);
  const [extradetails, setExtradetails] = useState({});

  const toggleDiv = (type) => {
    setIsVisible(type);
  };

  useEffect(() => {
    if (step !== "extrastep") return;
    setBook(extracapacity ? extracapacity : 0);
    setExtraid(extraID ? extraID : null);
    if (date && service) {
      setLoadingske(true);
      fetchProductsByDate(date);
    }
  }, [date, service, step]);

  const fetchProductsByDate = async (selectedDate) => {
    const { data } = await axiosInstance(
      `/extras?date=${moment(selectedDate).format(
        "YYYY-MM-DD",
      )}&service_id=${service}`,
      {
        method: "get",
      },
    );
    if (data && data.status == 200) {
      if (data.data.length == 0) {
        addtocart();
        dispatch(setStep("checkoutstep"));
        dispatch(setLoading(false));
      } else {
        setProductsArr(data.data);
      }
    }
    setLoadingske(false);
  };

  // Template for each carousel item
  const productTemplate = (product, pp) => {
    return (
      <div className="fx-extrabox" key={pp}>
        <div className="fx-extrapicbox">
          <img src={extra} alt={product.extra_name} />
          <p className="fx-extrapicpriceboxright">
            {decodeHtml(product.price)}
          </p>
        </div>
        <div className="fx-extracontentbox">
          <h4>{product.extra_name}</h4>
          <p>{decodeHtml(product.extra_desc)}</p>
          <div className="fx-common">
            <div className="fx-quantitybox">
              {extraid != product.id && (
                <input
                  type="submit"
                  className="btn-secondary"
                  value="Select"
                  onClick={() => {
                    setExtradetails(product);
                    slotbook(product.id, "add", product.cap_left);
                  }}
                />
              )}
              {extraid == product.id && book > 0 && (
                <>
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
                    value={extraid == product.id ? book : 0}
                    defaultValue={0}
                    min={0}
                  />
                  <button
                    type="button"
                    className="increment"
                    onClick={() =>
                      slotbook(product.id, "add", product.cap_left)
                    }
                  >
                    +
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const slotbook = (id, type, capacity_left) => {
    setExtraid(id);
    let currentbook = book;
    if (extraid != id) {
      currentbook = 0;
      setBook(0);
    }
    if (type == "add") {
      if (currentbook >= capacity_left) {
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
        if (count == 0) {
          setExtraid(null);
        }
      }
    }
  };

  const bookextra = async () => {
    if (book == 0) {
      Swal.fire({
        toast: true,
        position: "top-end", // or 'bottom-end', 'top-start', etc.
        showConfirmButton: false,
        timer: 3000, // auto-close after 3 seconds
        icon: "warning", // 'success', 'error', 'warning', 'info', 'question'
        title: "Please choose capacity",
      });
      return;
    }

    dispatch(setLoading(true));
    const { data } = await axiosInstance(
      `/price-format?service_id=${cart.service[0].id}&capacity=${
        cart.service[0].capacity
      }&date=${moment(date).format(
        "YYYY-MM-DD",
      )}&extra_id=${extraid}&extra_capacity=${book}`,
      {
        method: "get",
      },
    );
    let cartobj = {
      id: extraid,
      name: extradetails.extra_name,
      price: extradetails.price,
      total: data?.data?.price,
      total_formatted: data?.data?.extra_total,
      slot: "",
      capacity: book,
    };
    dispatch(
      setCart({
        service: cart.service,
        extra: [cartobj],
        total: data?.data?.total,
        total_formatted: data?.data?.total_formated,
        discount: 0,
        subtotal: data?.data?.total_formated,
      }),
    );

    addtocart();
  };

  const addtocart = async () => {
    dispatch(setLoading(true));
    const { data } = await axiosInstance.post(`/addtocart`, {
      service_id: service,
      date: moment(date).format("YYYY-MM-DD"),
      total_service_booking: capacity,
      time_slot: slot,
      extra_svc_ids: extraid,
      no_of_persons: book,
      gift,
    });
    if (data && data.status == 200 && data.data.booking_string) {
      dispatch(setExtracapacity(book));
      dispatch(setExtra(extraid));
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
    addtocart();
    dispatch(setStep("checkoutstep"));
    dispatch(setLoading(false));
  };

  return (
    <>
      <div
        className="fx-leftcontentbox"
        style={{ display: step === "extrastep" ? "block" : "none" }}
      >
        <h1 className="fx-all-main-heading">
          What experience are you looking for?
        </h1>
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
                      return (
                        <div className="fx-extrabox" key={p1}>
                          <div className="fx-extrapicbox">
                            <img src={extra} alt={product.extra_name} />
                            <p className="fx-extrapicpriceboxright">
                              {decodeHtml(product.price)}
                            </p>
                          </div>
                          <div className="fx-extracontentbox">
                            <h4>{product.extra_name}</h4>
                            <p>{decodeHtml(product.extra_desc)}</p>
                            <div className="fx-common">
                              <div className="fx-quantitybox">
                                {extraid != product.id && (
                                  <input
                                    type="submit"
                                    className="btn-secondary"
                                    value="Select"
                                    onClick={() => {
                                      setExtradetails(product);
                                      slotbook(
                                        product.id,
                                        "add",
                                        product.cap_left,
                                      );
                                    }}
                                  />
                                )}
                                {extraid == product.id && book > 0 && (
                                  <>
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
                                      value={extraid == product.id ? book : 0}
                                      defaultValue={0}
                                      min={0}
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
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
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
                    return (
                      <div className="fx-extraboxlist" key={p2}>
                        <div className="fx-extrapicboxlist">
                          <img src={extra} alt={product.extra_name} />
                          <span className="fx-servicepiccontentbox">
                            {product.extra_name}
                          </span>
                        </div>
                        <div className="fx-extracontentboxlist">
                          <h4>{product.extra_name}</h4>
                          <p>{decodeHtml(product.extra_desc)}</p>
                          <p className="price">
                            {" "}
                            <span>{decodeHtml(product.price)}</span>
                          </p>
                          <div className="fx-common">
                            <div className="fx-quantitybox">
                              {extraid != product.id && (
                                <input
                                  type="submit"
                                  className="btn-secondary"
                                  value="Select"
                                  onClick={() => {
                                    setExtradetails(product);
                                    slotbook(
                                      product.id,
                                      "add",
                                      product.cap_left,
                                    );
                                  }}
                                />
                              )}
                              {extraid == product.id && book > 0 && (
                                <>
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
                                    value={extraid == product.id ? book : 0}
                                    defaultValue={0}
                                    min={0}
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
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
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
