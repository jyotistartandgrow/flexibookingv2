import { useEffect, useState } from "react";
import axiosInstance from "./Interceptor";

// The quote lives in the capacity namespace, not booking/v1.
const participantQuoteUrl = (serviceId) =>
  `${String(axiosInstance.defaults.baseURL || "").replace(/\/booking\/v1\/?$/, "/bm-capacity/v1")}/services/${serviceId}/participant-quote`;

/**
 * Live price for the chosen participants (group rates, age bands, …) from
 * POST bm-capacity/v1/services/{id}/participant-quote. Pass null to skip.
 * Requests are debounced and stale responses ignored.
 */
export function useParticipantQuote(request) {
  const requestKey = request ? JSON.stringify(request) : "";
  const [state, setState] = useState({
    key: "",
    quote: null,
    loading: false,
    error: "",
  });

  useEffect(() => {
    if (!requestKey) return undefined;
    const { serviceId, body } = JSON.parse(requestKey);
    const controller = new AbortController();
    setState((previous) => ({
      ...previous,
      key: requestKey,
      loading: true,
      error: "",
    }));
    const timer = setTimeout(() => {
      axiosInstance
        .post(participantQuoteUrl(serviceId), body, {
          signal: controller.signal,
        })
        .then(({ data }) => {
          setState({
            key: requestKey,
            quote: data || null,
            loading: false,
            error: "",
          });
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          setState({
            key: requestKey,
            quote: null,
            loading: false,
            error:
              error?.data?.message ||
              error?.response?.data?.message ||
              error?.message ||
              "Unable to calculate the price for these participants.",
          });
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [requestKey]);

  const current = Boolean(requestKey) && state.key === requestKey;
  const quote = current ? state.quote : null;
  return {
    quote,
    loading: Boolean(requestKey) && (!current || state.loading),
    error: current ? state.error : "",
    // Ready = priced, bookable and within the slot's quantity rules.
    ready:
      current &&
      !state.loading &&
      !state.error &&
      Boolean(quote) &&
      quote.available !== false &&
      quote.quantity_valid !== false,
  };
}
