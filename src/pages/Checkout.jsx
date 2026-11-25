import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import Swal from "sweetalert2";
import axiosInstance from "../Utils/Interceptor";
import useFetch from "../Utils/CustomHook";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { InputSwitch } from "primereact/inputswitch";
import { Banknote, CreditCard, RefreshCw } from "lucide-react";
import { setReceiverInfo, setStep, setLoading } from "../store/step1Slice";
import {
  setBillingDetails,
  setCheckoutkey,
  setPaymentstring,
  setSelectedPaymentMethod,
  setSessionExpired,
} from "../store/step4Slice";
import GiftCardPreviewButton from "./Giftcardpreviewbutton";
import {
  toPlainText,
  toSafeUrl,
  validateEmail,
  validatePhoneForCountry,
} from "../Utils/Functions";
import CouponSection from "./CouponSection";
import { useRegionalPreferences } from "../Utils/regionalPreferences";
import { __, withElement } from "../i18n";

const formatInternationalPhone = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? `+${digits}` : "";
};

export default function Checkout(props) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const step = useSelector((state) => state.step1.step);
  const bookingkey = useSelector((state) => state.step3.bookingkey);
  const checkoutkey = useSelector((state) => state.step4.checkoutkey);
  const receiverInfo = useSelector((state) => state.step1.receiverInfo);
  const gift = useSelector((state) => state.step1.gift);
  const giftCustomization = useSelector(
    (state) => state.step1.giftCustomization || { message: "" },
  );
  const opendatepurchase = useSelector((state) => state.step1.opendatepurchase);
  const voucherDetail = useSelector((state) => state.step3.voucherdetail);
  const redeemBooking = useSelector((state) => state.step1.redeemBooking);

  const { data: countries } = useFetch("/countries", {
    method: "get",
  });
  const [billdata, setBilldata] = useState({});
  const [states, setState] = useState({});
  const [term, setTerm] = useState(false);
  const [invoice, setInvoice] = useState(false);
  const [numberOnly, setNumberOnly] = useState("");
  const [phoneValid, setPhoneValid] = useState(true);
  const [rphoneValid, setRPhoneValid] = useState(true);
  const [errorlist, setErrorlist] = useState({});
  const [receiverErrors, setReceiverErrors] = useState({});
  const [configuredFields, setVisibleField] = useState({});
  const visibleField = props.redeemBooking
    ? {
        ...configuredFields,
        sgbm_field_5: true,
        sgbm_field_6: true,
        sgbm_field_7: true,
        sgbm_field_8: true,
        sgbm_field_9: true,
      }
    : configuredFields;
  // Defaults from /settings regional_preferences (country, phone country).
  const { country: siteCountry, phoneCountry } = useRegionalPreferences();
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [paymentGroups, setPaymentGroups] = useState([]);
  const [selectedPaymentCard, setSelectedPaymentCard] = useState(null);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
  const [paymentMethodsError, setPaymentMethodsError] = useState("");

  useEffect(() => {
    setErrorlist({});
  }, [billdata]);

  useEffect(() => {
    if (step != "checkoutstep") {
      return;
    }
    getFields();
  }, [step]);

  useEffect(() => {
    if (step != "checkoutstep" || !bookingkey) {
      return;
    }
    getPaymentMethods();
  }, [step, gift, bookingkey]);

  useEffect(() => {
    if (step !== "checkoutstep" || !props.redeemBooking) return;

    const recipient = voucherDetail?.recepient_data;
    if (!recipient) return;

    setBilldata((current) => ({
      ...current,
      sgbm_field_1: recipient.recipient_first_name || "",
      sgbm_field_2: recipient.recipient_last_name || "",
      sgbm_field_3: recipient.recipient_email || "",
      sgbm_field_4: recipient.recipient_contact || "",
      sgbm_field_5: recipient.recipient_address || "",
      sgbm_field_6: recipient.recipient_city || "",
      sgbm_field_7: recipient.recipient_state || "",
      sgbm_field_8: recipient.recipient_country || "",
      sgbm_field_9: recipient.recipient_postcode || "",
    }));
    setNumberOnly(recipient.recipient_contact || "");

    if (recipient.recipient_country) {
      getState(recipient.recipient_country);
    }
  }, [step, props.redeemBooking, voucherDetail]);

  // Pre-select the site country (/settings regional_preferences) in an empty,
  // visible billing Country field — once per booking, so a visitor who clears
  // it isn't overridden. A voucher recipient's own country takes priority.
  const countryPrefilledFor = useRef(null);
  useEffect(() => {
    if (step !== "checkoutstep" || !siteCountry || !visibleField.sgbm_field_8)
      return;
    if (billdata.sgbm_field_8 || countryPrefilledFor.current === bookingkey)
      return;
    if (props.redeemBooking && voucherDetail?.recepient_data?.recipient_country)
      return;
    countryPrefilledFor.current = bookingkey;
    setBilldata((current) =>
      current.sgbm_field_8
        ? current
        : { ...current, sgbm_field_8: siteCountry, sgbm_field_7: "" },
    );
    getState(siteCountry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    step,
    siteCountry,
    visibleField.sgbm_field_8,
    billdata.sgbm_field_8,
    bookingkey,
    props.redeemBooking,
    voucherDetail,
  ]);

  const getFieldsRequest = async () => {
    dispatch(setLoading(true));
    const { data } = await axiosInstance(`/get-fields`, {
      method: "get",
    });
    if (data) {
      const fields = data.data; // Handle nested data structure
      if (Array.isArray(fields)) {
        fields.forEach((field) => {
          if (field.field_options && field.field_options.is_visible == 1) {
            setVisibleField((prev) => ({ ...prev, [field.field_key]: true }));
          }
        });
      }
    }

    dispatch(setLoading(false));
  };

  const getPaymentMethods = async () => {
    if (!bookingkey) {
      return;
    }

    setPaymentMethodsLoading(true);
    setPaymentMethodsError("");
    dispatch(setSelectedPaymentMethod(null));

    try {
      const { data } = await axiosInstance.post(`/payment-methods`, {
        booking_key: bookingkey,
        checkout_key: checkoutkey,
      });
      const paymentData = data?.data;
      const responseGroups = Array.isArray(paymentData?.groups)
        ? paymentData.groups
        : [];
      const responseCards = Array.isArray(paymentData?.cards)
        ? paymentData.cards
        : [];
      const groups = gift
        ? responseGroups
            .map((group) => ({
              ...group,
              cards: (group.cards || []).filter(
                (card) =>
                  card.method === "online" && card.id != "partial_payment",
              ),
            }))
            .filter((group) => group.cards.length > 0)
        : responseGroups;
      const cards = gift
        ? responseCards.filter(
            (card) => card.method === "online" && card.id != "partial_payment",
          )
        : responseCards;
      const selectedCardIsAvailable = cards.some(
        (card) => card.id === paymentData?.selected_card?.id,
      );
      const defaultCard =
        (selectedCardIsAvailable ? paymentData.selected_card : null) ||
        cards.find((card) => card.selected) ||
        groups
          .flatMap((group) => group.cards || [])
          .find((card) => card.selected) ||
        cards[0] ||
        groups.flatMap((group) => group.cards || [])[0] ||
        null;
      setPaymentGroups(groups);
      setSelectedPaymentCard(defaultCard);
      dispatch(setSelectedPaymentMethod(defaultCard?.method || null));

      if (groups.length === 0) {
        setPaymentMethodsError(__("No payment methods are currently available."));
      }
    } catch (error) {
      setPaymentGroups([]);
      setSelectedPaymentCard(null);
      setPaymentMethodsError(
        error?.data?.message ||
          error?.message ||
          __("Unable to load payment methods. Please try again."),
      );
    } finally {
      setPaymentMethodsLoading(false);
    }
  };

  const getStateRequest = async (country) => {
    dispatch(setLoading(true));
    const { data } = await axiosInstance(`/states?country_code=${country}`, {
      method: "get",
    });

    if (data?.data) {
      setState(data?.data);
      dispatch(setLoading(false));
    }
  };

  const checkoutRequest = async () => {
    if (!selectedPaymentCard) {
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        icon: "warning",
        title: __("Please choose a payment method before proceeding"),
      });
      return;
    }

    // Validate gift receiver information if gift is enabled
    if (gift && !opendatepurchase) {
      const errors = {};

      if (!receiverInfo.email || !validateEmail(receiverInfo.email)) {
        errors.email = true;
      }

      if (!rphoneValid) {
        errors.phoneNumber = true;
      }

      if (!String(receiverInfo.address || "").trim()) {
        errors.address = true;
      }
      if (!receiverInfo.country) {
        errors.country = true;
      }
      if (!receiverInfo.state) {
        errors.state = true;
      }
      if (!String(receiverInfo.city || "").trim()) {
        errors.city = true;
      }
      if (!String(receiverInfo.postcode || receiverInfo.zip || "").trim()) {
        errors.postcode = true;
      }

      if (Object.keys(errors).length > 0) {
        setReceiverErrors(errors);
        Swal.fire({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          icon: "error",
          title: __("Please complete the gift receiver information"),
        });
        return;
      }
      setReceiverErrors({});
    }

    if (!billdata.sgbm_field_1 && visibleField.sgbm_field_1) {
      setErrorlist({ sgbm_field_1: true });
      return;
    }
    if (visibleField.sgbm_field_3) {
      if (!billdata.sgbm_field_3 || !validateEmail(billdata.sgbm_field_3)) {
        setErrorlist({ sgbm_field_3: true });
        return;
      }
    }
    if (visibleField.sgbm_field_4) {
      if (numberOnly.trim() == "" || !phoneValid) {
        setErrorlist({ sgbm_field_4: true });
        Swal.fire({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          icon: "error",
          title: __("Please enter a valid phone number for the selected country"),
        });
        return;
      }
    }
    if (
      !String(billdata.sgbm_field_5 || "").trim() &&
      visibleField.sgbm_field_5
    ) {
      setErrorlist({ sgbm_field_5: true });
      return;
    }
    if (
      !String(billdata.sgbm_field_6 || "").trim() &&
      visibleField.sgbm_field_6
    ) {
      setErrorlist({ sgbm_field_6: true });
      return;
    }
    if (!billdata.sgbm_field_8 && visibleField.sgbm_field_8) {
      setErrorlist({ sgbm_field_8: true });
      return;
    }
    if (props.redeemBooking && !billdata.sgbm_field_7) {
      setErrorlist({ sgbm_field_7: true });
      return;
    }
    if (
      !String(billdata.sgbm_field_9 || "").trim() &&
      visibleField.sgbm_field_9
    ) {
      setErrorlist({ sgbm_field_9: true });
      return;
    }
    if (!billdata.sgbm_field_10 && visibleField.sgbm_field_10) {
      setErrorlist({ sgbm_field_10: true });
      return;
    }

    if (invoice) {
      const invoiceErrors = {};
      if (!billdata.invoice_company_name?.trim())
        invoiceErrors.invoice_company_name = true;
      if (!billdata.invoice_company_address?.trim())
        invoiceErrors.invoice_company_address = true;
      if (!billdata.invoice_company_country)
        invoiceErrors.invoice_company_country = true;
      if (!billdata.invoice_vat_id?.trim()) invoiceErrors.invoice_vat_id = true;
      if (Object.keys(invoiceErrors).length > 0) {
        setErrorlist(invoiceErrors);
        Swal.fire({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          icon: "error",
          title: __("Please fill in all invoice fields"),
        });
        return;
      }
    }

    if (!term) {
      Swal.fire({
        toast: true,
        position: "top-end", // or 'bottom-end', 'top-start', etc.
        showConfirmButton: false,
        timer: 3000, // auto-close after 3 seconds
        icon: "warning", // 'success', 'error', 'warning', 'info', 'question'
        title: __("Please accept terms and conditions before proceeding"),
      });
      return;
    }

    dispatch(setLoading(true));
    const gift_info = {
      recipient_first_name: opendatepurchase
        ? (billdata.sgbm_field_1 ?? "")
        : gift
          ? (receiverInfo.firstName ?? "")
          : "",
      recipient_last_name:
        gift && !opendatepurchase ? (receiverInfo.lastName ?? "") : "",
      recipient_email: opendatepurchase
        ? (billdata.sgbm_field_3 ?? "")
        : gift
          ? (receiverInfo.email ?? "")
          : "",
      recipient_contact:
        gift && !opendatepurchase
          ? formatInternationalPhone(receiverInfo.phoneNumber)
          : "",
      recipient_address:
        gift && !opendatepurchase ? (receiverInfo.address ?? "") : "",
      recipient_country:
        gift && !opendatepurchase ? (receiverInfo.country ?? "") : "",
      recipient_state:
        gift && !opendatepurchase ? (receiverInfo.state ?? "") : "",
      recipient_city:
        gift && !opendatepurchase ? (receiverInfo.city ?? "") : "",
      recipient_postcode:
        gift && !opendatepurchase
          ? (receiverInfo.postcode ?? receiverInfo.zip ?? "")
          : "",
    };

    const giftCustomizationData =
      gift && !opendatepurchase
        ? {
            occasion_id: giftCustomization.occasionId ?? "",
            template_id: giftCustomization.template ?? "",
            personal_message: giftCustomization.message ?? "",
            font_key: giftCustomization.font ?? "",
          }
        : {};
    const voucherDelivery =
      giftCustomization.delivery === "me" ? "me" : "recipient";
    const giftDeliveryData =
      gift && !opendatepurchase
        ? {
            channel: "email",
            target:
              voucherDelivery === "me" ? "purchaser_email" : "recipient_email",
            timing: "immediate",
          }
        : {};

    const billingDataForRequest = {
      ...billdata,
      sgbm_field_4: formatInternationalPhone(billdata.sgbm_field_4),
      country_code: billdata.sgbm_field_8,
    };

    const { data } = await axiosInstance.post(`/checkout`, {
      booking_data: bookingkey,
      payment_method: selectedPaymentCard.method,
      payment_mode: selectedPaymentCard.choice,
      payment_gateway: selectedPaymentCard.gateway,
      billing_details: billingDataForRequest,
      shipping_details: {
        shipping_first_name: "",
        shipping_last_name: "",
        shipping_email: "",
        shipping_contact: "",
        shipping_address: "",
        shipping_country: siteCountry,
        shipping_state: "",
        shipping_city: "",
        shipping_postcode: "",
      },
      gift_details: gift_info,
      gift_customization: giftCustomizationData,
      gift_delivery: giftDeliveryData,
      voucher_delivery: gift && !opendatepurchase ? voucherDelivery : "",
      is_gift: gift,
      is_open_date_purchase: Boolean(opendatepurchase),
      other_data: {
        terms_conditions: 1,
        booking_acknowledgement: true,
        shipping_same_as_billing: 1,
        age_group_from_0: 0,
        age_group_to_0: 2,
        age_group_total_0: 0,
        age_group_from_1: 3,
        age_group_to_1: 17,
        age_group_total_1: 0,
        age_group_from_2: 18,
        age_group_to_2: 40,
        age_group_total_2: 0,
        age_group_from_3: 41,
        age_group_to_3: 100,
        age_group_total_3: 0,
        input_coupon_code: "",
        is_gift: gift,
      },
      payment_method_id: selectedPaymentCard.id,
    });

    if (data && data.status == 200 && data.data.status == "success") {
      dispatch(setBillingDetails(billingDataForRequest));
      if (
        selectedPaymentCard.method === "offline" ||
        selectedPaymentCard.method === "cash_on_delivery" ||
        selectedPaymentCard.method === "payment_link"
      ) {
        if (redeemBooking) {
          dispatch(setLoading(false));
          navigate(`/redeem-thankyou`);
        } else if (opendatepurchase) {
          dispatch(setLoading(false));
          navigate(`/opendate-thankyou?pid=${bookingkey}`);
        } else {
          dispatch(setLoading(false));
          navigate(`/thankyou?pid=${bookingkey}`);
        }
      } else {
        dispatch(setCheckoutkey(data.data.checkout));
        dispatch(setPaymentstring(data.data.data));
        dispatch(setSessionExpired(false));
        dispatch(setStep("paymentstep"));
      }
    } else {
      Swal.fire({
        toast: true,
        position: "top-end", // or 'bottom-end', 'top-start', etc.
        showConfirmButton: false,
        timer: 3000, // auto-close after 3 seconds
        icon: "error", // 'success', 'error', 'warning', 'info', 'question'
        titleText: toPlainText(
          data?.message ?? __("There is some error , please try again"),
        ),
      });
      if (data?.message == "Error Fetching Booking Information !!") {
        Swal.fire({
          icon: "error",
          title: __("Session Expired"),
          text: __(
            "Your session has expired. Please start the booking process again.",
          ),
        });
      }
    }
    dispatch(setLoading(false));
  };
  // A rejected request would otherwise leave the fullscreen loader on forever.
  const guardRequest =
    (request, fallbackMessage) =>
    async (...args) => {
      try {
        return await request(...args);
      } catch (error) {
        console.error(fallbackMessage, error);
        dispatch(setLoading(false));
        Swal.fire({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          icon: "error",
          titleText: toPlainText(
            error?.data?.message ||
              error?.response?.data?.message ||
              fallbackMessage,
          ),
        });
        return undefined;
      }
    };
  const getFields = guardRequest(
    getFieldsRequest,
    __("Unable to load checkout fields"),
  );
  const getState = guardRequest(getStateRequest, __("Unable to load states"));
  const checkout = guardRequest(
    checkoutRequest,
    __("Unable to complete checkout, please try again"),
  );

  return (
    <div
      className="fx-leftcontentbox fx-checkoutpage"
      style={{ display: step === "checkoutstep" ? "block" : "none" }}
    >
      {props.stepsVisibility?.step_4_title_visible == "true" && (
        <h1 className="fx-all-main-heading">
          {props.stepTitles?.step_4_title ||
            (redeemBooking ? __("Information") : __("Checkout"))}
        </h1>
      )}
      <div className="fx-commoninput">
        <div className="fx-inputgroup">
          <div
            className={`fx-element-box ${visibleField.sgbm_field_1 ? "" : "fx-hidden"}`}
          >
            <label>{__("First Name")}</label>
            <input
              type="text"
              placeholder={__("First Name")}
              value={billdata.sgbm_field_1 || ""}
              className={errorlist.sgbm_field_1 ? "fx-invalid" : ""}
              onChange={(e) =>
                setBilldata({ ...billdata, sgbm_field_1: e.target.value })
              }
            />
            {errorlist.sgbm_field_1 && (
              <span class="fx-errortext">{__("Enter First Name")}</span>
            )}
          </div>
          <div
            className={`fx-element-box ${visibleField.sgbm_field_2 ? "" : "fx-hidden"}`}
          >
            <label>{__("Last Name")}</label>
            <input
              type="text"
              placeholder={__("Last Name")}
              value={billdata.sgbm_field_2 || ""}
              onChange={(e) =>
                setBilldata({ ...billdata, sgbm_field_2: e.target.value })
              }
            />
          </div>
        </div>
        <div className="fx-inputgroup">
          <div
            className={`fx-element-box ${visibleField.sgbm_field_3 ? "" : "fx-hidden"}`}
          >
            <label>{__("Email")}</label>
            <input
              type="email"
              placeholder={__("Email")}
              value={billdata.sgbm_field_3 || ""}
              className={errorlist.sgbm_field_3 ? "fx-invalid" : ""}
              onChange={(e) =>
                setBilldata({ ...billdata, sgbm_field_3: e.target.value })
              }
              onBlur={(e) => {
                if (e.target.value && !validateEmail(e.target.value)) {
                  setErrorlist({ ...errorlist, sgbm_field_3: true });
                } else {
                  setErrorlist({ ...errorlist, sgbm_field_3: false });
                }
              }}
            />
            {errorlist.sgbm_field_3 && (
              <span class="fx-errortext">{__("Enter a valid email address")}</span>
            )}
          </div>
          <div
            className={`fx-element-box ${visibleField.sgbm_field_4 ? "" : "fx-hidden"}`}
          >
            <label className="fx-mobile-input">{__("Mobile")}</label>
            <div className="fx-phone-input">
              <PhoneInput
                country={billdata.sgbm_field_8?.toLowerCase() || phoneCountry}
                value={billdata.sgbm_field_4}
                className={errorlist.sgbm_field_4 ? "fx-invalid" : ""}
                onChange={(phone, country) => {
                  setBilldata({ ...billdata, sgbm_field_4: phone });
                  // Remove dial code to check number only
                  const number = phone.replace("+" + country.dialCode, "");
                  setNumberOnly(number);

                  // Validate phone for country
                  const isValid = validatePhoneForCountry(phone, country);
                  setPhoneValid(isValid);

                  // Clear error if valid
                  if (isValid && errorlist.sgbm_field_4) {
                    setErrorlist({ ...errorlist, sgbm_field_4: false });
                  }
                }}
                enableSearch={true} // search country
                disableDropdown={false} // keep dropdown
                inputStyle={{ width: "100%" }}
                isValid={(value, country) => {
                  return validatePhoneForCountry(value, country);
                }}
              />
              {errorlist.sgbm_field_4 && (
                <span class="fx-errortext">
                  {__("Enter a valid phone number for the selected country")}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="fx-inputgroup">
          <div
            className={`fx-element-box ${visibleField.sgbm_field_5 ? "" : "fx-hidden"}`}
          >
            <label>{__("Address")}</label>
            <input
              type="text"
              placeholder={__("Address")}
              value={billdata.sgbm_field_5 || ""}
              className={
                errorlist.sgbm_field_5 ? "fx-invalid bigtextbox" : "bigtextbox"
              }
              onChange={(e) =>
                setBilldata({ ...billdata, sgbm_field_5: e.target.value })
              }
            />
            {errorlist.sgbm_field_5 && (
              <span class="fx-errortext">{__("Enter Address")}</span>
            )}
          </div>
        </div>
        <div className="fx-inputgroup">
          <div
            className={`fx-element-box fx-selectwrapper ${visibleField.sgbm_field_8 ? "" : "fx-hidden"}`}
          >
            <label>{__("Country")}</label>
            <select
              value={billdata.sgbm_field_8 || ""}
              onChange={(e) => {
                setBilldata({
                  ...billdata,
                  sgbm_field_8: e.target.value,
                  sgbm_field_7: "",
                });
                setState([]);
                if (e.target.value) getState(e.target.value);
              }}
              className={errorlist.sgbm_field_8 ? "fx-invalid" : ""}
            >
              <option value="">{__("Select Country")}</option>
              {countries &&
                Object.keys(countries.data).map((code) => (
                  <option key={code} value={code}>
                    {countries.data[code]}
                  </option>
                ))}
            </select>
            {errorlist.sgbm_field_8 && (
              <span class="fx-errortext">{__("Enter Country")}</span>
            )}
          </div>
          <div
            className={`fx-element-box fx-selectwrapper ${visibleField.sgbm_field_7 ? "" : "fx-hidden"}`}
          >
            <label>{__("State")}</label>
            <select
              value={billdata.sgbm_field_7 || ""}
              onChange={(e) => {
                setBilldata({ ...billdata, sgbm_field_7: e.target.value });
              }}
              className={errorlist.sgbm_field_7 ? "fx-invalid" : ""}
            >
              <option value="">{__("Select State")}</option>
              {states.length > 0 &&
                Object.keys(states).map((key) => (
                  <option key={states[key].code} value={states[key].code}>
                    {states[key].name}
                  </option>
                ))}
            </select>
            {errorlist.sgbm_field_7 && (
              <span class="fx-errortext">{__("Enter State")}</span>
            )}
          </div>
        </div>
        <div className="fx-inputgroup">
          <div
            className={`fx-element-box ${visibleField.sgbm_field_6 ? "" : "fx-hidden"}`}
          >
            <label>{__("City")}</label>
            <input
              type="text"
              placeholder={__("City")}
              value={billdata.sgbm_field_6 || ""}
              className={errorlist.sgbm_field_6 ? "fx-invalid" : ""}
              onChange={(e) =>
                setBilldata({ ...billdata, sgbm_field_6: e.target.value })
              }
            />
            {errorlist.sgbm_field_6 && (
              <span class="fx-errortext">{__("Enter City")}</span>
            )}
          </div>
          <div
            className={`fx-element-box ${visibleField.sgbm_field_9 ? "" : "fx-hidden"}`}
          >
            <label>{__("Postcode")}</label>
            <input
              type="text"
              placeholder={__("Postcode")}
              value={billdata.sgbm_field_9 || ""}
              className={errorlist.sgbm_field_9 ? "fx-invalid" : ""}
              onChange={(e) =>
                setBilldata({ ...billdata, sgbm_field_9: e.target.value })
              }
            />
            {errorlist.sgbm_field_9 && (
              <span class="fx-errortext">{__("Enter Postcode")}</span>
            )}
          </div>
        </div>
        <div className="fx-inputgroup">
          <div
            className={`fx-element-box ${visibleField.sgbm_field_10 ? "" : "fx-hidden"}`}
          >
            <label>{__("Order Notes")}</label>
            <input
              type="text"
              placeholder={__("Note")}
              value={billdata.sgbm_field_10 || ""}
              className={
                errorlist.sgbm_field_10 ? "bigtextbox fx-invalid" : "bigtextbox"
              }
              onChange={(e) =>
                setBilldata({ ...billdata, sgbm_field_10: e.target.value })
              }
            />
            {errorlist.sgbm_field_10 && (
              <span class="fx-errortext">{__("Enter Order Notes")}</span>
            )}
          </div>
        </div>

        <div className="fx-toggleswitch">
          {gift == true && !opendatepurchase && (
            <>
              {/* <label htmlFor="option1">Gift</label>
              <InputSwitch
                checked={gift ? true : false}
                onChange={() => dispatch(setGift(!gift))}
                inputId="option1"
              /> */}

              <div className="fx-gift-receiver-header">
                <h3>{__("Gift Receiver Information")}</h3>
                {/* Preview Button */}
              </div>
              <div className="fx-commoninput">
                <div class="fx-inputgroup">
                  <div class="fx-element-box">
                    <label>{__("First Name")}</label>
                    <input
                      placeholder={__("First Name")}
                      type="text"
                      value={receiverInfo.firstName}
                      onBlur={(e) =>
                        dispatch(
                          setReceiverInfo({
                            ...receiverInfo,
                            firstName: e.target.value,
                          }),
                        )
                      }
                    ></input>
                  </div>
                  <div class="fx-element-box">
                    <label>{__("Last Name")}</label>
                    <input
                      placeholder={__("Last Name")}
                      type="text"
                      value={receiverInfo.lastName}
                      onBlur={(e) =>
                        dispatch(
                          setReceiverInfo({
                            ...receiverInfo,
                            lastName: e.target.value,
                          }),
                        )
                      }
                    ></input>
                  </div>
                </div>
                <div class="fx-inputgroup">
                  <div class="fx-element-box">
                    <label>{__("Email")}</label>
                    <input
                      placeholder={__("Email")}
                      type="email"
                      value={receiverInfo.email}
                      className={receiverErrors.email ? "fx-invalid" : ""}
                      onChange={(e) =>
                        dispatch(
                          setReceiverInfo({
                            ...receiverInfo,
                            email: e.target.value,
                          }),
                        )
                      }
                      onBlur={(e) => {
                        if (e.target.value && !validateEmail(e.target.value)) {
                          setReceiverErrors({ ...receiverErrors, email: true });
                        } else {
                          setReceiverErrors({
                            ...receiverErrors,
                            email: false,
                          });
                        }
                      }}
                    ></input>
                    {receiverErrors.email && (
                      <span class="fx-errortext">
                        {__("Enter a valid email address")}
                      </span>
                    )}
                  </div>
                  <div class="fx-element-box">
                    <label>{__("Phone Number")}</label>
                    <div className="fx-phone-input">
                      <PhoneInput
                        key={phoneCountry || "default"}
                        country={phoneCountry}
                        onMount={(_value, countryData) =>
                          setSelectedCountry(countryData)
                        }
                        value={receiverInfo.phoneNumber}
                        className={
                          receiverErrors.phoneNumber ? "fx-invalid" : ""
                        }
                        onChange={(phone, country) => {
                          setSelectedCountry(country);
                          dispatch(
                            setReceiverInfo({
                              ...receiverInfo,
                              phoneNumber: phone,
                            }),
                          );
                          const isValid = validatePhoneForCountry(
                            phone,
                            country,
                          );
                          setRPhoneValid(isValid);
                          if (isValid && errorlist.phoneNumber) {
                            setErrorlist((prev) => ({
                              ...prev,
                              phoneNumber: false,
                            }));
                          }
                        }}
                        onBlur={() => {
                          const isValid = validatePhoneForCountry(
                            receiverInfo.phoneNumber,
                            selectedCountry,
                          );
                          setErrorlist((prev) => ({
                            ...prev,
                            phoneNumber: !isValid,
                          }));
                        }}
                        enableSearch={true}
                        disableDropdown={false}
                        inputStyle={{ width: "100%" }}
                        isValid={(value, country) =>
                          validatePhoneForCountry(value, country)
                        }
                      />
                      {receiverErrors.phoneNumber && (
                        <span className="fx-errortext">
                          {__("Enter a valid phone number for the selected country")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="fx-inputgroup">
                  <div className="fx-element-box">
                    <label>{__("Address")}</label>
                    <input
                      placeholder={__("Address")}
                      type="text"
                      value={receiverInfo.address || ""}
                      className={
                        receiverErrors.address
                          ? "bigtextbox fx-invalid"
                          : "bigtextbox"
                      }
                      onChange={(e) =>
                        dispatch(setReceiverInfo({ address: e.target.value }))
                      }
                    />
                    {receiverErrors.address && (
                      <span className="fx-errortext">{__("Enter Address")}</span>
                    )}
                  </div>
                </div>
                <div className="fx-inputgroup">
                  <div className="fx-element-box fx-selectwrapper">
                    <label>{__("Country")}</label>
                    <select
                      value={receiverInfo.country || ""}
                      className={receiverErrors.country ? "fx-invalid" : ""}
                      onChange={(e) => {
                        const country = e.target.value;
                        dispatch(
                          setReceiverInfo({
                            country,
                            state: "",
                          }),
                        );
                        setState([]);
                        if (country) getState(country);
                      }}
                    >
                      <option value="">{__("Select Country")}</option>
                      {countries?.data &&
                        Object.keys(countries.data).map((code) => (
                          <option key={code} value={code}>
                            {countries.data[code]}
                          </option>
                        ))}
                    </select>
                    {receiverErrors.country && (
                      <span className="fx-errortext">{__("Enter Country")}</span>
                    )}
                  </div>
                  <div className="fx-element-box fx-selectwrapper">
                    <label>{__("State")}</label>
                    <select
                      value={receiverInfo.state || ""}
                      className={receiverErrors.state ? "fx-invalid" : ""}
                      onChange={(e) =>
                        dispatch(setReceiverInfo({ state: e.target.value }))
                      }
                    >
                      <option value="">{__("Select State")}</option>
                      {Array.isArray(states) &&
                        states.map((stateOption) => (
                          <option
                            key={stateOption.code}
                            value={stateOption.code}
                          >
                            {stateOption.name}
                          </option>
                        ))}
                    </select>
                    {receiverErrors.state && (
                      <span className="fx-errortext">{__("Enter State")}</span>
                    )}
                  </div>
                </div>
                <div className="fx-inputgroup">
                  <div className="fx-element-box">
                    <label>{__("City")}</label>
                    <input
                      placeholder={__("City")}
                      type="text"
                      value={receiverInfo.city || ""}
                      className={receiverErrors.city ? "fx-invalid" : ""}
                      onChange={(e) =>
                        dispatch(setReceiverInfo({ city: e.target.value }))
                      }
                    />
                    {receiverErrors.city && (
                      <span className="fx-errortext">{__("Enter City")}</span>
                    )}
                  </div>
                  <div className="fx-element-box">
                    <label>{__("Postcode")}</label>
                    <input
                      placeholder={__("Postcode")}
                      type="text"
                      value={receiverInfo.postcode || receiverInfo.zip || ""}
                      className={receiverErrors.postcode ? "fx-invalid" : ""}
                      onChange={(e) =>
                        dispatch(
                          setReceiverInfo({
                            postcode: e.target.value,
                            zip: e.target.value,
                          }),
                        )
                      }
                    />
                    {receiverErrors.postcode && (
                      <span className="fx-errortext">{__("Enter Postcode")}</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
          <CouponSection bookingKey={bookingkey} />
          <section
            className="fx-payment-methods"
            aria-labelledby="payment-methods-title"
          >
            <div className="fx-payment-methods-heading">
              <h2 id="payment-methods-title">{__("Choose payment method")}</h2>
              <p>{__("Select how you’d like to pay for this booking.")}</p>
            </div>

            {paymentMethodsLoading && (
              <div className="fx-payment-methods-status" role="status">
                {__("Loading payment methods...")}
              </div>
            )}

            {!paymentMethodsLoading && paymentMethodsError && (
              <div className="fx-payment-methods-error" role="alert">
                <span>{paymentMethodsError}</span>
                <button
                  type="button"
                  className="fx-payment-methods-retry"
                  onClick={getPaymentMethods}
                  aria-label={__("Retry loading payment methods")}
                  title={__("Retry")}
                >
                  <RefreshCw size={17} aria-hidden="true" />
                </button>
              </div>
            )}

            {!paymentMethodsLoading && paymentGroups.length > 0 && (
              <div
                className="fx-payment-methods-list"
                role="radiogroup"
                aria-labelledby="payment-methods-title"
              >
                {paymentGroups.map((group) => {
                  const cards = group.cards || [];
                  const hasMultiCardGroup = paymentGroups.some(
                    (item) => (item.cards || []).length > 1,
                  );
                  const showGroupHeading =
                    cards.length > 1 ||
                    (paymentGroups.length > 1 && hasMultiCardGroup);

                  return (
                    <div className="fx-payment-method-group" key={group.id}>
                      {showGroupHeading && (
                        <div className="fx-payment-method-group-heading">
                          <h3>{group.title}</h3>
                          {group.description && <p>{group.description}</p>}
                        </div>
                      )}
                      <div className="fx-payment-method-card-list">
                        {cards.map((card) => {
                          const isSelected =
                            selectedPaymentCard?.id === card.id;
                          const PaymentIcon =
                            card.method === "online" ? CreditCard : Banknote;

                          return (
                            <button
                              type="button"
                              className={`fx-payment-method-card ${isSelected ? "selected" : ""}`}
                              key={card.id}
                              onClick={() => {
                                setSelectedPaymentCard(card);
                                dispatch(setSelectedPaymentMethod(card.method));
                              }}
                              role="radio"
                              aria-checked={isSelected}
                            >
                              <span
                                className="fx-payment-method-icon"
                                aria-hidden="true"
                              >
                                <PaymentIcon size={20} />
                              </span>
                              <span className="fx-payment-method-copy">
                                <span className="fx-payment-method-title-row">
                                  <strong>{card.title}</strong>
                                  {card.provider && (
                                    <span className="fx-payment-method-provider">
                                      {card.provider}
                                    </span>
                                  )}
                                </span>
                                {card.description && (
                                  <span className="fx-payment-method-desc">
                                    {card.description}
                                  </span>
                                )}
                              </span>
                              <span
                                className="fx-payment-method-radio"
                                aria-hidden="true"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
          <label htmlFor="option2">{__("Invoice Request")}</label>
          <InputSwitch
            checked={invoice ? true : false}
            onChange={() => setInvoice(!invoice)}
            inputId="option2"
          />
        </div>
        {invoice && (
          <div className="fx-commoninput fx-invoice-fields">
            <div className="fx-inputgroup">
              <div className="fx-element-box">
                <label>{__("Company Name")}</label>
                <input
                  type="text"
                  placeholder={__("Company Name")}
                  value={billdata.invoice_company_name || ""}
                  className={errorlist.invoice_company_name ? "fx-invalid" : ""}
                  onChange={(e) =>
                    setBilldata({
                      ...billdata,
                      invoice_company_name: e.target.value,
                    })
                  }
                />
                {errorlist.invoice_company_name && (
                  <span className="fx-errortext">{__("Enter Company Name")}</span>
                )}
              </div>
              <div className="fx-element-box">
                <label>{__("VAT ID")}</label>
                <input
                  type="text"
                  placeholder={__("VAT ID")}
                  value={billdata.invoice_vat_id || ""}
                  className={errorlist.invoice_vat_id ? "fx-invalid" : ""}
                  onChange={(e) =>
                    setBilldata({ ...billdata, invoice_vat_id: e.target.value })
                  }
                />
                {errorlist.invoice_vat_id && (
                  <span className="fx-errortext">{__("Enter VAT ID")}</span>
                )}
              </div>
            </div>
            <div className="fx-inputgroup">
              <div className="fx-element-box">
                <label>{__("Company Address")}</label>
                <input
                  type="text"
                  placeholder={__("Company Address")}
                  className={
                    errorlist.invoice_company_address
                      ? "fx-invalid bigtextbox"
                      : "bigtextbox"
                  }
                  value={billdata.invoice_company_address || ""}
                  onChange={(e) =>
                    setBilldata({
                      ...billdata,
                      invoice_company_address: e.target.value,
                    })
                  }
                />
                {errorlist.invoice_company_address && (
                  <span className="fx-errortext">{__("Enter Company Address")}</span>
                )}
              </div>
            </div>
            <div className="fx-inputgroup">
              <div className="fx-element-box fx-selectwrapper">
                <label>{__("Company Country")}</label>
                <select
                  value={billdata.invoice_company_country || ""}
                  className={
                    errorlist.invoice_company_country ? "fx-invalid" : ""
                  }
                  onChange={(e) =>
                    setBilldata({
                      ...billdata,
                      invoice_company_country: e.target.value,
                    })
                  }
                >
                  <option value="">{__("Select Country")}</option>
                  {countries &&
                    Object.keys(countries.data).map((code) => (
                      <option key={code} value={code}>
                        {countries.data[code]}
                      </option>
                    ))}
                </select>
                {errorlist.invoice_company_country && (
                  <span className="fx-errortext">{__("Select Company Country")}</span>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="fx-inputgroup fx-checkboxcontainer">
          <input
            type="checkbox"
            id="terms-checkbox"
            defaultChecked={term ? "checked" : ""}
            onClick={() => setTerm(!term)}
          />
          <label htmlFor="terms-checkbox" className="checkbox-label">
            {withElement(
              __("You are making a direct booking.Please accept %s before proceeding"),
              <a
                href={toSafeUrl(props.termsAndConditionLink) || undefined}
                target="_blank"
                rel="noopener noreferrer"
              >
                {__("terms and conditions")}
              </a>,
            )}
          </label>
        </div>
        <div className="fx-element-box fx-checkoutbuttonbar">
          <input
            type="button"
            className="btn-primary"
            value={__("Continue")}
            disabled={paymentMethodsLoading || !selectedPaymentCard}
            onClick={() => checkout()}
          />
        </div>
      </div>
    </div>
  );
}
