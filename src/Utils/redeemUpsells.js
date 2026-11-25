import axiosInstance from "./Interceptor";
import { __ } from "../i18n";

// Format a total in the same currency style as a server-formatted sample, e.g. "60,00 €" or "€60.00".
export const formatLikePrice = (sample, amount) => {
  const token = String(sample || "")
    .match(/\d[\d.,\s]*/)?.[0]
    ?.trim();
  if (!token) return Number(amount || 0).toFixed(2);
  const decimals = token.match(/[.,](\d+)$/);
  const hasDecimals = decimals && decimals[1].length !== 3;
  const decimalSep = hasDecimals
    ? token[token.length - decimals[1].length - 1]
    : ".";
  const thousandSep = decimalSep === "," ? "." : ",";
  const [whole, fraction] = Number(amount || 0)
    .toFixed(hasDecimals ? decimals[1].length : 0)
    .split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);
  return String(sample).replace(
    token,
    fraction ? `${grouped}${decimalSep}${fraction}` : grouped,
  );
};

export const choiceKey = (choice) =>
  `${choice.date}|${choice.from}|${choice.to}`;

// Items without schedule choices (untimed extras) inherit the gift's slot.
export const getSelectedChoice = (item, slotKey) =>
  (item.schedule_choices || []).find((choice) => choiceKey(choice) === slotKey);

export const getApiErrorMessage = (error, fallback) =>
  error?.response?.data?.data?.message ||
  error?.response?.data?.message ||
  error?.data?.data?.message ||
  error?.data?.message ||
  error?.message ||
  fallback;

// Flattens nested data into PHP form keys: post[order_key], post[selections][0][quantity], ...
const appendFormValue = (params, key, value) => {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      appendFormValue(params, `${key}[${index}]`, item),
    );
  } else if (typeof value === "object") {
    Object.entries(value).forEach(([child, item]) =>
      appendFormValue(params, `${key}[${child}]`, item),
    );
  } else {
    params.append(
      key,
      typeof value === "boolean" ? (value ? "1" : "0") : String(value),
    );
  }
};

// Quote, payment and confirmation live on the bm-vouchers REST namespace. They are posted
// form-encoded as action=...&nonce=...&post[...]=...; the interceptor adds the nonce.
export const callVoucherApi = async (route, action, post) => {
  const base = axiosInstance.defaults.baseURL;
  const url = base.replace(/\/booking\/v1\/?$/, `/bm-vouchers/v1${route}`);
  const body = new URLSearchParams({ action });
  appendFormValue(body, "post", post);
  const { data } = await axiosInstance.post(url, body, {
    bookingNonceBody: true,
  });
  if (!data?.success) {
    throw new Error(
      data?.data?.message ||
        data?.message ||
        __("The request could not be completed."),
    );
  }
  return data.data;
};
