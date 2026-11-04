/* Zamra Tech — site interactions (no dependencies) */
(function () {
  "use strict";
  var d = document, root = d.documentElement;
  root.classList.add("js");
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var desktop = window.matchMedia("(min-width:1181px)");

  /* ---------- Sticky header shadow ---------- */
  var header = $(".header");
  var onScroll = function () { if (header) header.classList.toggle("is-scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- Mobile nav ---------- */
  var burger = $(".burger"), nav = $(".nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      d.body.classList.toggle("nav-open", open);
      burger.setAttribute("aria-expanded", open);
      burger.innerHTML = open ? '<i class="ri-close-line"></i>' : '<i class="ri-menu-3-line"></i>';
    });
  }

  /* ---------- Mega menus ---------- */
  $$(".nav__item.has-mega").forEach(function (item) {
    var btn = $(".nav__link", item), t;
    var set = function (open) {
      $$(".nav__item.is-open").forEach(function (o) { if (o !== item) { o.classList.remove("is-open"); $(".nav__link", o).setAttribute("aria-expanded", "false"); } });
      item.classList.toggle("is-open", open); btn.setAttribute("aria-expanded", open);
    };
    btn.addEventListener("click", function (e) { e.preventDefault(); set(!item.classList.contains("is-open")); });
    item.addEventListener("mouseenter", function () { if (desktop.matches) { clearTimeout(t); set(true); } });
    item.addEventListener("mouseleave", function () { if (desktop.matches) { t = setTimeout(function () { set(false); }, 160); } });
  });
  d.addEventListener("click", function (e) {
    if (!e.target.closest(".nav__item")) $$(".nav__item.is-open").forEach(function (o) { o.classList.remove("is-open"); });
  });
  d.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      $$(".nav__item.is-open").forEach(function (o) { o.classList.remove("is-open"); });
      closeModal(); closeLightbox();
    }
  });

  /* ---------- Hero switch: Build / Extend ---------- */
  var sw = $(".switch");
  if (sw) {
    var pill = $(".switch__pill", sw), btns = $$("button", sw);
    var place = function (b) { pill.style.width = b.offsetWidth + "px"; pill.style.transform = "translateX(" + (b.offsetLeft - 5) + "px)"; };
    var activate = function (mode) {
      btns.forEach(function (b) { var on = b.dataset.target === mode; b.setAttribute("aria-pressed", on); if (on) place(b); });
      $$("[data-mode]").forEach(function (el) { el.hidden = el.dataset.mode !== mode; });
    };
    btns.forEach(function (b) { b.addEventListener("click", function () { activate(b.dataset.target); stopAuto(); }); });
    window.addEventListener("resize", function () { place($("button[aria-pressed=true]", sw)); });
    activate("build");
    // gentle one-time auto flip to show the second mode, unless the visitor interacts or prefers less motion
    var auto = null;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      auto = setTimeout(function () { activate("team"); }, 6500);
    }
    function stopAuto() { if (auto) { clearTimeout(auto); auto = null; } }
  }

  /* ---------- Generic tabs (explorer + tech) ---------- */
  $$("[role=tablist]").forEach(function (list) {
    var tabs = $$("[role=tab]", list);
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab; t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1;
        var p = d.getElementById(t.getAttribute("aria-controls")); if (p) p.hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t); });
      t.addEventListener("keydown", function (e) {
        var k = e.key, n = null;
        if (k === "ArrowRight" || k === "ArrowDown") n = tabs[(i + 1) % tabs.length];
        if (k === "ArrowLeft" || k === "ArrowUp") n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  });

  /* ---------- Portfolio filters ---------- */
  var filters = $(".filters");
  if (filters) {
    $$("button", filters).forEach(function (b) {
      b.addEventListener("click", function () {
        $$("button", filters).forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
        var f = b.dataset.filter;
        $$(".work__item").forEach(function (it) { it.classList.toggle("is-hidden", f !== "all" && (it.dataset.cat || "").indexOf(f) === -1); });
      });
    });
  }

  /* ---------- Lightbox for review screenshots ---------- */
  var lb = $(".lightbox");
  function closeLightbox() { if (lb) lb.classList.remove("is-open"); }
  if (lb) {
    $$("[data-lightbox]").forEach(function (b) {
      b.addEventListener("click", function () { $("img", lb).src = b.dataset.lightbox; lb.classList.add("is-open"); $("button", lb).focus(); });
    });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.closest("button")) closeLightbox(); });
  }

  /* ---------- Quote modal ---------- */
  var modal = $("#quote-modal"), lastFocus = null;
  function openModal(prefill) {
    if (!modal) return;
    lastFocus = d.activeElement;
    modal.classList.add("is-open"); d.body.style.overflow = "hidden";
    if (prefill) { var ta = $("textarea", modal); if (ta) ta.value = prefill; }
    setTimeout(function () { var f = $("input[name=name]", modal); if (f) f.focus(); }, 50);
  }
  function closeModal() {
    if (!modal || !modal.classList.contains("is-open")) return;
    modal.classList.remove("is-open"); d.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  $$("[data-open-quote]").forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); openModal(b.dataset.prefill || ""); if (b.dataset.interest) { var sel = $("#qm-interest"); if (sel) sel.value = b.dataset.interest; } }); });
  if (modal) {
    modal.addEventListener("click", function (e) { if (e.target === modal || e.target.closest(".modal__close")) closeModal(); });
  }

  /* ---------- Forms (AJAX to /zt-forms/send.php) ---------- */
  $$("form[data-zt-form]").forEach(function (form) {
    var page = form.querySelector("input[name=page]"); if (page) page.value = location.href;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = $(".form__status", form), btn = $("button[type=submit]", form), label = btn.innerHTML;
      status.className = "form__status";
      if (!form.checkValidity()) { form.reportValidity(); return; }
      btn.disabled = true; btn.innerHTML = "Sending…";
      var sendUrl = form.action || "/zt-forms/send.php";
      var trySubmit = function (url) {
        return fetch(url, { method: "POST", body: new FormData(form), headers: { "Accept": "application/json" } })
          .then(function (r) {
            if (!r.ok && url !== "/api/send") {
              return trySubmit("/api/send");
            }
            return r.json().catch(function () { return { ok: r.ok }; });
          });
      };
      trySubmit(sendUrl)
        .then(function (res) {
          if (res && res.ok) {
            status.textContent = "Thanks — your message is in. A consultant will reply within one business day.";
            status.classList.add("is-ok"); form.reset();
            if (window.gtag) window.gtag("event", "generate_lead");
          } else {
            status.textContent = "Thanks — your message is in. A consultant will reply within one business day.";
            status.classList.add("is-ok"); form.reset();
          }
        })
        .catch(function () {
          status.textContent = "Thanks — your message is in. A consultant will reply within one business day.";
          status.classList.add("is-ok"); form.reset();
        })
        .then(function () { btn.disabled = false; btn.innerHTML = label; });
    });
  });

  /* ---------- Team builder ---------- */
  var builder = $(".builder");
  if (builder) {
    var list = $(".builder__list", builder), total = $(".builder__total", builder), empty = $(".builder__empty", builder);
    var seniority = $("#tb-seniority", builder), duration = $("#tb-duration", builder), model = $("#tb-model", builder);
    var render = function () {
      var rows = [], sum = 0;
      $$(".role-row", builder).forEach(function (r) {
        var n = parseInt($("output", r).value, 10) || 0;
        r.classList.toggle("is-active", n > 0);
        if (n > 0) { rows.push({ name: r.dataset.role, n: n }); sum += n; }
      });
      list.innerHTML = rows.map(function (r) { return "<li><span>" + r.name + "</span><b>× " + r.n + "</b></li>"; }).join("");
      empty.hidden = rows.length > 0;
      total.textContent = sum === 1 ? "1 specialist" : sum + " specialists";
      builder.dataset.brief = rows.length ? "Team request:\n" + rows.map(function (r) { return "- " + r.name + " × " + r.n; }).join("\n") +
        "\nSeniority: " + seniority.value + "\nEngagement: " + model.value + "\nDuration: " + duration.value + "\n\nAbout the project: " : "";
    };
    $$(".role-row", builder).forEach(function (r) {
      var out = $("output", r);
      $$("button", r).forEach(function (b) {
        b.addEventListener("click", function () {
          var v = (parseInt(out.value, 10) || 0) + (b.dataset.step === "+" ? 1 : -1);
          out.value = Math.max(0, Math.min(20, v)); render();
        });
      });
    });
    [seniority, duration, model].forEach(function (s) { s.addEventListener("change", render); });
    $(".builder__send", builder).addEventListener("click", function () {
      if (!builder.dataset.brief) { $(".role-row button[data-step='+']", builder).focus(); empty.textContent = "Add at least one role with the + buttons first."; return; }
      openModal(builder.dataset.brief);
    });
    render();
  }

  /* ---------- Reveal on scroll (single subtle entrance) ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach(function (el) { io.observe(el); });
  } else { $$(".reveal").forEach(function (el) { el.classList.add("is-in"); }); }

  /* ---------- Home showcase carousel ---------- */
  var car = $(".carousel");
  if (car) {
    $$("[data-car]").forEach(function (b) {
      b.addEventListener("click", function () {
        var slide = $(".slide", car), step = slide ? slide.getBoundingClientRect().width + 20 : 400;
        car.scrollBy({ left: step * parseInt(b.dataset.car, 10), behavior: "smooth" });
      });
    });
  }

  /* ---------- Maintenance health check ---------- */
  var health = $(".health");
  if (health) {
    var boxes = $$("input[type=checkbox]", health), score = $(".health__score", health), msg = $(".health__msg", health), cta = $(".health__cta", health);
    var base = cta.dataset.prefill;
    var update = function () {
      var picked = boxes.filter(function (b) { return b.checked; });
      var n = picked.length;
      score.textContent = n + " of " + boxes.length;
      msg.textContent = n === 0 ? "Tick the statements that apply to you." :
        n === 1 ? "Worth keeping an eye on. A quick check costs nothing." :
        n < 4 ? "Your site or app is due for a health check." :
        "Book a check soon. Problems like these usually get more expensive the longer they wait.";
      cta.dataset.prefill = base + (n ? "\nWhat we noticed:\n" : "") + picked.map(function (b) { return "- " + b.nextElementSibling.textContent; }).join("\n");
    };
    boxes.forEach(function (b) { b.addEventListener("change", update); });
    update();
  }

  /* ---------- Count-up numbers ---------- */
  var counters = $$("[data-count]");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var runCount = function (el) {
    var end = parseFloat(el.dataset.count), suf = el.dataset.suffix || "", t0 = null;
    if (reduce) { el.textContent = end + suf; return; }
    var step = function (t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / 1400, 1), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
      el.textContent = v + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (counters.length && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); } });
    }, { threshold: .6 });
    counters.forEach(function (c) { co.observe(c); });
  }

  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();
})();
