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
import { setLoading } from "../store/step1Slice";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { validateEmail } from "../Utils/Functions";

export default function ReedemCheckout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const step = useSelector((state) => state.step1.redeemstep);
  const slot = useSelector((state) => state.step3.slot);
  const voucherdetail = useSelector((state) => state.step3.voucherdetail);
  const date = useSelector((state) => state.step1.date);
  const voucher = useSelector((state) => state.step1.voucher);

  const { data: countries } = useFetch("/countries", {
    method: "get",
  });
  const [billdata, setBilldata] = useState({});
  const [states, setState] = useState({});
  const [term, setTerm] = useState(false);
  const [numberOnly, setNumberOnly] = useState("");
  const [errorlist, setErrorlist] = useState({});
  const [visibleField, setVisibleField] = useState({});

  useEffect(() => {
    if (step == "checkoutstep") {
      getFields();
      setErrorlist({});
      setBilldata(voucherdetail.recepient_data || {});
      getState(voucherdetail.recepient_data?.recipient_country);
      setNumberOnly(voucherdetail.recepient_data?.recipient_contact || "");
    }
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

  const confirmredeem = async () => {
    setErrorlist({});
    if (!billdata.recipient_first_name) {
      setErrorlist({ recipient_first_name: true });
      return;
    }
    if (!billdata.recipient_last_name) {
      setErrorlist({ recipient_last_name: true });
      return;
    }
    if (numberOnly.trim() == "") {
      setErrorlist({ recipient_contact: true });
      return;
    }
    if (!billdata.recipient_email) {
      setErrorlist({ recipient_email: true });
      return;
    }
    if (!billdata.recipient_address) {
      setErrorlist({ recipient_address: true });
      return;
    }
    if (!billdata.recipient_city) {
      setErrorlist({ recipient_city: true });
      return;
    }
    if (!billdata.recipient_state) {
      setErrorlist({ recipient_state: true });
      return;
    }
    if (!billdata.recipient_postcode) {
      setErrorlist({ recipient_postcode: true });
      return;
    }

    if (!billdata.recipient_country) {
      setErrorlist({ recipient_country: true });
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

    const { data } = await axiosInstance.post(`/voucher-redeem`, {
      voucher,
      date: moment(date).format("YYYY-MM-DD"),
      slot,
      recipient: billdata,
    });

    if (data && data.status == 200 && data.data.status == "success") {
      navigate(`/redeem-thankyou`);
    } else {
      Swal.fire({
        toast: true,
        position: "top-end", // or 'bottom-end', 'top-start', etc.
        showConfirmButton: false,
        timer: 3000, // auto-close after 3 seconds
        icon: "error", // 'success', 'error', 'warning', 'info', 'question'
        title: data?.message ?? "There is some error , please try again",
      });
      dispatch(setLoading(false));
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
          <div
            className={`fx-element-box ${visibleField.sgbm_field_1 ? "" : "fx-hidden"}`}
          >
            <label>First Name</label>
            <input
              type="text"
              placeholder="First Name"
              className={errorlist.recipient_first_name ? "fx-invalid" : ""}
              value={billdata.recipient_first_name || ""}
              onChange={(e) =>
                setBilldata({
                  ...billdata,
                  recipient_first_name: e.target.value,
                })
              }
            />
            {errorlist.recipient_first_name && (
              <span className="fx-errortext">Enter First Name</span>
            )}
          </div>
          <div
            className={`fx-element-box ${visibleField.sgbm_field_2 ? "" : "fx-hidden"}`}
          >
            <label>Last Name</label>
            <input
              type="text"
              placeholder="Last Name"
              value={billdata.recipient_last_name || ""}
              onChange={(e) =>
                setBilldata({
                  ...billdata,
                  recipient_last_name: e.target.value,
                })
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
              className={errorlist.recipient_email ? "fx-invalid" : ""}
              value={billdata.recipient_email || ""}
              onChange={(e) =>
                setBilldata({ ...billdata, recipient_email: e.target.value })
              }
              onBlur={(e) => {
                if (e.target.value && !validateEmail(e.target.value)) {
                  setErrorlist({ ...errorlist, recipient_email: true });
                } else {
                  setErrorlist({ ...errorlist, recipient_email: false });
                }
              }}
            />
            {errorlist.recipient_email && (
              <span className="fx-errortext">Enter Email</span>
            )}
          </div>
          <div
            className={`fx-element-box ${visibleField.sgbm_field_4 ? "" : "fx-hidden"}`}
          >
            <label>Mobile</label>
            <div className="fx-phone-input">
              <PhoneInput
                country={billdata.recipient_country?.toLowerCase() || "in"}
                value={billdata.recipient_contact}
                className={errorlist.recipient_contact ? "fx-invalid" : ""}
                onChange={(phone, country) => {
                  setBilldata({ ...billdata, recipient_contact: phone });
                  // Remove dial code to check number only
                  const number = phone.replace("+" + country.dialCode, "");
                  setNumberOnly(number);
                }}
                enableSearch={true} // search country
                disableDropdown={false} // keep dropdown
                inputStyle={{ width: "100%" }}
              />
              {errorlist.recipient_contact && (
                <span className="fx-errortext">Enter Phone number</span>
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
              value={billdata.recipient_address || ""}
              className={
                errorlist.recipient_address
                  ? "fx-invalid bigtextbox"
                  : "bigtextbox"
              }
              onChange={(e) =>
                setBilldata({ ...billdata, recipient_address: e.target.value })
              }
            />
            {errorlist.recipient_address && (
              <span className="fx-errortext">Enter Address</span>
            )}
          </div>
        </div>
        <div className="fx-inputgroup">
          <div
            className={`fx-element-box fx-selectwrapper ${visibleField.sgbm_field_8 ? "" : "fx-hidden"}`}
          >
            <label>Country</label>
            <select
              defaultValue={billdata.recipient_country}
              onChange={(e) => {
                setBilldata({ ...billdata, recipient_country: e.target.value });
                getState(e.target.value);
              }}
              className={errorlist.recipient_country ? "fx-invalid" : ""}
            >
              {countries &&
                Object.keys(countries.data).map((code) => (
                  <option
                    value={code}
                    selected={billdata.recipient_country === code}
                  >
                    {countries.data[code]}
                  </option>
                ))}
            </select>
            {errorlist.recipient_country && (
              <span className="fx-errortext">Enter Country</span>
            )}
          </div>
          <div
            className={`fx-element-box fx-selectwrapper ${visibleField.sgbm_field_7 ? "" : "fx-hidden"}`}
          >
            <label>State</label>
            <select
              defaultValue={billdata.recipient_state}
              onChange={(e) => {
                setBilldata({ ...billdata, recipient_state: e.target.value });
              }}
              className={errorlist.recipient_state ? "fx-invalid" : ""}
            >
              {states.length > 0 &&
                Object.keys(states).map((key) => (
                  <option
                    value={states[key].code}
                    selected={billdata.recipient_state === states[key].name}
                  >
                    {states[key].name}
                  </option>
                ))}
            </select>
            {errorlist.recipient_state && (
              <span className="fx-errortext">Enter State</span>
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
              value={billdata?.recipient_city}
              className={errorlist.recipient_city ? "fx-invalid" : ""}
              onChange={(e) =>
                setBilldata({ ...billdata, recipient_city: e.target.value })
              }
            />
            {errorlist.recipient_city && (
              <span className="fx-errortext">Enter City</span>
            )}
          </div>
          <div
            className={`fx-element-box ${visibleField.sgbm_field_9 ? "" : "fx-hidden"}`}
          >
            <label>Zip</label>
            <input
              type="text"
              placeholder="State"
              className={errorlist.recipient_postcode ? "fx-invalid" : ""}
              value={billdata?.recipient_postcode}
              onChange={(e) =>
                setBilldata({ ...billdata, recipient_postcode: e.target.value })
              }
            />
            {errorlist.recipient_postcode && (
              <span className="fx-errortext">Enter Zip</span>
            )}
          </div>
        </div>

        <div className="fx-inputgroup">
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
            onClick={() => confirmredeem()}
          />
        </div>
      </div>
    </div>
  );
}
