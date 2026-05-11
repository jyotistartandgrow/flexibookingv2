import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import axiosInstance from "../Utils/Interceptor";
import { decodeHtml } from "../Utils/Functions";
import { setLoading } from "../store/step1Slice";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Swal from "sweetalert2";
import moment from "moment";

export default function CheckinThankyou() {
  const dispatch = useDispatch();
  const componentRef = useRef();
  const bookingkey = useSelector((state) => state.step3.bookingkey);
  const loading = useSelector((state) => state.step1.loading);
  const [bookingData, setBookingData] = useState(null);

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
    bookingdetail();
  }, []);
  return (
    <>
      <div className={`fx-fullscreen-loader ${loading ? "show" : "hide"}`}>
        <div className="fx-seg-loader"></div>
      </div>
      <div className="fx-voucher-purchase-success-page" ref={componentRef}>
        <div className="fx-status-icon">✓</div>
        <h1 className="fx-title">Scan Successful!</h1>
        <p className="fx-message">
          Hey {bookingData?.customer_billing?.billing_first_name}{" "}! QR code scan is successfully done.
        </p>

        <div className="fx-summary-card fx-booking">
          <h2 className="fx-summary-title">Order Summary</h2>
          <div className="fx-order-row">
            {bookingData?.service_date &&
              moment(bookingData?.service_date).isValid() && (
                <div>
                  Service Date:
                  <br />{" "}
                  <span>
                    {moment(bookingData?.service_date).format("MMMM Do, YYYY")}
                  </span>
                </div>
              )}
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
              <span>{decodeHtml(bookingData?.product_details?.subtotal)}</span>
            </div>
            <div>
              Discount
              <span>{decodeHtml(bookingData?.coupon_discount)}</span>
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

          {bookingData?.coupon != "N/A" && (
            <table className="fx-billing-shipping-notification noborder">
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
                  <td className="fx-coupon-des">
                    <i className="pi pi-angle-double-right"></i>
                    coupon/s <strong>{bookingData?.coupon}</strong> with total
                    discount of{" "}
                    <span className="postive_price_module_discount">
                      {decodeHtml(bookingData?.coupon_discount)}
                    </span>{" "}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        <div className="fx-btn-group">
          <button className="fx-btn fx-btn-primary" onClick={downloadAsPDF}>
            <span>📥</span> Download Receipt
          </button>
        </div>

        <hr className="fx-footer-separator"></hr>

        <a href="/" className="fx-home-link">
          ← Return to Homepage
        </a>
      </div>
    </>
  );
}
