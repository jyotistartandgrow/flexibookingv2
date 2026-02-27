import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout(props) {
  return (
    <div className="fx-booking fx-container bgbody">
      <Outlet />
      <Sidebar {...props} />
    </div>
  );
}
