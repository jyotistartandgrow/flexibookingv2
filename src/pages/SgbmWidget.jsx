import { useState, useEffect, useCallback } from "react";


/* ── Constants ───────────────────────────────────────────── */
const API_BASE =
  "https://wordpress-1092228-6228102.cloudwaysapps.com/wp-json/booking/v1";
const REDIRECT_URL =
  "https://wordpress-1092228-6228102.cloudwaysapps.com/v2-shortcode/";
const SERVICE_PAGE =
  "https://wordpress-1092228-6228102.cloudwaysapps.com/v2-starting-from-service/";

// const ACCENT_PRESETS = [
//   "#215ad4",
//   "#14b8a6",
//   "#8b5cf6",
//   "#f59e0b",
//   "#ef4444",
//   "#10b981",
// ];

const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/* ── Helpers ─────────────────────────────────────────────── */
function parsePrice(raw = "") {
  // HTML entity &#0128; = € symbol; strip it and commas
  return raw.replace(/&#0128;|€|,/g, "").trim();
}

function getMonthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function getFirstDayOfWeekOffset(year, month) {
  // 0=Sun,1=Mon... convert to Mon-based (0=Mon)
  const d = new Date(year, month, 1).getDay();
  return (d + 6) % 7;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/* ── Calendar Preview Component ──────────────────────────── */
function CalendarPreview({ accentColor }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [calData, setCalData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCalendar = useCallback(async (y, m) => {
    setLoading(true);
    setError(null);
    try {
      const key = getMonthKey(y, m);
      const res = await fetch(
        `${API_BASE}/service-availability-calendar?month=${key}`,
      );
      const json = await res.json();
      if (json.status === 200 && Array.isArray(json.data)) {
        const map = {};
        json.data.forEach((d) => {
          map[d.date] = d;
        });
        setCalData((prev) => ({ ...prev, [key]: map }));
      } else {
        setError("Failed to load calendar.");
      }
    } catch {
      setError("Network error loading calendar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const key = getMonthKey(year, month);
    if (!calData[key]) fetchCalendar(year, month);
  }, [year, month, calData, fetchCalendar]);

  const monthKey = getMonthKey(year, month);
  const monthData = calData[monthKey] || {};
  const offset = getFirstDayOfWeekOffset(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;

  const monthLabel = new Date(year, month, 1).toLocaleString("en-US", {
    month: "long",
  });

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
  };

  return (
    <div className="fx-widget-calendar" style={{ "--fx-accent": accentColor }}>
      <div className="fx-widget-cal-header">
        <div className="fx-widget-cal-nav">
          <button className="fx-widget-cal-nav-btn" onClick={prevMonth}>
            ‹
          </button>
          <span className="fx-widget-cal-month">
            {monthLabel.toUpperCase()} {year}
          </span>
          <button className="fx-widget-cal-nav-btn" onClick={nextMonth}>
            ›
          </button>
        </div>
        <div className="fx-widget-cal-days-header">
          {WEEKDAY_LABELS.map((d) => (
            <span key={d} className="fx-widget-cal-day-name">
              {d}
            </span>
          ))}
        </div>
      </div>

      <div className="fx-widget-cal-body">
        {loading ? (
          <div className="fx-widget-stage-loading" style={{ minHeight: 120 }}>
            <div
              className="fx-widget-spinner"
              style={{ "--fx-accent": accentColor }}
            />
            <span>Loading dates…</span>
          </div>
        ) : error ? (
          <div className="fx-widget-error">
            <span className="fx-widget-error-icon">⚠</span>
            <span>{error}</span>
          </div>
        ) : (
          <div className="fx-widget-cal-grid">
            {Array.from({ length: totalCells }).map((_, idx) => {
              const day = idx - offset + 1;
              const valid = day >= 1 && day <= daysInMonth;
              if (!valid)
                return <div key={idx} className="fx-widget-cal-cell" />;

              const dateStr = `${monthKey}-${String(day).padStart(2, "0")}`;
              const info = monthData[dateStr];
              const bookable = info?.is_bookable;
              const price = info?.price ? parsePrice(info.price) : null;
              const isSelected = selectedDate === dateStr;

              let cellClass = "fx-widget-cal-cell";
              if (bookable) cellClass += " fx-widget-cal-bookable";
              else cellClass += " fx-widget-cal-unavailable";
              if (isSelected) cellClass += " fx-widget-cal-selected";

              return (
                <div
                  key={idx}
                  className={cellClass}
                  onClick={() => bookable && setSelectedDate(dateStr)}
                >
                  <span className="fx-widget-cal-day-num">{day}</span>
                  {bookable && price && (
                    <span className="fx-widget-cal-price">€{price}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Service Cards Preview Component ─────────────────────── */
function CardsPreview({ accentColor, cols, showCategory }) {
  const today = new Date().toISOString().slice(0, 10);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/services?date=${today}&category=&all=true`)
      .then((r) => r.json())
      .then((json) => {
        if (json.status === 200 && Array.isArray(json.data)) {
          // Filter out test entries
          const filtered = json.data.filter(
            (s) => !["Request test", "TEST"].includes(s.service_title),
          );
          setServices(filtered);
        } else {
          setError("Failed to load services.");
        }
      })
      .catch(() => setError("Network error loading services."))
      .finally(() => setLoading(false));
  }, [today]);

  const visible = services.slice(0, cols === 1 ? 2 : cols === 2 ? 4 : 6);

  if (loading)
    return (
      <div className="fx-widget-stage-loading">
        <div
          className="fx-widget-spinner"
          style={{ "--fx-accent": accentColor }}
        />
        <span>Loading services…</span>
      </div>
    );

  if (error)
    return (
      <div className="fx-widget-error">
        <span className="fx-widget-error-icon">⚠</span>
        <span>{error}</span>
      </div>
    );

  return (
    <div
      className={`fx-widget-cards-grid fx-widget-cols-${cols}`}
      style={{ "--fx-accent": accentColor }}
    >
      {visible.map((s) => (
        <div key={s.id} className="fx-widget-card ">
          <div className="fx-widget-card-img-wrap">
            <img
              src={s.svc_img}
              alt={s.service_title}
              className="fx-widget-card-img"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            {showCategory && (
              <span className="fx-widget-card-badge">{s.category_name}</span>
            )}
          </div>
          <div className="fx-widget-card-body">
            <p className="fx-widget-card-title">{s.service_title}</p>
            <p className="fx-widget-card-desc">{s.svc_short_desc}</p>
            <div className="fx-widget-card-footer">
              <span className="fx-widget-card-price">
                from <strong>€{parsePrice(s.svc_price)}</strong>
              </span>
              <span className="fx-widget-card-arrow">›</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Small Sub-components ────────────────────────────────── */
function OptBtn({ active, onClick, children }) {
  return (
    <button
      className={`fx-widget-opt-btn${active ? " fx-widget-opt-active" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Section({ label, children }) {
  return (
    <div className="fx-widget-section">
      <p className="fx-widget-section-label">{label}</p>
      {children}
    </div>
  );
}

/* ── Main Widget Builder Page ────────────────────────────── */
export default function WidgetBuilder() {
  const [tab, setTab] = useState("calendar"); // "calendar" | "cards"
  const [accentColor, setAccentColor] = useState("#0ea5e9");
  const [cols, setCols] = useState(3);
  const [showCategory, setShowCategory] = useState(true);
  const [widgetWidth, setWidgetWidth] = useState(700);
  const [widgetHeight, setWidgetHeight] = useState(520);
  const [mode, setMode] = useState("preview"); // "preview" | "code"
  const [copied, setCopied] = useState(false);

  // Rebuild iframe src based on settings
  const iframeSrc =
    tab === "calendar"
      ? `${SERVICE_PAGE}?widget=calendar&accent=${encodeURIComponent(accentColor)}&redirect=${encodeURIComponent(REDIRECT_URL)}`
      : `${SERVICE_PAGE}?widget=cards&cols=${cols}&accent=${encodeURIComponent(accentColor)}&showCategory=${showCategory}&redirect=${encodeURIComponent(REDIRECT_URL)}`;

  const iframeCode =
    `<iframe\n` +
    `  src="${iframeSrc}"\n` +
    `  width="${widgetWidth}"\n` +
    `  height="${widgetHeight}"\n` +
    `  frameborder="0"\n` +
    `  style="border-radius:16px;border:none;"\n` +
    `  title="Corte Spa Widget">\n` +
    `</iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(iframeCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  return (
    <div className="fx-widget-root" style={{ "--fx-accent": accentColor }}>
      {/* ── Header ── */}
      {/* <header className="fx-widget-header">
        <div className="fx-widget-header-logo">◇</div>
        <div>
          <div className="fx-widget-header-title">Spa Widget Builder</div>
          <div className="fx-widget-header-sub">
            Corte Spa — Cadore Dolomiti
          </div>
        </div>
      </header> */}

      <div className="fx-widget-layout fx-booking fx-container bgbody">
        {/* ── Config Panel ── */}
        <aside className="fx-widget-config">
          <Section label="Widget type">
            <div className="fx-widget-opt-group">
              <OptBtn
                active={tab === "calendar"}
                onClick={() => setTab("calendar")}
              >
              Calendar
              </OptBtn>
              <OptBtn active={tab === "cards"} onClick={() => setTab("cards")}>
                Cards
              </OptBtn>
            </div>
          </Section>

          <Section label="Accent color">
            <div className="fx-widget-color-row">
              {/* {ACCENT_PRESETS.map((c) => (
                <div
                  key={c}
                  className={`fx-widget-swatch${accentColor === c ? " fx-widget-swatch-active" : ""}`}
                  style={{ background: c }}
                  onClick={() => setAccentColor(c)}
                />
              ))} */}
              <input
                type="color"
                className="fx-widget-color-input"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                title="Custom color"
              />
            </div>
          </Section>

          {tab === "cards" && (
            <>
              <Section label="Columns">
                <div className="fx-widget-opt-group">
                  {[1, 2, 3].map((n) => (
                    <OptBtn
                      key={n}
                      active={cols === n}
                      onClick={() => setCols(n)}
                    >
                      {n} col{n > 1 ? "s" : ""}
                    </OptBtn>
                  ))}
                </div>
              </Section>

              <Section label="Category badge">
                <div className="fx-widget-opt-group">
                  <OptBtn
                    active={showCategory}
                    onClick={() => setShowCategory(true)}
                  >
                    Show
                  </OptBtn>
                  <OptBtn
                    active={!showCategory}
                    onClick={() => setShowCategory(false)}
                  >
                    Hide
                  </OptBtn>
                </div>
              </Section>
            </>
          )}

          <Section label="Iframe size">
            <div className="fx-widget-slider-wrap">
              <label className="fx-widget-slider-label">
                Width: <strong>{widgetWidth}px</strong>
                <input
                  type="range"
                  min={280}
                  max={1100}
                  step={10}
                  value={widgetWidth}
                  className="fx-widget-slider"
                  onChange={(e) => setWidgetWidth(+e.target.value)}
                />
              </label>
              <label className="fx-widget-slider-label">
                Height: <strong>{widgetHeight}px</strong>
                <input
                  type="range"
                  min={300}
                  max={900}
                  step={10}
                  value={widgetHeight}
                  className="fx-widget-slider"
                  onChange={(e) => setWidgetHeight(+e.target.value)}
                />
              </label>
            </div>
          </Section>

          <Section label="Redirect URL">
            <input
              readOnly
              value={REDIRECT_URL}
              className="fx-widget-url-input"
            />
            <p className="fx-widget-url-hint">
              Clicks redirect to your booking shortcode page
            </p>
          </Section>
        </aside>

        {/* ── Content Panel ── */}
        <main className="fx-widget-content">
          <div className="fx-widget-content-topbar">
            <div className="fx-widget-content-header">
            <div className="fx-widget-header-title">Widget Builder</div>
            <span className="fx-widget-panel-title">
              {mode === "preview" ? "Live Preview" : "Embed Code"}
            </span>
            </div>
            <div className="fx-widget-tabbar">
              <button
                className={`fx-widget-tab${mode === "preview" ? " fx-widget-tab-active" : ""}`}
                onClick={() => setMode("preview")}
              >
                Preview
              </button>
              <button
                className={`fx-widget-tab${mode === "code" ? " fx-widget-tab-active" : ""}`}
                onClick={() => setMode("code")}
              >
                Embed code
              </button>
            </div>
          </div>

          {/* Preview */}
          {mode === "preview" && (
            <>
              <div className="fx-widget-stage">
                {tab === "calendar" ? (
                  <CalendarPreview accentColor={accentColor} />
                ) : (
                  <CardsPreview
                    accentColor={accentColor}
                    cols={cols}
                    showCategory={showCategory}
                  />
                )}
              </div>
              {/* <div className="fx-widget-banner fx-widget-banner-warning">
                ⚡ Simulated preview using live API data. The actual iframe
                loads your Corte Spa page and redirects on click.
              </div> */}
            </>
          )}

          {/* Embed Code */}
          {mode === "code" && (
            <>
              <div className="fx-widget-code-wrap">
                <button
                  className={`fx-widget-copy-btn${copied ? " fx-widget-copy-success" : ""}`}
                  onClick={handleCopy}
                >
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
                <pre className="fx-widget-code-block">{iframeCode}</pre>
              </div>

              <div className="fx-widget-banner fx-widget-banner-success">
                <p className="fx-widget-banner-title">
                  How to embed on your site:
                </p>
                <ol>
                  <li>Copy the embed code above</li>
                  <li>
                    Paste into WordPress "Custom HTML" block, Elementor HTML
                    widget, or any embed block
                  </li>
                  <li>
                    Visitors see your widget inline — clicks redirect to your
                    booking page
                  </li>
                </ol>
              </div>

              <div className="fx-widget-banner fx-widget-banner-info">
                <strong>WordPress tip:</strong> Use a "Custom HTML" Gutenberg
                block and paste the code. Works with Elementor, Divi, and any
                page builder that supports HTML embeds.
              </div>
            </>
          )}

          {/* Widget type cards */}
          {/* <div className="fx-widget-info-grid">
            <p className="fx-widget-info-header">Available widgets</p>
            {[
              {
                icon: "📅",
                title: "Booking Calendar",
                desc: "Date picker with live pricing per day fetched from your API. Redirects on date selection.",
              },
              {
                icon: "🃏",
                title: "Service Cards",
                desc: "Live grid of spa services with images, category badges, and starting prices from your API.",
              },
            ].map((w) => (
              <div key={w.title} className="fx-widget-info-card">
                <span className="fx-widget-info-card-icon">{w.icon}</span>
                <p className="fx-widget-info-card-title">{w.title}</p>
                <p className="fx-widget-info-card-desc">{w.desc}</p>
              </div>
            ))}
          </div> */}
        </main>
      </div>
    </div>
  );
}
