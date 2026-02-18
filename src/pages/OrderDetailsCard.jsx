import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import moment from "moment";
import { decodeHtml } from "../Utils/Functions";
import Commonbox from "../components/Commonbox";
import { setTopbar } from "../store/step1Slice";

const OrderDetailsCard = () => {
  const dispatch = useDispatch();
  const [isOpenn, setIsOpenn] = useState(false);
  const date = useSelector((state) => state.step1.date);
  const cart = useSelector((state) => state.step2.cart);

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
        onClick={toggleCard}
      >
        {/* Header Section */}
        <div className="fx-header-row">
          <span className="fx-title">Order Details</span>
          <div className="fx-chevron"></div>
        </div>
        {/* Summary Section */}

        <div className="fx-summary-row">
          <div className="fx-info-group">
            <div className="fx-calendar-icon"></div>
            <span>
              {moment(date).format("MMM DD")},{" "}
              {cart?.service?.length > 0 && (
                <>
                  {cart.service.map((ct) => {
                    return ct.name;
                  })}
                </>
              )}
            </span>
          </div>
          {cart?.total_formatted && (
            <span className="fx-price">
              {decodeHtml(cart?.total_formatted)}
            </span>
          )}
        </div>
        {/* Sliding Content */}

        <div className="fx-collapsible-content">
          <Commonbox />
          {/* <div className="fx-detail-line">
          <span>Service Provider:</span>
          <strong>Wellness Spa Plus</strong>
        </div>

        <div className="fx-detail-line">
          <span>Confirmation #:</span>
          <strong>ABC-123456</strong>
        </div>

        <div className="fx-detail-line">
          <span>Payment Method:</span>
          <strong>Visa ending in 4242</strong>
        </div> */}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsCard;
