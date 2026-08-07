(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var navToggle = document.querySelector(".nav-toggle");
  var siteNav = document.querySelector(".site-nav");

  function onScroll() {
    if (!header) return;
    if (window.scrollY > 8) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      var open = siteNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });

    siteNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        siteNav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("visible");
    });
  }

  var pickCards = document.querySelectorAll(".pick-card");
  var showcasePanels = document.querySelectorAll(".showcase-panel");
  var showcaseStage = document.querySelector(".showcase-stage");
  var teamShowcase = document.querySelector(".team-showcase");
  var supportsViewTransition = typeof document.startViewTransition === "function";

  function applyState(id) {
    pickCards.forEach(function (c) {
      var active = c.getAttribute("data-member") === id;
      c.classList.toggle("active", active);
      c.setAttribute("aria-pressed", String(active));
    });
    showcasePanels.forEach(function (p) {
      p.classList.toggle("active", p.getAttribute("data-panel") === id);
    });
    if (showcaseStage) {
      showcaseStage.classList.toggle("open", Boolean(id));
    }
  }

  function runWithTransition(update) {
    if (supportsViewTransition) {
      document.startViewTransition(update);
    } else {
      update();
    }
  }

  if (teamShowcase && pickCards.length) {
    pickCards.forEach(function (card) {
      card.addEventListener("click", function () {
        var id = card.getAttribute("data-member");
        var alreadyOpen = card.classList.contains("active");
        runWithTransition(function () {
          applyState(alreadyOpen ? null : id);
        });
      });
    });

    document.addEventListener("click", function (e) {
      if (teamShowcase.contains(e.target)) return;
      if (showcaseStage.classList.contains("open")) {
        runWithTransition(function () {
          applyState(null);
        });
      }
    });
  }
})();
