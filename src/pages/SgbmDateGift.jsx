import { useSelector } from "react-redux";
import Steps from "./Steps";
import ChooseDate from "./ChooseDate";
import Service from "./Service";
import Extra from "./Extra";
import Checkout from "./Checkout";
import Payment from "./Payment";
import OrderDetailsCard from "./OrderDetailsCard";

export default function SgbmDateGift(props) {
  const loading = useSelector((state) => state.step1.loading);
  const date = useSelector((state) => state.step1.date);
  const step = useSelector((state) => state.step1.step);
  const gift = useSelector((state) => state.step1.gift);
  const cart = useSelector((state) => state.step2.cart);

  return (
    <div className="fx-leftbar">
      <Steps {...props} />
      <div className={`fx-fullscreen-loader ${loading ? "show" : "hide"}`}>
        <div className="fx-seg-loader"></div>
      </div>
      {props.topbar == "true" && ((gift && cart?.service?.length > 0) ||
      (!gift && date && step !== "datestep")) ? (
        <OrderDetailsCard {...props} />
      ) : null}
      {/* Booking and Gift Tabs */}
      <ChooseDate />
      {/* End Booking and Gift Tabs */}
      {/* Service Tabs */}
      <Service {...props} />
      {/* End Service Tabs */}
      {/* Extra Tabs */}
      <Extra {...props} />
      {/* End Extra Tabs */}
      {/* Checkout Tabs */}
      <Checkout />
      {/* End Checkout Tabs */}
      {/* Payment Tabs */}
      <Payment />
      {/* End Payment Tabs */}
    </div>
  );
}
