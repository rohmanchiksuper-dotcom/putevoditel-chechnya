/* Дополнительные эффекты: золотая пыль, хребты, курсор, «живая» карта */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ============ золотая пыль в шапке ============ */
  var cv = $("#dust"), hero = $("#hero");
  if (cv && cv.getContext && !reduce) {
    var ctx = cv.getContext("2d"), dpr = Math.min(2, window.devicePixelRatio || 1), W = 0, H = 0, parts = [];
    function size() {
      W = hero.clientWidth; H = hero.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(60, W * H / 22000));
      parts = [];
      for (var i = 0; i < n; i++) parts.push(newPart(true));
    }
    function newPart(any) {
      return { x: Math.random() * W, y: any ? Math.random() * H : H + 10, r: Math.random() * 1.8 + .4,
        vy: -(Math.random() * .35 + .08), vx: (Math.random() - .5) * .15, a: Math.random() * .6 + .2, t: Math.random() * 6.28 };
    }
    // одна заранее нарисованная «искра» вместо градиента на каждую частицу в каждом кадре
    var sprite = document.createElement("canvas"); sprite.width = sprite.height = 32;
    var sg = sprite.getContext("2d"), gr = sg.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, "rgba(245,220,140,1)"); gr.addColorStop(1, "rgba(245,220,140,0)");
    sg.fillStyle = gr; sg.fillRect(0, 0, 32, 32);
    var heroVisible = true;
    new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; }).observe(hero);
    function tick() {
      requestAnimationFrame(tick);
      if (!heroVisible || document.hidden) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.t += .02; p.x += p.vx + Math.sin(p.t) * .12; p.y += p.vy;
        if (p.y < -10) parts[i] = newPart(false);
        ctx.globalAlpha = p.a * (.6 + .4 * Math.sin(p.t * 1.7));
        var s = p.r * 8;
        ctx.drawImage(sprite, p.x - s / 2, p.y - s / 2, s, s);
      }
    }
    size(); tick();
    window.addEventListener("resize", size);
  }

  /* ============ параллакс хребтов и фото в шапке ============ */
  var ridges = $$(".ridges path"), heroImg = $("#hero .scene-bg img");
  var mx = 0, my = 0, sy = 0;
  function heroParallax() {
    ridges.forEach(function (p, i) {
      var k = (i + 1) * 0.5;
      p.style.transform = "translate(" + (mx * 10 * k).toFixed(1) + "px," + (sy * (0.12 + i * 0.1) + my * 4 * k).toFixed(1) + "px)";
    });
    if (heroImg && fine) heroImg.style.translate = (mx * -14).toFixed(1) + "px " + (my * -10).toFixed(1) + "px";
  }
  if (!reduce) {
    window.addEventListener("scroll", function () { sy = Math.min(window.scrollY, window.innerHeight); heroParallax(); }, { passive: true });
    if (fine) hero.addEventListener("pointermove", function (e) {
      mx = e.clientX / window.innerWidth - .5; my = e.clientY / window.innerHeight - .5; heroParallax();
    });
  }

  /* ============ курсор-кольцо: идёт ровно за мышью, без задержки ============ */
  var cur = $("#cur");
  if (cur && fine && !reduce) {
    document.body.classList.add("has-cursor");
    var px = -100, py = -100, cRaf = 0, lastHot = null;
    function paint() { cRaf = 0; cur.style.transform = "translate3d(" + px + "px," + py + "px,0)"; }
    document.addEventListener("pointermove", function (e) {
      px = e.clientX; py = e.clientY;
      if (!cRaf) cRaf = requestAnimationFrame(paint);
      var t = e.target;
      if (t !== lastHot) {
        lastHot = t;
        var hot = t.closest && t.closest("a, button, .chip, .leaflet-marker-icon, summary, .d-photo");
        cur.classList.toggle("hot", !!hot);
        cur.classList.toggle("on-map", !!(t.closest && t.closest("#map")) && !hot);
      }
    }, { passive: true });
    document.addEventListener("pointerleave", function () { px = py = -100; paint(); });
  }

  /* ============ живая карта: бегущий огонёк и «Проиграть маршрут» ============ */
  function initMap() {
    var A = window.ARGUN;
    if (!A || !window.L) return;
    var map = A.map, pts = A.latlngs;

    // огонёк, который бесконечно бежит по линии маршрута
    var segs = [], total = 0;
    for (var i = 1; i < pts.length; i++) {
      var d = map.distance(pts[i - 1], pts[i]);
      segs.push(d); total += d;
    }
    var spark = L.marker(pts[0], {
      icon: L.divIcon({ className: "", html: '<div class="spark"></div>', iconSize: [14, 14], iconAnchor: [7, 7] }),
      interactive: false, keyboard: false, zIndexOffset: 2000
    }).addTo(map);
    function at(f) {
      var dist = f * total;
      for (var i = 0; i < segs.length; i++) {
        if (dist <= segs[i]) {
          var k = dist / segs[i], a = pts[i], b = pts[i + 1];
          return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
        }
        dist -= segs[i];
      }
      return pts[pts.length - 1];
    }
    var mapVisible = false, t0 = null, DUR = 16000;
    new IntersectionObserver(function (e) { mapVisible = e[0].isIntersecting; }, { threshold: .1 }).observe($("#map"));
    if (!reduce) (function run(t) {
      requestAnimationFrame(run);
      if (!mapVisible || document.hidden || map._animatingZoom) return;
      if (!t0) t0 = t;
      var f = ((t - t0) % DUR) / DUR;
      f = f < .5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2; // плавный разгон и торможение
      var ll = at(f);
      spark._latlng = L.latLng(ll);
      if (spark._icon) L.DomUtil.setPosition(spark._icon, map.latLngToLayerPoint(spark._latlng).round());
    })(performance.now());
    else spark.remove();

    // «Проиграть маршрут»: камера облетает все остановки по порядку
    var btn = $("#map-play"), playing = false, timer = null, idx = 0;
    function stop() {
      playing = false; clearTimeout(timer);
      btn.classList.remove("on"); $("span", btn).textContent = "Проиграть маршрут";
    }
    function step() {
      if (!playing) return;
      if (idx >= A.stops.length) {
        stop();
        map.closePopup();
        map.flyToBounds(L.latLngBounds(pts), { paddingTopLeft: [70, 70], paddingBottomRight: [70, 40], duration: 2 });
        return;
      }
      A.focusStop(A.stops[idx].n);
      idx++;
      timer = setTimeout(step, 3600);
    }
    btn.addEventListener("click", function () {
      if (playing) { stop(); return; }
      playing = true; idx = 0;
      btn.classList.add("on"); $("span", btn).textContent = "Остановить";
      step();
    });
    map.on("dragstart", stop);
  }
  if (window.ARGUN) initMap(); else document.addEventListener("argun:map", initMap);

})();
