import logo from "../assets/logo.png";
import Commonbox from "./Commonbox";
import { useSelector } from "react-redux";
import useDeviceType from "../Utils/useDeviceType";

export default function Sidebar(props) {
  const topbar = useSelector((state) => state.step1.topbar);
  const isDesktop = useDeviceType();
  return (
    <>
      <div
        className="fx-sidebar "
        style={{ display: props.rightbar == "true" && isDesktop ? "block" : "none" }}
      >
        <div className="logo">
          <img src={logo} className="fx-right-logo" />
        </div>
        {!topbar && <Commonbox />}
      </div>
    </>
  );
}
