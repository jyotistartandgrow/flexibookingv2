import { useEffect, useState, useRef } from "react";
import logo from "../assets/logo.png";
import { useDispatch } from "react-redux";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import axiosInstance from "../Utils/Interceptor";
import moment from "moment";
import { decodeHtml } from "../Utils/Functions";
import { useReactToPrint } from "react-to-print";
import { setLoading } from "../store/step1Slice";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Swal from "sweetalert2";

export default function Thankyou() {
  const dispatch = useDispatch();
  const componentRef = useRef();
  const bookingkey = new URLSearchParams(window.location.search).get("pid");
  const [bookingData, setBookingData] = useState(null);
  const [email, setEmail] = useState("");

  const bookingdetail = async () => {
    dispatch(setLoading(true));
    const { data } = await axiosInstance.post(`/thankyou`, {
      booking_key: bookingkey,
    });
    if (data && data.status == 200) {
      console.log(data);
      setBookingData(data?.data);
      dispatch(setLoading(false));
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "Print",
    onBeforePrint: () => {
      return new Promise((resolve) => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "../src/styles/thankyou.css";
        link.onload = resolve; // wait for CSS to load
        document.head.appendChild(link);
      });
    },
  });

  const downloadAsPDF = async () => {
    const element = componentRef.current;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("download.pdf");
  };

  const sendEmail = async () => {
    if (!email) {
      Swal.fire({
        toast: true,
        position: "top-end", // or 'bottom-end', 'top-start', etc.
        showConfirmButton: false,
        timer: 3000, // auto-close after 3 seconds
        icon: "error", // 'success', 'error', 'warning', 'info', 'question'
        title: "Please provide email",
      });
    }
    const { data } = await axiosInstance.post(`/send-email`, {
      booking_key: bookingkey,
      email,
    });
    if (data && data.status == 200) {
      console.log(data);
      if (data.data.status) {
        setEmail("");
        Swal.fire({
          toast: true,
          position: "top-end", // or 'bottom-end', 'top-start', etc.
          showConfirmButton: false,
          timer: 3000, // auto-close after 3 seconds
          icon: "success", // 'success', 'error', 'warning', 'info', 'question'
          title: "Mail Sent successfully",
        });
      }
    }
  };

  useEffect(() => {
    bookingdetail();
  }, []);
  return (
    <div className="fx-booking fx-container">
      <div className="fx-confirmation-wrapper">
        <img src={logo} className="fx-thanku-logo" />
        <div className="fx-confirm-left">
          <div className="fx-voucher-icon">
            <i className="pi pi-file-pdf"></i>
            <span>Voucher</span>
          </div>

          <h1>
            Hey {bookingData?.customer_billing?.billing_first_name}{" "}
            {bookingData?.customer_billing?.billing_last_name}!
          </h1>
          <h2>Thanks for Your Order.</h2>

          <p className="fx-info-text">
            You will receive an email with the ticket, show it when you arrive
            at the Spa. If you book with a voucher, you must present your QC
            Pass, Esselunga voucher or company welfare vouchers in the purchase
            format at the reception in order to take advantage of the services
            included.
          </p>

          <div className="fx-email-box">
            <input
              type="text"
              placeholder="Send via mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="fx-btn-send" onClick={sendEmail}>
              Send
            </button>
          </div>

          <div className="fx-button-row">
            <button className="fx-btn-light" onClick={handlePrint}>
              {" "}
              <span className="fx-thankubuttontext">Print</span>{" "}
              <i className="pi pi-print"></i>
            </button>
            <button className="fx-btn-light" onClick={downloadAsPDF}>
              {" "}
              <span className="fx-thankubuttontext">Download</span>{" "}
              <i className="pi pi-download"></i>
            </button>
          </div>
        </div>
        <div className="fx-confirm-right" ref={componentRef}>
          <div className="fx-confirm-innerrightbox">
            <h3 className="fx-order-title">
              Your order is Confirmed. You will receive a confirmation mail in
              your billing email.
            </h3>

            <div className="fx-order-row">
              <div>
                Service Date:
                <br />{" "}
                <span>
                  {moment(bookingData?.service_date).format("MMMM Do, YYYY")}
                </span>
              </div>
              <div>
                Payment via: <br />
                <span>Card</span>
              </div>
            </div>

            <div className="fx-order-row">
              <div>
                Order Ref:
                <br />
                <span>{bookingData?.payment_ref_id}</span>
              </div>
            </div>

            <table className="fx-order-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                {bookingData?.products?.map((product, pkey) => (
                  <tr key={"product-" + pkey}>
                    <td>{product.product_heading}</td>
                    <td>{product.name}</td>
                    <td>{decodeHtml(product.price)}</td>
                    <td>{product.quantity}</td>
                    <td>{decodeHtml(product.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="fx-summary">
              <div>
                Subtotal{" "}
                <span>
                  {decodeHtml(bookingData?.product_details?.subtotal)}
                </span>
              </div>
              <div>
                Discount<span>{decodeHtml(bookingData?.coupon_discount)}</span>
              </div>
              <div>
                Total
                <span>{decodeHtml(bookingData?.product_details?.total)}</span>
              </div>
            </div>

            <div className="fx-address-block">
              <div>
                <h4>Billing Address</h4>
                <p>
                  {bookingData?.customer_billing?.billing_first_name}{" "}
                  {bookingData?.customer_billing?.billing_last_name} <br />
                  {bookingData?.customer_billing?.billing_address} <br />
                  {bookingData?.customer_billing?.billing_city} <br />
                  {bookingData?.customer_billing?.billing_email}
                </p>
              </div>

              <div>
                <h4>Shipping Address</h4>
                <p>
                  {bookingData?.customer_shipping?.shipping_first_name}{" "}
                  {bookingData?.customer_shipping?.shipping_last_name} <br />
                  {bookingData?.customer_shipping?.shipping_address} <br />
                  {bookingData?.customer_shipping?.shipping_city} <br />
                  {bookingData?.customer_shipping?.shipping_email}
                </p>
              </div>
            </div>
            <table className="billing-shipping-notification noborder">
              <tbody>
                <tr>
                  <th>
                    <i
                      className="fa fa-exclamation-triangle"
                      aria-hidden="true"
                    ></i>
                    This order has
                  </th>
                </tr>
                <tr>
                  <td className="addresstext addresstext-notic">
                    <i className="fa fa-hand-o-right" aria-hidden="true"></i>
                    coupon/s <strong>{bookingData?.coupon}</strong> with total
                    discount of{" "}
                    <span className="postive_price_module_discount">
                      {decodeHtml(bookingData?.coupon_discount)}
                    </span>{" "}
                  </td>
                </tr>
              </tbody>
            </table>
            <table className="discountbox">
              <tbody>
                <tr>
                  <td>
                    <div className="discount">
                      <div className="shopnowbtn" id="booking_home">
                        {" "}
                        Home
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <table className="footer">
              <tbody>
                <tr>
                  <td colspan="2" className="copyright">
                    <img decoding="async" src={logo} />
                    <br />
                    Copyrights Reserved © {moment().format("YYYY")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
