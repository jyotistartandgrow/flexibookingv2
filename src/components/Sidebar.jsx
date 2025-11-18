import logo from "../assets/logo.png";
import { useSelector, useDispatch } from "react-redux";


export default function Sidebar() {
  const date = useSelector((state) => state.step1.date);
  return (
    <div className="fx-sidebar">
      <div className="logo">
        <img src={logo} className="fx-right-logo" />
      </div>

      <p className="giftmessagebox">
        book your service on a specific date" and "do a gift to a friend
      </p>
    </div>
  );
}
