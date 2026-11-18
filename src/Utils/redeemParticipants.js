import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "./Interceptor";
import { normalizeParticipantGroups, getParticipantSelection } from "./participants";
import { setRedeemParticipants } from "../store/step3Slice";

export const getRedemptionParty = (component, counts) => {
  const quantity = Number(component.quantity) || 1;
  const config = {
    ...component.config,
    quantity_rules: { minimum_quantity: quantity, maximum_quantity: quantity, allowed_quantities: [quantity] },
  };
  return getParticipantSelection(config, normalizeParticipantGroups(config), counts || {}, quantity);
};

export const defaultRedemptionCounts = (component) => {
  const groups = normalizeParticipantGroups(component.config);
  const counts = {};
  for (const guest of component.guests || []) {
    const group = groups.find((item) => guest.band_key ? item.bandKey === guest.band_key : item.category === guest.ticket_type);
    if (group) counts[group.key] = (counts[group.key] || 0) + 1;
  }
  if (!Object.keys(counts).length && !component.fixed) {
    const adult = groups.find((group) => group.category === "adult" && !group.disabled);
    if (adult) counts[adult.key] = Number(component.quantity) || 1;
  }
  return counts;
};

const preflight = async (post, signal) => {
  const base = axiosInstance.defaults.baseURL;
  const url = base.replace(/\/booking\/v1\/?$/, "/bm-vouchers/v1/preflight");
  const { data } = await axiosInstance.post(url, {
    action: "preflight_voucher_redemption", post,
  }, { signal, bookingNonceBody: true });
  if (!data?.success || !data?.data?.valid) {
    throw new Error(data?.data?.message || data?.message || "This schedule is no longer available.");
  }
  return data.data;
};

export function useRedeemParticipants(request) {
  const dispatch = useDispatch();
  const saved = useSelector((state) => state.step3.redeemParticipants);
  const savedRef = useRef(saved);
  savedRef.current = saved;
  const requestKey = request ? JSON.stringify(request) : "";
  const [state, setState] = useState({ key: "", components: [], counts: {}, loading: false, error: "" });
  const [retry, setRetry] = useState(0);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!requestKey) return;
    const controller = new AbortController();
    let active = true;
    setState({ key: requestKey, components: [], counts: {}, loading: true, error: "" });
    preflight(JSON.parse(requestKey), controller.signal).then((data) => {
      if (!active) return;
      const components = data.participant_components || [];
      const counts = Object.fromEntries(components.map((component) => [component.key,
        !component.fixed && savedRef.current?.key === requestKey && savedRef.current?.counts?.[component.key]
          ? savedRef.current.counts[component.key] : defaultRedemptionCounts(component),
      ]));
      setState({ key: requestKey, components, counts, loading: false, error: "" });
    }).catch((error) => {
      if (active) setState({ key: requestKey, components: [], counts: {}, loading: false,
        error: error?.data?.data?.message || error?.data?.message || error.message || "Unable to load participants." });
    });
    return () => { active = false; controller.abort(); };
  }, [requestKey, retry]);

  const ready = Boolean(requestKey) && state.key === requestKey && !state.loading && !state.error;
  const valid = ready && state.components.every((component) => getRedemptionParty(component, state.counts[component.key]).valid);
  const guests = Object.fromEntries(state.components.map((component) => [component.key,
    getRedemptionParty(component, state.counts[component.key]).guests,
  ]));
  const guestsKey = JSON.stringify(guests);

  useEffect(() => {
    if (!ready) return;
    const schedule = JSON.parse(requestKey);
    dispatch(setRedeemParticipants({ key: requestKey, counts: state.counts,
      slot_selection: { ...schedule.slot_selection, capacity_component_guests: JSON.parse(guestsKey) },
      capacity_component_guests: JSON.parse(guestsKey),
    }));
  }, [ready, requestKey, state.counts, guestsKey, dispatch]);

  const change = (component, group, delta) => {
    if (checking || component.fixed || group.disabled) return;
    setState((previous) => {
      const current = previous.counts[component.key] || {};
      const next = Math.max(0, (Number(current[group.key]) || 0) + delta);
      const counts = { ...current, [group.key]: next };
      const total = Object.values(counts).reduce((sum, value) => sum + Number(value), 0);
      if (total > Number(component.quantity)) return previous;
      return { ...previous, counts: { ...previous.counts, [component.key]: counts } };
    });
  };

  const validate = async () => {
    if (!valid || checking) return false;
    setChecking(true);
    try {
      await preflight({ ...JSON.parse(requestKey), capacity_component_guests: guests });
      return true;
    } catch (error) {
      setState((previous) => ({ ...previous, error: error?.data?.data?.message || error?.data?.message || error.message || "Unable to verify availability." }));
      return false;
    } finally { setChecking(false); }
  };

  return { ...state, visible: Boolean(requestKey), valid, checking, change, validate, retry: () => setRetry((value) => value + 1) };
}
