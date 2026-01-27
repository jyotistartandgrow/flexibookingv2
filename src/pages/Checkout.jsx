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

export default function Checkout() {
  const dispatch = useDispatch();
  const step = useSelector((state) => state.step1.step);
  const bookingkey = useSelector((state) => state.step3.bookingkey);
  const receiverInfo = useSelector((state) => state.step1.receiverInfo);
  const gift = useSelector((state) => state.step1.gift);

  const { data: countries } = useFetch("/countries", {
    method: "get",
  });
  const [billdata, setBilldata] = useState({});
  const [states, setState] = useState({});
  const [term, setTerm] = useState(false);
  const [invoice, setInvoice] = useState(false);
  const [numberOnly, setNumberOnly] = useState("");
  const [errorlist, setErrorlist] = useState({});

  useEffect(() => {
    setErrorlist({});
  }, [billdata]);

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
    if (!billdata.sgbm_field_1) {
      setErrorlist({ sgbm_field_1: true });
      return;
    }
    if (!billdata.sgbm_field_3) {
      setErrorlist({ sgbm_field_3: true });
      return;
    }
    if (numberOnly.trim() == "") {
      setErrorlist({ sgbm_field_4: true });
      return;
    }
    if (!billdata.sgbm_field_5) {
      setErrorlist({ sgbm_field_5: true });
      return;
    }
    if (!billdata.sgbm_field_6) {
      setErrorlist({ sgbm_field_6: true });
      return;
    }
    if (!billdata.sgbm_field_8) {
      setErrorlist({ sgbm_field_8: true });
      return;
    }
    if (!billdata.sgbm_field_9) {
      setErrorlist({ sgbm_field_9: true });
      return;
    }
    if (!billdata.sgbm_field_10) {
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
      recipient_first_name: gift ? receiverInfo.firstName ?? "" : "",
      recipient_last_name: gift ? receiverInfo.lastName ?? "" : "",
      recipient_email: gift ? receiverInfo.email ?? "" : "",
      recipient_contact: gift ? receiverInfo.phoneNumber ?? "" : "",
      recipient_address: "",
      recipient_country: gift ? receiverInfo.country ?? "" : "",
      recipient_state: "",
      recipient_city: "",
      recipient_postcode: gift ? receiverInfo.zip ?? "" : "",
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
    }
    dispatch(setLoading(false));
  };
  return (
    <div
      className="fx-leftcontentbox fx-checkoutpage"
      style={{ display: step === "checkoutstep" ? "block" : "none" }}
    >
      {/* <h1 className="fx-main-heading">Checkout</h1> */}
      <div className="fx-commoninput">
        <div className="fx-inputgroup">
          <div className="fx-element-box">
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
          <div className="fx-element-box">
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
          <div className="fx-element-box">
            <label>Email</label>
            <input
              type="email"
              placeholder="Email"
              className={errorlist.sgbm_field_3 ? "fx-invalid" : ""}
              onChange={(e) =>
                setBilldata({ ...billdata, sgbm_field_3: e.target.value })
              }
            />
            {errorlist.sgbm_field_3 && (
              <span class="fx-errortext">Enter Email</span>
            )}
          </div>
          <div className="fx-element-box">
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
                }}
                enableSearch={true} // search country
                disableDropdown={false} // keep dropdown
                inputStyle={{ width: "100%" }}
              />
              {errorlist.sgbm_field_4 && (
                <span class="fx-errortext">Enter Phone number</span>
              )}
            </div>
          </div>
        </div>
        <div className="fx-inputgroup">
          <div className="fx-element-box">
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
          <div className="fx-element-box fx-selectwrapper">
            <label>Country</label>
            <select
              onChange={(e) => {
                setBilldata({ ...billdata, sgbm_field_8: e.target.value });
                getState(e.target.value);
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
          <div className="fx-element-box fx-selectwrapper">
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
          <div className="fx-element-box">
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
          <div className="fx-element-box">
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
          <div className="fx-element-box">
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
          <label htmlFor="option1">Gift</label>
          <InputSwitch
            checked={gift ? true : false}
            onChange={() => setGift(!gift)}
            inputId="option1"
          />
        
        {gift == true && (
          <>
            <h3>Gift Receiver Information</h3>
            <div className="fx-commoninput">
              <div class="fx-inputgroup">
                <div class="fx-element-box">
                  <label>First Name</label>
                  <input
                    placeholder="First Name"
                    class=""
                    type="text"
                    fdprocessedid="ffetu"
                  ></input>
                </div>
                <div class="fx-element-box">
                  <label>Last Name</label>
                  <input
                    placeholder="First Name"
                    class=""
                    type="text"
                    fdprocessedid="ffetu"
                  ></input>
                </div>
              </div>
            </div>
            <div className="fx-giftbox fx-commoninput" id="gift-section">
              <div className="fx-inputgroup">
                <input
                  type="text"
                  placeholder="First Name"
                  value={receiverInfo.firstName}
                  onBlur={(e) =>
                    dispatch(
                      setReceiverInfo({
                        ...receiverInfo,
                        firstName: e.target.value,
                      })
                    )
                  }
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={receiverInfo.lastName}
                  onBlur={(e) =>
                    dispatch(
                      setReceiverInfo({
                        ...receiverInfo,
                        lastName: e.target.value,
                      })
                    )
                  }
                />
              </div>
              <div className="fx-inputgroup">
                <div className="fx-input-wrapper">
                  <input
                    type="email"
                    placeholder="Email"
                    value={receiverInfo.email}
                    onBlur={(e) =>
                      dispatch(
                        setReceiverInfo({
                          ...receiverInfo,
                          email: e.target.value,
                        })
                      )
                    }
                  />
                  <i className="fa fa-envelope-o"></i>
                </div>
                <div className="fx-input-wrapper">
                  <input
                    type="text"
                    placeholder="Phone Number"
                    value={receiverInfo.phoneNumber}
                    onBlur={(e) =>
                      dispatch(
                        setReceiverInfo({
                          ...receiverInfo,
                          phoneNumber: e.target.value,
                        })
                      )
                    }
                  />
                  <i className="fa fa-phone"></i>
                </div>
              </div>
              <div className="fx-inputgroup">
                <div className="fx-input-wrapper">
                  <input
                    type="text"
                    placeholder="Country"
                    value={receiverInfo.country}
                    onBlur={(e) =>
                      dispatch(
                        setReceiverInfo({
                          ...receiverInfo,
                          country: e.target.value,
                        })
                      )
                    }
                  />
                  <i className="fa fa-flag-o"></i>
                </div>
                <div className="fx-input-wrapper">
                  <input
                    type="text"
                    placeholder="Zip"
                    value={receiverInfo.zip}
                    onBlur={(e) =>
                      dispatch(
                        setReceiverInfo({
                          ...receiverInfo,
                          zip: e.target.value,
                        })
                      )
                    }
                  />
                </div>
              </div>
              <div className="fx-inputgroup">
                <div className="fx-input-wrapper">
                  <input
                    type="text"
                    placeholder="Address"
                    className="bigtextbox"
                    value={receiverInfo.address}
                    onBlur={(e) =>
                      dispatch(
                        setReceiverInfo({
                          ...receiverInfo,
                          address: e.target.value,
                        })
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </>
        )}

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
            id="checkbox-checked"
            defaultChecked={term ? "checked" : ""}
            onClick={() => setTerm(!term)}
          />
          <label htmlFor="checkbox-checked" className="checkbox-label">
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
