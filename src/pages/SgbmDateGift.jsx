import { useState } from "react";
import Steps from "./Steps";
import ChooseDate from "./ChooseDate";
import Service from "./Service";
import Extra from "./Extra";
import Checkout from "./Checkout";
import Payment from "./Payment";

export default function SgbmDateGift() {
  // Declare state

  const [step, setStep] = useState("datestep");

  return (
    <div className="fx-leftbar">
      <Steps step={step} setStep={setStep} />
      {/* Booking and Gift Tabs */}
      <ChooseDate step={step} setStep={setStep} />
      {/* End Booking and Gift Tabs */}
      {/* Service Tabs */}
      <Service step={step} setStep={setStep} />
      {/* End Service Tabs */}
      {/* Extra Tabs */}
      <Extra step={step} setStep={setStep} />
      {/* End Extra Tabs */}
      {/* Checkout Tabs */}
      <Checkout step={step} setStep={setStep} />
      {/* End Checkout Tabs */}
      {/* Payment Tabs */}
      <Payment step={step} setStep={setStep} />
      {/* End Payment Tabs */}
    </div>
  );
}
