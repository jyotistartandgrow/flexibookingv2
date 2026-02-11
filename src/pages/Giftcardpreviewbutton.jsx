import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import GiftCardPreview from "./Giftcardpreview";
import "primereact/resources/themes/lara-light-teal/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

const GiftCardPreviewButton = ({
  receiverFirstName,
  receiverLastName,
  services,
  total,
  senderName,
  message = "Enjoy your special day!",
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="fx-preview-button-container">
      <Button
        label="Preview Gift Card"
        icon="pi pi-eye"
        onClick={() => setVisible(true)}
        className="fx-preview-button p-button-outlined p-button-teal"
      />

      <Dialog
        header=""
        visible={visible}
        style={{ width: "90vw", maxWidth: "600px" }}
        onHide={() => setVisible(false)}
        draggable={false}
        className="fx-gift-card-dialog"
      >
        <GiftCardPreview
          receiverFirstName={receiverFirstName}
          receiverLastName={receiverLastName}
          services={services}
          total={total}
          senderName={senderName}
          message={message}
        />
      </Dialog>
    </div>
  );
};

export default GiftCardPreviewButton;
