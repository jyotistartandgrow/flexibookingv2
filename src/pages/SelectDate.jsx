import { useRef, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Calendar } from "primereact/calendar";
import { addLocale } from "primereact/api";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { ArrowLeft, CalendarDays, Clock, ImageOff } from "lucide-react";
import moment from "moment";
import Swal from "sweetalert2";
import {
  setDate,
  setRedeemStep,
  setLoading,
  setRedeemBooking,
  setStep,
} from "../store/step1Slice";
import {
  setRedeemBundleSlots,
  setSlot,
  setVoucherDetail,
} from "../store/step3Slice";
import { setTimeslot } from "../store/step2Slice";
import axiosInstance from "../Utils/Interceptor";
import { decodeEntities } from "../Utils/Functions";

addLocale("en-monday", {
  firstDayOfWeek: 1, // Monday
});

function RedeemItemCard({ product, description }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(product.image) && !imageFailed;

  return (
    <article className="fx-redeem-item-card">
      <div className="fx-redeem-item-media">
        {showImage ? (
          <img
            src={product.image}
            alt=""
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="fx-redeem-item-fallback" aria-hidden="true">
            <ImageOff size={22} />
          </span>
        )}
        {product.category_name && (
          <span className="fx-redeem-item-category">
            {product.category_name}
          </span>
        )}
      </div>
      <div className="fx-redeem-item-copy">
        <h3>{product.name}</h3>
        {description && (
          <div
            className="fx-redeem-item-desc"
            dangerouslySetInnerHTML={{
              __html: decodeEntities(description),
            }}
          />
        )}
      </div>
    </article>
  );
}

export default function SelectDate() {
  const calendarRef = useRef(null);
  const dispatch = useDispatch();
  const step = useSelector((state) => state.step1.redeemstep);
  const date = useSelector((state) => state.step1.date);
  const voucher = useSelector((state) => state.step1.voucher);
  const [voucherdetail, setVoucherdetail] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedBundleSlots, setSelectedBundleSlots] = useState([]);
  const [expandedBundleIndex, setExpandedBundleIndex] = useState(0);
  const [bundleSlotTabs, setBundleSlotTabs] = useState({});
  const [bundleSchedule, setBundleSchedule] = useState(null);
  const [bundleScheduleLoading, setBundleScheduleLoading] = useState(false);

  const bundleProduct = voucherdetail?.products?.find(
    (product) =>
      product?.item_type === "bundle" &&
      Array.isArray(product?.bundle_components),
  );
  const bundleComponents = Array.isArray(bundleSchedule?.components)
    ? bundleSchedule.components
    : bundleProduct?.bundle_components || [];
  const isBundleVoucher = bundleComponents.length > 0;
  const bundleSelectionComplete =
    isBundleVoucher && selectedBundleSlots.length === bundleComponents.length;

  const products = voucherdetail?.products || [];
  const services = products.filter((product) => product.service_id);
  const extras = products.filter(
    (product) => product.id && !product.service_id,
  );
  const slots = voucherdetail?.slots || [];
  const isContinueDisabled =
    !date || (isBundleVoucher ? !bundleSelectionComplete : !selectedSlot);

  const slotset = (slot) => {
    setSelectedSlot(slot);
    dispatch(setSlot(slot));
  };

  useEffect(() => {
    if (step == "datestep") {
      fetchVoucher();
    }
  }, [step, date]);

  const fetchVoucher = async () => {
    dispatch(setLoading(true));
    const { data } = await axiosInstance(`/voucher-detail`, {
      method: "post",
      data: { voucher: voucher, date: moment(date).format("YYYY-MM-DD") },
    });
    if (data && data.status == 200 && data?.data?.status == true) {
      setVoucherdetail(data.data);
      setSelectedSlot(null);
      setSelectedBundleSlots([]);
      setExpandedBundleIndex(0);
      setBundleSlotTabs({});
      setBundleSchedule(null);
      dispatch(setSlot(null));
      dispatch(setRedeemBundleSlots([]));
      dispatch(setVoucherDetail(data.data));
      dispatch(setDate(data.data.date));
    }
    dispatch(setLoading(false));
  };

  const getslot = () => {
    dispatch(setLoading(true));
    if (!date) {
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        icon: "warning",
        title: "Please select a date",
      });
      dispatch(setLoading(false));
      return;
    }

    if (isBundleVoucher ? !bundleSelectionComplete : !selectedSlot) {
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        icon: "warning",
        title: isBundleVoucher
          ? "Please select a slot for every bundle component"
          : "Please select a slot",
      });
      dispatch(setLoading(false));
      return;
    }
    dispatch(setRedeemBooking(false));
    dispatch(setRedeemStep("checkoutstep"));
    dispatch(setLoading(false));
  };

  const bookNewServices = () => {
    if (isContinueDisabled) return;

    dispatch(
      setTimeslot(
        isBundleVoucher
          ? selectedBundleSlots[0]?.slot_label || null
          : selectedSlot,
      ),
    );
    dispatch(setStep("servicesstep"));
    dispatch(setRedeemBooking(true));
  };

  const getBundleSlotMinutes = (slotItem) => {
    if (Number.isFinite(Number(slotItem?.start_minutes))) {
      return Number(slotItem.start_minutes);
    }
    const [hours, minutes] = String(slotItem?.from || "0:0")
      .split(":")
      .map(Number);
    return hours * 60 + minutes;
  };

  const getBundleSlotsByTab = (component, tab) => {
    const slotSource = component?.available_slots;
    if (slotSource && !Array.isArray(slotSource)) {
      if (Array.isArray(slotSource[tab])) return slotSource[tab];
      if (tab === "all") {
        return Object.values(slotSource)
          .filter(Array.isArray)
          .flat()
          .filter(
            (slotItem, index, slots) =>
              slots.findIndex(
                (candidate) =>
                  (candidate?.slot_key || candidate?.slot_label) ===
                  (slotItem?.slot_key || slotItem?.slot_label),
              ) === index,
          );
      }
    }

    const availableSlots = Array.isArray(slotSource) ? slotSource : [];
    if (tab === "all") return availableSlots;

    return availableSlots.filter((slotItem) => {
      const startMinutes = getBundleSlotMinutes(slotItem);
      return tab === "morning" ? startMinutes < 720 : startMinutes >= 720;
    });
  };

  const getDefaultBundleTab = (component) =>
    getBundleSlotsByTab(component, "morning").length > 0
      ? "morning"
      : getBundleSlotsByTab(component, "afternoon").length > 0
        ? "afternoon"
        : "all";

  const getBundleScheduleFromResponse = (responseData) => {
    const candidates = [
      responseData?.bundle_slots,
      responseData?.data?.bundle_slots,
      responseData?.bundle_time_slots,
      responseData?.data?.bundle_time_slots,
      responseData?.slots?.bundle_time_slots,
      responseData?.data?.slots?.bundle_time_slots,
      responseData?.data,
      responseData,
    ];

    return (
      candidates.find(
        (candidate) => candidate && Array.isArray(candidate.components),
      ) || null
    );
  };

  const selectBundleSlot = async (component, componentIndex, slotItem) => {
    if (componentIndex > selectedBundleSlots.length || bundleScheduleLoading) {
      return;
    }

    const slotLabel = slotItem?.label || slotItem?.slot_label || "";
    const selectedComponentSlot = {
      bundle_id: component?.bundle_id,
      bundle_item_id: component?.bundle_item_id,
      service_id: component?.component_service_id ?? component?.service_id,
      component_position:
        Number(component?.component_position) || componentIndex + 1,
      slot_key: slotItem?.slot_key,
      slot_label: slotLabel,
      from: slotItem?.from,
      to: slotItem?.to,
    };
    const nextSelections = [
      ...selectedBundleSlots.slice(0, componentIndex),
      selectedComponentSlot,
    ];

    setBundleScheduleLoading(true);
    dispatch(setLoading(true));
    try {
      const { data: responseData } = await axiosInstance.post(
        "/bundle-component-schedule",
        {
          service_id: bundleProduct?.service_id,
          bundle_id:
            component?.bundle_id ??
            bundleProduct?.bundle_components?.[0]?.bundle_id,
          date: moment(date).format("YYYY-MM-DD"),
          total_service_booking: Number(bundleProduct?.quantity) || 1,
          time_slot: slotLabel,
          selected_component_slots: nextSelections,
        },
      );
      const nextSchedule = getBundleScheduleFromResponse(responseData);
      if (!nextSchedule) {
        throw new Error(
          responseData?.message || "Unable to load the next bundle component",
        );
      }

      const responseSelections =
        Array.isArray(nextSchedule.selected_component_slots) &&
        nextSchedule.selected_component_slots.length > 0
          ? nextSchedule.selected_component_slots
          : nextSelections;
      const nextComponents = nextSchedule.components.map((nextComponent) => {
        const previousComponent = bundleComponents.find(
          (currentComponent) =>
            Number(currentComponent?.component_position) ===
            Number(nextComponent?.component_position),
        );
        return nextComponent?.state === "selected" && previousComponent
          ? {
              ...nextComponent,
              available_slots: previousComponent.available_slots,
            }
          : nextComponent;
      });

      setBundleSchedule({ ...nextSchedule, components: nextComponents });
      setSelectedBundleSlots(responseSelections);
      dispatch(setRedeemBundleSlots(responseSelections));
      dispatch(setSlot(responseSelections[0]?.slot_label || null));
      setExpandedBundleIndex(
        responseSelections.length < nextComponents.length
          ? responseSelections.length
          : -1,
      );
    } catch (error) {
      Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        icon: "error",
        title:
          error?.response?.data?.message ||
          error?.message ||
          "Unable to load the next bundle component",
      });
    } finally {
      setBundleScheduleLoading(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <div
      className="fx-tabcontent fx-gift-date-box"
      style={{ display: step === "datestep" ? "block" : "none" }}
    >
      <div className="redemption-Voucher-services-box">
        <div className="fx-booking-container">
          <div className="fx-content-body">
            <div className="fx-redeem-slot-heading">
              <h1>Select date & time</h1>
              <p>Choose when you’d like to use this voucher.</p>
            </div>

            {services.length > 0 && (
              <section className="fx-section-group">
                <h2 className="fx-section-title">
                  {services.length === 1
                    ? "Included service"
                    : "Included services"}
                </h2>
                {services.map((product, index) => (
                  <RedeemItemCard
                    key={product.service_id || index}
                    product={product}
                    description={product.service_desc}
                  />
                ))}
              </section>
            )}

            {extras.length > 0 && (
              <section className="fx-section-group">
                <h2 className="fx-section-title">
                  {extras.length === 1 ? "Extra" : "Extras"}
                </h2>
                {extras.map((product, index) => (
                  <RedeemItemCard
                    key={product.id || index}
                    product={product}
                    description={product.service_desc}
                  />
                ))}
              </section>
            )}

            <section className="fx-scheduling-panel">
              <div className="fx-date-picker-group">
                <label className="fx-label" htmlFor="redeem-slot-date">
                  Date
                </label>
                <div className="fx-input-with-icon">
                  <Calendar
                    inputId="redeem-slot-date"
                    value={
                      moment(voucherdetail?.date).isValid()
                        ? moment(voucherdetail?.date).toDate()
                        : null
                    }
                    onChange={(e) => {
                      setSelectedSlot(null);
                      setSelectedBundleSlots([]);
                      setExpandedBundleIndex(0);
                      setBundleSchedule(null);
                      dispatch(setSlot(null));
                      dispatch(setRedeemBundleSlots([]));
                      dispatch(setDate(e.value));
                    }}
                    className="fx-datepicker"
                    minDate={new Date()}
                    ref={calendarRef}
                    onClick={() => {
                      calendarRef.current?.show();
                    }}
                    locale="en-monday"
                    dateFormat="dd/mm/yy"
                  />
                  <span className="fx-icon" aria-hidden="true">
                    <CalendarDays size={18} />
                  </span>
                </div>
              </div>

              {!isBundleVoucher && voucherdetail?.slots?.length > 0 && (
                <p class="fx-availability-note">
                  Available times for{" "}
                  <strong>
                    {moment(voucherdetail?.date).format("dddd, MMM DD")}
                  </strong>
                </p>
              )}

              {!isBundleVoucher && (
                <div class="fx-time-selector-grid">
                  {voucherdetail?.slots?.length == 0 && (
                    <div>No slots available for the selected date.</div>
                  )}
                  {voucherdetail?.slots?.map((slot, index) => (
                    <div
                      key={index}
                      className={
                        slot == selectedSlot
                          ? "fx-time-btn fx-selected"
                          : "fx-time-btn"
                      }
                      onClick={() => slotset(slot)}
                    >
                      {slot.split(" - ")[0]} - {slot.split(" - ")[1]}
                    </div>
                  ))}
                </div>
              )}

              {isBundleVoucher && (
                <div className="fx-slot-bundle-modal-box fx-redeem-bundle-slots">
                  <div className="fx-booking-modal-header">
                    <div className="fx-bundle-modal-heading">
                      <h2 className="fx-booking-modal-title">Bundle slots</h2>
                      <p>Pick slots for each package component in order.</p>
                    </div>
                    <span className="fx-bundle-progress">
                      {selectedBundleSlots.length} of {bundleComponents.length}{" "}
                      selected
                    </span>
                  </div>

                  <div className="fx-booking-modal-content">
                    <div className="fx-service-slots-details">
                      {bundleComponents.map((component, componentIndex) => {
                        const position =
                          Number(component?.component_position) ||
                          componentIndex + 1;
                        const selectedComponentSlot =
                          selectedBundleSlots[componentIndex];
                        const isWaiting =
                          componentIndex > selectedBundleSlots.length;
                        const isSelected = Boolean(selectedComponentSlot);
                        const isExpanded =
                          !isWaiting && expandedBundleIndex === componentIndex;
                        const activeTab =
                          bundleSlotTabs[position] ||
                          getDefaultBundleTab(component);
                        const componentSlots = getBundleSlotsByTab(
                          component,
                          activeTab,
                        );
                        const voucherComponent =
                          bundleProduct?.bundle_components?.find(
                            (voucherBundleComponent) =>
                              Number(
                                voucherBundleComponent?.component_position,
                              ) === position,
                          );
                        const componentQuantity =
                          Number(voucherComponent?.quantity_consumed) ||
                          (Number(
                            voucherComponent?.component_quantity_per_bundle ??
                              voucherComponent?.quantity ??
                              component?.component_quantity_per_bundle ??
                              component?.quantity,
                          ) || 1) * (Number(bundleProduct?.quantity) || 1) ||
                          1;

                        return (
                          <div
                            className={`fx-massage-card${isExpanded ? " fx-expanded" : ""}${isWaiting ? " fx-waiting" : ""}${isSelected ? " fx-component-selected" : ""}`}
                            key={component?.bundle_item_id || componentIndex}
                          >
                            <div
                              className="fx-massage-card-header"
                              onClick={() => {
                                if (!isWaiting) {
                                  setExpandedBundleIndex(
                                    isExpanded ? -1 : componentIndex,
                                  );
                                }
                              }}
                            >
                              <div className="fx-massage-card-info">
                                <div className="fx-component-label-row">
                                  <span>Component {position}</span>
                                  <span
                                    className={`fx-component-status fx-status-${isSelected ? "selected" : isWaiting ? "waiting" : "active"}`}
                                  >
                                   {" "}
                                    {isSelected
                                      ? "Selected"
                                      : isWaiting
                                        ? "Waiting"
                                        : "Choose now"}
                                  </span>
                                </div>
                                <h3 className="fx-massage-title">
                                  {component?.service_name}
                                </h3>
                                <p className="fx-massage-description">
                                  Quantity: {componentQuantity}
                                </p>
                              </div>
                              {!isWaiting && (
                                <span className="fx-massage-accordion-icon"></span>
                              )}
                            </div>

                            {isWaiting && (
                              <p className="fx-component-waiting-message">
                                Choose slot after completing Component{" "}
                                {componentIndex}
                              </p>
                            )}

                            {isExpanded && (
                              <div className="fx-massage-card-content">
                                <div className="fx-bundle-slot-tabs">
                                  {[
                                    ["morning", "Morning"],
                                    ["afternoon", "Afternoon"],
                                    ["all", "All day"],
                                  ].map(([tabKey, tabLabel]) => (
                                    <button
                                      className={
                                        activeTab === tabKey ? "fx-active" : ""
                                      }
                                      key={tabKey}
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setBundleSlotTabs((previousTabs) => ({
                                          ...previousTabs,
                                          [position]: tabKey,
                                        }));
                                      }}
                                    >
                                      {tabLabel}
                                    </button>
                                  ))}
                                </div>

                                {componentSlots.length > 0 ? (
                                  <div className="fx-time-slots">
                                    {componentSlots.map(
                                      (slotItem, slotIndex) => {
                                        const selectedSlotKey =
                                          selectedComponentSlot?.slot_key;
                                        const availableSlotKey =
                                          slotItem?.slot_key;
                                        const availableSlotLabel =
                                          slotItem?.label ||
                                          slotItem?.slot_label;
                                        const isSlotSelected = Boolean(
                                          (selectedSlotKey != null &&
                                            availableSlotKey != null &&
                                            String(selectedSlotKey) ===
                                              String(availableSlotKey)) ||
                                          (selectedComponentSlot?.slot_label &&
                                            selectedComponentSlot.slot_label ===
                                              availableSlotLabel),
                                        );
                                        return (
                                          <button
                                            className={`fx-time-slot${isSlotSelected ? " fx-selected" : ""}`}
                                            disabled={bundleScheduleLoading}
                                            key={`${slotItem?.slot_key || slotItem?.label}-${slotIndex}`}
                                            type="button"
                                            onClick={() =>
                                              selectBundleSlot(
                                                component,
                                                componentIndex,
                                                slotItem,
                                              )
                                            }
                                          >
                                            <span className="fx-slot-time">
                                              {isSlotSelected && (
                                                <i
                                                  className="pi pi-check"
                                                  aria-hidden="true"
                                                ></i>
                                              )}
                                              <span>
                                                {slotItem?.label ||
                                                  slotItem?.slot_label}
                                              </span>
                                            </span>
                                            <small>
                                              {slotItem?.capacity_left} left
                                            </small>
                                          </button>
                                        );
                                      },
                                    )}
                                  </div>
                                ) : (
                                  <p className="fx-no-bundle-slots">
                                    No {activeTab} slots available
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p
                      className={`fx-bundle-selection-message${bundleSelectionComplete ? " fx-complete" : ""}`}
                    >
                      {bundleSelectionComplete
                        ? "All component slots are selected."
                        : "Choose every bundle component slot."}
                    </p>
                  </div>
                </div>
              )}
            </section>

            <div className="fx-footer-actions">
              <button
                type="button"
                className="fx-btn-back"
                onClick={() => dispatch(setRedeemStep("codestep"))}
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Back
              </button>
              <div className="fx-footer-primary-actions">
                <button
                  type="button"
                  className={`fx-btn-secondary ${isContinueDisabled ? "fx-btn-disable" : ""}`}
                  onClick={bookNewServices}
                  disabled={isContinueDisabled}
                >
                  Add more services
                </button>
                <button
                  type="button"
                  className={`btn-primary btn-primary-countinu ${isContinueDisabled ? "fx-btn-disable" : ""}`}
                  onClick={() => {
                    if (!isContinueDisabled) {
                      getslot();
                    }
                  }}
                  disabled={isContinueDisabled}
                >
                  Continue to checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
