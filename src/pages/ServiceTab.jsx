import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axiosInstance from "../Utils/Interceptor";
import moment from "moment";
import { setDate, setGift, setLoading } from "../store/step1Slice";
import { setService } from "../store/step2Slice";
import { decodeHtml } from "../Utils/Functions";
import Service from "./Service";

export default function ServiceTab(props) {
  const dispatch = useDispatch();
  const step = useSelector((state) => state.step1.step);
  const [serviceDetails, setServiceDetails] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [popupRequest, setPopupRequest] = useState(0);
  const serviceid = String(props.service_id ?? "").trim();

  useEffect(() => {
    if (!serviceid) {
      setServiceDetails(null);
      setErrorMessage("A service ID is required to load this service.");
      return;
    }

    let active = true;
    dispatch(setLoading(true));
    setErrorMessage("");
    const getServiceDetails = (requestDate) =>
      axiosInstance.get(
        `/service-details?date=${requestDate}&service_id=${encodeURIComponent(serviceid)}&all=false&is_bundle=false&bundle_id=0`,
      );

    (async () => {
      try {
        let requestDate = moment().format("YYYY-MM-DD");
        let response = await getServiceDetails(requestDate);
        const todayHasNoService =
          !response?.data?.data ||
          (Array.isArray(response.data.data) && response.data.data.length === 0);

        if (todayHasNoService) {
          requestDate = moment().add(1, "day").format("YYYY-MM-DD");
          response = await getServiceDetails(requestDate);
        }

        const data = response?.data;
        if (!active) return;
        if (data?.status != 200 || !data?.data || data.data.length === 0) {
          setServiceDetails(null);
          setErrorMessage(data?.message || "Unable to load service details.");
          return;
        }

        const details = data.data;
        const dateSlots = Array.isArray(details.date_slots)
          ? details.date_slots
          : [];
        const requestDateIsAvailable = dateSlots.some(
          (slotItem) =>
            moment(slotItem?.date).format("YYYY-MM-DD") === requestDate,
        );
        const bookingDate = requestDateIsAvailable
          ? requestDate
          : dateSlots[0]?.date || requestDate;

        setServiceDetails(details);
        dispatch(setService(details.id || serviceid));
        dispatch(setDate(bookingDate));
      } catch (error) {
        if (!active) return;
        setServiceDetails(null);
        setErrorMessage(
          error?.response?.data?.message || "Unable to load service details.",
        );
      } finally {
        if (active) dispatch(setLoading(false));
      }
    })();

    return () => {
      active = false;
    };
  }, [dispatch, serviceid]);

  const openServicePopup = (isGift) => {
    if (!serviceDetails) return;
    dispatch(setService(serviceDetails.id || serviceid));
    dispatch(setGift(isGift));
    setPopupRequest((request) => request + 1);
  };

  const title = serviceDetails?.service_title || serviceDetails?.service_name;
  const description =
    serviceDetails?.svc_long_desc || serviceDetails?.svc_short_desc;
  const duration = serviceDetails?.duration;

  return (
    <>
      <div
        className="fx-single-service-page"
        style={{ display: step === "servicesstep" ? "block" : "none" }}
      >
        <div className="fx-service-card">
          <div className="fx-service-card__media">
            {serviceDetails?.svc_img ? (
              <img
                className="fx-service-card__image"
                src={serviceDetails.svc_img}
                alt={title || "Service"}
              />
            ) : (
              <div className="fx-service-card__image-placeholder">
                <i className="pi pi-image" aria-hidden="true"></i>
              </div>
            )}

            <div className="fx-service-card__tags">
              {serviceDetails?.category_name && (
                <span className="fx-service-card__tag">
                  {decodeHtml(serviceDetails.category_name)}
                </span>
              )}
              {serviceDetails?.is_bundle && (
                <span className="fx-service-card__tag">Bundle</span>
              )}
            </div>

            {duration && duration !== "N/A" && (
              <span className="fx-service-card__duration">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="8.25"></circle>
                  <path d="M12 7.5v5l3.2 1.8"></path>
                </svg>
                <span>{decodeHtml(duration)}</span>
              </span>
            )}
          </div>

          <div className="fx-service-card__content">
            <div className="fx-service-card__eyebrow">
              {serviceDetails?.is_bundle ? "BUNDLE" : "SINGLE SERVICE"}
            </div>

            <h1
              className="fx-service-card__title"
              style={{ color: serviceDetails?.svc_name_colour || undefined }}
            >
              {title || (errorMessage ? "Service unavailable" : "Loading...")}
              <span
                className="fx-service-card__info"
                title={description ? decodeHtml(description) : "Service information"}
                aria-label="More information"
              >
                i
              </span>
            </h1>

            <p className="fx-service-card__description">
              {description ? decodeHtml(description) : errorMessage}
            </p>

            <p className="fx-service-card__price">
              <span>Total</span>
              <strong>
                {serviceDetails?.svc_price
                  ? decodeHtml(serviceDetails.svc_price)
                  : "-"}
              </strong>
            </p>

            <div className="fx-service-card__actions">
              <button
                className="fx-service-card__button fx-service-card__button--gift"
                type="button"
                disabled={!serviceDetails}
                onClick={() => openServicePopup(true)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3.5" y="9" width="17" height="11.5" rx="1.5"></rect>
                  <path d="M2.8 6h18.4v3H2.8zM12 6v14.5M12 6H8.8a2.2 2.2 0 1 1 2.2-2.2V6Zm0 0h3.2a2.2 2.2 0 1 0-2.2-2.2V6Z"></path>
                </svg>
                Buy as Gift
              </button>

              <button
                className="fx-service-card__button fx-service-card__button--book"
                type="button"
                disabled={!serviceDetails}
                onClick={() => openServicePopup(false)}
              >
                Book Now
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      <Service
        {...props}
        popupOnly
        requestedServiceId={props.service_id}
        openRequest={popupRequest}
      />
    </>
  );
}
