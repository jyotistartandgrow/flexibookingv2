import logo from "../assets/logo.png";
import Commonbox from "./Commonbox";
import { useSelector } from "react-redux";

export default function Sidebar() {
  const topbar = useSelector((state) => state.step1.topbar);
  return (
    <>
      <div className="fx-sidebar ">
        <div className="logo">
          <img src={logo} className="fx-right-logo" />
        </div>
        {!topbar && <Commonbox />}
      </div>
    </>
  );
}
