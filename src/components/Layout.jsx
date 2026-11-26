import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { getLanguageClass } from "../i18n";

export default function Layout(props) {
  return (
    <div className={`fx-booking fx-container bgbody ${getLanguageClass()}`}>
      <Outlet />
      <Sidebar {...props} />
    </div>
  );
}
