import React from "react";
import { useSelector } from "react-redux";
import moment from "moment";
import { formatLikePrice } from "../Utils/redeemUpsells";
import { isPhoneOnlyRedemption } from "../Utils/redeemByPhone";
import "../styles/redeem-upsell-services.scss";

export default function RedeemCommonbox({
  setVisibleBottom,
  hideSchedule: hideScheduleProp = false,
}) {
  const date = useSelector((state) => state.step1.date);
  const step = useSelector((state) => state.step1.redeemstep);
  const voucherdetail = useSelector((state) => state.step3.voucherdetail);
  const slot = useSelector((state) => state.step3.slot);
  // Phone-only vouchers are scheduled with the venue, so no online date/time applies.
  const hideSchedule = hideScheduleProp || isPhoneOnlyRedemption(voucherdetail);
  const isUpsell = useSelector((state) => state.step1.redeemUpsell);
  const selections = useSelector((state) => state.step3.redeemUpsellSelections);
  const quote = useSelector((state) => state.step3.redeemUpsellQuote);

  // On the payment step the server quote is authoritative; before that, show the selection estimate.
  const useQuote = step === "paymentstep" && quote?.items?.length > 0;
  const additions = !isUpsell
    ? []
    : useQuote
      ? quote.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          slot_label: [item.slot_from, item.slot_to]
            .filter(Boolean)
            .join(" - "),
          line_total: formatLikePrice(quote.formatted_total, item.line_total),
        }))
      : (selections || [])
          .filter((item) => item.display)
          .map((item) => ({ ...item.display, quantity: item.quantity }));
  const additionsTotal = useQuote
    ? quote.formatted_total
    : formatLikePrice(
        selections?.find((item) => item.display)?.display.line_total,
        (selections || []).reduce(
          (sum, item) => sum + (Number(item.display?.amount) || 0),
          0,
        ),
      );

  return (
    <>
      {!voucherdetail.products && !date && (
        <p className="giftmessagebox">Redeem your gift on a specific date</p>
      )}
      {date && !hideSchedule && (
        <div className="fx-bookingdatebar">
          <div className="fx-bookingdate">
            Date
            <br />
            <span>{moment(date).format("MMMM DD YYYY")}</span>
          </div>
        </div>
      )}
      {slot && !hideSchedule && (
        <div className="fx-bookingdatebar">
          <div className="fx-bookingdate">
            Time
            <br />
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
                  {/* <div className="price">{decodeHtml(ct.total)}</div> */}
                </div>
              );
            })}
          </div>
          {additions.length > 0 && (
            <div className="fx-servicelistbox fx-redeem-summary-additions">
              <div className="fx-redeem-summary-additions__title">
                Added services
              </div>
              {additions.map((item, index) => (
                <div className="fx-serviceitem" key={`addition-${index}`}>
                  <div className="itemname">
                    {item.name} {`X ${item.quantity}`}
                    {item.slot_label && <small>{item.slot_label}</small>}
                  </div>
                  <div className="price">{item.line_total}</div>
                </div>
              ))}
              <div className="fx-redeem-summary-additions__total">
                <span>{useQuote ? "Total to pay" : "Additions total"}</span>
                <strong>{additionsTotal}</strong>
              </div>
            </div>
          )}
          <div className="fx-right-bottom-bar">
            {/* {voucherdetail.discount > 0 && (
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
            )}
            <div className="fx-totalbar">
              <p>
                Total <span> {decodeHtml(voucherdetail.total)}</span>
              </p>
            </div> */}
            {step == "checkoutstep" && (
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
