import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import axiosInstance from "../Utils/Interceptor";
import { decodeHtml } from "../Utils/Functions";
import categoryimg from "../assets/service1.jpg";
import { setStep, setLoading, setCategory } from "../store/step1Slice";
import useDeviceType from "../Utils/useDeviceType";

export default function Category(props) {
  const dispatch = useDispatch();
  const isDesktop = useDeviceType();
  const step = useSelector((state) => state.step1.step);
  const [categories, setCategories] = useState([]);
  const [isVisible, setIsVisible] = useState("grid");
  const [skeloading, setLoadingske] = useState(false);
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
  }, [isVisible, isDesktop, categories]);

  const toggleDiv = (type) => {
    setIsVisible(type);
  };

  useEffect(() => {
    if (step == "servicesstep") return;
    if (step == "datestep") {
      dispatch(setStep("categorystep"));
    }
    fetchCategories();
  }, [step]);

  const fetchCategories = async () => {
    setLoadingske(true);
    const { data } = await axiosInstance(`/categories`, {
      method: "get",
    });
    if (data && data.status == 200) {
      setCategories(data.data);
      setLoadingske(false);
    }
  };

  // Auto-set default view based on category count and device type
  useEffect(() => {
    if (categories.length === 0) return;
    if (isDesktop) {
      if (categories.length === 1) setIsVisible("list");
      else if (categories.length <= 8) setIsVisible("grid");
      else if (categories.length <= 12) setIsVisible("slider");
      else setIsVisible("list");
    } else {
      if (categories.length <= 2) setIsVisible("grid");
      else if (categories.length <= 5) setIsVisible("slider");
      else setIsVisible("list");
    }
  }, [categories, isDesktop]);

  // Template for each carousel item
  const categoryTemplate = (category) => {
    return (
      <div
        className={
          props.showBookNowButton == "true"
            ? "fx-servicebox fx-servicebox-add-button"
            : "fx-serviceboxad"
        }
        onClick={() => getservice(category.id)}
      >
        <div className="fx-servicepicbox">
          <img src={categoryimg} alt={category.cat_name} />
          {props.categoryLabelVisibility == "true" && (
            <span className="fx-servicepiccontentbox">{category.cat_name}</span>
          )}
        </div>
        <div className="fx-servicecontentbox">
          <h4>{category.cat_name}</h4>
          <p>Category description here</p>
          <p className="price">
            <span className="fx-price-form">from</span>
            <span className="fx-price-one">{decodeHtml(category.price)}</span>
            {props.showBookNowButton !== "true" && (
              <i className="pi pi-chevron-right"></i>
            )}
          </p>
          {props.showBookNowButton == "true" && (
            <div className="booknowbtn" onClick={() => getservice(category.id)}>
              <a href="#">Book Now</a>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getservice = (id) => {
    console.log(id);
    dispatch(setCategory(id));
    dispatch(setLoading(true));
    dispatch(setStep("servicesstep"));
    dispatch(setLoading(false));
  };

  return (
    <div
      className="fx-leftcontentbox"
      style={{ display: step === "categorystep" ? "block" : "none" }}
    >
      <h1
        className="fx-all-main-heading"
        style={{
          display:
            props.mobileHeading == "false" && !isDesktop ? "none" : "block",
        }}
      >
        {/* What experience are you looking for? */}
      </h1>
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
            !skeloading && categories.length == 0 ? "show" : "hide"
          }`}
        >
          No category found
        </div>

        <div
          className={
            isVisible == "grid" && !skeloading
              ? "fx-tabcontent selected"
              : "fx-tabcontent"
          }
        >
          <div className="fx-servicecontainer">
            {categories.length > 0 &&
              categories.map((category, p1) => {
                return (
                  <div
                    className={
                      props.showBookNowButton == "true"
                        ? "fx-servicebox fx-servicebox-add-button"
                        : "fx-servicebox"
                    }
                    key={p1}
                    onClick={() => getservice(category.id)}
                  >
                    <div className="fx-servicepicbox">
                      <img src={categoryimg} alt={category.cat_name} />
                      {props.categoryLabelVisibility == "true" && (
                        <span className="fx-servicepiccontentbox">
                          {category.cat_name}
                        </span>
                      )}
                    </div>
                    <div className="fx-servicecontentbox">
                      <h4>{category.cat_name}</h4>
                      <p>Category description here</p>
                      <p className="price">
                        <span className="fx-price-form">from</span>
                        <span className="fx-price-one">
                          {decodeHtml(category.price)}
                        </span>
                        {props.showBookNowButton !== "true" && (
                          <i className="pi pi-chevron-right"></i>
                        )}
                      </p>

                      {props.showBookNowButton == "true" && (
                        <div
                          className="booknowbtn"
                          onClick={() => getservice(category.id)}
                        >
                          <a href="#">Book Now</a>
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
          {categories.length > 0 &&
            categories.map((category, p2) => {
              return (
                <div
                  className="fx-serviceboxlist"
                  key={p2}
                  onClick={() => getservice(category.id)}
                >
                  <div className="fx-servicepicboxlist">
                    <div className="fx-list-img-box">
                      <img src={categoryimg} alt={category.cat_name} />
                    </div>
                    {props.categoryLabelVisibility == "true" && (
                      <span className="fx-servicepiccontentbox">
                        {category.cat_name}
                      </span>
                    )}
                  </div>
                  <div className="fx-servicecontentboxlist">
                    <div className="list-view-text-content">
                      <h4>{category.cat_name}</h4>
                      <p>Category description here</p>
                    </div>
                    <p className="price">
                      <span className="fx-price-form">from</span>
                      <span className="fx-price-one">
                        {decodeHtml(category.price)}
                      </span>
                      <i className="pi pi-chevron-right"></i>
                    </p>
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
                {categories.map((category, idx) => (
                  <div key={idx} className="fx-mobile-swipe-item">
                    {categoryTemplate(category)}
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
                  className={`fx-desktop-swipe-carousel${categories.length < 4 ? " fx-dswipe-few" : ""}`}
                  ref={desktopCarouselRef}
                >
                  {categories.map((category, idx) => (
                    <div key={idx} className="fx-desktop-swipe-item">
                      {categoryTemplate(category)}
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
      </div>
    </div>
  );
}
