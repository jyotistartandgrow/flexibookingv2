import { useSelector } from "react-redux";
import Steps from "./Steps";
import ChooseDate from "./ChooseDate";
import Service from "./Service";
import Extra from "./Extra";
import Checkout from "./Checkout";
import Payment from "./Payment";
import OrderDetailsCard from "./OrderDetailsCard";
import CombinedDetailsCard from "./CombinedDetailsCard";

export default function SgbmDateGift(props) {
  const loading = useSelector((state) => state.step1.loading);
  const date = useSelector((state) => state.step1.date);
  const step = useSelector((state) => state.step1.step);
  const gift = useSelector((state) => state.step1.gift);
  const voucher = useSelector((state) => state.step1.voucher);
  const cart = useSelector((state) => state.step2.cart);
  return (
    <div
      className={`${props.rightbar == "true" ? "fx-leftbar-in-rightbar-show" : ""} fx-leftbar`}
    >
      <div
        className={`fx-booking-skeleton`}
        style={{ display: loading && step == "datestep" ? "block" : "none" }}
      >
        <div className="fx-sk-tabs">
          <div className="fx-sk-tab"></div>
          <div className="fx-sk-tab"></div>
        </div>
        <div className="fx-sk-title"></div>
        <div className="fx-sk-grid">
          <div className="fx-sk-input"></div>
          <div className="fx-sk-input"></div>
          <div className="fx-sk-input"></div>
          <div className="fx-sk-input"></div>
        </div>
        <div className="fx-sk-button"></div>
        <div className="fx-sk-checkbox"></div>
      </div>
      <Steps {...props} />
      <div className={`fx-fullscreen-loader ${loading ? "show" : "hide"}`}>
        <div className="fx-seg-loader"></div>
      </div>
      {props.redeemBooking && props.topbar == "true" && !loading && voucher ? (
        <CombinedDetailsCard {...props} />
      ) : props.topbar == "true" &&
      !loading &&
      ((gift && cart?.service?.length > 0) ||
        (!gift && date && step !== "datestep")) ? (
        <OrderDetailsCard {...props} />
      ) : null}
      {/* Booking and Gift Tabs */}
      <ChooseDate {...props} />
      {/* End Booking and Gift Tabs */}
      {/* Service Tabs */}
      <Service {...props} />
      {/* End Service Tabs */}
      {/* Extra Tabs */}
      <Extra {...props} />
      {/* End Extra Tabs */}
      {/* Checkout Tabs */}
      <Checkout {...props} />
      {/* End Checkout Tabs */}
      {/* Payment Tabs */}
      <Payment {...props} />
      {/* End Payment Tabs */}
    </div>
  );
}
