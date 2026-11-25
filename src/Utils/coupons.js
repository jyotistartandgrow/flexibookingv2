import axiosInstance from "./Interceptor";
import { decodeHtml } from "./Functions";
import { __ } from "../i18n";

/**
 * Applies one coupon to an existing booking via POST /apply-coupon and
 * returns the cart updated with the discounted totals, or the API's error.
 */
export const applyCouponToBooking = async (bookingKey, code, cart) => {
  const { data: response } = await axiosInstance.post("/apply-coupon", {
    booking_key: bookingKey,
    coupon_code: code,
  });
  const result = response?.data;
  if (response?.status != 200 || result?.status != true) {
    return {
      ok: false,
      error:
        decodeHtml(result?.error || result?.message || "") ||
        __("Failed to apply coupon"),
    };
  }
  return { ok: true, cart: cartWithCouponTotals(cart, result) };
};

/**
 * Order-summary fields from an /apply-coupon result:
 * discount (number, used to decide whether to show the discount rows),
 * discount_formatted / subtotal / total_formatted (display text) and the
 * applied coupon codes.
 */
export const cartWithCouponTotals = (cart, result) => ({
  ...cart,
  total: result?.amount ?? cart?.total,
  total_formatted: result?.total ?? cart?.total_formatted,
  discount: Number(result?.discount ?? result?.checkout_discount) || 0,
  discount_formatted: result?.coupon_discount || "",
  subtotal: result?.original_data?.subtotal || cart?.subtotal,
  coupon_codes: Array.isArray(result?.applied)
    ? result.applied.map((item) => item?.code).filter(Boolean)
    : result?.code
      ? [result.code]
      : cart?.coupon_codes || [],
});
