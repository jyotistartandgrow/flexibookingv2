import { useEffect, useState } from "react";
import axiosInstance from "./Interceptor";
import { swalError } from "./Functions";

const useFetch = (url, { method, body }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [isReload, setIsreload] = useState(false);

  const reload = () => {
    setIsreload(!isReload);
  };

  useEffect(() => {
    const fetchApiFunction = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance[method ? method : "get"](
          url,
          body,
        );
        setData(response?.data);
      } catch (error) {
        setData(null);
        swalError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchApiFunction();
    return () => {};
  }, [url, body, isReload, method]);

  return { loading, reload, data };
};

export default useFetch;
