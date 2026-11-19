import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { ArrowLeft, ArrowRight, Minus, Plus } from "lucide-react";
import { setRedeemStep } from "../store/step1Slice";
import {
  setRedeemUpsellQuote,
  setRedeemUpsellSelections,
} from "../store/step3Slice";
import axiosInstance from "../Utils/Interceptor";
import { formatSelectedComponentSlots } from "../Utils/Functions";
import ServiceCard from "../components/ServiceCard";
import RedeemSelectedServices from "../components/RedeemSelectedServices";
import { choiceKey, getSelectedChoice } from "../Utils/redeemUpsells";
import "../styles/redeem-upsell-services.scss";

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.data?.message ||
  error?.message ||
  "Unable to load additions for this schedule.";

export default function RedeemUpsellServices() {
  const dispatch = useDispatch();
  const step = useSelector((state) => state.step1.redeemstep);
  const voucher = useSelector((state) => state.step1.voucher);
  const date = useSelector((state) => state.step1.date);
  const slot = useSelector((state) => state.step3.slot);
  const bundleSlots = useSelector((state) => state.step3.redeemBundleSlots);

  const [recommendations, setRecommendations] = useState([]);
  const [maxProducts, setMaxProducts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [quantities, setQuantities] = useState({});
  const [slots, setSlots] = useState({});
  const [popupVisible, setPopupVisible] = useState(false);

  const isActive = step === "upsellstep";
  const bookingDate = date ? moment(date).format("YYYY-MM-DD") : "";
  const bundleSlotsKey = JSON.stringify(bundleSlots || []);

  useEffect(() => {
    if (!isActive || !voucher || !bookingDate || !slot) return;
    const controller = new AbortController();
    const componentSlots = JSON.parse(bundleSlotsKey);

    setLoading(true);
    setError("");
    setQuantities({});
    setSlots({});
    setPopupVisible(false);
    axiosInstance
      .post(
        "/redemption-upsells",
        {
          voucher,
          date: bookingDate,
          slot,
          ...(componentSlots.length > 0
            ? {
                selected_component_slots:
                  formatSelectedComponentSlots(componentSlots),
              }
            : {}),
        },
        { signal: controller.signal },
      )
      .then(({ data }) => {
        if (data?.status != 200) throw new Error(data?.message);
        const items = Array.isArray(data?.data?.recommendations)
          ? [...data.data.recommendations].sort(
              (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
            )
          : [];
        setRecommendations(items);
        setMaxProducts(Number(data?.data?.max_products) || items.length);
      })
      .catch((requestError) => {
        if (controller.signal.aborted) return;
        setRecommendations([]);
        setMaxProducts(0);
        setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [isActive, voucher, bookingDate, slot, bundleSlotsKey, retry]);

  if (!isActive) return null;

  const allowedFor = (item) => {
    const allowed = (item.allowed_quantities || [])
      .map(Number)
      .filter((value) => value > 0)
      .sort((a, b) => a - b);
    return allowed.length ? allowed : [Number(item.quantity_min) || 1];
  };

  const selectedItems = recommendations.filter(
    (item) => quantities[item.recommendation_key] > 0,
  );
  const limitReached = maxProducts > 0 && selectedItems.length >= maxProducts;

  // Quantities step through the server's allowed values; going below the minimum removes the item.
  const stepQuantity = (item, direction) => {
    const allowed = allowedFor(item);
    const current = quantities[item.recommendation_key] || 0;
    let next;
    if (direction > 0) {
      if (!current && limitReached) return;
      next = current
        ? (allowed.find((value) => value > current) ?? current)
        : allowed[0];
    } else {
      next = [...allowed].reverse().find((value) => value < current) ?? 0;
    }
    setQuantities((previous) => ({
      ...previous,
      [item.recommendation_key]: next,
    }));
  };

  const toggleItem = (item) => {
    const selected = quantities[item.recommendation_key] > 0;
    if (!selected && limitReached) return;
    setQuantities((previous) => ({
      ...previous,
      [item.recommendation_key]: selected ? 0 : allowedFor(item)[0],
    }));
  };

  // Pre-select the slot when an addition has exactly one possible time.
  const openPopup = () => {
    setSlots((previous) => {
      const next = { ...previous };
      selectedItems.forEach((item) => {
        const choices = item.schedule_choices || [];
        if (!next[item.recommendation_key] && choices.length === 1)
          next[item.recommendation_key] = choiceKey(choices[0]);
      });
      return next;
    });
    setPopupVisible(true);
  };

  // A quantity the chosen slot cannot take clears that slot so the customer picks again.
  const changePopupQuantity = (item, quantity) => {
    setQuantities((previous) => ({
      ...previous,
      [item.recommendation_key]: quantity,
    }));
    const choice = getSelectedChoice(item, slots[item.recommendation_key]);
    if (
      choice?.allowed_quantities?.length &&
      !choice.allowed_quantities.map(Number).includes(quantity)
    ) {
      setSlots((previous) => ({
        ...previous,
        [item.recommendation_key]: null,
      }));
    }
  };

  const removeFromPopup = (item) => {
    setQuantities((previous) => ({
      ...previous,
      [item.recommendation_key]: 0,
    }));
    setSlots((previous) => ({ ...previous, [item.recommendation_key]: null }));
    if (selectedItems.length <= 1) setPopupVisible(false);
  };

  // Saved in the redemption-upsells quote API `selections` shape for the checkout step.
  const confirmSelections = (selections) => {
    dispatch(setRedeemUpsellSelections(selections));
    setPopupVisible(false);
    dispatch(setRedeemStep("checkoutstep"));
  };

  // Skipping redeems the gift on its own: no additions, so no payment step.
  const skipAdditions = () => {
    setPopupVisible(false);
    dispatch(setRedeemUpsellSelections([]));
    dispatch(setRedeemUpsellQuote(null));
    dispatch(setRedeemStep("checkoutstep"));
  };

  return (
    <section
      className="fx-redemption-upsells"
      aria-labelledby="fx-upsell-heading"
    >
      <header className="fx-redemption-upsells__heading">
        <div>
          <p className="fx-redemption-upsells__eyebrow">Optional additions</p>
          <h1 id="fx-upsell-heading">Make the appointment your own</h1>
          <p>
            Only additions available for your selected schedule are shown. You
            pay only for what you add.
          </p>
        </div>
        {maxProducts > 0 && (
          <span className="fx-redemption-upsells__count" aria-live="polite">
            {selectedItems.length > 0
              ? `${selectedItems.length} of ${maxProducts} selected`
              : `Choose up to ${maxProducts}`}
          </span>
        )}
      </header>

      {loading && (
        <p className="fx-redemption-upsells__status" role="status">
          Loading additions for your schedule…
        </p>
      )}

      {!loading && error && (
        <div
          className="fx-redemption-upsells__status fx-redemption-upsells__error"
          role="alert"
        >
          <p>{error}</p>
          <button
            type="button"
            className="fx-upsell-back"
            onClick={() => setRetry((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && recommendations.length === 0 && (
        <p className="fx-redemption-upsells__status" role="status">
          There are no additions available for your selected schedule.
        </p>
      )}

      {!loading && !error && recommendations.length > 0 && (
        <div className="fx-servicecontainer">
          {recommendations.map((item) => {
            const allowed = allowedFor(item);
            const quantity = quantities[item.recommendation_key] || 0;
            const selected = quantity > 0;
            const blocked = !selected && limitReached;
            const atMax = selected && quantity >= allowed[allowed.length - 1];
            return (
              <ServiceCard
                key={item.recommendation_key}
                product={{
                  id: item.recommendation_key,
                  service_name: item.name,
                  svc_img: item.image,
                  svc_short_desc: item.description,
                }}
                showCategory={false}
                className={`fx-servicebox fx-bundle-content${selected ? " fx-servicebox-selected" : ""}${blocked ? " fx-servicebox-blocked" : ""}`}
                onClick={() => toggleItem(item)}
                imageControl={
                  <input
                    className="fx-upsell-service-checkbox"
                    type="checkbox"
                    checked={selected}
                    disabled={blocked}
                    onClick={(event) => event.stopPropagation()}
                    onChange={() => toggleItem(item)}
                    aria-label={`Select ${item.name}`}
                  />
                }
              >
                <div className="fx-upsell-service-bottom">
                  <p className="price">
                    <span className="fx-price-one">{item.formatted_price}</span>
                  </p>
                  <div
                    className="fx-upsell-service__quantity"
                    role="group"
                    aria-label={`${item.name} quantity`}
                  >
                    <button
                      type="button"
                      disabled={!selected}
                      onClick={(event) => {
                        event.stopPropagation();
                        stepQuantity(item, -1);
                      }}
                      aria-label={`Decrease ${item.name} quantity`}
                    >
                      <Minus size={13} aria-hidden="true" />
                    </button>
                    <output
                      aria-live="polite"
                      aria-label={`${item.name} selected quantity`}
                    >
                      {quantity}
                    </output>
                    <button
                      type="button"
                      disabled={blocked || atMax}
                      onClick={(event) => {
                        event.stopPropagation();
                        stepQuantity(item, 1);
                      }}
                      aria-label={`Increase ${item.name} quantity`}
                    >
                      <Plus size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </ServiceCard>
            );
          })}
        </div>
      )}

      <footer className="fx-redemption-upsells__actions">
        <button
          type="button"
          className="fx-upsell-back"
          onClick={() => dispatch(setRedeemStep("datestep"))}
        >
          <ArrowLeft size={16} aria-hidden="true" /> Back
        </button>
        <div className="fx-redemption-upsells__continue">
          <button
            type="button"
            className="fx-upsell-skip"
            onClick={skipAdditions}
          >
            Skip
          </button>
          {!loading && !error && recommendations.length > 0 && (
            <button
              type="button"
              className="fx-upsell-continue"
              onClick={openPopup}
              disabled={selectedItems.length === 0}
            >
              Continue <ArrowRight size={17} aria-hidden="true" />
            </button>
          )}
        </div>
      </footer>

      <RedeemSelectedServices
        visible={popupVisible}
        items={selectedItems}
        quantities={quantities}
        slots={slots}
        onQuantity={changePopupQuantity}
        onSlot={(item, key) =>
          setSlots((previous) => ({
            ...previous,
            [item.recommendation_key]: key,
          }))
        }
        onRemove={removeFromPopup}
        onClose={() => setPopupVisible(false)}
        onContinue={confirmSelections}
      />
    </section>
  );
}
