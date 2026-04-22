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

export default function OpenDateThankyou() {
  const dispatch = useDispatch();
  const componentRef = useRef();
  const bookingkey = useSelector((state) => state.step3.bookingkey);
  const loading = useSelector((state) => state.step1.loading);
  const [bookingData, setBookingData] = useState(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

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
    //dispatch({ type: "app/reset" });
    bookingdetail();
  }, []);
  return (
    <>
      <div className={`fx-fullscreen-loader ${loading ? "show" : "hide"}`}>
        <div className="fx-seg-loader"></div>
      </div>
      <div className="fx-voucher-purchase-success-page" ref={componentRef}>
        <div className="fx-status-icon">✓</div>
        <h1 className="fx-title">Payment Successful!</h1>
        <p className="fx-message">
          Your booking has been confirmed. A confirmation email with your
          details has been sent to your inbox.
        </p>

        <div className="fx-voucher-box">
          <span className="fx-voucher-label">Your Unique Voucher Code</span>
          <div className="fx-voucher-code">
            {bookingData?.voucher || "N/A"}
            <button
              className="fx-copy-btn"
              onClick={() => {
                navigator.clipboard.writeText(bookingData?.voucher || "");
                Swal.fire({
                  toast: true,
                  position: "top-end",
                  showConfirmButton: false,
                  timer: 2000,
                  icon: "success",
                  title: "Voucher copied!",
                });
              }}
            >
              ❐
            </button>
          </div>
        </div>

        <div className="fx-summary-card">
          <h2 className="fx-summary-title">Order Summary</h2>
          {bookingData?.products?.map((product, pkey) => (
            <div className="fx-item-row" key={pkey}>
              <div className="fx-item-info">
                <p className="fx-item-name">{product.name}</p>
                <p className="fx-item-meta">
                  {product.quantity} x {product.product_heading}
                </p>
              </div>
              <div className="fx-item-price">{decodeHtml(product.total)}</div>
            </div>
          ))}

          <hr className="fx-divider"></hr>

          <div className="fx-calc-row">
            <span>Subtotal</span>
            <span className="fx-bold-value">
              {decodeHtml(bookingData?.product_details?.subtotal)}
            </span>
          </div>
          {/* <div className="fx-calc-row">
            <span>Taxes (20%)</span>
            <span className="fx-bold-value">€22.00</span>
          </div> */}
          <div className="fx-calc-row">
            <span className="fx-discount">Discount applied</span>
            <span className="fx-discount">
              -{decodeHtml(bookingData?.coupon_discount)}
            </span>
          </div>

          <div className="fx-total-row">
            <span className="fx-total-label">Total Paid</span>
            <div>
              <div className="fx-grand-total">
                {decodeHtml(bookingData?.product_details?.total)}
              </div>
              {/* <div className="fx-payment-meta">
                Paid via Credit Card ending in **** 4242
              </div> */}
            </div>
          </div>
        </div>

        <div className="fx-btn-group">
          <button className="fx-btn fx-btn-primary" onClick={downloadAsPDF}>
            <span>📥</span> Download Receipt
          </button>
          <div className="fx-share-wrapper" style={{ position: "relative", display: "inline-block" }}>
            <button
              className="fx-btn fx-btn-secondary"
              onClick={() => setShowShareMenu(!showShareMenu)}
            >
              <span>🔗</span> Share Voucher
            </button>
            {showShareMenu && (
              <div
                className="fx-share-menu"
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  marginBottom: "8px",
                  background: "#fff",
                  borderRadius: "8px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                  padding: "8px 0",
                  zIndex: 10,
                  minWidth: "180px",
                }}
              >
                {[
                  {
                    label: "WhatsApp",
                    icon: "💬",
                    onClick: () => {
                      const text = encodeURIComponent(`Here's my voucher code: ${bookingData?.voucher || ""}`);
                      window.open(`https://wa.me/?text=${text}`, "_blank");
                    },
                  },
                  {
                    label: "Facebook",
                    icon: "📘",
                    onClick: () => {
                      const url = encodeURIComponent(window.location.href);
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodeURIComponent(`Here's my voucher code: ${bookingData?.voucher || ""}`)}`, "_blank");
                    },
                  },
                  {
                    label: "X (Twitter)",
                    icon: "🐦",
                    onClick: () => {
                      const text = encodeURIComponent(`Here's my voucher code: ${bookingData?.voucher || ""}`);
                      window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
                    },
                  },
                  {
                    label: "Email",
                    icon: "✉️",
                    onClick: () => {
                      const subject = encodeURIComponent("My Voucher Code");
                      const body = encodeURIComponent(`Here's my voucher code: ${bookingData?.voucher || ""}`);
                      window.location.href = `mailto:?subject=${subject}&body=${body}`;
                    },
                  },
                  {
                    label: "Copy Link",
                    icon: "📋",
                    onClick: () => {
                      navigator.clipboard.writeText(bookingData?.voucher || "").then(() => {
                        Swal.fire({
                          toast: true,
                          position: "top-end",
                          showConfirmButton: false,
                          timer: 2000,
                          icon: "success",
                          title: "Voucher copied to clipboard!",
                        });
                      });
                    },
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      item.onClick();
                      setShowShareMenu(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                      padding: "8px 16px",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <span>{item.icon}</span> {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <hr className="fx-footer-separator"></hr>

        <a href="/" className="fx-home-link">
          ← Return to Homepage
        </a>
      </div>
    </>
  );
}
