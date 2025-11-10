import moment from "moment";
import { useLocation } from "react-router-dom";
import Swal from "sweetalert2";

const swalError = (error) => {
  let errorMessage = "";

  for (const key in error?.data?.error) {
    errorMessage += `${error?.data?.error[key]}
<br>`;
  }
  errorMessage += error?.data?.message;
  console.log(errorMessage);
  if (errorMessage) {
    Swal.fire({
      toast: true,
      position: "top-end", // or 'bottom-end', 'top-start', etc.
      showConfirmButton: false,
      timer: 3000, // auto-close after 3 seconds
      icon: "error", // 'success', 'error', 'warning', 'info', 'question'
      title: errorMessage,
    });
  }
};

const swalUpdated = () => {
  return;
};

const ReactDatePickerTimeConverter = (time) => {
  if (time) {
    return moment(time).format("DD/MM/YYYY");
  } else {
    return "";
  }
};

export const decodeEntities = (htmlString) => {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = htmlString;
  return textarea.value;
};

const timeFormatter = (props) => props && moment(props).format("DD-MM-YYYY ");

export function isValidEmail(email) {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(email);
}

export { swalError, swalUpdated, ReactDatePickerTimeConverter, timeFormatter };

export const formattedDateAndTime = (props) => {
  return props && moment(props).format("Do MMM YYYY, [at] h:mm a");
};

export const formattedDate = (props) => {
  return props && moment(props).format("Do MMM YYYY");
};

export const formattedDatewithFormat = (props, format) => {
  return props && moment(props).format(format);
};

export const useQuery = (id) => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const bookingId = query.get(id);
  return bookingId;
};

export const slugify = (text) => {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "-and-")
    .replace(/[\s\W-]+/g, "-");
};
