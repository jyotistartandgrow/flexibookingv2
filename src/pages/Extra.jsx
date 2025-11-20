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
import { setStep } from "../store/step1Slice";
import Swal from "sweetalert2";

export default function Service() {
  const dispatch = useDispatch();

  const date = useSelector((state) => state.step1.date);
  const step = useSelector((state) => state.step1.step);
  const service = useSelector((state) => state.step2.service);
  const capacity = useSelector((state) => state.step2.capacity);
  const slot = useSelector((state) => state.step2.slot);

  const [products, setProductsArr] = useState([]);
  const [isVisible, setIsVisible] = useState("grid");
  const [book, setBook] = useState(0);
  const [extraid, setExtraid] = useState(null);

  const toggleDiv = (type) => {
    setIsVisible(type);
  };

  useEffect(() => {
    if (date && service) {
      fetchProductsByDate(date);
    }
  }, [date, service]);

  const fetchProductsByDate = async (selectedDate) => {
    const { data } = await axiosInstance(
      `/extras?date=${moment(selectedDate).format(
        "YYYY-MM-DD"
      )}&service_id=${service}`,
      {
        method: "get",
      }
    );
    if (data && data.status == 200) {
      setProductsArr(data.data);
    }
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
              <button
                type="button"
                className="decrement"
                onClick={() => slotbook(product.id, "minus")}
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
                onClick={() => slotbook(product.id, "add")}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const slotbook = (id, type) => {
    setExtraid(id);
    let currentbook = book;
    if (extraid != id) {
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

    const { data } = await axiosInstance.post(`/addtocart`, {
      service_id: service,
      date: moment(date).format("YYYY-MM-DD"),
      total_service_booking: capacity,
      time_slot: slot,
      extra_svc_ids: extraid,
      no_of_persons: book,
    });
    if (data && data.status == 200) {
      dispatch(setExtracapacity(book));
      dispatch(setExtra(extraid));
      dispatch(setBookingkey(data.data.booking_string));
      dispatch(setStep("checkoutstep"));
    } else {
      Swal.fire({
        toast: true,
        position: "top-end", // or 'bottom-end', 'top-start', etc.
        showConfirmButton: false,
        timer: 3000, // auto-close after 3 seconds
        icon: "error", // 'success', 'error', 'warning', 'info', 'question'
        title: data?.message ?? "There is some error , please try again",
      });
    }
  };

  const skipextra = () => {
    dispatch(setStep("checkoutstep"));
  };

  return (
    <>
      <div
        className="fx-leftcontentbox"
        style={{ display: step === "extrastep" ? "block" : "none" }}
      >
        <h1 className="fx-main-heading">
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

          <div
            className={
              isVisible == "grid" ? "fx-tabcontent selected" : "fx-tabcontent"
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
                            <button
                              type="button"
                              className="decrement"
                              onClick={() => slotbook(product.id, "minus")}
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
                              onClick={() => slotbook(product.id, "add")}
                            >
                              +
                            </button>
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
              isVisible == "list" ? "fx-tabcontent selected" : "fx-tabcontent"
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
                          <button
                            type="button"
                            className="decrement"
                            onClick={() => slotbook(product.id, "minus")}
                          >
                            -
                          </button>
                          <input type="number" value="0" min="0" />
                          <button
                            type="button"
                            className="increment"
                            onClick={() => slotbook(product.id, "add")}
                          >
                            +
                          </button>
                        </div>
                      </div>
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
