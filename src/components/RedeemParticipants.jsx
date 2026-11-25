import { normalizeParticipantGroups } from "../Utils/participants";
import { getRedemptionParty } from "../Utils/redeemParticipants";
import "../styles/redeem-participants.scss";
import { __, sprintf } from "../i18n";

export default function RedeemParticipants({ selection }) {
  if (!selection.visible) return null;
  return (
    <section
      className="fx-redeem-participants"
      aria-busy={selection.loading || selection.checking}
    >
      <h2>{__("Who is coming?")}</h2>
      {selection.loading && (
        <p role="status">{__("Loading participant options…")}</p>
      )}
      {selection.error && (
        <div role="alert">
          <p>{selection.error}</p>
          <button type="button" onClick={selection.retry}>
            {__("Try again")}
          </button>
        </div>
      )}
      {!selection.loading &&
        selection.components.map((component) => {
          const counts = selection.counts[component.key] || {};
          const party = getRedemptionParty(component, counts);
          return (
            <div className="fx-redeem-participant-service" key={component.key}>
              <h3>{component.name}</h3>
              <p>{sprintf(__("Required visitors: %s"), component.quantity)}</p>
              {normalizeParticipantGroups(component.config).map((group) => (
                <div className="fx-redeem-participant-row" key={group.key}>
                  <div>
                    <strong>{group.name}</strong>
                    <small>{group.ages}</small>
                  </div>
                  <div className="fx-redeem-participant-controls">
                    <button
                      type="button"
                      aria-label={sprintf(
                        __("Remove %1$s for %2$s"),
                        group.name,
                        component.name,
                      )}
                      disabled={
                        component.fixed ||
                        group.disabled ||
                        selection.checking ||
                        !counts[group.key]
                      }
                      onClick={() => selection.change(component, group, -1)}
                    >
                      −
                    </button>
                    <output
                      aria-label={sprintf(
                        __("%1$s for %2$s"),
                        group.name,
                        component.name,
                      )}
                    >
                      {counts[group.key] || 0}
                    </output>
                    <button
                      type="button"
                      aria-label={sprintf(
                        __("Add %1$s for %2$s"),
                        group.name,
                        component.name,
                      )}
                      disabled={
                        component.fixed ||
                        group.disabled ||
                        selection.checking ||
                        party.total >= Number(component.quantity)
                      }
                      onClick={() => selection.change(component, group, 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
              {!party.valid && (
                <p className="fx-redeem-participant-warning" role="status">
                  {sprintf(
                    __("Choose %s visitors for this service."),
                    component.quantity,
                  )}
                  {component.config?.adult_required
                    ? ` ${__("At least one adult or senior is required.")}`
                    : ""}
                </p>
              )}
            </div>
          );
        })}
      {!selection.loading && !selection.error && (
        <p className="fx-redeem-participant-note">
          {selection.checking
            ? __("Checking availability…")
            : selection.valid
              ? __(
                  "Participants selected. Availability is checked when you continue.",
                )
              : __("Select participants for each included service to continue.")}
        </p>
      )}
    </section>
  );
}
