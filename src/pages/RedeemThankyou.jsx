import { useCallback, useEffect, useState, useRef } from "react";
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
  const redeemBooking = useSelector((state) => state.step1.redeemBooking);
  const bookingkey = useSelector((state) => state.step3.bookingkey);
  const loading = useSelector((state) => state.step1.loading);
  const [bookingData, setBookingData] = useState(null);
  const [serviceBookingData, setServiceBookingData] = useState(null);
  const [email, setEmail] = useState("");
  const serviceQrCodeImage = serviceBookingData?.qrcode
    ? `data:image/png;base64,${serviceBookingData.qrcode}`
    : null;
  
  const bookingdetail = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const [redeemResponse, serviceResponse] = await Promise.all([
        axiosInstance.post(`/redeem-thankyou`, {
          redeem_code: voucher,
        }),
        redeemBooking && bookingkey
          ? axiosInstance.post(`/thankyou`, {
              booking_key: bookingkey,
            })
          : Promise.resolve(null),
      ]);

      if (redeemResponse?.data?.status == 200) {
        setBookingData(redeemResponse.data?.data);
      }
      if (serviceResponse?.data?.status == 200) {
        setServiceBookingData(serviceResponse.data?.data);
      }
    } catch (error) {
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        icon: "error",
        title:
          error?.response?.data?.message ||
          "Unable to load confirmation details",
      });
    } finally {
      dispatch(setLoading(false));
    }
  }, [bookingkey, dispatch, redeemBooking, voucher]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "Print",
    pageStyle: `
      @page { margin: 20mm; }
      * { box-sizing: border-box; }
      body { font-family: Arial, sans-serif; font-size: 14px; color: #222; background: #fff; }
      .fx-confirm-innerrightbox { background: #fff; padding: 20px 40px; }
      .fx-order-title { font-size: 16px; color: #444; line-height: 1.5; margin-bottom: 20px; }
      .fx-order-row { display: flex; justify-content: space-between; color: #444; font-size: 13px; font-weight: 500; margin-bottom: 10px; line-height: 1.5; }
      .fx-order-row span { color: #777; font-weight: 300; }
      .fx-order-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
      .fx-order-table th { font-weight: 600; padding: 10px 4px; text-align: left; border-bottom: 2px solid #ddd; }
      .fx-order-table td { color: #777; font-weight: 300; padding: 10px 4px; text-align: left; border-bottom: 1px solid #eee; }
      .fx-order-table th:last-child, .fx-order-table td:last-child { text-align: right; }
      .fx-summary { border-top: 2px solid #ddd; padding-top: 15px; font-weight: 500; margin-top: 4px; }
      .fx-summary div { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
      .fx-address-block { border-top: 1px solid #ddd; margin-top: 15px; display: flex; justify-content: space-between; gap: 20px; }
      .fx-address-block h4 { margin-bottom: 8px; margin-top: 15px; font-size: 13px; font-weight: 600; }
      .fx-address-block p { font-size: 13px; color: #777; margin-top: 0; line-height: 1.5; font-weight: 300; word-break: break-word; }
      .fx-billing-shipping-notification { background: #fff7f7; width: 100%; padding: 12px; text-align: left; border-radius: 8px; border: 1px solid #ffb7b7; font-size: 14px; margin-top: 16px; border-collapse: collapse; }
      .fx-billing-shipping-notification th { padding-bottom: 6px; font-weight: 600; }
      .fx-coupon-des { color: #385f6a; }
      .fx-coupon-des .postive_price_module_discount { font-weight: bold; color: #1b9b2a; }
      .fx-qr-block { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
      .fx-qr-block-text { flex: 1; }
      .fx-qr-block-text h4 { margin: 0 0 6px; font-size: 13px; font-weight: 600; color: #333; }
      .fx-qr-block-text p { margin: 0; font-size: 13px; color: #777; font-weight: 300; line-height: 1.5; }
      .fx-qr-image-wrapper { flex-shrink: 0; width: 100px; height: 100px; border: 1px solid #ddd; border-radius: 6px; padding: 6px; background: #fff; display: flex; align-items: center; justify-content: center; }
      .fx-qr-image { width: 100%; height: 100%; object-fit: contain; display: block; }
    `,
  });

  const downloadAsPDF = async () => {
    const element = componentRef.current;
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: false,
      scale: 2,
      backgroundColor: "#ffffff",
    });
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
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        icon: "error",
        title: "Please provide email",
      });
      return;
    }

    const { data } = await axiosInstance.post(`/send-email`, {
      redeem_code: voucher,
      email,
    });

    if (data && data.status == 200) {
      if (data.data.status) {
        setEmail("");
        Swal.fire({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          icon: "success",
          title: "Mail Sent successfully",
        });
      }
    }
  };

  useEffect(() => {
    dispatch(setLoading(false));
    bookingdetail();
  }, [bookingdetail, dispatch]);

  return (
    <>
      <div className={`fx-fullscreen-loader ${loading ? "show" : "hide"}`}>
        <div className="fx-seg-loader"></div>
      </div>
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
            <h2>Thanks for Redeeming.</h2>

            <p className="fx-info-text">
              Thank you for redeeming your voucher. You can print or download
              your voucher for future reference. You will also receive a
              confirmation email with the details of your booking.
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
                <span className="fx-thankubuttontext">Print</span>
                <i className="pi pi-print"></i>
              </button>
              <button className="fx-btn-light" onClick={downloadAsPDF}>
                <span className="fx-thankubuttontext">Download</span>
                <i className="pi pi-download"></i>
              </button>
            </div>
          </div>

          <div
            className="fx-confirm-right notranslate"
            ref={componentRef}
            translate="no"
          >
            <div className="fx-confirm-innerrightbox">
              <h3 className="fx-order-title">
                Your order is Confirmed. You will receive a confirmation mail.
              </h3>

              <div className="fx-order-row">
                {bookingData?.service_date &&
                  moment(bookingData?.service_date).isValid() && (
                    <div>
                      Service Date:
                      <br />
                      <span>
                        {moment(bookingData?.service_date).format(
                          "MMMM Do, YYYY",
                        )}
                      </span>
                    </div>
                  )}
                <div>
                  Payment via: <br />
                  <span>Voucher</span>
                </div>
              </div>

              <div className="fx-order-row">
                <div>
                  Order Ref:
                  <br />
                  <span>
                    {bookingData?.payment_ref_id ||
                      bookingData?.order_ref ||
                      voucher}
                  </span>
                </div>
              </div>

              <table className="fx-order-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                  </tr>
                </thead>

                <tbody>
                  {bookingData?.products?.map((product, pkey) => (
                    <tr key={"product-" + pkey}>
                      <td>{product.name}</td>
                      <td>{product.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {bookingData?.coupon != "N/A" && bookingData?.coupon && (
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
                        coupon/s <strong>{bookingData?.coupon}</strong> with
                        total discount of
                        <span className="postive_price_module_discount">
                          {decodeHtml(bookingData?.coupon_discount)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}

              {redeemBooking && serviceBookingData && (
                <section className="fx-combined-booking-confirmation">
                  <h3 className="fx-order-title">New Service Booking</h3>

                  <div className="fx-order-row">
                    {serviceBookingData?.service_date &&
                      moment(serviceBookingData.service_date).isValid() && (
                        <div>
                          Service Date:
                          <br />
                          <span>
                            {moment(serviceBookingData.service_date).format(
                              "MMMM Do, YYYY",
                            )}
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
                      <span>{serviceBookingData?.payment_ref_id}</span>
                    </div>
                  </div>

                  <table className="fx-order-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceBookingData?.products?.map((product, pkey) => (
                        <tr key={`service-product-${pkey}`}>
                          <td>{product.name}</td>
                          <td>{decodeHtml(product.price)}</td>
                          <td>{product.quantity}</td>
                          <td>{decodeHtml(product.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="fx-summary">
                    {serviceBookingData?.product_details?.discount > 0 && (
                      <>
                        <div>
                          Subtotal
                          <span>
                            {decodeHtml(
                              serviceBookingData?.product_details?.subtotal,
                            )}
                          </span>
                        </div>
                        <div>
                          Discount
                          <span>
                            {decodeHtml(serviceBookingData?.coupon_discount)}
                          </span>
                        </div>
                      </>
                    )}
                    <div>
                      Total
                      <span>
                        {decodeHtml(
                          serviceBookingData?.product_details?.total,
                        )}
                      </span>
                    </div>
                  </div>

                  {serviceBookingData?.coupon != "N/A" &&
                    serviceBookingData?.coupon && (
                      <table className="fx-billing-shipping-notification noborder">
                        <tbody>
                          <tr>
                            <th>This order has</th>
                          </tr>
                          <tr>
                            <td className="fx-coupon-des">
                              coupon/s{" "}
                              <strong>{serviceBookingData.coupon}</strong> with
                              total discount of{" "}
                              <span className="postive_price_module_discount">
                                {decodeHtml(
                                  serviceBookingData?.coupon_discount,
                                )}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}

                </section>
              )}

              <div className="fx-address-block">
                <div>
                  <h4>Customer Details</h4>
                  <p>
                    {bookingData?.customer_billing?.billing_first_name}{" "}
                    {bookingData?.customer_billing?.billing_last_name} <br />
                    {bookingData?.customer_billing?.billing_email} <br />
                    {bookingData?.customer_billing?.billing_contact}
                  </p>
                </div>
              </div>

              {redeemBooking &&
                serviceBookingData &&
                !serviceBookingData?.voucher &&
                serviceQrCodeImage && (
                  <div className="fx-qr-block">
                    <div className="fx-qr-block-text">
                      <h4>Booking Verification QR Code</h4>
                      <p>Present this QR code at the time of service</p>
                    </div>
                    <div className="fx-qr-image-wrapper">
                      <img
                        src={serviceQrCodeImage}
                        alt="Booking verification QR code"
                        className="fx-qr-image"
                      />
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
