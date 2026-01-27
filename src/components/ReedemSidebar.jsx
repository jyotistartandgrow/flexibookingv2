import logo from "../assets/logo.png";
import React from "react";

import RedeemCommonbox from "./RedeemCommonbox";

export default function Sidebar() {
  return (
    <>
      <div className="fx-sidebar ">
        <div className="logo">
          <img src={logo} className="fx-right-logo" />
        </div>
        <RedeemCommonbox />
      </div>
    </>
  );
}
