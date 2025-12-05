import Steps from "./Steps";
import ChooseDate from "./ChooseDate";
import Service from "./Service";
import Extra from "./Extra";
import Checkout from "./Checkout";
import Payment from "./Payment";
import { useSelector } from "react-redux";

export default function SgbmDateGift() {
  const loading = useSelector((state) => state.step1.loading);
  return (
    <div className="fx-leftbar">
      <Steps />
      {loading && (
        <div className="fx-fullscreen-loader">
          <div className="fx-seg-loader"></div>
        </div>
      )}
      {/* Booking and Gift Tabs */}
      <ChooseDate />
      {/* End Booking and Gift Tabs */}
      {/* Service Tabs */}
      <Service />
      {/* End Service Tabs */}
      {/* Extra Tabs */}
      <Extra />
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
