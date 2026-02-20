import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import moment from "moment";
import { decodeHtml } from "../Utils/Functions";
import Commonbox from "../components/Commonbox";
import { setTopbar } from "../store/step1Slice";
import useDeviceType from "../Utils/useDeviceType";

const OrderDetailsCard = () => {
  const dispatch = useDispatch();
  const [isOpenn, setIsOpenn] = useState(false);
  const date = useSelector((state) => state.step1.date);
  const cart = useSelector((state) => state.step2.cart);
  const topbar = useSelector((state) => state.step1.topbar);
  const gift = useSelector((state) => state.step1.gift);
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
            <span className="fx-title">Order Details</span>
            <div className="fx-chevron"></div>
          </div>
          {/* Summary Section */}

          <div className="fx-summary-row">
            <div className="fx-info-group">
              <div className="fx-calendar-icon"></div>
              <span>
                {!gift && `${moment(date).format("MMM DD")} `}
                {cart?.service?.length > 0 && (
                  <>
                    {!gift && ", "}
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
        </div>
        {/* Sliding Content */}

        <div className="fx-collapsible-content">
          {topbar && isDesktop && <Commonbox toggleCard={toggleCard} />}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsCard;
