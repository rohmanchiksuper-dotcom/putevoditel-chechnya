(function () {
  "use strict";

  var stops = window.ROUTE_STOPS || [];
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================= helpers ================= */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function srcLink(t, u) {
    return esc(t) + '. <a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(u) + "</a>";
  }
  function stopTitleHTML(t) {
    // «Цой-Педе — «город мёртвых»» → обычная часть + курсив
    var i = t.indexOf(" — ");
    if (i > 0) return '<span class="split">' + esc(t.slice(0, i)) + '</span> <em class="split">— ' + esc(t.slice(i + 3)) + "</em>";
    return '<span class="split">' + esc(t) + "</span>";
  }

  function shortLead(t) {
    // для сцены — первые одно-два предложения, полный текст в панели «Читать полностью»
    var sent = t.match(/[^.!?]+[.!?]+(\s|$)/g) || [t];
    var out = sent[0];
    if (sent[1] && (out + sent[1]).length < 230) out += sent[1];
    return out.trim();
  }

  /* ================= заставка ================= */
  var intro = $("#intro");
  document.body.classList.add("locked");
  function closeIntro() {
    if (!intro || intro.classList.contains("gone")) return;
    intro.classList.add("gone");
    document.body.classList.remove("locked");
    setTimeout(function () { intro.remove(); }, 1400);
    setTimeout(function () { $("#hero").classList.add("in"); }, 250);
  }
  setTimeout(function () { intro && intro.classList.add("ready"); }, reduce ? 50 : 1900);
  $("#enter").addEventListener("click", closeIntro);
  document.addEventListener("keydown", function (e) {
    if (intro && !intro.classList.contains("gone") && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); closeIntro(); }
  });
  intro.addEventListener("wheel", function () { if (intro.classList.contains("ready")) closeIntro(); }, { passive: true });

  /* ================= остановки ================= */
  var host = $("#stops");
  var html = "";
  stops.forEach(function (s) {
    var kind = s.type === "main" ? "Главная остановка" : "По пути";
    var file = "images/" + s.photo;
    var chips = s.facts.slice(0, 4).map(function (f, i) {
      return '<li class="chip" style="--i:' + i + '"><b>' + esc(f[1]) + "</b><span>" + esc(f[0]) + "</span></li>";
    }).join("");
    var credit = s.credit
      ? 'Фото: <a href="' + esc(s.credit.url) + '" target="_blank" rel="noopener">' + esc(s.credit.author) + ", " + esc(s.credit.license) + "</a>"
      : "";
    html +=
      '<section class="scene stop ' + s.type + '" id="stop-' + s.n + '" data-n="' + s.n + '">' +
        '<div class="scene-bg"><img src="' + esc(file) + '" alt="' + esc(s.photoAlt) + '" data-file="' + esc(file) + '" loading="lazy"></div>' +
        '<div class="scene-scrim"></div>' +
        '<div class="big-num" aria-hidden="true">' + pad(s.n) + "</div>" +
        '<button class="photo-btn" type="button" data-photo="' + s.n + '">Фото на весь экран</button>' +
        '<div class="scene-content">' +
          '<p class="eyebrow tag"><i></i>' + kind + " · " + esc(s.place) + "</p>" +
          '<svg class="orn" viewBox="0 0 154 22" aria-hidden="true"><path pathLength="1" d="M2 11h40m70 0h40M52 11c0-6 8-9 12-5s-2 10-6 7M102 11c0-6-8-9-12-5s2 10 6 7M66 11c4-8 18-8 22 0s-18 8-22 0z"/></svg>' +
          '<h2 class="split-title' + (s.title.length > 28 ? " long" : "") + '">' + stopTitleHTML(s.title) + "</h2>" +
          '<p class="lead">' + esc(shortLead(s.text[0])) + "</p>" +
          '<ul class="chips">' + chips + "</ul>" +
          '<div class="stop-actions">' +
            '<button class="btn" type="button" data-read="' + s.n + '"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3h5v10H2zM9 3h5v10H9z" fill="none"/></svg>Читать полностью</button>' +
            '<button class="btn ghost" type="button" data-map="' + s.n + '">На карте</button>' +
          "</div>" +
        "</div>" +
        '<p class="capt">' + credit + "</p>" +
      "</section>";
    if (s.next) {
      html += '<div class="next-strip reveal"><span class="arrow"><i></i>дальше</span><p>' + esc(s.next) + "</p></div>";
    }
  });
  host.innerHTML = html;

  /* ================= источники ================= */
  $("#sources-by-stop").innerHTML = stops.map(function (s) {
    return "<details><summary>" + pad(s.n) + " · " + esc(s.title) + "</summary><ol>" +
      s.sources.map(function (x) { return "<li>" + srcLink(x[0], x[1]) + "</li>"; }).join("") + "</ol></details>";
  }).join("");
  $("#photo-credits").innerHTML = stops.filter(function (s) { return s.credit; }).map(function (s) {
    return "<li>" + pad(s.n) + ". " + esc(s.title) + " — " + esc(s.credit.author) + ", " + esc(s.credit.license) +
      ', Викимедиа Коммонс. <a href="' + esc(s.credit.url) + '" target="_blank" rel="noopener">' + esc(decodeURI(s.credit.url)) + "</a></li>";
  }).join("") +
    "<li>Монета 10 рублей 2010 «Чеченская Республика» — фото аверса и реверса; описание по данным Банка России.</li>";

  /* ================= разбивка заголовков на слова ================= */
  $$(".split-title").forEach(function (h) {
    var i = 0;
    $$(".split", h).forEach(function (el) {
      var words = el.textContent.split(/\s+/).filter(Boolean);
      el.innerHTML = words.map(function (w) {
        return '<span class="w"><span style="--i:' + (i++) + '">' + esc(w) + "</span></span>";
      }).join(" ");
    });
  });
  $$(".stat-grid li").forEach(function (li, i) { li.style.setProperty("--i", i); });

  /* ================= фото: заглушка, если файла нет ================= */
  function attachFallback(img) {
    var file = img.getAttribute("data-file");
    function swap() {
      var d = document.createElement("div");
      d.className = "photo-missing";
      d.innerHTML = "<span>Здесь будет фото</span><code>" + esc(file) + "</code>";
      img.replaceWith(d);
    }
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) swap();
    else img.addEventListener("error", swap, { once: true });
  }
  $$("img[data-file]").forEach(attachFallback);

  /* ================= появление при прокрутке ================= */
  var counted = [];
  function countUp(el) {
    if (counted.indexOf(el) >= 0) return;
    counted.push(el);
    var to = parseFloat(el.getAttribute("data-count"));
    var dec = parseInt(el.getAttribute("data-dec") || "0", 10);
    var t0 = null, dur = reduce ? 1 : 1600;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = (to * e).toFixed(dec).replace(".", ",");
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      $$("[data-count]", en.target).forEach(countUp);
    });
  }, { threshold: 0.25 });
  $$(".scene:not(.hero), .reveal, .sources-section").forEach(function (el) { io.observe(el); });

  /* ================= шкала маршрута, меню, прогресс ================= */
  var rail = $("#rail"), mark = $("#rail-mark"), ticks = $("#rail-ticks");
  function railH() { return rail.getBoundingClientRect().height; }
  ticks.innerHTML = stops.map(function (s, i) {
    return '<div class="rail-tick ' + s.type + '" data-go="' + s.n + '" style="top:' + (i / (stops.length - 1) * 100) + '%"><span>' + pad(s.n) + "</span></div>";
  }).join("");
  ticks.addEventListener("click", function (e) {
    var t = e.target.closest("[data-go]");
    if (t) document.getElementById("stop-" + t.getAttribute("data-go")).scrollIntoView({ behavior: "smooth" });
  });

  var stopEls = $$(".stop"), menuLinks = $$(".menu a");
  var bgs = $$(".scene-bg"), bigWord = $(".big-word");
  var progress = $("#progress");
  var current = 0;
  var SHORT = ["Комплекс Славы", "Нацмузей", "Мечеть", "Грозный-Сити", "Цветочный парк", "Грозненское море", "Аргунское ущелье", "Нихалой", "Ушкалой", "Цой-Педе"];

  function setCurrent(n) {
    if (n === current) return;
    current = n;
    var s = stops[n - 1];
    $("#rail-num").textContent = pad(n);
    $("#rail-name").textContent = SHORT[n - 1] || s.title;
    mark.style.transform = "translateY(" + ((n - 1) / (stops.length - 1)) * railH() + "px)";
    $$(".rail-tick", ticks).forEach(function (t, i) { t.classList.toggle("done", i < n); });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var vh = window.innerHeight, doc = document.documentElement;
      progress.style.transform = "scaleX(" + (window.scrollY / Math.max(1, doc.scrollHeight - vh)) + ")";

      // параллакс фоновых фото
      if (!reduce) {
        bgs.forEach(function (bg) {
          var r = bg.parentNode.getBoundingClientRect();
          if (r.bottom < -100 || r.top > vh + 100) return;
          bg.style.transform = "translate3d(0," + (r.top * -0.12).toFixed(1) + "px,0)";
        });
        if (bigWord) bigWord.style.setProperty("--px", (bigWord.parentNode.getBoundingClientRect().top * 0.25).toFixed(1) + "px");
      }

      // какая остановка в центре экрана
      stopEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.55 && r.bottom > vh * 0.45) setCurrent(+el.getAttribute("data-n"));
      });
      var firstTop = stopEls[0].getBoundingClientRect().top;
      var lastBottom = stopEls[stopEls.length - 1].getBoundingClientRect().bottom;
      rail.classList.toggle("show", firstTop < vh * 0.5 && lastBottom > vh * 0.5);

      // подсветка пункта меню
      var ids = ["about", "map-section", "stop-1", "coin", "sources"], active = -1;
      ids.forEach(function (id, i) {
        var el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < vh * 0.5) active = i;
      });
      menuLinks.forEach(function (a, i) { a.classList.toggle("cur", i === active); });
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { var c = current; current = 0; setCurrent(c || 1); onScroll(); });
  setCurrent(1);
  onScroll();

  /* ================= наклон карточек за курсором ================= */
  document.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse") return;
    var c = e.target.closest && e.target.closest(".chip, .stat-grid li");
    if (!c) return;
    var r = c.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    c.classList.add("tilting");
    c.style.setProperty("--ry", ((x - .5) * 14).toFixed(1) + "deg");
    c.style.setProperty("--rx", ((.5 - y) * 14).toFixed(1) + "deg");
    c.style.setProperty("--gx", (x * 100).toFixed(0) + "%");
    c.style.setProperty("--gy", (y * 100).toFixed(0) + "%");
  });
  document.addEventListener("pointerout", function (e) {
    var c = e.target.closest && e.target.closest(".chip, .stat-grid li");
    if (c && !c.contains(e.relatedTarget)) { c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); }
  });

  /* ================= панель «Читать полностью» ================= */
  var drawer = $("#drawer"), back = $("#drawer-back"), dIn = $("#drawer-inner");
  var lastFocus = null;
  function openDrawer(n) {
    var s = stops[n - 1];
    var file = "images/" + s.photo;
    dIn.innerHTML =
      '<div class="d-photo" data-photo="' + n + '"><img src="' + esc(file) + '" alt="' + esc(s.photoAlt) + '" data-file="' + esc(file) + '"></div>' +
      '<div class="d-body">' +
        '<p class="eyebrow">' + pad(n) + " · " + (s.type === "main" ? "Главная остановка" : "По пути") + "</p>" +
        '<h3 id="drawer-title">' + esc(s.title) + "</h3>" +
        '<p class="d-place">' + esc(s.place) + "</p>" +
        s.text.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") +
        '<ul class="d-facts">' + s.facts.map(function (f) { return "<li><b>" + esc(f[0]) + "</b><span>" + esc(f[1]) + "</span></li>"; }).join("") + "</ul>" +
        '<div class="d-block sig"><h4>Почему это важно для региона и России</h4><p>' + esc(s.significance) + "</p></div>" +
        '<div class="d-block how"><h4>Как добраться</h4><ul>' + s.howto.map(function (h) { return "<li>" + esc(h) + "</li>"; }).join("") + "</ul></div>" +
        '<details class="d-sources" open><summary>Источники (' + s.sources.length + ")</summary><ol>" +
          s.sources.map(function (x) { return "<li>" + srcLink(x[0], x[1]) + "</li>"; }).join("") + "</ol></details>" +
        '<p class="d-meta">' + (s.author ? "Текст: " + esc(s.author) + ". " : "") +
          (s.credit ? 'Фото: <a href="' + esc(s.credit.url) + '" target="_blank" rel="noopener">' + esc(s.credit.author) + ", " + esc(s.credit.license) + "</a>" : "") + "</p>" +
      "</div>";
    $$("img[data-file]", dIn).forEach(attachFallback);
    lastFocus = document.activeElement;
    drawer.hidden = false;
    requestAnimationFrame(function () { drawer.classList.add("show"); back.classList.add("show"); });
    document.body.classList.add("locked");
    dIn.scrollTop = 0;
    setTimeout(function () { $("#drawer-x").focus({ preventScroll: true }); }, 50);
  }
  function closeDrawer() {
    drawer.classList.remove("show"); back.classList.remove("show");
    document.body.classList.remove("locked");
    setTimeout(function () { if (!drawer.classList.contains("show")) drawer.hidden = true; }, 700);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  $("#drawer-x").addEventListener("click", closeDrawer);
  back.addEventListener("click", closeDrawer);

  /* ================= фото на весь экран ================= */
  var lb = $("#lightbox");
  function openLightbox(n, x, y) {
    var s = stops[n - 1];
    $("#lb-img").src = "images/" + s.photo;
    $("#lb-img").alt = s.photoAlt;
    $("#lb-k").textContent = pad(n) + " · " + s.place;
    $("#lb-t").textContent = s.title;
    lb.style.setProperty("--x", x + "px");
    lb.style.setProperty("--y", y + "px");
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
  }
  function closeLightbox() { lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true"); }
  $("#lb-x").addEventListener("click", closeLightbox);
  lb.addEventListener("click", function (e) { if (e.target === lb || e.target.id === "lb-img") closeLightbox(); });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (lb.classList.contains("open")) closeLightbox();
    else if (drawer.classList.contains("show")) closeDrawer();
  });

  /* ================= монета ================= */
  var coin = $("#coin3d"), coinSide = 0;
  coin.addEventListener("click", function () {
    coin.classList.add("user");
    coinSide += 180;
    coin.style.transform = "rotateY(" + coinSide + "deg)";
  });

  /* ================= карта ================= */
  var map = null, markers = {};
  function focusStop(n) {
    var s = stops[n - 1];
    map.flyTo([s.lat, s.lng], s.n <= 2 ? 16 : 13.5, { duration: reduce ? 0 : 1.8, easeLinearity: 0.1 });
    map.once("moveend", function () { markers[n].openPopup(); });
    $$("#stop-list button").forEach(function (b) { b.classList.toggle("act", +b.getAttribute("data-n") === n); });
  }
  function showOnMap(n) {
    document.getElementById("map-section").scrollIntoView({ behavior: "smooth" });
    if (map) setTimeout(function () { focusStop(n); }, 500);
  }

  // общий обработчик кликов
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-read],[data-map],[data-photo],#stop-list button[data-n]");
    if (!t) return;
    if (t.hasAttribute("data-read")) openDrawer(+t.getAttribute("data-read"));
    else if (t.hasAttribute("data-map")) showOnMap(+t.getAttribute("data-map"));
    else if (t.hasAttribute("data-photo")) openLightbox(+t.getAttribute("data-photo"), e.clientX, e.clientY);
    else if (map) focusStop(+t.getAttribute("data-n"));
  });

  $("#stop-list").innerHTML = stops.map(function (s) {
    return '<li class="' + s.type + '"><button type="button" data-n="' + s.n + '"><span class="n">' + s.n + "</span><span>" +
      esc(s.title) + "<small>" + (s.type === "main" ? "главная" : "по пути") + "</small></span></button></li>";
  }).join("");

  if (typeof L === "undefined") {
    $("#map").innerHTML = '<p style="padding:20px">Не удалось загрузить библиотеку карты (vendor/leaflet.js).</p>';
    return;
  }

  map = L.map("map", { scrollWheelZoom: false, zoomSnap: 0, zoomDelta: 0.5, wheelPxPerZoomLevel: 140, inertiaDeceleration: 2200, easeLinearity: 0.15 });
  map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');

  // Подложка OpenStreetMap.
  // Стандартный сервер tile.openstreetmap.org блокирует страницы, открытые с диска
  // (file://, без заголовка Referer, — вместо карты плитки «Access blocked»),
  // поэтому в таком случае берём тайлы OpenStreetMap France: те же данные OSM, подписи по-русски.
  var osmAttr = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">участники OpenStreetMap</a>';
  var osmStandard = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: osmAttr });
  var osmFrance = L.tileLayer("https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png", {
    maxZoom: 19, subdomains: "abc", attribution: osmAttr + ", тайлы OpenStreetMap France"
  });
  var isFile = location.protocol === "file:";
  var primary = isFile ? osmFrance : osmStandard;
  var backup = osmFrance;
  primary.addTo(map);
  if (!isFile) {
    L.control.layers({ "OpenStreetMap": osmStandard, "OpenStreetMap France": osmFrance }, null, { position: "topright" }).addTo(map);
  }

  var loaded = 0, errors = 0, switched = false, offlineNote = $("#map-offline");
  function watch(layer) {
    layer.on("tileload", function () { loaded++; offlineNote.hidden = true; });
    layer.on("tileerror", function () {
      errors++;
      if (loaded === 0 && errors >= 4) {
        if (!switched && primary !== backup) { switched = true; errors = 0; map.removeLayer(primary); backup.addTo(map); }
        else offlineNote.hidden = false;
      }
    });
  }
  watch(osmStandard); watch(osmFrance);
  if (!navigator.onLine) offlineNote.hidden = false;

  // линия маршрута по порядку точек: сначала «прорисовывается», потом становится пунктиром
  var latlngs = stops.map(function (s) { return [s.lat, s.lng]; });
  L.polyline(latlngs, { color: "#e6c867", weight: 12, opacity: 0.12, lineJoin: "round", interactive: false }).addTo(map);
  L.polyline(latlngs, { color: "#e6c867", weight: 6, opacity: 0.14, lineJoin: "round", interactive: false }).addTo(map);
  var line = L.polyline(latlngs, { color: "#e6c867", weight: 3, className: "route-line", lineJoin: "round", lineCap: "round" }).addTo(map);

  var FAN = { 1: [-46, -26], 2: [-23, -13], 3: [0, 0], 4: [23, 13], 5: [46, 26] };
  stops.forEach(function (s) {
    var size = s.type === "main" ? 32 : 28;
    var icon = L.divIcon({
      className: "",
      // пять точек в центре Грозного на общем плане сливаются — раскладываем их кружки «веером»
      html: '<div class="num-marker ' + s.type + '"' + (FAN[s.n] ? ' style="--ox:' + FAN[s.n][0] + 'px;--oy:' + FAN[s.n][1] + 'px"' : "") + ">" + s.n + "</div>",
      iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2]
    });
    var popup =
      '<div class="popup-tag">' + (s.type === "main" ? "Главная остановка" : "По пути") + " · №" + s.n + "</div>" +
      '<p class="popup-title">' + esc(s.title) + "</p>" +
      '<ul class="popup-list">' + s.popup.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>" +
      '<a class="popup-link" href="#stop-' + s.n + '">Подробнее ↓</a>';
    markers[s.n] = L.marker([s.lat, s.lng], {
      icon: icon, title: s.n + ". " + s.title, zIndexOffset: s.type === "main" ? 1000 : 0
    }).addTo(map).bindPopup(popup, { maxWidth: 280 });
  });

  function farClass() { map.getContainer().classList.toggle("far", map.getZoom() < 12); }
  map.on("zoomend", farClass);
  map.fitBounds(L.latLngBounds(latlngs), { paddingTopLeft: [70, 70], paddingBottomRight: [70, 40] });
  farClass();

  // реальная длина линии — чтобы «прорисовка» шла ровно
  var path = line.getElement && line.getElement();
  if (path && path.getTotalLength) {
    var len = Math.ceil(path.getTotalLength()) + 10;
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    var lio = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      lio.disconnect();
      setTimeout(function () { path.style.strokeDashoffset = "0"; }, 300);
      setTimeout(function () {
        path.style.strokeDasharray = ""; path.style.strokeDashoffset = ""; path.classList.add("drawn");
      }, reduce ? 300 : 3700);
    }, { threshold: 0.3 });
    lio.observe($("#map"));
  }

  window.ARGUN = { map: map, markers: markers, stops: stops, focusStop: focusStop, latlngs: latlngs };
  document.dispatchEvent(new Event("argun:map"));

  // Щипок двумя пальцами на тачпаде: Chrome/Firefox/Edge присылают wheel с ctrlKey,
  // Safari — события gesture*. Карта увеличивается вокруг курсора, страница при этом не масштабируется.
  var mc = map.getContainer(), zTarget = null, zPoint = null, zRaf = 0;
  function clampZ(z) { return Math.max(map.getMinZoom() || 3, Math.min(18, z)); }
  function applyZoom() {
    zRaf = 0;
    if (zTarget === null) return;
    map.setZoomAround(zPoint, zTarget, { animate: false });
  }
  mc.addEventListener("wheel", function (e) {
    if (!e.ctrlKey || map.scrollWheelZoom.enabled()) return;
    e.preventDefault();
    var base = zTarget === null ? map.getZoom() : zTarget;
    zTarget = clampZ(base - e.deltaY * 0.013);
    zPoint = map.mouseEventToContainerPoint(e);
    if (!zRaf) zRaf = requestAnimationFrame(applyZoom);
    clearTimeout(mc._zt); mc._zt = setTimeout(function () { zTarget = null; }, 160);
  }, { passive: false });
  var gStart = null;
  mc.addEventListener("gesturestart", function (e) { e.preventDefault(); gStart = map.getZoom(); });
  mc.addEventListener("gesturechange", function (e) {
    e.preventDefault();
    if (gStart === null) return;
    zTarget = clampZ(gStart + Math.log2(e.scale));
    zPoint = map.mouseEventToContainerPoint(e);
    if (!zRaf) zRaf = requestAnimationFrame(applyZoom);
  });
  mc.addEventListener("gestureend", function (e) { e.preventDefault(); gStart = null; zTarget = null; });

  map.on("click", function () { map.scrollWheelZoom.enable(); });
  map.on("mouseout", function () { map.scrollWheelZoom.disable(); });
  window.addEventListener("resize", function () { map.invalidateSize(); });
})();
