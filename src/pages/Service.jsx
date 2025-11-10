import { useState } from "react";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { Carousel } from "primereact/carousel";
import service from "../assets/service1.jpg";

export default function Service({ step, setStep }) {
  const [isVisible, setIsVisible] = useState("grid");
  const toggleDiv = (type) => {
    setIsVisible(type);
  };
  const products = [
    {
      id: 1,
      name: "Massaggi",
      image: service,
      price: "54",
      desc: "A collection of massages dedicated to specific needs.",
    },
    {
      id: 2,
      name: "Massaggi",
      image: service,
      price: "54",
      desc: "A collection of massages dedicated to specific needs.",
    },
    {
      id: 3,
      name: "Massaggi",
      image: service,
      price: "54",
      desc: "A collection of massages dedicated to specific needs.",
    },
    {
      id: 4,
      name: "Massaggi",
      image: service,
      price: "54",
      desc: "A collection of massages dedicated to specific needs.",
    },
    {
      id: 5,
      name: "Massaggi",
      image: service,
      price: "54",
      desc: "A collection of massages dedicated to specific needs.",
    },
    {
      id: 6,
      name: "Massaggi",
      image: service,
      price: "54",
      desc: "A collection of massages dedicated to specific needs.",
    },
    {
      id: 7,
      name: "Massaggi",
      image: service,
      price: "54",
      desc: "A collection of massages dedicated to specific needs.",
    },
    {
      id: 8,
      name: "Massaggi",
      image: service,
      price: "54",
      desc: "A collection of massages dedicated to specific needs.",
    },
  ];

  // Template for each carousel item
  const productTemplate = (product) => {
    return (
      <div className="fx-servicebox">
        <div className="fx-servicepicbox">
          <img src={product.image} alt={product.name} />
          <span className="fx-servicepiccontentbox">{product.name}</span>
        </div>
        <div className="fx-servicecontentbox">
          <h4>{product.name}</h4>
          <p>{product.desc}</p>
          <p className="price">
            from <span>{product.price} €</span>
          </p>
          <div className="booknowbtn">
            <a href="#popup1">Book Now</a>
          </div>
        </div>
      </div>
    );
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
            <div className="fx-servicebox">
              <div className="fx-servicepicbox">
                <img src={service} />
                <span className="fx-servicepiccontentbox">Massaggi</span>
              </div>
              <div className="fx-servicecontentbox">
                <h4>Massages</h4>
                <p>A collection of massages dedicated to specific needs.</p>
                <p className="price">
                  from <span>54 €</span>
                </p>
                <div className="booknowbtn">
                  <a href="#popup1">Book Now</a>
                </div>
              </div>
            </div>

            <div className="fx-servicebox">
              <div className="fx-servicepicbox">
                <img src={service} />
                <span className="fx-servicepiccontentbox">Massaggi</span>
              </div>
              <div className="fx-servicecontentbox">
                <h4>Massages</h4>
                <p>A collection of massages dedicated to specific needs.</p>
                <p className="price">
                  from <span>54 €</span>
                </p>
                <div className="booknowbtn">Book Now</div>
              </div>
            </div>
            <div className="fx-servicebox">
              <div className="fx-servicepicbox">
                <img src={service} />
                <span className="fx-servicepiccontentbox">Massaggi</span>
              </div>
              <div className="fx-servicecontentbox">
                <h4>Massages</h4>
                <p>A collection of massages dedicated to specific needs.</p>
                <p className="price">
                  from <span>54 €</span>
                </p>
                <div className="booknowbtn">Book Now</div>
              </div>
            </div>
            <div className="fx-servicebox">
              <div className="fx-servicepicbox">
                <img src={service} />
                <span className="fx-servicepiccontentbox">Massaggi</span>
              </div>
              <div className="fx-servicecontentbox">
                <h4>Massages</h4>
                <p>A collection of massages dedicated to specific needs.</p>
                <p className="price">
                  from <span>54 €</span>
                </p>
                <div className="booknowbtn">Book Now</div>
              </div>
            </div>
            <div className="fx-servicebox">
              <div className="fx-servicepicbox">
                <img src={service} />
                <span className="fx-servicepiccontentbox">Massaggi</span>
              </div>
              <div className="fx-servicecontentbox">
                <h4>Massages</h4>
                <p>A collection of massages dedicated to specific needs.</p>
                <p className="price">
                  from <span>54 €</span>
                </p>
                <div className="booknowbtn">Book Now</div>
              </div>
            </div>
            <div className="fx-servicebox">
              <div className="fx-servicepicbox">
                <img src={service} />
                <span className="fx-servicepiccontentbox">Massaggi</span>
              </div>
              <div className="fx-servicecontentbox">
                <h4>Massages</h4>
                <p>A collection of massages dedicated to specific needs.</p>
                <p className="price">
                  from <span>54 €</span>
                </p>
                <div className="booknowbtn">Book Now</div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={
            isVisible == "list" ? "fx-tabcontent selected" : "fx-tabcontent"
          }
        >
          <div className="fx-serviceboxlist">
            <div className="fx-servicepicboxlist">
              <img src={service} />
              <span className="fx-servicepiccontentbox">Massaggi</span>
            </div>
            <div className="fx-servicecontentboxlist">
              <h4>Ritual and body</h4>
              <p>A collection of massages dedicated to specific needs.</p>
              <p className="price">
                from <span>54 €</span>
              </p>
              <span className="booknowbtn">Book Now</span>
            </div>
          </div>
          <div className="fx-serviceboxlist">
            <div className="fx-servicepicboxlist">
              <img src={service} />
              <span className="fx-servicepiccontentbox">Massaggi</span>
            </div>
            <div className="fx-servicecontentboxlist">
              <h4>Ritual and body</h4>
              <p>A collection of massages dedicated to specific needs.</p>
              <p className="price">
                from <span>54 €</span>
              </p>
              <span className="booknowbtn">Book Now</span>
            </div>
          </div>
          <div className="fx-serviceboxlist">
            <div className="fx-servicepicboxlist">
              <img src={service} />
              <span className="fx-servicepiccontentbox">Massaggi</span>
            </div>
            <div className="fx-servicecontentboxlist">
              <h4>Ritual and body</h4>
              <p>A collection of massages dedicated to specific needs.</p>
              <p className="price">
                from <span>54 €</span>
              </p>
              <span className="booknowbtn">Book Now</span>
            </div>
          </div>
          <div className="fx-serviceboxlist">
            <div className="fx-servicepicboxlist">
              <img src={service} />
              <span className="fx-servicepiccontentbox">Massaggi</span>
            </div>
            <div className="fx-servicecontentboxlist">
              <h4>Ritual and body</h4>
              <p>A collection of massages dedicated to specific needs.</p>
              <p className="price">
                from <span>54 €</span>
              </p>
              <span className="booknowbtn">Book Now</span>
            </div>
          </div>
          <div className="fx-serviceboxlist">
            <div className="fx-servicepicboxlist">
              <img src={service} />
              <span className="fx-servicepiccontentbox">Massaggi</span>
            </div>
            <div className="fx-servicecontentboxlist">
              <h4>Ritual and body</h4>
              <p>A collection of massages dedicated to specific needs.</p>
              <p className="price">
                from <span>54 €</span>
              </p>
              <span className="booknowbtn">Book Now</span>
            </div>
          </div>
          <div className="fx-serviceboxlist">
            <div className="fx-servicepicboxlist">
              <img src={service} />
              <span className="fx-servicepiccontentbox">Massaggi</span>
            </div>
            <div className="fx-servicecontentboxlist">
              <h4>Ritual and body</h4>
              <p>A collection of massages dedicated to specific needs.</p>
              <p className="price">
                from <span>54 €</span>
              </p>
              <span className="booknowbtn">Book Now</span>
            </div>
          </div>
          <div className="fx-serviceboxlist">
            <div className="fx-servicepicboxlist">
              <img src={service} />
              <span className="fx-servicepiccontentbox">Massaggi</span>
            </div>
            <div className="fx-servicecontentboxlist">
              <h4>Ritual and body</h4>
              <p>A collection of massages dedicated to specific needs.</p>
              <p className="price">
                from <span>54 €</span>
              </p>
              <span className="booknowbtn">Book Now</span>
            </div>
          </div>
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
  );
}
