(function () {
  "use strict";

  var header = document.getElementById("header");
  var navToggle = document.getElementById("navToggle");
  var navMenu = document.getElementById("navMenu");
  var navClose = document.getElementById("navClose");
  var SCROLL_OFFSET = 80;

  function getHeaderOffset() {
    return header ? header.offsetHeight : SCROLL_OFFSET;
  }

  function scrollToHash(hash, behavior) {
    if (!hash || hash === "#") {
      window.scrollTo({ top: 0, behavior: behavior || "smooth" });
      return;
    }
    var el = document.querySelector(hash);
    if (!el) return;
    var top = el.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
    window.scrollTo({ top: Math.max(0, top), behavior: behavior || "smooth" });
  }

  function setMobileNavOpen(isOpen) {
    if (navMenu) {
      navMenu.classList.toggle("is-open", isOpen);
      navMenu.setAttribute("aria-hidden", isOpen ? "false" : "true");
    }
    if (navToggle) {
      navToggle.classList.toggle("is-active", isOpen);
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    }
    document.body.classList.toggle("nav-open", isOpen);
    document.documentElement.classList.toggle("nav-open", isOpen);
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    if (isOpen && navClose) {
      navClose.focus();
    }
  }

  function closeMobileNav() {
    setMobileNavOpen(false);
  }

  function toggleMobileNav() {
    var open = !(navMenu && navMenu.classList.contains("is-open"));
    setMobileNavOpen(open);
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var href = link.getAttribute("href");
      if (!href || href === "#") return;
      if (href.length > 1 && document.querySelector(href)) {
        e.preventDefault();
        scrollToHash(href);
        closeMobileNav();
      }
    });
  });

  function pathLooksLikeIndex() {
    var p = window.location.pathname || "";
    return /index\.html$/i.test(p) || p === "/" || /\/$/.test(p) || p === "";
  }

  document.querySelectorAll('a[href*="index.html#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var href = link.getAttribute("href");
      if (!href || href.indexOf("#") < 0) return;
      var i = href.indexOf("#");
      var filePart = href.slice(0, i);
      var hash = href.slice(i);
      if (hash.length < 2) return;
      if (!pathLooksLikeIndex()) return;
      if (filePart !== "" && filePart !== "index.html" && filePart !== "./index.html") return;
      if (!document.querySelector(hash)) return;
      e.preventDefault();
      scrollToHash(hash);
      closeMobileNav();
    });
  });

  if (navMenu) {
    navMenu.addEventListener("click", function (e) {
      var link = e.target.closest("a");
      if (link && navMenu.contains(link)) closeMobileNav();
    });
  }

  function onScrollHeader() {
    if (!header) return;
    if (window.scrollY > 40) {
      header.classList.add("header--scrolled");
    } else {
      header.classList.remove("header--scrolled");
    }
  }

  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      toggleMobileNav();
    });
  }

  if (navClose) {
    navClose.addEventListener("click", function (e) {
      e.stopPropagation();
      closeMobileNav();
    });
  }

  window.addEventListener("resize", function () {
    if (window.matchMedia("(min-width: 769px)").matches) {
      closeMobileNav();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (document.body.classList.contains("nav-open")) {
      closeMobileNav();
    }
  });

  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.08,
      }
    );
    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  if (window.location.hash && document.querySelector(window.location.hash)) {
    window.addEventListener("load", function () {
      scrollToHash(window.location.hash, "auto");
    });
  }

  function initBaSlider(root) {
    var track = root.querySelector("[data-ba-track]");
    var clip = root.querySelector("[data-ba-clip]");
    var handle = root.querySelector("[data-ba-handle]");
    if (!track || !clip || !handle) return;

    function syncTrackWidth() {
      track.style.setProperty("--ba-track-w", track.offsetWidth + "px");
    }

    function posFromClient(clientX) {
      var rect = track.getBoundingClientRect();
      if (rect.width <= 0) return 50;
      return ((clientX - rect.left) / rect.width) * 100;
    }

    function setPos(percent) {
      var min = parseFloat(handle.getAttribute("aria-valuemin") || "3", 10);
      var max = parseFloat(handle.getAttribute("aria-valuemax") || "97", 10);
      var p = Math.min(max, Math.max(min, percent));
      clip.style.width = p + "%";
      handle.style.left = p + "%";
      handle.setAttribute("aria-valuenow", String(Math.round(p)));
    }

    var dragging = false;

    function onDocMouseMove(e) {
      if (!dragging) return;
      setPos(posFromClient(e.clientX));
    }

    function endDrag() {
      dragging = false;
    }

    track.addEventListener("mousedown", function (e) {
      if (e.button !== 0) return;
      if (handle.contains(e.target)) return;
      dragging = true;
      setPos(posFromClient(e.clientX));
      e.preventDefault();
    });

    handle.addEventListener("mousedown", function (e) {
      e.stopPropagation();
      if (e.button !== 0) return;
      dragging = true;
      e.preventDefault();
    });

    document.addEventListener("mousemove", onDocMouseMove);
    document.addEventListener("mouseup", endDrag);

    track.addEventListener(
      "touchstart",
      function (e) {
        if (handle.contains(e.target)) return;
        if (!e.touches[0]) return;
        dragging = true;
        setPos(posFromClient(e.touches[0].clientX));
      },
      { passive: true }
    );

    handle.addEventListener(
      "touchstart",
      function (e) {
        e.stopPropagation();
        dragging = true;
      },
      { passive: true }
    );

    document.addEventListener(
      "touchmove",
      function (e) {
        if (!dragging || !e.touches[0]) return;
        setPos(posFromClient(e.touches[0].clientX));
      },
      { passive: true }
    );
    document.addEventListener("touchend", endDrag);
    document.addEventListener("touchcancel", endDrag);

    handle.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      var current = parseFloat(handle.getAttribute("aria-valuenow") || "50", 10);
      if (Number.isNaN(current)) current = 50;
      setPos(current + (e.key === "ArrowRight" ? 4 : -4));
    });

    window.addEventListener("resize", syncTrackWidth);
    if ("ResizeObserver" in window) {
      new ResizeObserver(syncTrackWidth).observe(track);
    }

    syncTrackWidth();
    setPos(50);
  }

  document.querySelectorAll("[data-ba-slider]").forEach(initBaSlider);

  document.querySelectorAll(".gallery-masonry__cell").forEach(function (cell) {
    cell.addEventListener("mousemove", function (e) {
      var r = cell.getBoundingClientRect();
      var x = ((e.clientX - r.left) / r.width) * 100;
      var y = ((e.clientY - r.top) / r.height) * 100;
      cell.style.setProperty("--gx", x + "%");
      cell.style.setProperty("--gy", y + "%");
    });
  });

  var cookieBanner = document.getElementById("cookieConsent");
  var cookieAccept = document.getElementById("cookieConsentAccept");
  var COOKIE_CONSENT_KEY = "gstaad_cookie_consent";
  if (cookieBanner && localStorage.getItem(COOKIE_CONSENT_KEY) !== "1") {
    cookieBanner.hidden = false;
  }
  if (cookieAccept && cookieBanner) {
    cookieAccept.addEventListener("click", function () {
      localStorage.setItem(COOKIE_CONSENT_KEY, "1");
      cookieBanner.hidden = true;
    });
  }
})();
