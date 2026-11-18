import Steps from "./Steps";
import Service from "./Service";
import Extra from "./Extra";
import Checkout from "./Checkout";
import Payment from "./Payment";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import OrderDetailsCard from "./OrderDetailsCard";
import { setGift, setOpenDatePurchase, setStep } from "../store/step1Slice";

export default function SgbmOpenDatePurchase(props) {
  const loading = useSelector((state) => state.step1.loading);
  const date = useSelector((state) => state.step1.date);
  const cart = useSelector((state) => state.step2.cart);
  const gift = useSelector((state) => state.step1.gift);
  const openDatePurchase = useSelector((state) => state.step1.opendatepurchase);
  const step = useSelector((state) => state.step1.step);
  const dispatch = useDispatch();
  // main.jsx seeds these flags for this shortcode; this is only a safety net.
  // Dispatching from an effect (not during render) avoids React's
  // "Cannot update a component while rendering a different component" error.
  useEffect(() => {
    if (!gift) dispatch(setGift(true));
    if (!openDatePurchase) dispatch(setOpenDatePurchase(true));
  }, [dispatch, gift, openDatePurchase]);

  useEffect(() => {
    if (step === "customizestep") dispatch(setStep("checkoutstep"));
  }, [dispatch, step]);

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
