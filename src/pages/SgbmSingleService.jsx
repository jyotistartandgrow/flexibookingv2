import Steps from "./Steps";
import ServiceTab from "./ServiceTab";
import Extra from "./Extra";
import Checkout from "./Checkout";
import Payment from "./Payment";
import { useSelector } from "react-redux";
import OrderDetailsCard from "./OrderDetailsCard";

export default function SgbmssOpenCalendar(props) {
  const loading = useSelector((state) => state.step1.loading);
  const date = useSelector((state) => state.step1.date);
  const cart = useSelector((state) => state.step2.cart);
  return (
    <div
      className={`${props.rightbar == "true" ? "fx-leftbar-in-rightbar-show" : ""} fx-leftbar`}
    >
      <Steps type="service" {...props} />
      <div className={`fx-fullscreen-loader ${loading ? "show" : "hide"}`}>
        <div className="fx-seg-loader"></div>
      </div>
      {props.topbar == "true" && date && cart?.service?.length > 0 && (
        <OrderDetailsCard {...props} />
      )}
      {/*  Date Tab */}
      <ServiceTab {...props} />
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
