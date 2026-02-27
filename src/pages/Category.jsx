import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { Carousel } from "primereact/carousel";
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

  // Template for each carousel item
  const categoryTemplate = (category) => {
    return (
      <div className="fx-servicebox">
        <div className="fx-servicepicbox">
          <img src={categoryimg} alt={category.cat_name} />
          <span className="fx-servicepiccontentbox">{category.cat_name}</span>
        </div>
        <div className="fx-servicecontentbox">
          <h4>{category.cat_name}</h4>
          <p className="price">
            from <span>{decodeHtml(category.price)}</span>
          </p>
          <div className="booknowbtn">
            <a href="#" onClick={() => getservice(category.id)}>
              Book Now
            </a>
          </div>
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
      <h1 className="fx-all-main-heading" style={{
          display:
            props.mobileHeading == "false" && !isDesktop ? "none" : "block",
        }}>What experience are you looking for?</h1>
      <div id="fx-Icontab_nav">
        <ul style={{
          display:
            props.mobileHeading == "false" && !isDesktop ? "none" : "block",
        }}>
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
            isVisible == "grid" ? "fx-tabcontent selected" : "fx-tabcontent"
          }
        >
          <div className="fx-servicecontainer">
            {categories.length > 0 &&
              categories.map((category, p1) => {
                return (
                  <div className="fx-servicebox" key={p1}>
                    <div className="fx-servicepicbox">
                      <img src={categoryimg} alt={category.cat_name} />
                      <span className="fx-servicepiccontentbox">
                        {category.cat_name}
                      </span>
                    </div>
                    <div className="fx-servicecontentbox">
                      <h4>{category.cat_name}</h4>
                      <p className="price">
                        from <span>{decodeHtml(category.price)}</span>
                      </p>
                      <div className="booknowbtn">
                        <a href="#" onClick={() => getservice(category.id)}>
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
          {categories.length > 0 &&
            categories.map((category, p2) => {
              return (
                <div className="fx-serviceboxlist" key={p2}>
                  <div className="fx-servicepicboxlist">
                    <img src={categoryimg} alt={category.cat_name} />
                    <span className="fx-servicepiccontentbox">
                      {category.cat_name}
                    </span>
                  </div>
                  <div className="fx-servicecontentboxlist">
                    <h4>{category.cat_name}</h4>
                    <p className="price">
                      from <span>{decodeHtml(category.price)}</span>
                    </p>
                    <span
                      className="booknowbtn"
                      onClick={() => getservice(category.id)}
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
              value={categories}
              itemTemplate={categoryTemplate}
              numVisible={4}
              numScroll={3}
              circular
              autoplayInterval={3000}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
