import Steps from "./Steps";
import Service from "./Service";
import Extra from "./Extra";
import Checkout from "./Checkout";
import Payment from "./Payment";
import Category from "./Category";
import { useSelector } from "react-redux";
import OrderDetailsCard from "./OrderDetailsCard";

export default function SgbmCategory() {
  const loading = useSelector((state) => state.step1.loading);
  const date = useSelector((state) => state.step1.date);
  return (
    <div className="fx-leftbar">
      <Steps type="category" />
      <div className={`fx-fullscreen-loader ${loading ? "show" : "hide"}`}>
        <div className="fx-seg-loader"></div>
      </div>
      {date && <OrderDetailsCard />}

      {/* Category Tabs */}
      <Category />
      {/* End Category Tabs */}
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
