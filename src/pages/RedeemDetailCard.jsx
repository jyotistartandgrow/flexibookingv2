import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import moment from "moment";
import { decodeHtml } from "../Utils/Functions";
import RedeemCommonbox from "../components/RedeemCommonbox";
import { setTopbar } from "../store/step1Slice";
import useDeviceType from "../Utils/useDeviceType";

const OrderDetailsCard = () => {
  const dispatch = useDispatch();
  const [isOpenn, setIsOpenn] = useState(false);
  const date = useSelector((state) => state.step1.date);
  const topbar = useSelector((state) => state.step1.topbar);
  const voucher = useSelector((state) => state.step1.voucher);
  const isDesktop = useDeviceType();

  const toggleCard = () => {
    setIsOpenn(!isOpenn);
  };

  useEffect(() => {
    dispatch(setTopbar(true));
  }, [isOpenn, dispatch]);

  return (
    <div className="fx-top-order-details-box">
      <div
        className={`fx-top-order-details-card ${isOpenn ? "fx-is-open" : ""}`}
      >
        {/* Header Section */}
        <div onClick={toggleCard}>
          <div className="fx-header-row">
            <span className="fx-title">Redeem Details</span>
            <div className="fx-chevron"></div>
          </div>
          {/* Summary Section */}
          <div className="fx-summary-row">
            <div className="fx-info-group">
              <div className="fx-gift-icon"></div>
              <span>{voucher}</span>
            </div>
          </div>
        </div>
        {/* Sliding Content */}

        <div className="fx-collapsible-content">
          {topbar && isDesktop && <RedeemCommonbox toggleCard={toggleCard} />}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsCard;
