import Steps from "./Steps";
import Service from "./Service";
import Extra from "./Extra";
import Checkout from "./Checkout";
import Payment from "./Payment";
import Category from "./Category";
import { useSelector } from "react-redux";
import OrderDetailsCard from "./OrderDetailsCard";

export default function SgbmCategory(props) {
  const loading = useSelector((state) => state.step1.loading);
  const date = useSelector((state) => state.step1.date);
  return (
    <div className={`${props.rightbar == "true" ? "fx-leftbar-in-rightbar-show" : ""} fx-leftbar`}>
      <Steps type="category" {...props} />
      <div className={`fx-fullscreen-loader ${loading ? "show" : "hide"}`}>
        <div className="fx-seg-loader"></div>
      </div>
      {props.topbar == "true" && date && <OrderDetailsCard {...props} />}

      {/* Category Tabs */}
      <Category {...props} />
      {/* End Category Tabs */}
      {/* Service Tabs */}
      <Service {...props} />
      {/* End Service Tabs */}
      {/* Extra Tabs */}
      <Extra {...props} />
      {/* End Extra Tabs */}
      {/* Checkout Tabs */}
      <Checkout {...props}/>
      {/* End Checkout Tabs */}
      {/* Payment Tabs */}
      <Payment {...props}/>
      {/* End Payment Tabs */}
    </div>
  );
}
