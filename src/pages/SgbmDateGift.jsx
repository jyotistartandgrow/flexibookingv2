import { useState } from "react";
import Steps from "./Steps";
import ChooseDate from "./ChooseDate";
import Service from "./Service";

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
    </div>
  );
}
