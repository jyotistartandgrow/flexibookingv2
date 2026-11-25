import axios from "axios";
import { initI18n } from "../i18n";

const apiBaseUrl = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
});

// Keep nonce bootstrapping outside the main instance so requesting `/nonce`
// does not recursively run the authenticated request interceptor.
const nonceClient = axios.create({
  baseURL: apiBaseUrl,
});

let cachedNonce = null;
let nonceRequest = null;

const readNonce = (response) =>
  response?.data?.data?.nonce ?? response?.data?.nonce;

const fetchNonce = async () => {
  const response = await nonceClient.get("/nonce");
  const nonce = readNonce(response);

  if (!nonce) {
    throw new Error("The booking API did not return a nonce.");
  }

  cachedNonce = nonce;
  return nonce;
};

const getNonce = (forceRefresh = false) => {
  if (forceRefresh) {
    cachedNonce = null;
  }

  if (cachedNonce) {
    return Promise.resolve(cachedNonce);
  }

  if (!nonceRequest) {
    nonceRequest = fetchNonce().finally(() => {
      nonceRequest = null;
    });
  }

  return nonceRequest;
};

const refreshNonce = (failedNonce) => {
  // Another failed request may already have refreshed the shared nonce.
  if (cachedNonce && cachedNonce !== failedNonce) {
    return Promise.resolve(cachedNonce);
  }

  return getNonce(true);
};

const setHeader = (config, name, value) => {
  if (typeof config.headers?.set === "function") {
    config.headers.set(name, value);
  } else {
    config.headers = {
      ...(config.headers || {}),
      [name]: value,
    };
  }
};

const setNonceHeader = (config, nonce) => {
  setHeader(config, "X-Booking-Nonce", nonce);
  config._bookingNonceValue = nonce;
};

const getErrorCode = (response) =>
  response?.data?.code ?? response?.data?.data?.code;

export const initializeBookingNonce = () => getNonce();

axiosInstance.interceptors.request.use(
  async (config) => {
    const [nonce, locale] = await Promise.all([getNonce(), initI18n()]);

    setNonceHeader(config, nonce);
    // Run the API in the language the UI was rendered in, so messages,
    // service data and the language saved on the booking match the page.
    setHeader(config, "X-Booking-Locale", locale);
    // Native voucher REST handlers also validate the AJAX nonce in the body.
    // Form bodies arrive as URLSearchParams, or as an encoded string when a request is retried.
    const isFormString =
      typeof config.data === "string" && !config.data.trim().startsWith("{");
    if (
      config.bookingNonceBody &&
      (config.data instanceof URLSearchParams || isFormString)
    ) {
      const form = new URLSearchParams(config.data);
      form.set("nonce", nonce);
      config.data = form;
    } else if (config.bookingNonceBody) {
      const body =
        typeof config.data === "string" ? JSON.parse(config.data) : config.data;
      config.data = { ...body, nonce };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const response = error.response;
    const originalRequest = error.config;
    const isInvalidNonce =
      response?.status === 403 &&
      getErrorCode(response) === "bm_rest_invalid_nonce";

    if (
      isInvalidNonce &&
      originalRequest &&
      !originalRequest._bookingNonceRetried
    ) {
      originalRequest._bookingNonceRetried = true;

      try {
        const nonce = await refreshNonce(originalRequest._bookingNonceValue);
        setNonceHeader(originalRequest, nonce);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError.response || refreshError);
      }
    }

    return Promise.reject(response || error);
  },
);

export default axiosInstance;
