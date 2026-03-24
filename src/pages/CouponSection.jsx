import { useState, useId } from "react";
import { useDispatch } from "react-redux";
import iconapplied from "../assets/icons8-confirm.svg";
import Swal from "sweetalert2";
import { setCouponlist } from "../store/step1Slice";

export default function CouponSection() {
  const dispatch = useDispatch();
  const uid = useId();
  const [isVisibleGift, setIsVisibleGift] = useState(false);
  const [fields, setFields] = useState([{ code: "", applied: false }]);

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
        title: "Please enter a coupon code",
      });
      return;
    }
    Swal.fire({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      icon: "info",
      title: "Once you proceed to payment, the discount will be applied.",
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
      <div className="fx-couponcontainer">
        <div className="fx-element-box">
          <input
            type="checkbox"
            id={uid}
            checked={isVisibleGift}
            onChange={(e) => setIsVisibleGift(e.target.checked)}
          />
          <label htmlFor={uid} className="checkbox-label">
            If you have coupon
          </label>
        </div>
        {isVisibleGift && (
          <div className="fx-commoninput">
            {fields.map((field, index) => (
              <div className="fx-couponcontainerinputbox" key={index}>
                <div className="fx-coupon-box">
                  <input
                    type="text"
                    placeholder="Enter your coupon code"
                    value={field.code}
                    onChange={(e) => {
                      if (!field.applied) {
                        const newFields = [...fields];
                        newFields[index] = { ...newFields[index], code: e.target.value };
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
                      APPLY
                    </button>
                  )}
                  {field.applied && (
                    <button className="fx-apply-btn fx-applied-btn">
                      APPLIED <img src={iconapplied} />
                    </button>
                  )}
                </div>
                <div className="fx-delete-coupon">
                  <i
                    className="pi pi-trash"
                    onClick={() => removeCoupon(index)}
                  ></i>
                </div>
              </div>
            ))}
            <div className="fx-element-box" onClick={() => addmoreCoupon()}>
              <p className="fx-addmorelink">Add More</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
