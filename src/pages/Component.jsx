import { useState } from "react";
// import { Calendar } from "primereact/calendar";
// import { Tooltip } from "primereact/tooltip";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import calendar from "../assets/calendar.png";
import service from "../assets/service1.jpg";
import extra from "../assets/extra1.jpg";
import { Carousel } from "primereact/carousel";

export default function Component() {
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

  const responsiveOptions = [
        {
            breakpoint: '1024px', // For screens less than 1024px
            numVisible: 3,
            numScroll: 3
        },
        {
            breakpoint: '768px', // For screens less than 768px (tablets)
            numVisible: 2,
            numScroll: 2
        },
        {
            breakpoint: '560px', // For screens less than 560px (mobile phones)
            numVisible: 1,
            numScroll: 1
        }
    ]

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
    <div className="fx-leftbar">
      <h1>Generic Componets</h1>
      <h3>Stepper</h3>
      <div className="fx-stepper">
        <div className="fx-step-container active">
          <div className="fx-step active">1</div>
          <div className="fx-step-label">Date</div>
        </div>
        <div className="fx-line active"></div>
        <div className="fx-step-container">
          <div className="fx-step">2</div>
          <div className="fx-step-label">Services</div>
        </div>
        <div className="fx-line"></div>
        <div className="fx-step-container">
          <div className="fx-step">3</div>
          <div className="fx-step-label">Extra</div>
        </div>
        <div className="fx-line"></div>
        <div className="fx-step-container">
          <div className="fx-step">4</div>
          <div className="fx-step-label">Checkout</div>
        </div>
        <div className="fx-line"></div>
        <div className="fx-step-container">
          <div className="fx-step">5</div>
          <div className="fx-step-label">Payment</div>
        </div>
      </div>

      <div className="fx-stepper">
        <div className="fx-step-container mobcompleted">
          <div className="fx-step completed">1</div>
          <div className="fx-step-label">Date</div>
        </div>
        <div className="fx-line "></div>
        <div className="fx-step-container active">
          <div className="fx-step active">2</div>
          <div className="fx-step-label">Services</div>
        </div>
        <div className="fx-line active"></div>
        <div className="fx-step-container">
          <div className="fx-step">3</div>
          <div className="fx-step-label">Extra</div>
        </div>
        <div className="fx-line"></div>
        <div className="fx-step-container">
          <div className="fx-step">4</div>
          <div className="fx-step-label">Checkout</div>
        </div>
        <div className="fx-line"></div>
        <div className="fx-step-container">
          <div className="fx-step">5</div>
          <div className="fx-step-label">Payment</div>
        </div>
      </div>

      <div className="fx-stepper">
        <div className="fx-step-container mobcompleted">
          <div className="fx-step completed">1</div>
          <div className="fx-step-label">Date</div>
        </div>
        <div className="fx-line"></div>
        <div className="fx-step-container">
          <div className="fx-step completed">2</div>
          <div className="fx-step-label">Services</div>
        </div>
        <div className="fx-line"></div>
        <div className="fx-step-container active">
          <div className="fx-step active">3</div>
          <div className="fx-step-label">Extra</div>
        </div>
        <div className="fx-line active"></div>
        <div className="fx-step-container">
          <div className="fx-step">4</div>
          <div className="fx-step-label">Checkout</div>
        </div>
        <div className="fx-line"></div>
        <div className="fx-step-container">
          <div className="fx-step">5</div>
          <div className="fx-step-label">Payment</div>
        </div>
      </div>

      <div className="fx-stepper">
        <div className="fx-step-container mobcompleted">
          <div className="fx-step completed">1</div>
          <div className="fx-step-label">Date</div>
        </div>
        <div className="fx-line"></div>
        <div className="fx-step-container">
          <div className="fx-step completed">2</div>
          <div className="fx-step-label">Services</div>
        </div>
        <div className="fx-line"></div>
        <div className="fx-step-container">
          <div className="fx-step completed">3</div>
          <div className="fx-step-label">Extra</div>
        </div>
        <div className="fx-line"></div>
        <div className="fx-step-container active">
          <div className="fx-step active">4</div>
          <div className="fx-step-label">Checkout</div>
        </div>
        <div className="fx-line  active"></div>
        <div className="fx-step-container">
          <div className="fx-step">5</div>
          <div className="fx-step-label">Payment</div>
        </div>
      </div>

      <div className="fx-stepper-tabstyle" style={{ marginTop: "30px" }}>
        <div className="step datestep active">
          <span>1 DATE</span>
        </div>
        <div className="step servicesstep ">
          2 <span>SERVICES</span>
        </div>
        <div className="step extrastep ">
          3 <span>EXTRA</span>
        </div>
        <div className="step checkoutstep ">
          4 <span>CHECKOUT</span>
        </div>
        <div className="step paymentstep ">
          5 <span>PAYMENT</span>
        </div>
      </div>

      <div className="fx-stepper-tabstyle" style={{ marginTop: "30px" }}>
        <div className="step datestep complete">
          <span>1 DATE</span>
        </div>
        <div className="step servicesstep active">
          <span>2 SERVICES</span>
        </div>
        <div className="step extrastep ">
          <span>3 EXTRA</span>
        </div>
        <div className="step checkoutstep ">
          <span>4 CHECKOUT</span>
        </div>
        <div className="step paymentstep ">
          <span>5 PAYMENT</span>
        </div>
      </div>

      <div className="fx-stepper-tabstyle" style={{ marginTop: "30px" }}>
        <div className="step datestep complete">
          1<span>DATE</span>
        </div>
        <div className="step servicesstep complete">
          2<span>SERVICES</span>
        </div>
        <div className="step extrastep active">
          <span>3 EXTRA</span>
        </div>
        <div className="step checkoutstep ">
          4<span>CHECKOUT</span>
        </div>
        <div className="step paymentstep ">
          5<span>PAYMENT</span>
        </div>
      </div>

      <div className="fx-stepper-tabstyle" style={{ marginTop: "30px" }}>
        <div className="step datestep complete">
          1<span>DATE</span>
        </div>
        <div className="step servicesstep complete">
          2<span>SERVICES</span>
        </div>
        <div className="step extrastep complete">
          3<span>EXTRA</span>
        </div>
        <div className="step checkoutstep active">
          <span>4CHECKOUT</span>
        </div>
        <div className="step paymentstep ">
          5<span>PAYMENT</span>
        </div>
      </div>

      <div className="fx-stepper-tabstyle" style={{ marginTop: "30px" }}>
        <div className="step datestep complete">
          1<span>DATE</span>
        </div>
        <div className="step servicesstep complete">
          2<span>SERVICES</span>
        </div>
        <div className="step extrastep complete">
          3<span>EXTRA</span>
        </div>
        <div className="step checkoutstep complete">
          4<span>CHECKOUT</span>
        </div>
        <div className="step paymentstep active">
          <span>5 PAYMENT</span>
        </div>
      </div>

      <h3>Tab</h3>
      <div id="fx-tab_nav">
        <ul>
          <li className="selected">
            <a href="#">Booking</a>
          </li>
          <li>
            <a href="#">Gift</a>
          </li>
        </ul>
        <div className="fx-tabcontent">
          <div className="fx-element-box">
            <div className="fx-calendar fx-commoninput">
              <input
                type="text"
                placeholder="Select date"
                name="checkIn"
                className="fx-datepicker"
              />
              <img src={calendar} className="fx-calendaricon" />
            </div>
          </div>
          <div className="fx-element-box">
            <input
              type="submit"
              className="btn-primary"
              value="Check Availability"
            />
          </div>
          <div className="fx-couponcontainer">
            <div className="fx-element-box">
              <input type="checkbox" id="checkbox-checked" defaultChecked />
              <label htmlFor="checkbox-checked" className="checkbox-label">
                Do you have a promo code?
              </label>
            </div>
            <div className="fx-commoninput">
              <div className="fx-couponcontainerinputbox">
                <div className="fx-coupon-box">
                  <input type="text" placeholder="Enter your coupon code" />
                  <button className="fx-apply-btn">Apply</button>
                </div>
              </div>

              <div className="fx-couponcontainerinputbox">
                <div className="fx-coupon-box">
                  <input type="text" placeholder="Enter your coupon code" />
                  <button className="fx-apply-btn">Apply</button>
                </div>
                <div>
                  <i className="fa fa-trash fx-delete-icon"></i>
                </div>
              </div>
              <div className="fx-element-box">
                <p className="fx-addmorelink">Add More</p>
              </div>
            </div>
          </div>
        </div>
        <div className="fx-tabcontent">
          <h3>Gift receiver information</h3>
          <div className="fx-giftbox fx-commoninput">
            <div className="fx-inputgroup">
              <input type="text" placeholder="First Name" />
              <input type="text" placeholder="Last Name" />
            </div>
            <div className="fx-inputgroup">
              <div className="fx-input-wrapper">
                <input type="email" placeholder="Email" />
                <i className="fa fa-envelope-o"></i>
              </div>
              <div className="fx-input-wrapper">
                <input type="text" placeholder="Phone Number" />
                <i className="fa fa-phone"></i>
              </div>
            </div>
            <div className="fx-inputgroup">
              <div className="fx-input-wrapper">
                <input type="text" placeholder="Country" />
                <i className="fa fa-flag-o"></i>
              </div>
              <div className="fx-input-wrapper">
                <input type="text" placeholder="Zip" />
              </div>
            </div>
            <div className="fx-element-box">
              <input
                type="submit"
                className="btn-primary"
                value="View Services"
              />
            </div>
          </div>
        </div>
      </div>
      <h3>Buttons</h3>
      <div className="fx-element-box">
        <input
          type="submit"
          className="btn-primary"
          value="Check Availability"
        />
      </div>
      <br />

      <input
        type="submit"
        className="btn-secondary"
        value="Check Availability"
      />

      <h3>Input With lables</h3>
      <div className="fx-commoninput">
        <div className="fx-inputgroup">
          <div className="fx-element-box">
            <label>First Name</label>
            <input type="text" placeholder="First Name" />
          </div>
          <div className="fx-element-box">
            <label>Last Name</label>
            <input type="text" placeholder="Last Name" />
          </div>
        </div>

        <div className="fx-inputgroup">
          <div className="fx-element-box">
            <label>Email</label>
            <input type="text" placeholder="Email" />
          </div>
          <div className="fx-element-box">
            <label>Mobile</label>
            <input type="text" placeholder="Last Name" />
          </div>
        </div>
        <div className="fx-inputgroup">
          <div className="fx-element-box">
            <label>Address</label>
            <input type="text" placeholder="Address" className="bigtextbox" />
          </div>
        </div>
        <div className="fx-inputgroup">
          <div className="fx-element-box">
            <label>City</label>
            <input type="text" placeholder="City" />
          </div>
          <div className="fx-element-box">
            <label>State</label>
            <input type="text" placeholder="State" />
          </div>
        </div>
        <div className="fx-inputgroup">
          <div className="fx-element-box">
            <label>Country</label>
            <input type="text" placeholder="City" />
          </div>
          <div className="fx-element-box">
            <label>Zip</label>
            <input type="text" placeholder="State" />
          </div>
        </div>
        <div className="fx-inputgroup">
          <div className="fx-element-box">
            <label>Order Notes</label>
            <input type="text" placeholder="Note" className="bigtextbox" />
          </div>
        </div>
      </div>

      <h3>Service Card1</h3>
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
      <h3>Service Card2</h3>
      <div className="fx-servicecontainer">
        <div className="fx-servicebox">
          <div className="fx-servicepicbox">
            <img src={service} />
            <span className="fx-servicepiccontentbox">Massaggi</span>
            <p className="fx-pricebox"> €26.00</p>
          </div>
          <div className="fx-servicecontentbox">
            <h4>Massages</h4>
            <p>A collection of massages dedicated to specific needs.</p>

            <div className="booknowbtn">Book Now</div>
          </div>
        </div>
        <div className="fx-servicebox">
          <div className="fx-servicepicbox">
            <img src={service} />
            <span className="fx-servicepiccontentbox">Massaggi</span>
            <p className="fx-pricebox"> €26.00</p>
          </div>
          <div className="fx-servicecontentbox">
            <h4>Massages</h4>
            <p>A collection of massages dedicated to specific needs.</p>

            <div className="booknowbtn">Book Now</div>
          </div>
        </div>
        <div className="fx-servicebox">
          <div className="fx-servicepicbox">
            <img src={service} />
            <span className="fx-servicepiccontentbox">Massaggi</span>
            <p className="fx-pricebox"> €26.00</p>
          </div>
          <div className="fx-servicecontentbox">
            <h4>Massages</h4>
            <p>A collection of massages dedicated to specific needs.</p>

            <div className="booknowbtn">Book Now</div>
          </div>
        </div>
        <div className="fx-servicebox">
          <div className="fx-servicepicbox">
            <img src={service} />
            <span className="fx-servicepiccontentbox">Massaggi</span>
            <p className="fx-pricebox"> €26.00</p>
          </div>
          <div className="fx-servicecontentbox">
            <h4>Massages</h4>
            <p>A collection of massages dedicated to specific needs.</p>

            <div className="booknowbtn">Book Now</div>
          </div>
        </div>
      </div>
      <h3>Extra Card1</h3>
      <div className="fx-extracontainer">
        <div className="fx-extrabox">
          <div className="fx-extrapicbox">
            <img src={extra} />
          </div>
          <div className="fx-extracontentbox">
            <h4>Face Treatments</h4>
            <p>A collection of massages dedicated</p>
            <p className="price">€26,89</p>
            <div className="fx-common">
              <div className="fx-quantitybox">
                <button type="button" className="decrement">
                  -
                </button>
                <input type="number" defaultValue="0" min="0" />
                <button type="button" className="increment">
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="fx-extrabox">
          <div className="fx-extrapicbox">
            <img src={extra} />
          </div>
          <div className="fx-extracontentbox">
            <h4>Face Treatments</h4>
            <p>A collection of massages dedicated</p>
            <p className="price">€26,89</p>
            <div className="fx-common">
              <div className="fx-quantitybox">
                <button type="button" className="decrement">
                  -
                </button>
                <input type="number" defaultValue="0" min="0" />
                <button type="button" className="increment">
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="fx-extrabox">
          <div className="fx-extrapicbox">
            <img src={extra} />
          </div>
          <div className="fx-extracontentbox">
            <h4>Face Treatments</h4>
            <p>A collection of massages dedicated</p>
            <p className="price">€26,89</p>
            <div className="fx-common">
              <div className="fx-quantitybox">
                <button type="button" className="decrement">
                  -
                </button>
                <input type="number" defaultValue="0" min="0" />
                <button type="button" className="increment">
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <h3>Extra Card2</h3>
      <div className="fx-extracontainer">
        <div className="fx-extrabox">
          <div className="fx-extrapicbox">
            <img src={extra} />
            <p className="fx-extrapicpricebox">€26,89</p>
          </div>
          <div className="fx-extracontentbox">
            <h4>Face Treatments</h4>
            <p>A collection of massages dedicated</p>
            <div className="fx-common">
              <div className="fx-quantitybox">
                <button type="button" className="decrement">
                  -
                </button>
                <input type="number" defaultValue="0" min="0" />
                <button type="button" className="increment">
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="fx-extrabox">
          <div className="fx-extrapicbox">
            <img src={extra} />
            <p className="fx-extrapicpricebox">€26,89</p>
          </div>
          <div className="fx-extracontentbox">
            <h4>Face Treatments</h4>
            <p>A collection of massages dedicated</p>
            <div className="fx-common">
              <div className="fx-quantitybox">
                <button type="button" className="decrement">
                  -
                </button>
                <input type="number" defaultValue="0" min="0" />
                <button type="button" className="increment">
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="fx-extrabox">
          <div className="fx-extrapicbox">
            <img src={extra} />
            <p className="fx-extrapicpricebox">€26,89</p>
          </div>
          <div className="fx-extracontentbox">
            <h4>Face Treatments</h4>
            <p>A collection of massages dedicated</p>
            <div className="fx-common">
              <div className="fx-quantitybox">
                <button type="button" className="decrement">
                  -
                </button>
                <input type="number" defaultValue="0" min="0" />
                <button type="button" className="increment">
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <h3>Extra Card3</h3>
      <div className="fx-extracontainer">
        <div className="fx-extrabox">
          <div className="fx-extrapicbox">
            <img src={extra} />
            <p className="fx-extrapicpriceboxright">€26,89</p>
          </div>
          <div className="fx-extracontentbox">
            <h4>Face Treatments</h4>
            <p>A collection of massages dedicated</p>
            <div className="fx-common">
              <div className="fx-quantitybox">
                <button type="button" className="decrement">
                  -
                </button>
                <input type="number" defaultValue="0" min="0" />
                <button type="button" className="increment">
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="fx-extrabox">
          <div className="fx-extrapicbox">
            <img src={extra} />
            <p className="fx-extrapicpriceboxright">€26,89</p>
          </div>
          <div className="fx-extracontentbox">
            <h4>Face Treatments</h4>
            <p>A collection of massages dedicated</p>
            <div className="fx-common">
              <div className="fx-quantitybox">
                <button type="button" className="decrement">
                  -
                </button>
                <input type="number" defaultValue="0" min="0" />
                <button type="button" className="increment">
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="fx-extrabox">
          <div className="fx-extrapicbox">
            <img src={extra} />
            <p className="fx-extrapicpriceboxright">€26,89</p>
          </div>
          <div className="fx-extracontentbox">
            <h4>Face Treatments</h4>
            <p>A collection of massages dedicated</p>
            <div className="fx-common">
              <div className="fx-quantitybox">
                <button type="button" className="decrement">
                  -
                </button>
                <input type="number" defaultValue="0" min="0" />
                <button type="button" className="increment">
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3>Extra Card4</h3>
      <div className="fx-extracontainer">
        <div className="fx-extrabox">
          <div className="fx-extrapicbox">
            <img src={extra} />
          </div>
          <div className="fx-extracontentbox">
            <h4>Face Treatments</h4>
            <p>A collection of massages dedicated</p>
            <div className="fx-common">
              <div className="fx-quantitybox">
                <button type="button" className="decrement">
                  -
                </button>
                <input type="number" defaultValue="0" min="0" />
                <button type="button" className="increment">
                  +
                </button>
              </div>
              <div className="price">€26,89</div>
            </div>
          </div>
        </div>
        <div className="fx-extrabox">
          <div className="fx-extrapicbox">
            <img src={extra} />
          </div>
          <div className="fx-extracontentbox">
            <h4>Face Treatments</h4>
            <p>A collection of massages dedicated</p>
            <div className="fx-common">
              <div className="fx-quantitybox">
                <button type="button" className="decrement">
                  -
                </button>
                <input type="number" defaultValue="0" min="0" />
                <button type="button" className="increment">
                  +
                </button>
              </div>
              <div className="price">€26,89</div>
            </div>
          </div>
        </div>
        <div className="fx-extrabox">
          <div className="fx-extrapicbox">
            <img src={extra} />
          </div>
          <div className="fx-extracontentbox">
            <h4>Face Treatments</h4>
            <p>A collection of massages dedicated</p>
            <div className="fx-common">
              <div className="fx-quantitybox">
                <button type="button" className="decrement">
                  -
                </button>
                <input type="number" defaultValue="0" min="0" />
                <button type="button" className="increment">
                  +
                </button>
              </div>
              <div className="price">€26,89</div>
            </div>
          </div>
        </div>
      </div>
      <h3>Slider</h3>
      <div className="slider responsive">
        <Carousel
          value={products}
          itemTemplate={productTemplate}
          numVisible={4}
          numScroll={3}
          responsiveOptions={responsiveOptions}
          circular
          autoplayInterval={3000}
        />
      </div>
      <div className="fx-leftcontentbox">
        <h3>
          Grid View, List View & Slider{" "}
          <span className="fx-tooltip-container">
            {/* <FontAwesomeIcon icon={faSquareFull} className="fx-info-icon" /> */}
            <div className="fx-tooltip">
              Lorem Ipsum is simply dummy text of the printing and typesetting
              industry.
            </div>
          </span>
        </h3>
        <div id="fx-Icontab_nav">
          <ul>
            <li className="selected">
              <a
                href="#"
                className={isVisible == "grid" ? "selected" : ""}
                onClick={() => toggleDiv("grid")}
              >
                <i className="fa fa-th"></i>
              </a>
            </li>
            <li>
              <a
                href="#"
                className={isVisible == "list" ? "selected" : ""}
                onClick={() => toggleDiv("list")}
              >
                <i className="fa fa-list"></i>
              </a>
            </li>
            <li>
              <a
                href="#"
                className={isVisible == "slider" ? "selected" : ""}
                onClick={() => toggleDiv("slider")}
              >
                <i className="fa fa-sliders"></i>
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
            </div>
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
                responsiveOptions={responsiveOptions}
                circular
                autoplayInterval={3000}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
