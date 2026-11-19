import { useEffect, useRef, useState } from "react";
import axiosInstance from "./Interceptor";
import {
  getParticipantSelection,
  normalizeParticipantGroups,
} from "./participants";
import { defaultRedemptionCounts } from "./redeemParticipants";

// The component-participants contract lives in the capacity namespace, not booking/v1.
const componentParticipantsUrl = (serviceId) =>
  `${String(axiosInstance.defaults.baseURL || "").replace(/\/booking\/v1\/?$/, "/bm-capacity/v1")}/services/${serviceId}/component-participants`;

const errorMessage = (error, fallback) =>
  error?.data?.message ||
  error?.response?.data?.message ||
  error?.message ||
  fallback;

const sumCounts = (counts) =>
  Object.values(counts || {}).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0,
  );

/** Visitor limits for one component: fixed (min = max) or a range when the server allows it. */
export const getComponentLimits = (component) => {
  const quantity = Number(component?.quantity) || 1;
  const minimum = Math.max(
    1,
    Number(component?.minimum_quantity ?? quantity) || quantity,
  );
  const maximum = Math.max(
    minimum,
    Number(component?.maximum_quantity ?? quantity) || minimum,
  );
  return { minimum, maximum, fixed: minimum === maximum };
};

export const getComponentParty = (component, counts) => {
  const { minimum, maximum, fixed } = getComponentLimits(component);
  const config = {
    ...component.config,
    quantity_rules: {
      minimum_quantity: minimum,
      maximum_quantity: maximum,
      allowed_quantities: fixed ? [minimum] : null,
    },
  };
  return getParticipantSelection(
    config,
    normalizeParticipantGroups(config),
    counts || {},
    maximum,
  );
};

/**
 * Builds the request body expected by POST bm-capacity/v1/services/{id}/component-participants.
 * Returns null until every bundle component has a slot.
 */
export const buildBundleParticipantsRequest = ({
  serviceId,
  bundleId,
  date,
  quantity,
  componentSlots,
  lineKey,
}) => {
  if (
    !serviceId ||
    !(bundleId > 0) ||
    !Array.isArray(componentSlots) ||
    componentSlots.length === 0
  )
    return null;
  const ordered = [...componentSlots].sort(
    (a, b) => Number(a?.component_position) - Number(b?.component_position),
  );
  const firstSlot = ordered[0]?.slot_label || "";
  return {
    serviceId,
    body: {
      date,
      id: String(serviceId),
      selected_bundle_id: bundleId,
      selected_virtual_service_id: 0,
      total_service_booking: quantity,
      selected_component_slots: JSON.stringify(ordered),
      capacity_line_key: lineKey,
      capacity_extra_times: {},
      time_slot: firstSlot,
      slots: firstSlot,
    },
  };
};

/**
 * Request body for a virtual service: its included services are the components,
 * all starting at the chosen slot. total_service_booking is the booked quantity.
 */
export const buildVirtualParticipantsRequest = ({
  serviceId,
  virtualServiceId,
  date,
  quantity,
  timeSlot,
  lineKey,
}) => {
  if (!serviceId || !(virtualServiceId > 0) || !timeSlot || !(quantity > 0))
    return null;
  return {
    serviceId,
    body: {
      date,
      id: String(serviceId),
      time_slot: timeSlot,
      selected_bundle_id: 0,
      selected_virtual_service_id: virtualServiceId,
      total_service_booking: quantity,
      capacity_line_key: lineKey,
      capacity_extra_times: {},
      selected_component_slots: "[]",
    },
  };
};

/**
 * Loads the participant configuration for each bundle component (or one shared
 * configuration when every component has the same rules) and tracks the chosen
 * party per component. Each component's visitor count is fixed by the server.
 */
export function useComponentParticipants(request) {
  const requestKey = request ? JSON.stringify(request) : "";
  const [state, setState] = useState({
    key: "",
    components: [],
    shared: false,
    guidance: "",
    counts: {},
    loading: false,
    error: "",
  });
  const [retry, setRetry] = useState(0);
  const [checking, setChecking] = useState(false);
  const countsRef = useRef({});
  countsRef.current = state.counts;

  useEffect(() => {
    if (!requestKey) return;
    const { serviceId, body } = JSON.parse(requestKey);
    const controller = new AbortController();
    let active = true;
    setState((previous) => ({
      ...previous,
      key: requestKey,
      loading: true,
      error: "",
    }));
    axiosInstance
      .post(componentParticipantsUrl(serviceId), body, {
        signal: controller.signal,
      })
      .then(({ data }) => {
        if (!active) return;
        const components = Array.isArray(data?.components)
          ? data.components
          : [];
        const counts = Object.fromEntries(
          components.map((component) => {
            // Keep the visitor mix the user already chose when the required count is unchanged.
            const previous = countsRef.current[component.key];
            const { minimum, maximum } = getComponentLimits(component);
            const keep =
              previous &&
              sumCounts(previous) >= minimum &&
              sumCounts(previous) <= maximum;
            return [
              component.key,
              keep ? previous : defaultRedemptionCounts(component),
            ];
          }),
        );
        setState({
          key: requestKey,
          components,
          shared: Boolean(data?.shared_party) && components.length > 1,
          guidance: data?.participant_guidance || "",
          counts,
          loading: false,
          error: "",
        });
      })
      .catch((error) => {
        if (!active || controller.signal.aborted) return;
        setState((previous) => ({
          ...previous,
          key: requestKey,
          components: [],
          loading: false,
          error: errorMessage(error, "Unable to load participant options."),
        }));
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [requestKey, retry]);

  const ready =
    Boolean(requestKey) &&
    state.key === requestKey &&
    !state.loading &&
    !state.error;
  const parties = Object.fromEntries(
    state.components.map((component) => [
      component.key,
      getComponentParty(component, state.counts[component.key]),
    ]),
  );
  const valid =
    ready &&
    state.components.every((component) => parties[component.key].valid);
  const guests = Object.fromEntries(
    state.components.map((component) => [
      component.key,
      parties[component.key].guests,
    ]),
  );

  // "+" fills a free place; once the maximum is reached it moves one visitor
  // from the largest other group, so fixed totals never change.
  const change = (componentKeys, group, delta) => {
    if (checking || group.disabled) return;
    setState((previous) => {
      const nextCounts = { ...previous.counts };
      for (const key of componentKeys) {
        const component = previous.components.find((item) => item.key === key);
        if (!component) continue;
        const required = getComponentLimits(component).maximum;
        const current = { ...(previous.counts[key] || {}) };
        const value = Number(current[group.key]) || 0;
        if (delta < 0) {
          if (value <= 0) continue;
          current[group.key] = value - 1;
        } else if (sumCounts(current) < required) {
          current[group.key] = value + 1;
        } else {
          const donor = normalizeParticipantGroups(component.config)
            .filter(
              (item) =>
                item.key !== group.key && (Number(current[item.key]) || 0) > 0,
            )
            .sort(
              (a, b) =>
                (Number(current[b.key]) || 0) - (Number(current[a.key]) || 0),
            )[0];
          if (!donor) continue;
          current[donor.key] -= 1;
          current[group.key] = value + 1;
        }
        nextCounts[key] = current;
      }
      return { ...previous, counts: nextCounts };
    });
  };

  // Server-side check of the chosen parties against live capacity before continuing.
  const validate = async () => {
    if (!state.components.length) return true;
    if (!valid || checking) return false;
    const { serviceId, body } = JSON.parse(requestKey);
    setChecking(true);
    try {
      await axiosInstance.post(componentParticipantsUrl(serviceId), {
        ...body,
        capacity_component_guests: guests,
      });
      return true;
    } catch (error) {
      setState((previous) => ({
        ...previous,
        error: errorMessage(
          error,
          "Unable to verify availability for these participants.",
        ),
      }));
      return false;
    } finally {
      setChecking(false);
    }
  };

  return {
    ...state,
    visible: Boolean(requestKey),
    ready,
    required: state.components.length > 0,
    valid,
    parties,
    guests,
    checking,
    change,
    validate,
    retry: () => setRetry((value) => value + 1),
  };
}

// Bundles and virtual services share the same component-participants contract.
export const useBundleParticipants = useComponentParticipants;
