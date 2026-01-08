import React, { useRef } from "react";
import { useSelector } from "react-redux";
import moment from "moment";
import { decodeHtml } from "../Utils/Functions";

export default function Commonbox({ setVisibleBottom }) {
  const toast = useRef(null);
  const date = useSelector((state) => state.step1.date);
  const step = useSelector((state) => state.step1.reedemstep);
  const voucherdetail = useSelector((state) => state.step3.voucherdetail);
  const slot = useSelector((state) => state.step3.slot);

  return (
    <>
      {!voucherdetail.products && !date && (
        <p className="giftmessagebox">reedem your gift on a specific date</p>
      )}
      {date && (
        <div className="fx-bookingdatebar">
          <div className="fx-bookingdate">
            Date
            <br />
            <span>{moment(date).format("MMMM DD YYYY")}</span>
            <span>{slot}</span>
          </div>
        </div>
      )}
      {voucherdetail?.products?.length > 0 && (
        <>
          <div className="fx-servicelistbox">
            {voucherdetail.products.map((ct, ckey) => {
              return (
                <div className="fx-serviceitem" key={"ct-" + ckey}>
                  <div className="itemname">
                    {ct.name} {`X ${ct.quantity}`}
                  </div>
                  <div className="price">{decodeHtml(ct.total)}</div>
                </div>
              );
            })}
          </div>
          <div className="fx-right-bottom-bar">
            <div className="fx-subtotal-discount-bar">
              <div className="fx-subtotalbar">
                <p>
                  Sub Total <span> {decodeHtml(voucherdetail.subtotal)}</span>
                </p>
              </div>
              <div className="fx-discountbar">
                <p>
                  Discount <span> {decodeHtml(voucherdetail.discount)}</span>
                </p>
              </div>
            </div>
            <div className="fx-totalbar">
              <p>
                Total <span> {decodeHtml(voucherdetail.total)}</span>
              </p>
            </div>
            {(step == "paymentstep" || step == "checkoutstep") && (
              <div
                className="fx-down-icon-botttom"
                onClick={() => setVisibleBottom(false)}
              >
                <i className="pi pi-chevron-up"></i>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
