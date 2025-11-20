import Steps from "./Steps";
import ChooseDate from "./ChooseDate";
import Service from "./Service";
import Extra from "./Extra";
import Checkout from "./Checkout";
import Payment from "./Payment";

export default function SgbmDateGift() {
  return (
    <div className="fx-leftbar">
      <Steps />
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
