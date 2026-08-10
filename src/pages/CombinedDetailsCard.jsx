import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import Commonbox from "../components/Commonbox";
import RedeemCommonbox from "../components/RedeemCommonbox";
import { setTopbar } from "../store/step1Slice";

export default function CombinedDetailsCard({ topbar }) {
  const dispatch = useDispatch();
  const cardRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (topbar == "true") {
      dispatch(setTopbar(true));
    }
  }, [dispatch, topbar]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && cardRef.current && !cardRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="fx-top-order-details-box fx-combined-details-box" ref={cardRef}>
      <div
        className={`fx-top-order-details-card ${isOpen ? "fx-is-open" : ""}`}
      >
        <button
          type="button"
          className="fx-combined-details-toggle"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span className="fx-title">Details</span>
          <span className="fx-chevron" aria-hidden="true"></span>
        </button>

        <div className="fx-collapsible-content">
          <section className="fx-combined-details-section">
            <h3>Redeem Details</h3>
            <RedeemCommonbox hideSchedule />
          </section>

          <section className="fx-combined-details-section fx-order-details-section">
            <h3>Order Details</h3>
            <Commonbox />
          </section>
        </div>
      </div>
    </div>
  );
}
