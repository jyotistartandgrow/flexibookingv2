import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import RedeemCommonbox from "../components/RedeemCommonbox";
import { setTopbar } from "../store/step1Slice";

const RedeemDetailCard = (props) => {
  const dispatch = useDispatch();
  const [isOpenn, setIsOpenn] = useState(false);
  const topbar = useSelector((state) => state.step1.topbar);
  const voucher = useSelector((state) => state.step1.voucher);

  const toggleCard = () => {
    setIsOpenn(!isOpenn);
  };

  useEffect(() => {
    if (props.topbar == "true") {
      dispatch(setTopbar(true));
    }
  }, [props.topbar, dispatch]);

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
              <span>{voucher}</span>
            </div>
          </div>
        </div>
        {/* Sliding Content */}

        <div className="fx-collapsible-content">
          {topbar && <RedeemCommonbox toggleCard={toggleCard} />}
        </div>
      </div>
    </div>
  );
};

export default RedeemDetailCard;
