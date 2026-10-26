import { useEffect, useId, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  CalendarDays,
  Check,
  ChevronDown,
  Info,
  Italic,
  Link2,
  List,
  ListOrdered,
  Mail,
  MapPin,
  Send,
  Underline,
  X,
} from "lucide-react";
import {
  setGiftCustomization,
  setReceiverInfo,
  setStep,
} from "../store/step1Slice";

const templates = [
  { id: "happy-new-year", name: "Happy New Year", year: "2026", giftType: "New Year", variant: "champagne", className: "newyear" },
  { id: "fireworks", name: "Fireworks", year: "2028", giftType: "New Year", variant: "fireworks", className: "newyear" },
  { id: "midnight", name: "Midnight Magic", year: "2026", giftType: "New Year", variant: "midnight", className: "newyear" },
  { id: "anniversary", name: "Anniversary", year: "2026", giftType: "Anniversary", variant: "photo", image: "/assets/template-anniversary.jpg", title: "Happy Anniversary", className: "anniversary" },
  { id: "blackfriday", name: "Black Friday", year: "2026", giftType: "Black Friday", variant: "photo", image: "/assets/template-blackfriday.jpg", title: "BLACK FRIDAY", className: "blackfriday" },
  { id: "birthday", name: "Golden Birthday", year: "2026", giftType: "Birthday", variant: "photo", image: "/assets/golden-birthday.jpg", title: "Happy Birthday", className: "fx-birthday" },
];

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2);
  const minutes = index % 2 === 0 ? "00" : "30";
  const suffix = hours < 12 ? "AM" : "PM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return {
    value: `${String(hours).padStart(2, "0")}:${minutes}`,
    label: `${hour12}:${minutes} ${suffix}`,
  };
});

function StepTitle({ number, children }) {
  return (
    <div className="fx-step-title">
      <span className="fx-step-number">{number}</span>
      <span>{children}</span>
    </div>
  );
}

function Burst({ cx, cy, r, color, rays = 16 }) {
  return (
    <g>
      {Array.from({ length: rays }).map((_, index) => {
        const angle = (index / rays) * Math.PI * 2;
        const x2 = cx + Math.cos(angle) * r;
        const y2 = cy + Math.sin(angle) * r;
        return (
          <g key={index}>
            <line x1={cx + Math.cos(angle) * r * 0.08} y1={cy + Math.sin(angle) * r * 0.08} x2={x2} y2={y2} stroke={color} strokeWidth={r > 40 ? 3.2 : 2.2} strokeLinecap="round" />
            <circle cx={x2} cy={y2} r={r > 40 ? 2.4 : 1.7} fill="#fff6d0" />
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={Math.max(3.5, r * 0.14)} fill="#fff8dc" />
    </g>
  );
}

function TemplateArt({ variant, image, alt }) {
  const uid = useId().replace(/:/g, "");

  if (variant === "photo") {
    return <img className="fx-template-photo" src={image} alt={alt || ""} />;
  }

  if (variant === "champagne") {
    return (
      <div className="fx-art fx-art-champagne" aria-hidden="true">
        <svg className="fx-art-deco" viewBox="0 0 300 420">
          <path d="M18 8 C40 26 28 58 62 46M250 6 C230 28 268 52 236 70" fill="none" stroke="#e0b44a" strokeWidth="1.6" />
          {[28, 54, 92, 140, 188, 230, 268].map((x, index) => <circle key={x} cx={x} cy={20 + (index % 3) * 16} r="2" fill="#e6c15a" />)}
        </svg>
        <div className="fx-art-script">Hey New</div>
        <div className="fx-art-year">2026</div>
        <svg className="fx-flute" viewBox="0 0 80 150">
          <defs>
            <linearGradient id={`${uid}-liquid`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f8e7a2" />
              <stop offset="1" stopColor="#c9962c" />
            </linearGradient>
          </defs>
          <path d="M22 6 Q18 48 26 78 Q40 90 54 78 Q62 48 58 6Z" fill="rgba(255,255,255,.55)" stroke="#efe6d2" />
          <path d="M26 34 Q24 58 30 76 Q40 84 50 76 Q56 58 54 34 Q40 42 26 34Z" fill={`url(#${uid}-liquid)`} />
          <rect x="37.4" y="84" width="5.2" height="42" rx="1.4" fill="#f6f1e8" />
          <ellipse cx="40" cy="128" rx="18" ry="4.2" fill="#efe6d4" />
        </svg>
        <div className="fx-art-footer">Happy New Year</div>
      </div>
    );
  }

  if (variant === "fireworks") {
    return (
      <div className="fx-art fx-art-fireworks" aria-hidden="true">
        <svg className="fx-art-deco" viewBox="0 0 300 420">
          <Burst cx={62} cy={92} r={78} color="#f2cc62" rays={22} />
          <Burst cx={168} cy={58} r={58} color="#fff3cc" rays={18} />
          <Burst cx={248} cy={118} r={70} color="#e8b03a" rays={20} />
          <Burst cx={130} cy={148} r={34} color="#fff6d4" rays={12} />
        </svg>
        <div className="fx-art-spacer" />
        <div className="fx-art-year">2028</div>
        <div className="fx-art-script">Gift Card</div>
        <div className="fx-art-footer">Fireworks</div>
      </div>
    );
  }

  return (
    <div className="fx-art fx-art-midnight" aria-hidden="true">
      <svg className="fx-clock" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="78" fill="#0c0c0e" stroke="#e8e8ea" strokeWidth="3" />
        <circle cx="100" cy="100" r="72" fill="none" stroke="#bfc3c8" />
        {Array.from({ length: 12 }).map((_, index) => {
          const angle = (index / 12) * Math.PI * 2 - Math.PI / 2;
          const inner = index % 3 === 0 ? 58 : 64;
          return <line key={index} x1={100 + Math.cos(angle) * inner} y1={100 + Math.sin(angle) * inner} x2={100 + Math.cos(angle) * 68} y2={100 + Math.sin(angle) * 68} stroke="#ececec" strokeWidth={index % 3 === 0 ? 2.4 : 1.2} />;
        })}
        <line x1="100" y1="100" x2="100" y2="48" stroke="#f7f7f7" strokeWidth="2.4" />
        <line x1="100" y1="100" x2="108" y2="58" stroke="#d9d9dc" strokeWidth="3.4" />
        <circle cx="100" cy="100" r="3.5" fill="#f4f4f4" />
      </svg>
      <div className="fx-art-script">New Year!</div>
      <div className="fx-art-footer">Midnight Magic</div>
    </div>
  );
}

function PreviewCard({ active, font, firstName, lastName, message }) {
  return (
    <div className="fx-preview-card">
      <div className={`fx-preview-art ${active.variant !== "photo" ? "fx-design-art" : ""} ${active.className}`}>
        {active.variant === "photo" ? (
          <>
            <img src={active.image} alt="Selected gift template preview" />
            {active.id !== "birthday" && <div className="fx-art-label">{active.title}</div>}
          </>
        ) : <TemplateArt variant={active.variant} />}
      </div>
      <div className="fx-preview-content" style={{ fontFamily: font }}>
        <h2>{active.name}</h2>
        <p className="fx-year">{active.year}</p>
        <h3>{[firstName, lastName].filter(Boolean).join(" ") || "Recipient"}</h3>
        <div className="fx-preview-divider" />
        <p className="fx-preview-message">{message || "Your personal message will appear here."}</p>
        <p className="fx-sender">From Your Name</p>
      </div>
    </div>
  );
}

function DeliveryOption({ value, selected, icon, title, description, onChange }) {
  return (
    <label className="fx-delivery-option">
      <input type="radio" name="delivery" value={value} checked={selected === value} onChange={() => onChange({ delivery: value })} />
      <span className="fx-delivery-copy">
        <span className="fx-delivery-title">{icon}{title}</span>
        <span className="fx-delivery-desc">{description}</span>
      </span>
    </label>
  );
}

export default function Customize() {
  const dispatch = useDispatch();
  const step = useSelector((state) => state.step1.step);
  const gift = useSelector((state) => state.step1.gift);
  const receiverInfo = useSelector((state) => state.step1.receiverInfo);
  const customization = useSelector((state) => state.step1.giftCustomization || {});
  const [showPreview, setShowPreview] = useState(false);

  const giftType = customization.giftType || "New Year";
  const selected = customization.template || "happy-new-year";
  const message = customization.message || "";
  const font = customization.font || "Roboto";
  const delivery = customization.delivery || "recipient";
  const schedule = Boolean(customization.schedule);
  const deliveryDate = customization.deliveryDate || "";
  const deliveryTime = customization.deliveryTime || "";

  useEffect(() => {
    if (!showPreview) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setShowPreview(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [showPreview]);

  if (!gift || step !== "customizestep") return null;

  const active = templates.find((template) => template.id === selected) || templates[0];
  const matches = templates.filter((template) => template.giftType === giftType);
  const visibleTemplates = matches.length ? matches : templates.filter((template) => template.giftType === "New Year");
  const updateCustomization = (values) => dispatch(setGiftCustomization(values));
  const updateRecipient = (values) => dispatch(setReceiverInfo(values));
  const chooseType = (value) => {
    const firstMatch = templates.find((template) => template.giftType === value);
    updateCustomization({ giftType: value, ...(firstMatch ? { template: firstMatch.id } : {}) });
  };

  return (
    <main className="fx-page-shell">
      <div className="fx-customize-layout">
        <section className="fx-form-column">
          <h1>Customize</h1>

          <div className="fx-panel type-panel">
            <StepTitle number="1">Select Gift Type</StepTitle>
            <div className="fx-select-wrap">
              <select value={giftType} onChange={(event) => chooseType(event.target.value)}>
                <option>New Year</option><option>Birthday</option><option>Anniversary</option><option>Black Friday</option><option>Thank You</option><option>Congratulations</option>
              </select>
              <ChevronDown size={15} />
            </div>
          </div>

          <div className="fx-panel template-panel">
            <div className="fx-step-title fx-template-step-title">
              <span className="fx-step-number">2</span><span>Choose template</span>
              <button type="button" className="fx-template-info" aria-label="Each template changes the card design in the preview" title="Each template changes the card design in the preview"><Info size={15} strokeWidth={1.75} /></button>
            </div>
            <div className="fx-template-grid" role="radiogroup" aria-label="Choose template">
              {visibleTemplates.map((template) => (
                <button key={template.id} type="button" role="radio" aria-checked={selected === template.id} className={`fx-template-choice ${selected === template.id ? "fx-active" : ""}`} onClick={() => updateCustomization({ template: template.id, giftType: template.giftType })} aria-label={`Choose ${template.name} template`}>
                  <span className="fx-template-face"><TemplateArt variant={template.variant} image={template.image} alt="" /></span>
                  {selected === template.id && <span className="fx-template-check"><Check size={13} strokeWidth={3} /></span>}
                </button>
              ))}
            </div>
          </div>

          <div className="fx-panel message-panel">
            <StepTitle number="3">Add a message</StepTitle>
            <label className="fx-field-label" htmlFor="gift-message">Your personal message</label>
            <div className="fx-editor">
              <div className="fx-toolbar">
                <button aria-label="Bold" type="button" onClick={() => updateCustomization({ message: message ? `**${message.replace(/^\*\*|\*\*$/g, "")}**` : message })}><Bold size={14} /></button>
                <button aria-label="Italic" type="button" onClick={() => updateCustomization({ message: message ? `_${message.replace(/^_|_$/g, "")}_` : message })}><Italic size={14} /></button>
                <button aria-label="Underline" type="button"><Underline size={14} /></button><i />
                <button aria-label="Align left" type="button"><AlignLeft size={14} /></button><button aria-label="Align center" type="button"><AlignCenter size={14} /></button><button aria-label="Align right" type="button"><AlignRight size={14} /></button><i />
                <button aria-label="Bulleted list" type="button"><List size={14} /></button><button aria-label="Numbered list" type="button"><ListOrdered size={14} /></button><i /><button aria-label="Insert link" type="button"><Link2 size={14} /></button>
              </div>
              <textarea id="gift-message" value={message} onChange={(event) => updateCustomization({ message: event.target.value })} placeholder="Enter your personal message..." />
            </div>
          </div>

          <div className="fx-panel font-panel">
            <StepTitle number="4">Select font</StepTitle>
            <div className="fx-select-wrap">
              <select value={font} onChange={(event) => updateCustomization({ font: event.target.value })}>
                <option>Roboto</option><option>Arial</option><option>Georgia</option><option>Times New Roman</option><option>Verdana</option><option>Courier New</option>
              </select><ChevronDown size={15} />
            </div>
          </div>

          <div className="fx-panel fx-recipient-panel">
            <StepTitle number="5">Add recipient Details</StepTitle>
            <div className="fx-recipient-fields">
              <input value={receiverInfo.firstName || ""} onChange={(event) => updateRecipient({ firstName: event.target.value })} placeholder="First Name" aria-label="First name" />
              <input value={receiverInfo.lastName || ""} onChange={(event) => updateRecipient({ lastName: event.target.value })} placeholder="Last name" aria-label="Last name" />
              <div className="fx-email-field"><input type="email" value={receiverInfo.email || ""} onChange={(event) => updateRecipient({ email: event.target.value })} placeholder="Enter email address" aria-label="Email address" /><Mail size={15} /></div>
            </div>
          </div>

          <div className="fx-panel fx-delivery-panel">
            <div className="fx-step-title fx-template-step-title">
              <span className="fx-step-number">6</span><span>Delivery method</span>
              <button type="button" className="fx-template-info" aria-label="Choose how the gift card is delivered" title="Choose how the gift card is delivered"><Info size={15} strokeWidth={1.75} /></button>
            </div>
            <div className="fx-delivery-list" role="radiogroup" aria-label="Delivery method">
              <DeliveryOption value="mail" selected={delivery} icon={<MapPin size={14} />} title="Send Gift Card by mail" description="Physical gift card delivered to recipient's address" onChange={updateCustomization} />
              <DeliveryOption value="me" selected={delivery} icon={<Mail size={14} />} title="Send e-gift to me" description="Digital voucher sent to your email for manual delivery" onChange={updateCustomization} />
              <DeliveryOption value="recipient" selected={delivery} icon={<Send size={14} />} title="Send e-gift to recipient" description="Digital voucher sent directly to recipient's email" onChange={updateCustomization} />
            </div>
            {delivery === "recipient" && (
              <>
                <div className="fx-email-field fx-delivery-email"><input type="email" value={receiverInfo.email || ""} onChange={(event) => updateRecipient({ email: event.target.value })} placeholder="Recipient's email" aria-label="Recipient's email" /><Mail size={15} /></div>
                <label className="fx-schedule-check"><input type="checkbox" checked={schedule} onChange={(event) => updateCustomization({ schedule: event.target.checked })} /><span>Schedule gift voucher for a specific date &amp; time</span></label>
                {schedule && (
                  <div className="fx-schedule-stack">
                    <label className={`fx-schedule-date ${deliveryDate ? "fx-has-value" : ""}`}><CalendarDays size={15} /><input type="date" value={deliveryDate} onChange={(event) => updateCustomization({ deliveryDate: event.target.value })} aria-label="Select a date" />{!deliveryDate && <span className="fx-schedule-placeholder">Select a date</span>}</label>
                    <div className={`fx-select-wrap fx-schedule-time ${deliveryTime ? "" : "fx-is-empty"}`}><select value={deliveryTime} onChange={(event) => updateCustomization({ deliveryTime: event.target.value })} aria-label="Select a time"><option value="">Select a time</option>{timeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown size={15} /></div>
                  </div>
                )}
              </>
            )}
          </div>

          <button type="button" className="fx-preview-button" onClick={() => setShowPreview(true)}>PREVIEW</button>
          <button type="button" className="fx-save-button" onClick={() => dispatch(setStep("checkoutstep"))}>SAVE &amp; CONTINUE</button>
        </section>

        <aside className="fx-preview-column">
          <h1>Live Preview</h1>
          <PreviewCard active={active} font={font} firstName={receiverInfo.firstName} lastName={receiverInfo.lastName} message={message} />
        </aside>

        {showPreview && (
          <div className="fx-preview-modal" onClick={() => setShowPreview(false)}>
            <div className="fx-preview-dialog" role="dialog" aria-modal="true" aria-label="Live Preview" onClick={(event) => event.stopPropagation()}>
              <div className="fx-preview-modal-bar"><h2>Live Preview</h2><button type="button" className="fx-preview-close" onClick={() => setShowPreview(false)} aria-label="Close preview"><X size={18} /></button></div>
              <PreviewCard active={active} font={font} firstName={receiverInfo.firstName} lastName={receiverInfo.lastName} message={message} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
