import { useState, useId, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import iconapplied from "../assets/icons8-confirm.svg";
import closeicon from "../assets/close2.svg";
import Swal from "sweetalert2";
import {
  setBookingCoupons,
  setCouponlist,
  setLoading,
} from "../store/step1Slice";
import { setCart } from "../store/step2Slice";
import { applyCouponToBooking } from "../Utils/coupons";
import { toPlainText } from "../Utils/Functions";
import { __, sprintf } from "../i18n";

/**
 * bookingKey given (checkout page): Apply calls /apply-coupon right away and
 * updates the order details. Without it (date screen): coupons are saved and
 * applied on the payment step.
 */
export default function CouponSection({ bookingKey = null }) {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.step2.cart);
  const bookingCoupons = useSelector((state) => state.step1.bookingCoupons);
  const uid = useId();
  const [isVisibleGift, setIsVisibleGift] = useState(false);
  const [fields, setFields] = useState([{ code: "", applied: false }]);
  const couponcode = useSelector((state) => state.step1.couponcode);

  // Coupons the store still counts as applied for this screen.
  const appliedCount = bookingKey
    ? bookingCoupons?.bookingKey === bookingKey
      ? bookingCoupons.codes?.length || 0
      : 0
    : couponcode?.length || 0;
  const prevAppliedCount = useRef(appliedCount);

  // When the coupons are cleared elsewhere (e.g. the service was changed),
  // drop the "Applied" inputs too so the user enters the coupon again.
  // Only on a drop to zero, so a coupon being applied right now is kept.
  useEffect(() => {
    if (prevAppliedCount.current > 0 && appliedCount === 0) {
      setFields((prev) => {
        const kept = prev.filter((f) => !f.applied);
        return kept.length > 0 ? kept : [{ code: "", applied: false }];
      });
    }
    prevAppliedCount.current = appliedCount;
  }, [appliedCount]);

  const addmoreCoupon = () => {
    setFields([...fields, { code: "", applied: false }]);
  };

  const removeCoupon = (key) => {
    const updated = fields.filter((_, i) => i !== key);
    setFields(updated);
    // compute valid coupons - only include actually applied coupons
    const validCoupons = updated
      .filter((f) => f.applied && f.code.trim() !== "")
      .map((f) => f.code.trim());
    dispatch(setCouponlist(validCoupons));
  };

  const applycoupon = async (key) => {
    if (fields[key].code.trim() === "") {
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        icon: "error",
        title: __("Please enter a coupon code"),
      });
      return;
    }

    if (bookingKey) {
      const code = fields[key].code.trim();
      dispatch(setLoading(true));
      try {
        const result = await applyCouponToBooking(bookingKey, code, cart);
        if (!result.ok) {
          Swal.fire({
            iconHtml: `<img class="fx-coupon-close-icon" src="${closeicon}">`,
            titleText: toPlainText(sprintf(__("%s Coupon Error"), code)),
            text: result.error,
            customClass: { popup: "fx-coupon-box-popup" },
          });
          return;
        }
        dispatch(setCart(result.cart));
        const previous =
          bookingCoupons?.bookingKey === bookingKey ? bookingCoupons.codes : [];
        dispatch(
          setBookingCoupons({
            bookingKey,
            codes: [...new Set([...previous, code])],
          }),
        );
        setFields((prev) =>
          prev.map((item, i) =>
            i === key ? { ...item, applied: true, onBooking: true } : item,
          ),
        );
        Swal.fire({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          icon: "success",
          title: __("Coupon applied"),
        });
      } catch (error) {
        Swal.fire({
          iconHtml: `<img class="fx-coupon-close-icon" src="${closeicon}">`,
          titleText: toPlainText(sprintf(__("%s Coupon Error"), code)),
          text: error?.data?.message || __("Failed to apply coupon"),
          customClass: { popup: "fx-coupon-box-popup" },
        });
      } finally {
        dispatch(setLoading(false));
      }
      return;
    }

    Swal.fire({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      icon: "info",
      title: __("Once you proceed to payment, the discount will be applied."),
    });

    // Mark this coupon as applied
    setFields((prev) => {
      const updated = prev.map((item, i) =>
        i === key ? { ...item, applied: true } : item,
      );

      // compute valid coupons - only include actually applied coupons
      const validCoupons = updated
        .filter((f) => f.applied && f.code.trim() !== "")
        .map((f) => f.code.trim());

      // dispatch inside the setter
      dispatch(setCouponlist(validCoupons));

      return updated;
    });
  };

  return (
    <div className="fx-tabcontent selected">
      <div className="fx-couponcontainer fx-couponcontainer-checkout">
        <div className="fx-element-box">
          <input
            type="checkbox"
            id={uid}
            checked={isVisibleGift}
            onChange={(e) => setIsVisibleGift(e.target.checked)}
          />
          <label htmlFor={uid} className="checkbox-label">
            {__("Have a coupon?")}
          </label>
        </div>
        {isVisibleGift && (
          <div className="fx-commoninput">
            {fields.map((field, index) => (
              <div className="fx-couponcontainerinputbox" key={index}>
                <div className="fx-coupon-box">
                  <input
                    type="text"
                    placeholder={__("Enter your coupon code")}
                    value={field.code}
                    onChange={(e) => {
                      if (!field.applied) {
                        const newFields = [...fields];
                        newFields[index] = {
                          ...newFields[index],
                          code: e.target.value,
                        };
                        setFields(newFields);
                      }
                    }}
                    disabled={field.applied}
                    className={field.applied ? "fx-coupon-applied" : ""}
                  />
                  {!field.applied && (
                    <button
                      className="fx-apply-btn"
                      onClick={() => applycoupon(index)}
                    >
                      {__("Apply")}
                    </button>
                  )}
                  {field.applied && (
                    <button className="fx-apply-btn fx-applied-btn">
                      {__("Applied")} <img src={iconapplied} />
                    </button>
                  )}
                </div>
                {/* Applied to the booking already: there is no API to remove it. */}
                {!field.onBooking && (
                  <div className="fx-delete-coupon">
                    <i
                      className="pi pi-trash"
                      onClick={() => removeCoupon(index)}
                    ></i>
                  </div>
                )}
              </div>
            ))}
            <div className="fx-element-box" onClick={() => addmoreCoupon()}>
              <p className="fx-addmorelink">{__("Add More")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
