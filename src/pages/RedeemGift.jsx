import ReedemSteps from "./ReedemSteps";
import { useSelector } from "react-redux";
import Code from "./Code";
import SelectDate from "./SelectDate";
import SelectSlot from "./SelectSlot";
import ReedemCheckout from "./ReedemCheckout";
import ReedemSidebar from "../components/ReedemSidebar";

export default function SgbmDateGift() {
  const loading = useSelector((state) => state.step1.loading);
  return (
    <div className="fx-booking fx-container bgbody">
      <div className="fx-leftbar">
        <ReedemSteps />
        <div className={`fx-fullscreen-loader ${loading ? "show" : "hide"}`}>
          <div className="fx-seg-loader"></div>
        </div>
        {/* Code Tabs */}
        <Code />
        {/* End Code Tabs */}
        {/* Date Tabs */}
        <SelectDate />
        {/* End Date Tabs */}
        {/* Slot Tabs */}
        <SelectSlot />
        {/* End Slot Tabs */}
        {/* Checkout Tabs */}
        <ReedemCheckout />
        {/* End Checkout Tabs */}
      </div>
      <ReedemSidebar />
    </div>
  );
}
