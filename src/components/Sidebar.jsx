import logo from "../assets/logo.png";

export default function Sidebar() {
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
