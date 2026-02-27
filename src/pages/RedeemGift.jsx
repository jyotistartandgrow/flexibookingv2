import ReedemSteps from "./ReedemSteps";
import { useSelector } from "react-redux";
import Code from "./Code";
import SelectDate from "./SelectDate";
import SelectSlot from "./SelectSlot";
import ReedemCheckout from "./ReedemCheckout";
import ReedemSidebar from "../components/ReedemSidebar";
import RedeemDetailCard from "./RedeemDetailCard";

export default function SgbmDateGift(props) {
  const loading = useSelector((state) => state.step1.loading);
  const voucher = useSelector((state) => state.step1.voucher);
  return (
    <div className="fx-booking fx-container bgbody">
      <div className={`${props.rightbar == "true" ? "fx-leftbar-in-rightbar-show" : ""} fx-leftbar`}>
        <ReedemSteps {...props} />
        <div className={`fx-fullscreen-loader ${loading ? "show" : "hide"}`}>
          <div className="fx-seg-loader"></div>
        </div>
        {props.topbar == "true" && voucher  && <RedeemDetailCard {...props} />}
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
