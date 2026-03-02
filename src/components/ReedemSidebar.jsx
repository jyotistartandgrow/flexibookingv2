import logo from "../assets/logo.png";
import React from "react";

import RedeemCommonbox from "./RedeemCommonbox";
import useDeviceType from "../Utils/useDeviceType";

export default function ReedemSidebar(props) {
  const isDesktop = useDeviceType();
  return (
    <>
      <div
        className="fx-sidebar "
        style={{
          display: props.rightbar == "true" && isDesktop ? "block" : "none",
        }}
      >
        <div className="logo">
          <img src={logo} className="fx-right-logo" />
        </div>
        <RedeemCommonbox />
      </div>
    </>
  );
}
