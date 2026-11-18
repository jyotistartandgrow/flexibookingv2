import { Clock3, Minus, Plus, Users } from "lucide-react";
import { normalizeParticipantGroups } from "../Utils/participants";
import { decodeHtml } from "../Utils/Functions";
import { getComponentLimits } from "../Utils/bundleParticipants";

const visitorsLabel = (count) => `${count} visitor${Number(count) === 1 ? "" : "s"}`;
const limitsLabel = ({ minimum, maximum, fixed }) =>
  fixed ? visitorsLabel(minimum) : `${minimum}–${maximum} visitors`;

function ParticipantRows({ groups, counts, required, disabled, onChange, label }) {
  const total = Object.values(counts || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
  return groups.map((group) => {
    const value = Number(counts?.[group.key]) || 0;
    // When every place is taken, "+" moves a visitor from another group, so it
    // stays enabled as long as another group has someone to give.
    const canAdd = total < required || total - value > 0;
    return (
      <div className={`fx-service-participant-row${group.disabled ? " is-disabled" : ""}`} key={group.key}>
        <div><strong>{group.name}</strong><small>{group.ages}</small></div>
        <div className="fx-service-participant-quantity" role="group" aria-label={`${group.name} quantity${label ? ` for ${label}` : ""}`}>
          <button type="button" disabled={disabled || group.disabled || value <= 0} onClick={() => onChange(group, -1)} aria-label={`Remove one ${group.name.toLowerCase()} participant`}><Minus size={12} aria-hidden="true" /></button>
          <output aria-live="polite">{value}</output>
          <button type="button" disabled={disabled || group.disabled || !canAdd} onClick={() => onChange(group, 1)} aria-label={`Add one ${group.name.toLowerCase()} participant`}><Plus size={12} aria-hidden="true" /></button>
        </div>
      </div>
    );
  });
}

function PartyStatus({ party, limits }) {
  if (!party) return null;
  if (party.valid) {
    return <p className="fx-bundle-participant-note is-complete">{visitorsLabel(party.total)} selected</p>;
  }
  // Neutral guidance (no error colour): wrong total, or a rule such as an
  // accompanying adult that the current mix doesn't meet.
  const outOfRange = party.total < limits.minimum || party.total > limits.maximum;
  const message = outOfRange
    ? `Choose ${limitsLabel(limits)} (${party.total} selected).`
    : party.message;
  return <p className="fx-bundle-participant-note" role="status">{message}</p>;
}

export default function BundleParticipants({ selection }) {
  if (!selection.visible) return null;
  const { components, counts, parties, shared, loading, checking, error } = selection;
  if (!loading && !error && components.length === 0) return null;

  const busy = loading || checking;
  const first = components[0];

  return (
    <div className="fx-service-participants fx-bundle-participants" aria-busy={busy}>
      {loading && <p className="fx-service-participant-status" role="status">Loading participant options…</p>}
      {error && !loading && (
        <div className="fx-service-participant-error fx-bundle-participant-error" role="alert">
          <p>{decodeHtml(error)}</p>
          <button type="button" onClick={selection.retry}>Try again</button>
        </div>
      )}
      {!loading && !error && (
        <fieldset className="fx-service-participant-panel" disabled={checking}>
          <h3>Who is coming?</h3>
          <p>
            {decodeHtml(selection.guidance) ||
              (shared
                ? "Choose participants once for these included services."
                : "Confirm the participants for each included service.")}
          </p>

          {shared && first && (
            <div className="fx-bundle-participant-component">
              <div className="fx-bundle-participant-heading">
                <div className="fx-bundle-participant-services">
                  {components.map((component) => (
                    <span key={component.key}>
                      <strong>{decodeHtml(component.name)}</strong>
                      <small><Clock3 size={13} aria-hidden="true" /> {component.start}</small>
                    </span>
                  ))}
                </div>
                <span className="fx-bundle-participant-required"><Users size={14} aria-hidden="true" /> {limitsLabel(getComponentLimits(first))}</span>
              </div>
              <ParticipantRows
                groups={normalizeParticipantGroups(first.config)}
                counts={counts[first.key]}
                required={getComponentLimits(first).maximum}
                disabled={checking}
                onChange={(group, delta) => selection.change(components.map((component) => component.key), group, delta)}
              />
              <PartyStatus party={parties[first.key]} limits={getComponentLimits(first)} />
            </div>
          )}

          {!shared && components.map((component) => (
            <div className="fx-bundle-participant-component" key={component.key}>
              <div className="fx-bundle-participant-heading">
                <div className="fx-bundle-participant-services">
                  <span>
                    <strong>{decodeHtml(component.name)}</strong>
                    <small><Clock3 size={13} aria-hidden="true" /> {component.start}</small>
                  </span>
                </div>
                <span className="fx-bundle-participant-required"><Users size={14} aria-hidden="true" /> {limitsLabel(getComponentLimits(component))}</span>
              </div>
              <ParticipantRows
                groups={normalizeParticipantGroups(component.config)}
                counts={counts[component.key]}
                required={getComponentLimits(component).maximum}
                disabled={checking}
                label={decodeHtml(component.name)}
                onChange={(group, delta) => selection.change([component.key], group, delta)}
              />
              <PartyStatus party={parties[component.key]} limits={getComponentLimits(component)} />
            </div>
          ))}

          <p className="fx-bundle-participant-footnote">
            {checking
              ? "Checking availability…"
              : "Visitor numbers follow the booking quantity. When all places are filled, use + on a group to move a visitor into it. The package price does not change."}
          </p>
        </fieldset>
      )}
    </div>
  );
}
