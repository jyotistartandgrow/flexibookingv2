import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import moment from "moment";
import { decodeHtml } from "../Utils/Functions";
import Commonbox from "../components/Commonbox";
import { setTopbar } from "../store/step1Slice";

const OrderDetailsCard = (props) => {
  const dispatch = useDispatch();
  const [isOpenn, setIsOpenn] = useState(false);
  const cardRef = useRef(null);
  const date = useSelector((state) => state.step1.date);
  const cart = useSelector((state) => state.step2.cart);
  const topbar = useSelector((state) => state.step1.topbar);
  const gift = useSelector((state) => state.step1.gift);

  const toggleCard = () => {
    setIsOpenn(!isOpenn);
  };

  useEffect(() => {
    if (props.topbar == "true") {
      dispatch(setTopbar(true));
    }
  }, [dispatch, props.topbar]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpenn && cardRef.current && !cardRef.current.contains(e.target)) {
        setIsOpenn(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpenn]);

  return (
    <div className="fx-top-order-details-box">
      <div
        ref={cardRef}
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
          {topbar && <Commonbox toggleCard={toggleCard} />}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsCard;
