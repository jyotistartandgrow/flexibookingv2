import React from "react";

const GiftCardPreview = ({
  receiverFirstName,
  receiverLastName,
  services,
  total,
  senderName,
  message = "Enjoy your special day!",
}) => {
  return (
    <div className="fx-gift-card-container">

      {/* Gift Card Container */}
      <div className="fx-gift-card">
        {/* Decorative corner elements */}
        <div className="fx-gift-card-decorative-circle-1">
          <svg viewBox="0 0 100 100">
            <circle cx="0" cy="0" r="100" />
          </svg>
        </div>
        <div className="fx-gift-card-decorative-circle-2">
          <svg viewBox="0 0 100 100">
            <circle cx="100" cy="100" r="100" />
          </svg>
        </div>

        {/* Card Content - Centered */}
        <div className="fx-gift-card-content">
          {/* Main Message */}
          <h2 className="fx-gift-card-main-message">{message}</h2>

          {/* Total Amount */}
          <div className="fx-gift-card-total">{total}</div>

          {/* Recipient Name */}
          <div className="fx-gift-card-recipient">
            <p className="fx-gift-card-recipient-name">
              {receiverFirstName} {receiverLastName}
            </p>
          </div>

          {/* Divider with Heart */}
          <div className="fx-gift-card-divider">
            <div className="fx-gift-card-divider-line"></div>
            <svg className="fx-gift-card-heart" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <div className="fx-gift-card-divider-line"></div>
          </div>

          {/* Services List */}
          <div className="fx-gift-card-services">
            {services?.service?.map((service, index) => (
              <div key={`service-${index}`} className="fx-gift-card-service-item">
                <span>{service.name}</span>
              </div>
            ))}
            {services?.extra?.map((extra, index) => (
              <div key={`extra-${index}`} className="fx-gift-card-service-item">
                <span>{extra.name}</span>
              </div>
            ))}
          </div>

          {/* From */}
          <div className="fx-gift-card-sender">From: {senderName}</div>
        </div>

        {/* Bottom branding */}
        <div className="fx-gift-card-footer">
          <p className="fx-gift-card-brand-text">FLEXI BOOKING</p>
        </div>

         <p className="fx-gift-card-info-text">
        The recipient will receive this gift card via email
      </p>
      
      </div>

      {/* Info text below card */}
      
    </div>
  );
};

export default GiftCardPreview;
