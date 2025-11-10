import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

let store;

export const injectStore = (_store) => {
  store = _store;
};

axiosInstance.interceptors.request.use(
  (config) => {
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
  (error) => {
    if (error.response && error.response.status === 401) {
      store.dispatch({ type: "LOGOUT" });
    } else {
      return Promise.reject(error.response);
    }
  },
);

export default axiosInstance;
