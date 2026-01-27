import logo from "../assets/logo.png";
import Commonbox from "./Commonbox";

export default function Sidebar() {
  return (
    <>
      <div className="fx-sidebar ">
        <div className="logo">
          <img src={logo} className="fx-right-logo" />
        </div>
        <Commonbox />
      </div>
    </>
  );
}
