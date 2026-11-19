import moment from "moment";
import { useLocation } from "react-router-dom";
import Swal from "sweetalert2";

// Escapes text for safe interpolation into HTML (element content or quoted attributes).
export const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Turns an API message (which may carry entities or markup) into plain text.
// Use with SweetAlert's `titleText`, never `title`, which renders HTML.
export const toPlainText = (value) => {
  if (value === null || value === undefined) return "";
  const doc = new DOMParser().parseFromString(String(value), "text/html");
  return doc.body.textContent || "";
};

// Returns the URL only if it is an absolute http(s) URL (or relative to the
// current page); blocks javascript:, data: and other script-capable schemes.
export const toSafeUrl = (value, { allowMailto = false } = {}) => {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.trim(), window.location.href);
    const allowed = [
      "http:",
      "https:",
      ...(allowMailto ? ["mailto:", "tel:"] : []),
    ];
    return allowed.includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
};

const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "br",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "li",
  "ol",
  "p",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "u",
  "ul",
]);
const DROP_WITH_CONTENT = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "template",
  "noscript",
  "svg",
  "math",
  "form",
  "input",
  "textarea",
  "select",
  "button",
  "link",
  "meta",
]);

// Allowlist sanitizer for rich text coming from the API before it is rendered
// with dangerouslySetInnerHTML. Keeps basic formatting and safe links only.
export const sanitizeHtml = (html) => {
  const doc = new DOMParser().parseFromString(String(html ?? ""), "text/html");

  const clean = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) return;
      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.remove();
        return;
      }
      const tag = child.tagName.toLowerCase();
      if (DROP_WITH_CONTENT.has(tag)) {
        child.remove();
        return;
      }
      clean(child);
      if (!ALLOWED_TAGS.has(tag)) {
        child.replaceWith(...child.childNodes);
        return;
      }
      [...child.attributes].forEach(({ name }) => {
        if (name !== "class" && !(tag === "a" && name === "href")) {
          child.removeAttribute(name);
        }
      });
      if (tag === "a") {
        const href = toSafeUrl(child.getAttribute("href") || "", {
          allowMailto: true,
        });
        if (href) {
          child.setAttribute("href", href);
          child.setAttribute("target", "_blank");
          child.setAttribute("rel", "noopener noreferrer");
        } else {
          child.removeAttribute("href");
        }
      }
    });
  };

  clean(doc.body);
  return doc.body.innerHTML;
};

const swalError = (error) => {
  const parts = [];

  for (const key in error?.data?.error) {
    parts.push(escapeHtml(toPlainText(error?.data?.error[key])));
  }
  if (error?.data?.message)
    parts.push(escapeHtml(toPlainText(error.data.message)));
  // Each part is escaped, so only our own <br> separators are rendered as HTML.
  const errorMessage = parts.join("<br>");
  if (errorMessage) {
    Swal.fire({
      toast: true,
      position: "top-end", // or 'bottom-end', 'top-start', etc.
      showConfirmButton: false,
      timer: 3000, // auto-close after 3 seconds
      icon: "error", // 'success', 'error', 'warning', 'info', 'question'
      title: errorMessage,
    });
  }
};

const swalUpdated = () => {
  return;
};

const ReactDatePickerTimeConverter = (time) => {
  if (time) {
    return moment(time).format("DD/MM/YYYY");
  } else {
    return "";
  }
};

export const decodeEntities = (htmlString) => {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = htmlString;
  return textarea.value;
};

const timeFormatter = (props) => props && moment(props).format("DD-MM-YYYY ");

export function isValidEmail(email) {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(email);
}

export { swalError, swalUpdated, ReactDatePickerTimeConverter, timeFormatter };

export const formattedDateAndTime = (props) => {
  return props && moment(props).format("Do MMM YYYY, [at] h:mm a");
};

export const formattedDate = (props) => {
  return props && moment(props).format("Do MMM YYYY");
};

export const formattedDatewithFormat = (props, format) => {
  return props && moment(props).format(format);
};

const formatComponentSlotTime = (slotValue) => {
  const slotParts = String(slotValue || "").split(/\s+-\s+/);
  if (slotParts.length !== 2) return slotValue || "";

  const formatTime = (timeValue) => {
    const parsedTime = moment(
      timeValue.trim(),
      ["HH:mm", "H:mm", "h:mm A", "hh:mm A"],
      true,
    );
    return parsedTime.isValid() ? parsedTime.format("h:mm A") : timeValue;
  };

  return `${formatTime(slotParts[0])} - ${formatTime(slotParts[1])}`;
};

export const formatExtrasTimeSlot = (slotValue) => {
  const label =
    typeof slotValue === "string"
      ? slotValue
      : slotValue?.slot_label || slotValue?.label || slotValue?.slot || "";
  const parts = label.split(/\s*[-–—]\s*/);
  const from = slotValue?.from || parts[0];
  const to = slotValue?.to || parts[1];
  if (!from || !to) return "";

  const formats = ["HH:mm", "H:mm", "HH:mm:ss", "h:mm A", "hh:mm A"];
  const start = moment(String(from).trim(), formats, true);
  const end = moment(String(to).trim(), formats, true);
  return start.isValid() && end.isValid()
    ? `${start.format("HH:mm")} - ${end.format("HH:mm")}`
    : "";
};

export const formatSelectedComponentSlots = (componentSlots = []) =>
  componentSlots.map((componentSlot) => ({
    bundle_item_id: componentSlot?.bundle_item_id,
    service_id: componentSlot?.service_id,
    position: Number(
      componentSlot?.position ?? componentSlot?.component_position,
    ),
    slot: formatComponentSlotTime(
      componentSlot?.slot ?? componentSlot?.slot_label,
    ),
  }));

export const useQuery = (id) => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const bookingId = query.get(id);
  return bookingId;
};

export const slugify = (text) => {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "-and-")
    .replace(/[\s\W-]+/g, "-");
};

export const decodeHtml = (html) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  return doc.documentElement.textContent;
};

export const darkenHex = (hex, percent) => {
  // percent = 86 means "86% darker"
  const factor = (100 - percent) / 100;

  hex = hex.replace("#", "");

  const r = Math.round(parseInt(hex.substring(0, 2), 16) * factor);
  const g = Math.round(parseInt(hex.substring(2, 4), 16) * factor);
  const b = Math.round(parseInt(hex.substring(4, 6), 16) * factor);

  return (
    "#" +
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    b.toString(16).padStart(2, "0")
  );
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone) => {
  // Allows international formats: +, digits, spaces, hyphens, parentheses
  // Must have 10-15 digits
  const phoneRegex =
    /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,5}[-\s.]?[0-9]{1,5}$/;
  const digitsOnly = phone.replace(/\D/g, "");
  return phoneRegex.test(phone) && digitsOnly.length == 10;
};

// Local number length rules (min, max) per dial code (excluding country code)
const COUNTRY_PHONE_LENGTHS = {
  1: { min: 10, max: 10 }, // US / Canada
  7: { min: 10, max: 10 }, // Russia / Kazakhstan
  20: { min: 10, max: 10 }, // Egypt
  27: { min: 9, max: 9 }, // South Africa
  30: { min: 10, max: 10 }, // Greece
  31: { min: 9, max: 9 }, // Netherlands
  32: { min: 9, max: 9 }, // Belgium
  33: { min: 9, max: 9 }, // France
  34: { min: 9, max: 9 }, // Spain
  36: { min: 9, max: 9 }, // Hungary
  39: { min: 9, max: 10 }, // Italy
  40: { min: 9, max: 9 }, // Romania
  41: { min: 9, max: 9 }, // Switzerland
  43: { min: 7, max: 13 }, // Austria
  44: { min: 10, max: 10 }, // UK
  45: { min: 8, max: 8 }, // Denmark
  46: { min: 9, max: 9 }, // Sweden
  47: { min: 8, max: 8 }, // Norway
  48: { min: 9, max: 9 }, // Poland
  49: { min: 10, max: 11 }, // Germany
  51: { min: 9, max: 9 }, // Peru
  52: { min: 10, max: 10 }, // Mexico
  53: { min: 8, max: 8 }, // Cuba
  54: { min: 10, max: 10 }, // Argentina
  55: { min: 10, max: 11 }, // Brazil
  56: { min: 9, max: 9 }, // Chile
  57: { min: 10, max: 10 }, // Colombia
  58: { min: 10, max: 10 }, // Venezuela
  60: { min: 9, max: 10 }, // Malaysia
  61: { min: 9, max: 9 }, // Australia
  62: { min: 9, max: 12 }, // Indonesia
  63: { min: 10, max: 10 }, // Philippines
  64: { min: 8, max: 10 }, // New Zealand
  65: { min: 8, max: 8 }, // Singapore
  66: { min: 9, max: 9 }, // Thailand
  81: { min: 10, max: 11 }, // Japan
  82: { min: 9, max: 10 }, // South Korea
  84: { min: 9, max: 10 }, // Vietnam
  86: { min: 11, max: 11 }, // China
  90: { min: 10, max: 10 }, // Turkey
  91: { min: 10, max: 10 }, // India
  92: { min: 10, max: 10 }, // Pakistan
  93: { min: 9, max: 9 }, // Afghanistan
  94: { min: 9, max: 9 }, // Sri Lanka
  95: { min: 8, max: 10 }, // Myanmar
  98: { min: 10, max: 10 }, // Iran
  212: { min: 9, max: 9 }, // Morocco
  213: { min: 9, max: 9 }, // Algeria
  216: { min: 8, max: 8 }, // Tunisia
  218: { min: 9, max: 10 }, // Libya
  220: { min: 7, max: 7 }, // Gambia
  221: { min: 9, max: 9 }, // Senegal
  234: { min: 10, max: 10 }, // Nigeria
  254: { min: 9, max: 9 }, // Kenya
  256: { min: 9, max: 9 }, // Uganda
  260: { min: 9, max: 9 }, // Zambia
  263: { min: 9, max: 9 }, // Zimbabwe
  351: { min: 9, max: 9 }, // Portugal
  352: { min: 9, max: 9 }, // Luxembourg
  353: { min: 9, max: 9 }, // Ireland
  354: { min: 7, max: 7 }, // Iceland
  355: { min: 9, max: 9 }, // Albania
  356: { min: 8, max: 8 }, // Malta
  357: { min: 8, max: 8 }, // Cyprus
  358: { min: 9, max: 10 }, // Finland
  359: { min: 9, max: 9 }, // Bulgaria
  370: { min: 8, max: 8 }, // Lithuania
  371: { min: 8, max: 8 }, // Latvia
  372: { min: 7, max: 8 }, // Estonia
  380: { min: 9, max: 9 }, // Ukraine
  381: { min: 8, max: 9 }, // Serbia
  385: { min: 8, max: 9 }, // Croatia
  386: { min: 8, max: 8 }, // Slovenia
  387: { min: 8, max: 8 }, // Bosnia
  389: { min: 8, max: 8 }, // North Macedonia
  420: { min: 9, max: 9 }, // Czech Republic
  421: { min: 9, max: 9 }, // Slovakia
  961: { min: 7, max: 8 }, // Lebanon
  962: { min: 9, max: 9 }, // Jordan
  963: { min: 9, max: 9 }, // Syria
  964: { min: 10, max: 10 }, // Iraq
  965: { min: 8, max: 8 }, // Kuwait
  966: { min: 9, max: 9 }, // Saudi Arabia
  967: { min: 9, max: 9 }, // Yemen
  968: { min: 8, max: 8 }, // Oman
  971: { min: 9, max: 9 }, // UAE
  972: { min: 9, max: 9 }, // Israel
  973: { min: 8, max: 8 }, // Bahrain
  974: { min: 8, max: 8 }, // Qatar
  975: { min: 8, max: 8 }, // Bhutan
  976: { min: 8, max: 8 }, // Mongolia
  977: { min: 10, max: 10 }, // Nepal
  880: { min: 10, max: 10 }, // Bangladesh
  886: { min: 9, max: 9 }, // Taiwan
};

export const validatePhoneForCountry = (phone, countryData) => {
  if (!phone || !countryData || !countryData.dialCode) return false;
  if (phone == countryData.dialCode) return true;

  // Remove dial code to get the actual number
  const number = phone.replace(countryData.dialCode, "").trim();
  const digitsOnly = number.replace(/\D/g, "");

  // Look up country-specific length rules
  const dialCode = countryData.dialCode.replace("+", "");
  const lengthRule = COUNTRY_PHONE_LENGTHS[dialCode];

  if (lengthRule) {
    if (
      digitsOnly.length < lengthRule.min ||
      digitsOnly.length > lengthRule.max
    )
      return false;
  } else {
    // Fallback: reasonable international range
    if (digitsOnly.length < 7 || digitsOnly.length > 15) return false;
  }

  // Check if it only contains digits and spaces/dashes
  const phoneRegex = /^[0-9\s-]+$/;
  return phoneRegex.test(number);
};
