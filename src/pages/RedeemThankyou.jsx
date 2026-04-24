import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import axiosInstance from "../Utils/Interceptor";
import { decodeHtml } from "../Utils/Functions";
import { setLoading } from "../store/step1Slice";
import Swal from "sweetalert2";

export default function Thankyou() {
  const dispatch = useDispatch();
  const componentRef = useRef();
  const voucher = useSelector((state) => state.step1.voucher);
  const loading = useSelector((state) => state.step1.loading);
  const [bookingData, setBookingData] = useState(null);

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

  useEffect(() => {
    dispatch({ type: "app/reset" });
    dispatch(setLoading(false));
    bookingdetail();
  }, []);
  return (
    <>
      <div className={`fx-fullscreen-loader ${loading ? "show" : "hide"}`}>
        <div className="fx-seg-loader"></div>
      </div>
      <div className="fx-voucher-purchase-success-page" ref={componentRef}>
        <div className="fx-status-icon">✓</div>
        <h1 className="fx-title">Redemption Successful!</h1>
        <p className="fx-message">
          Thank you for redeeming your voucher. You will receive a redemption confirmation email shortly.
        </p>

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
              {decodeHtml(bookingData?.subtotal)}
            </span>
          </div>
          {/* <div className="fx-calc-row">
                <span>Taxes (20%)</span>
                <span className="fx-bold-value">€22.00</span>
              </div> */}
          <div className="fx-calc-row">
            <span className="fx-discount">Discount applied</span>
            <span className="fx-discount">
              -{decodeHtml(bookingData?.discount)}
            </span>
          </div>

          <div className="fx-total-row">
            <span className="fx-total-label">Total Paid</span>
            <div>
              <div className="fx-grand-total">
                {decodeHtml(bookingData?.total)}
              </div>
            </div>
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
