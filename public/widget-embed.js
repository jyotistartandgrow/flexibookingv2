(function () {
  var STYLE_ID = "fx-widget-embed-style";

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;

    var css = ""
      + ".fx-embed-root{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1e293b;max-width:100%;}" 
      + ".fx-embed-stage{background:#f1f5f9;border-radius:16px;padding:16px;min-height:300px;}"
      + ".fx-embed-loading,.fx-embed-error{display:flex;align-items:center;justify-content:center;min-height:140px;font-size:13px;color:#64748b;}"
      + ".fx-embed-error{color:#dc2626;}"
      + ".fx-embed-cal{background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;max-width:320px;}"
      + ".fx-embed-cal-header{padding:12px 14px 0;border-bottom:1px solid #eef2f7;}"
      + ".fx-embed-cal-nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}"
      + ".fx-embed-cal-nav button{border:none;background:none;font-size:18px;cursor:pointer;color:#64748b;padding:3px 6px;}"
      + ".fx-embed-cal-month{font-size:13px;font-weight:700;letter-spacing:1.6px;}"
      + ".fx-embed-days{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;margin-bottom:8px;}"
      + ".fx-embed-days span{font-size:10px;color:#94a3b8;font-weight:600;padding:2px 0;}"
      + ".fx-embed-cal-body{padding:8px 10px 12px;}"
      + ".fx-embed-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;}"
      + ".fx-embed-cell{min-height:36px;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:12px;}"
      + ".fx-embed-cell.empty{pointer-events:none;}"
      + ".fx-embed-cell.unavailable .num{color:#cbd5e1;}"
      + ".fx-embed-cell.bookable{cursor:pointer;}"
      + ".fx-embed-cell.bookable:hover{background:color-mix(in srgb,var(--fx-accent,#0ea5e9) 12%,#fff);}"
      + ".fx-embed-cell .price{font-size:9px;font-weight:600;color:var(--fx-accent,#0ea5e9);margin-top:2px;}"
      + ".fx-embed-cards-wrap{width:100%;}"
      + ".fx-embed-toggle{display:inline-flex;gap:6px;padding:4px;border:1px solid #e2e8f0;border-radius:999px;background:#fff;margin-bottom:12px;}"
      + ".fx-embed-toggle button{border:none;background:transparent;border-radius:999px;padding:7px 14px;font-size:12px;font-weight:700;color:#64748b;cursor:pointer;}"
      + ".fx-embed-toggle button.active{background:color-mix(in srgb,var(--fx-accent,#0ea5e9) 20%, #fff);color:var(--fx-accent,#0ea5e9);}"
      + ".fx-embed-cards{display:grid;gap:14px;}"
      + ".fx-embed-cards.cols-1{grid-template-columns:1fr;}"
      + ".fx-embed-cards.cols-2{grid-template-columns:repeat(2,minmax(0,1fr));}"
      + ".fx-embed-cards.cols-3{grid-template-columns:repeat(3,minmax(0,1fr));}"
      + ".fx-embed-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;cursor:pointer;}"
      + ".fx-embed-img-wrap{height:170px;background:#e2e8f0;position:relative;}"
      + ".fx-embed-img{width:100%;height:100%;object-fit:cover;display:block;}"
      + ".fx-embed-badge{position:absolute;left:8px;top:8px;background:rgba(255,255,255,.92);font-size:10px;border-radius:12px;padding:4px 6px;font-weight:700;}"
      + ".fx-embed-body{padding:14px;}"
      + ".fx-embed-title{font-size:20px;line-height:1.2;margin:0 0 4px;font-family:serif;color:#1e293b;}"
      + ".fx-embed-desc{font-size:13px;color:#94a3b8;margin:0 0 10px;min-height:36px;}"
      + ".fx-embed-footer{display:flex;justify-content:space-between;align-items:center;font-size:14px;color:#64748b;}"
      + ".fx-embed-footer strong{color:var(--fx-accent,#0ea5e9);font-size:28px;font-family:serif;line-height:1;}"
      + ".fx-embed-arrow{color:var(--fx-accent,#0ea5e9);font-size:20px;}"
      + ".fx-embed-carousel{display:flex;align-items:center;gap:10px;}"
      + ".fx-embed-arrow-btn{border:1px solid #dbe1eb;background:#fff;width:34px;height:34px;border-radius:999px;cursor:pointer;font-size:20px;color:#334155;}"
      + ".fx-embed-track{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;flex:1;}"
      + ".fx-embed-track::-webkit-scrollbar{display:none;}"
      + ".fx-embed-slide{flex:0 0 calc((100% - 28px)/3);min-width:240px;scroll-snap-align:start;}"
      + "@media (max-width:860px){.fx-embed-cards.cols-3{grid-template-columns:repeat(2,minmax(0,1fr));}.fx-embed-slide{flex:0 0 70%;}}"
      + "@media (max-width:520px){.fx-embed-cards.cols-2,.fx-embed-cards.cols-3{grid-template-columns:1fr;}.fx-embed-arrow-btn{display:none;}.fx-embed-slide{flex:0 0 85%;}}";

    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function parsePrice(raw) {
    return String(raw || "")
      .replace(/&#0128;|&#8364;|&euro;|€/gi, "")
      .trim()
      .split(",")[0]
      .trim();
  }

  function monthKey(year, month) {
    return year + "-" + String(month + 1).padStart(2, "0");
  }

  function monthOffset(year, month) {
    var d = new Date(year, month, 1).getDay();
    return (d + 6) % 7;
  }

  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function buildApiUrl(base, path) {
    var b = String(base || "").replace(/\/+$/, "");
    var p = String(path || "").replace(/^\/+/, "");
    return b + "/" + p;
  }

  function renderCalendar(root, cfg) {
    var today = new Date();
    var state = {
      y: today.getFullYear(),
      m: today.getMonth(),
      dataByMonth: {},
      loading: false,
      error: "",
    };

    function fetchMonth(y, m) {
      var key = monthKey(y, m);
      if (state.dataByMonth[key]) return Promise.resolve();

      state.loading = true;
      state.error = "";
      repaint();

      return fetch(buildApiUrl(cfg.apiBase, "service-availability-calendar?month=" + key))
        .then(function (r) { return r.json(); })
        .then(function (json) {
          if (json.status === 200 && Array.isArray(json.data)) {
            var map = {};
            json.data.forEach(function (d) { map[d.date] = d; });
            state.dataByMonth[key] = map;
          } else {
            state.error = "Failed to load calendar.";
          }
        })
        .catch(function () {
          state.error = "Network error loading calendar.";
        })
        .finally(function () {
          state.loading = false;
          repaint();
        });
    }

    function repaint() {
      var key = monthKey(state.y, state.m);
      var map = state.dataByMonth[key] || {};
      var offset = monthOffset(state.y, state.m);
      var totalDays = daysInMonth(state.y, state.m);
      var totalCells = Math.ceil((offset + totalDays) / 7) * 7;
      var monthLabel = new Date(state.y, state.m, 1).toLocaleString("en-US", { month: "long" }).toUpperCase();

      var html = ""
        + '<div class="fx-embed-stage" style="--fx-accent:' + cfg.accent + ';max-width:' + cfg.width + 'px;min-height:' + cfg.height + 'px">'
        + '  <div class="fx-embed-cal">'
        + '    <div class="fx-embed-cal-header">'
        + '      <div class="fx-embed-cal-nav">'
        + '        <button data-nav="prev" type="button">‹</button>'
        + '        <span class="fx-embed-cal-month">' + monthLabel + " " + state.y + "</span>"
        + '        <button data-nav="next" type="button">›</button>'
        + '      </div>'
        + '      <div class="fx-embed-days"><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span></div>'
        + '    </div>'
        + '    <div class="fx-embed-cal-body">';

      if (state.loading) {
        html += '<div class="fx-embed-loading">Loading dates...</div>';
      } else if (state.error) {
        html += '<div class="fx-embed-error">' + state.error + '</div>';
      } else {
        html += '<div class="fx-embed-grid">';
        for (var i = 0; i < totalCells; i += 1) {
          var day = i - offset + 1;
          if (day < 1 || day > totalDays) {
            html += '<div class="fx-embed-cell empty"></div>';
            continue;
          }

          var dateStr = key + "-" + String(day).padStart(2, "0");
          var info = map[dateStr] || {};
          var bookable = !!info.is_bookable;
          var cls = "fx-embed-cell " + (bookable ? "bookable" : "unavailable");
          html += '<div class="' + cls + '" data-date="' + dateStr + '" data-bookable="' + (bookable ? "1" : "0") + '">';
          html += '<span class="num">' + day + '</span>';
          if (bookable && info.price) {
            html += '<span class="price">€' + parsePrice(info.price) + '</span>';
          }
          html += "</div>";
        }
        html += "</div>";
      }

      html += "    </div></div></div>";
      root.innerHTML = html;

      var prevBtn = root.querySelector('[data-nav="prev"]');
      var nextBtn = root.querySelector('[data-nav="next"]');
      if (prevBtn) {
        prevBtn.addEventListener("click", function () {
          if (state.m === 0) {
            state.m = 11;
            state.y -= 1;
          } else {
            state.m -= 1;
          }
          fetchMonth(state.y, state.m);
          repaint();
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener("click", function () {
          if (state.m === 11) {
            state.m = 0;
            state.y += 1;
          } else {
            state.m += 1;
          }
          fetchMonth(state.y, state.m);
          repaint();
        });
      }

      root.querySelectorAll(".fx-embed-cell.bookable").forEach(function (el) {
        el.addEventListener("click", function () {
          window.open(cfg.redirect, "_blank", "noopener,noreferrer");
        });
      });
    }

    fetchMonth(state.y, state.m);
    repaint();
  }

  function cardMarkup(s, cfg) {
    var img = s.svc_img ? '<img class="fx-embed-img" src="' + s.svc_img + '" alt="' + (s.service_title || "") + '" />' : "";
    var badge = cfg.showCategory ? '<span class="fx-embed-badge">' + (s.category_name || "") + '</span>' : "";
    return ""
      + '<div class="fx-embed-card" role="button" tabindex="0">'
      + '  <div class="fx-embed-img-wrap">' + img + badge + "</div>"
      + '  <div class="fx-embed-body">'
      + '    <p class="fx-embed-title">' + (s.service_title || "") + "</p>"
      + '    <p class="fx-embed-desc">' + (s.svc_short_desc || "") + "</p>"
      + '    <div class="fx-embed-footer"><span>from <strong>€' + parsePrice(s.svc_price || "") + '</strong></span><span class="fx-embed-arrow">›</span></div>'
      + "  </div>"
      + "</div>";
  }

  function renderCards(root, cfg) {
    root.innerHTML = '<div class="fx-embed-stage" style="--fx-accent:' + cfg.accent + ';max-width:' + cfg.width + 'px;min-height:' + cfg.height + 'px"><div class="fx-embed-loading">Loading services...</div></div>';

    var today = new Date().toISOString().slice(0, 10);
    fetch(buildApiUrl(cfg.apiBase, "services?date=" + today + "&category=&all=true"))
      .then(function (r) { return r.json(); })
      .then(function (json) {
        if (!(json.status === 200 && Array.isArray(json.data))) {
          throw new Error("bad_data");
        }

        var services = json.data.filter(function (s) {
          return s.service_title !== "Request test" && s.service_title !== "TEST";
        });

        var hasCarousel = services.length > 0;
        var cardsHtml = services.map(function (s) { return cardMarkup(s, cfg); }).join("");

        var html = ""
          + '<div class="fx-embed-stage" style="--fx-accent:' + cfg.accent + ';max-width:' + cfg.width + 'px;min-height:' + cfg.height + 'px">'
          + '  <div class="fx-embed-cards-wrap">'
          + '    <div class="fx-embed-toggle">'
          + '      <button type="button" data-view="grid" class="active">Grid</button>'
          + '      <button type="button" data-view="carousel">Carousel</button>'
          + '    </div>'
          + '    <div class="fx-embed-view fx-grid-view">'
          + '      <div class="fx-embed-cards cols-' + cfg.cols + '">' + cardsHtml + '</div>'
          + '    </div>';

        if (hasCarousel) {
          html += ""
            + '    <div class="fx-embed-view fx-carousel-view" style="display:none">'
            + '      <div class="fx-embed-carousel">'
            + '        <button class="fx-embed-arrow-btn" data-arrow="prev" type="button">‹</button>'
            + '        <div class="fx-embed-track">'
            + services.map(function (s) { return '<div class="fx-embed-slide">' + cardMarkup(s, cfg) + '</div>'; }).join("")
            + "        </div>"
            + '        <button class="fx-embed-arrow-btn" data-arrow="next" type="button">›</button>'
            + "      </div>"
            + "    </div>";
        }

        html += "  </div></div>";
        root.innerHTML = html;

        function bindCardClicks(scope) {
          scope.querySelectorAll(".fx-embed-card").forEach(function (card) {
            card.addEventListener("click", function () {
              window.open(cfg.redirect, "_blank", "noopener,noreferrer");
            });
            card.addEventListener("keydown", function (e) {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                window.open(cfg.redirect, "_blank", "noopener,noreferrer");
              }
            });
          });
        }

        bindCardClicks(root);

        var toggleBtns = root.querySelectorAll(".fx-embed-toggle button");
        var gridView = root.querySelector(".fx-grid-view");
        var carouselView = root.querySelector(".fx-carousel-view");

        toggleBtns.forEach(function (btn) {
          btn.addEventListener("click", function () {
            toggleBtns.forEach(function (b) { b.classList.remove("active"); });
            btn.classList.add("active");
            var view = btn.getAttribute("data-view");
            if (view === "carousel" && carouselView) {
              gridView.style.display = "none";
              carouselView.style.display = "block";
            } else {
              gridView.style.display = "block";
              if (carouselView) carouselView.style.display = "none";
            }
          });
        });

        var track = root.querySelector(".fx-embed-track");
        if (track) {
          var prev = root.querySelector('[data-arrow="prev"]');
          var next = root.querySelector('[data-arrow="next"]');
          var getStep = function () {
            var first = track.querySelector(".fx-embed-slide");
            return first ? first.offsetWidth + 14 : 260;
          };
          if (prev) {
            prev.addEventListener("click", function () {
              track.scrollBy({ left: -getStep(), behavior: "smooth" });
            });
          }
          if (next) {
            next.addEventListener("click", function () {
              track.scrollBy({ left: getStep(), behavior: "smooth" });
            });
          }
        }
      })
      .catch(function () {
        root.innerHTML = '<div class="fx-embed-stage" style="--fx-accent:' + cfg.accent + ';max-width:' + cfg.width + 'px;min-height:' + cfg.height + 'px"><div class="fx-embed-error">Failed to load services.</div></div>';
      });
  }

  function boot() {
    addStyle();

    var roots = document.querySelectorAll('[data-fx-widget="1"]');
    if (!roots.length) return;

    roots.forEach(function (root) {
      var cfg = {
        widget: root.dataset.widget === "cards" ? "cards" : "calendar",
        apiBase: root.dataset.apiBase || "",
        accent: root.dataset.accent || "#0ea5e9",
        redirect: root.dataset.redirect || "",
        cols: Number(root.dataset.cols) || 3,
        showCategory: root.dataset.showCategory !== "false",
        width: Number(root.dataset.width) || 700,
        height: Number(root.dataset.height) || 520,
      };

      root.classList.add("fx-embed-root");
      root.style.setProperty("--fx-accent", cfg.accent);

      if (cfg.widget === "cards") {
        renderCards(root, cfg);
      } else {
        renderCalendar(root, cfg);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
