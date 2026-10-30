import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
});

// Keep nonce bootstrapping outside the main instance so requesting `/nonce`
// does not recursively run the authenticated request interceptor.
const nonceClient = axios.create({
  baseURL: apiBaseUrl,
});

let store;
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

const setNonceHeader = (config, nonce) => {
  if (typeof config.headers?.set === "function") {
    config.headers.set("X-Booking-Nonce", nonce);
  } else {
    config.headers = {
      ...(config.headers || {}),
      "X-Booking-Nonce": nonce,
    };
  }

  config._bookingNonceValue = nonce;
};

const getErrorCode = (response) =>
  response?.data?.code ?? response?.data?.data?.code;

export const initializeBookingNonce = () => getNonce();

export const injectStore = (_store) => {
  store = _store;
};

axiosInstance.interceptors.request.use(
  async (config) => {
    const nonce = await getNonce();

    setNonceHeader(config, nonce);
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

    if (response?.status === 401) {
      store?.dispatch({ type: "LOGOUT" });
    }
    return Promise.reject(response || error);
  },
);

export default axiosInstance;
