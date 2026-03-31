import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import Swal from "sweetalert2";
import axiosInstance from "../Utils/Interceptor";
import useFetch from "../Utils/CustomHook";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { InputSwitch } from "primereact/inputswitch";
import { setReceiverInfo, setStep, setLoading } from "../store/step1Slice";
import { setCheckoutkey, setPaymentstring } from "../store/step4Slice";
import GiftCardPreviewButton from "./Giftcardpreviewbutton";
import {
  decodeHtml,
  validateEmail,
  validatePhoneForCountry,
} from "../Utils/Functions";
import CouponSection from "./CouponSection";

export default function Checkout(props) {
  const dispatch = useDispatch();
  const step = useSelector((state) => state.step1.step);
  const bookingkey = useSelector((state) => state.step3.bookingkey);
  const receiverInfo = useSelector((state) => state.step1.receiverInfo);
  const gift = useSelector((state) => state.step1.gift);
  const cart = useSelector((state) => state.step2.cart);

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
  const [visibleField, setVisibleField] = useState({});
  const [selectedCountry, setSelectedCountry] = useState({ dialCode: "91" });

  useEffect(() => {
    setErrorlist({});
  }, [billdata]);

  useEffect(() => {
    if (step != "checkoutstep") {
      return;
    }
    getFields();
  }, [step]);

  const getFields = async () => {
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

  const getState = async (country) => {
    dispatch(setLoading(true));
    const { data } = await axiosInstance(`/states?country_code=${country}`, {
      method: "get",
    });

    if (data?.data) {
      setState(data?.data);
      dispatch(setLoading(false));
    }
  };

  const checkout = async () => {
    // Validate gift receiver information if gift is enabled
    if (gift) {
      const errors = {};

      if (!receiverInfo.email || !validateEmail(receiverInfo.email)) {
        errors.email = true;
      }

      if (!rphoneValid) {
        errors.phoneNumber = true;
      }

      if (Object.keys(errors).length > 0) {
        setReceiverErrors(errors);
        Swal.fire({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          icon: "error",
          title: "Please enter valid receiver email and phone number",
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
          title: "Please enter a valid phone number for the selected country",
        });
        return;
      }
    }
    if (!billdata.sgbm_field_5 && visibleField.sgbm_field_5) {
      setErrorlist({ sgbm_field_5: true });
      return;
    }
    if (!billdata.sgbm_field_6 && visibleField.sgbm_field_6) {
      setErrorlist({ sgbm_field_6: true });
      return;
    }
    if (!billdata.sgbm_field_8 && visibleField.sgbm_field_8) {
      setErrorlist({ sgbm_field_8: true });
      return;
    }
    if (!billdata.sgbm_field_9 && visibleField.sgbm_field_9) {
      setErrorlist({ sgbm_field_9: true });
      return;
    }
    if (!billdata.sgbm_field_10 && visibleField.sgbm_field_10) {
      setErrorlist({ sgbm_field_10: true });
      return;
    }

    if (!term) {
      Swal.fire({
        toast: true,
        position: "top-end", // or 'bottom-end', 'top-start', etc.
        showConfirmButton: false,
        timer: 3000, // auto-close after 3 seconds
        icon: "warning", // 'success', 'error', 'warning', 'info', 'question'
        title: "Please accept terms and conditions before proceeding",
      });
      return;
    }

    dispatch(setLoading(true));
    const gift_info = {
      recipient_first_name: gift ? (receiverInfo.firstName ?? "") : "",
      recipient_last_name: gift ? (receiverInfo.lastName ?? "") : "",
      recipient_email: gift ? (receiverInfo.email ?? "") : "",
      recipient_contact: gift ? (receiverInfo.phoneNumber ?? "") : "",
      recipient_address: "",
      recipient_country: gift ? (receiverInfo.country ?? "") : "",
      recipient_state: "",
      recipient_city: "",
      recipient_postcode: gift ? (receiverInfo.zip ?? "") : "",
    };

    billdata.country_code = billdata.sgbm_field_8;

    const { data } = await axiosInstance.post(`/checkout`, {
      booking_data: bookingkey,
      billing_details: billdata,
      shipping_details: {
        shipping_first_name: "",
        shipping_last_name: "",
        shipping_email: "",
        shipping_contact: "",
        shipping_address: "",
        shipping_country: "IN",
        shipping_state: "",
        shipping_city: "",
        shipping_postcode: "",
      },
      gift_details: gift_info,
      is_gift: gift,
      other_data: {
        terms_conditions: 1,
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
    });

    if (data && data.status == 200 && data.data.status == "success") {
      dispatch(setCheckoutkey(data.data.checkout));
      dispatch(setPaymentstring(data.data.data));
      dispatch(setStep("paymentstep"));
    } else {
      Swal.fire({
        toast: true,
        position: "top-end", // or 'bottom-end', 'top-start', etc.
        showConfirmButton: false,
        timer: 3000, // auto-close after 3 seconds
        icon: "error", // 'success', 'error', 'warning', 'info', 'question'
        title: data?.message ?? "There is some error , please try again",
      });
      if (data?.message == "Error Fetching Booking Information !!") {
        Swal.fire({
          icon: "error",
          title: `Session Expired`,
          text: "Your session has expired. Please start the booking process again.",
        });
        dispatch({ type: "app/reset" });
        window.location.reload();
      }
    }
    dispatch(setLoading(false));
  };
  return (
    <div
      className="fx-leftcontentbox fx-checkoutpage"
      style={{ display: step === "checkoutstep" ? "block" : "none" }}
    >
      {props.stepsVisibility?.step_4_title_visible == "true" && (
        <h1 className="fx-all-main-heading">
          {props.stepTitles?.step_4_title || "Checkout"}
        </h1>
      )}
      <div className="fx-commoninput">
        <div className="fx-inputgroup">
          <div
            className={`fx-element-box ${visibleField.sgbm_field_1 ? "" : "fx-hidden"}`}
          >
            <label>First Name</label>
            <input
              type="text"
              placeholder="First Name"
              className={errorlist.sgbm_field_1 ? "fx-invalid" : ""}
              onChange={(e) =>
                setBilldata({ ...billdata, sgbm_field_1: e.target.value })
              }
            />
            {errorlist.sgbm_field_1 && (
              <span class="fx-errortext">Enter First Name</span>
            )}
          </div>
          <div
            className={`fx-element-box ${visibleField.sgbm_field_2 ? "" : "fx-hidden"}`}
          >
            <label>Last Name</label>
            <input
              type="text"
              placeholder="Last Name"
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
            <label>Email</label>
            <input
              type="email"
              placeholder="Email"
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
              <span class="fx-errortext">Enter a valid email address</span>
            )}
          </div>
          <div
            className={`fx-element-box ${visibleField.sgbm_field_4 ? "" : "fx-hidden"}`}
          >
            <label className="fx-mobile-input">Mobile</label>
            <div className="fx-phone-input">
              <PhoneInput
                country={"in"}
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
                  Enter a valid phone number for the selected country
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="fx-inputgroup">
          <div
            className={`fx-element-box ${visibleField.sgbm_field_5 ? "" : "fx-hidden"}`}
          >
            <label>Address</label>
            <input
              type="text"
              placeholder="Address"
              className={
                errorlist.sgbm_field_5 ? "fx-invalid bigtextbox" : "bigtextbox"
              }
              onChange={(e) =>
                setBilldata({ ...billdata, sgbm_field_5: e.target.value })
              }
            />
            {errorlist.sgbm_field_5 && (
              <span class="fx-errortext">Enter Address</span>
            )}
          </div>
        </div>
        <div className="fx-inputgroup">
          <div
            className={`fx-element-box fx-selectwrapper ${visibleField.sgbm_field_8 ? "" : "fx-hidden"}`}
          >
            <label>Country</label>
            <select
              onChange={(e) => {
                setBilldata({ ...billdata, sgbm_field_8: e.target.value });
                visibleField.sgbm_field_8 && getState(e.target.value);
              }}
              className={errorlist.sgbm_field_8 ? "fx-invalid" : ""}
            >
              {countries &&
                Object.keys(countries.data).map((code) => (
                  <option value={code}>{countries.data[code]}</option>
                ))}
            </select>
            {errorlist.sgbm_field_8 && (
              <span class="fx-errortext">Enter Country</span>
            )}
          </div>
          <div
            className={`fx-element-box fx-selectwrapper ${visibleField.sgbm_field_7 ? "" : "fx-hidden"}`}
          >
            <label>State</label>
            <select
              onChange={(e) => {
                setBilldata({ ...billdata, sgbm_field_7: e.target.value });
              }}
              className={errorlist.sgbm_field_7 ? "fx-invalid" : ""}
            >
              {states.length > 0 &&
                Object.keys(states).map((key) => (
                  <option value={states[key].code}>{states[key].name}</option>
                ))}
            </select>
            {errorlist.sgbm_field_7 && (
              <span class="fx-errortext">Enter State</span>
            )}
          </div>
        </div>
        <div className="fx-inputgroup">
          <div
            className={`fx-element-box ${visibleField.sgbm_field_6 ? "" : "fx-hidden"}`}
          >
            <label>City</label>
            <input
              type="text"
              placeholder="City"
              className={errorlist.sgbm_field_6 ? "fx-invalid" : ""}
              onChange={(e) =>
                setBilldata({ ...billdata, sgbm_field_6: e.target.value })
              }
            />
            {errorlist.sgbm_field_6 && (
              <span class="fx-errortext">Enter City</span>
            )}
          </div>
          <div
            className={`fx-element-box ${visibleField.sgbm_field_9 ? "" : "fx-hidden"}`}
          >
            <label>Zip</label>
            <input
              type="text"
              placeholder="State"
              className={errorlist.sgbm_field_9 ? "fx-invalid" : ""}
              onChange={(e) =>
                setBilldata({ ...billdata, sgbm_field_9: e.target.value })
              }
            />
            {errorlist.sgbm_field_9 && (
              <span class="fx-errortext">Enter Zip</span>
            )}
          </div>
        </div>
        <div className="fx-inputgroup">
          <div
            className={`fx-element-box ${visibleField.sgbm_field_10 ? "" : "fx-hidden"}`}
          >
            <label>Order Notes</label>
            <input
              type="text"
              placeholder="Note"
              className={
                errorlist.sgbm_field_10 ? "bigtextbox fx-invalid" : "bigtextbox"
              }
              onChange={(e) =>
                setBilldata({ ...billdata, sgbm_field_10: e.target.value })
              }
            />
            {errorlist.sgbm_field_10 && (
              <span class="fx-errortext">Enter Order Notes</span>
            )}
          </div>
        </div>

        <div className="fx-toggleswitch">
          {gift == true && (
            <>
              {/* <label htmlFor="option1">Gift</label>
              <InputSwitch
                checked={gift ? true : false}
                onChange={() => dispatch(setGift(!gift))}
                inputId="option1"
              /> */}

              <div className="fx-gift-receiver-header">
                <h3>Gift Receiver Information</h3>
                {/* Preview Button */}
                <GiftCardPreviewButton
                  receiverFirstName={receiverInfo.firstName}
                  receiverLastName={receiverInfo.lastName}
                  services={cart}
                  total={decodeHtml(cart.total_formatted)}
                  senderName={billdata.sgbm_field_1 || "You"}
                  message="Enjoy your special day!"
                />
              </div>
              <div className="fx-commoninput">
                <div class="fx-inputgroup">
                  <div class="fx-element-box">
                    <label>First Name</label>
                    <input
                      placeholder="First Name"
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
                    <label>Last Name</label>
                    <input
                      placeholder="Last Name"
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
                    <label>Email</label>
                    <input
                      placeholder="Email"
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
                        Enter a valid email address
                      </span>
                    )}
                  </div>
                  <div class="fx-element-box">
                    <label>Phone Number</label>
                    <div className="fx-phone-input">
                      <PhoneInput
                        country={"in"}
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
                          Enter a valid phone number for the selected country
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div class="fx-inputgroup">
                  <div class="fx-element-box fx-hidden">
                    <label>Country</label>
                    <input
                      placeholder="Country"
                      type="text"
                      value={receiverInfo.country}
                      onBlur={(e) =>
                        dispatch(
                          setReceiverInfo({
                            ...receiverInfo,
                            country: e.target.value,
                          }),
                        )
                      }
                    ></input>
                  </div>
                  <div class="fx-element-box fx-hidden">
                    <label>Zip</label>
                    <input
                      placeholder="Zip"
                      type="text"
                      value={receiverInfo.zip}
                      onBlur={(e) =>
                        dispatch(
                          setReceiverInfo({
                            ...receiverInfo,
                            zip: e.target.value,
                          }),
                        )
                      }
                    ></input>
                  </div>
                </div>
                <div class="fx-inputgroup">
                  <div class="fx-element-box fx-hidden">
                    <label>Address</label>
                    <input
                      placeholder="Address"
                      type="text"
                      value={receiverInfo.address}
                      onBlur={(e) =>
                        dispatch(
                          setReceiverInfo({
                            ...receiverInfo,
                            address: e.target.value,
                          }),
                        )
                      }
                    ></input>
                  </div>
                </div>
              </div>
            </>
          )}
          <CouponSection />
          <label htmlFor="option2">Invoice Request</label>
          <InputSwitch
            checked={invoice ? true : false}
            onChange={() => setInvoice(!invoice)}
            inputId="option2"
          />
        </div>
        <div className="fx-inputgroup fx-checkboxcontainer">
          <input
            type="checkbox"
            id="terms-checkbox"
            defaultChecked={term ? "checked" : ""}
            onClick={() => setTerm(!term)}
          />
          <label htmlFor="terms-checkbox" className="checkbox-label">
            You are making a direct booking.Please accept terms and conditions
            before proceeding
          </label>
        </div>
        <div className="fx-element-box fx-checkoutbuttonbar">
          <input
            type="button"
            className="btn-primary"
            value="CONTINUE"
            onClick={() => checkout()}
          />
        </div>
      </div>
    </div>
  );
}
