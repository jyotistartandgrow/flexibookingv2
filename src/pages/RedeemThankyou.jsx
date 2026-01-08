import { useEffect, useState, useRef } from "react";
import logo from "../assets/logo.png";
import { useDispatch, useSelector } from "react-redux";
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
  const voucher = useSelector((state) => state.step1.voucher);
  const [bookingData, setBookingData] = useState(null);
  const [email, setEmail] = useState("");

  const bookingdetail = async () => {
    dispatch(setLoading(true));
    const { data } = await axiosInstance.post(`/redeem-thankyou`, {
      redeem_code: voucher,
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

  useEffect(() => {
    dispatch({ type: "app/reset" });
    dispatch(setLoading(false));
    bookingdetail();
  }, []);
  return (
    <div className="fx-booking fx-container">
      <div className="fx-confirmation-wrapper">
        <img
          src={logo}
          className="fx-thanku-logo"
          onClick={() => (window.location.href = "/")}
        />
        <div className="fx-confirm-left">
          <div className="fx-voucher-icon">
            <i className="pi pi-file-pdf"></i>
            <span>Voucher</span>
          </div>

          <h1>
            Hey {bookingData?.customer_billing?.billing_first_name}{" "}
            {bookingData?.customer_billing?.billing_last_name}!
          </h1>
          <h2>Thank you for redeeeming voucher- {voucher}</h2>

          <p className="fx-info-text">
            You will receive a redeem confirmation mail in your given email.
          </p>

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
              You will receive a redeem confirmation mail in your given email.
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
                Slots: <br />
                <span>
                  {bookingData?.booking_slots?.from} -{" "}
                  {bookingData?.booking_slots?.to}
                </span>
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
                Subtotal <span>{decodeHtml(bookingData?.subtotal)}</span>
              </div>
              <div>
                Discount<span>{decodeHtml(bookingData?.discount)}</span>
              </div>
              <div>
                Total
                <span>{decodeHtml(bookingData?.total)}</span>
              </div>
            </div>

            <div className="fx-address-block">
              <div>
                <h4>Recipient</h4>
                <p>
                  {bookingData?.recipient?.recipient_first_name}{" "}
                  {bookingData?.recipient?.recipient_last_name} <br />
                  {bookingData?.recipient?.recipient_address} <br />
                  {bookingData?.recipient?.recipient_city} <br />
                  {bookingData?.recipient?.recipient_email}
                </p>
              </div>

              <div>
                <h4>Gifter</h4>
                <p>
                  {bookingData?.customer_billing?.billing_first_name}{" "}
                  {bookingData?.customer_billing?.billing_last_name} <br />
                  {bookingData?.customer_billing?.billing_address} <br />
                  {bookingData?.customer_billing?.billing_city} <br />
                  {bookingData?.customer_billing?.billing_email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
