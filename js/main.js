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

  var showreel = document.getElementById("showreel");
  var showreelFrame = document.getElementById("showreel-frame");
  var soundHint = document.getElementById("sound-hint");
  var soundUnlocked = false;

  if (showreel && showreelFrame) {
    function unlockSound() {
      showreel.muted = false;
      soundUnlocked = true;
      if (soundHint) {
        soundHint.style.display = "none";
      }
      document.removeEventListener("pointerdown", unlockSound);
      document.removeEventListener("keydown", unlockSound);
    }

    function playShowreel() {
      if (soundUnlocked) {
        showreel.play();
        return;
      }
      showreel.muted = false;
      var attempt = showreel.play();
      if (attempt) {
        attempt.catch(function () {
          showreel.muted = true;
          showreel.play();
          if (soundHint) {
            soundHint.style.display = "flex";
          }
          document.addEventListener("pointerdown", unlockSound);
          document.addEventListener("keydown", unlockSound);
        });
      }
    }

    if (soundHint) {
      soundHint.addEventListener("click", function () {
        unlockSound();
        showreel.play();
      });
    }

    if ("IntersectionObserver" in window) {
      var videoObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              playShowreel();
            } else {
              showreel.pause();
            }
          });
        },
        { threshold: 0.35 }
      );
      videoObserver.observe(showreelFrame);
    } else {
      playShowreel();
    }
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

  function setAvatarNames(id) {
    pickCards.forEach(function (c) {
      var av = c.querySelector(".pick-avatar");
      var nm = c.querySelector(".pick-name");
      var isTarget = c.getAttribute("data-member") === id;
      av.style.viewTransitionName = isTarget ? "team-" + id : "";
      nm.style.viewTransitionName = isTarget ? "team-name-" + id : "";
    });
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
        var next = card.classList.contains("active") ? null : id;
        setAvatarNames(next);
        runWithTransition(function () {
          setAvatarNames(null);
          applyState(next);
        });
      });
    });

    document.addEventListener("click", function (e) {
      if (teamShowcase.contains(e.target)) return;
      if (showcaseStage.classList.contains("open")) {
        setAvatarNames(null);
        runWithTransition(function () {
          applyState(null);
        });
      }
    });
  }

  var photoModal = document.getElementById("photo-modal");
  if (photoModal) {
    var photoImages = [];
    var photoSiteUrl = null;
    var photoDownloadUrl = null;
    var photoIndex = 0;
    var photoImg = document.getElementById("photo-img");
    var photoTitle = document.getElementById("photo-title");
    var photoCounter = document.getElementById("photo-counter");
    var photoDots = document.getElementById("photo-dots");
    var photoStage = document.getElementById("photo-stage");
    var photoPrev = document.getElementById("photo-prev");
    var photoNext = document.getElementById("photo-next");
    var photoSite = document.getElementById("photo-site");
    var photoDownload = document.getElementById("photo-download");

    var photoGalleries = [
      {
        trigger: document.getElementById("gallery-trigger"),
        site: null,
        download: "https://github.com/zorojuro0101/Velare_Mobile_Ecommerce/releases/download/v1.0.7/Velare.apk",
        items: [
          { src: "login.jpg", title: "Login Page" },
          { src: "register.jpg", title: "Register Page" },
          { src: "view_product.jpg", title: "View Product Page" }
        ]
      },
      {
        trigger: document.getElementById("uniorg-trigger"),
        site: "https://uniorg-6yjm.onrender.com",
        download: null,
        items: [
          { src: "uniorg-placeholder-1.svg", title: "Dashboard" },
          { src: "uniorg-placeholder-2.svg", title: "Documents" },
          { src: "uniorg-placeholder-3.svg", title: "Elections" }
        ]
      }
    ];

    function photoPath(item) {
      return "../images/" + item.src;
    }

    function updatePhoto() {
      if (!photoImg) return;
      photoImg.classList.remove("loaded");
      var item = photoImages[photoIndex];
      photoImg.onload = function () {
        photoImg.classList.add("loaded");
      };
      photoImg.src = photoPath(item);
      if (photoTitle) {
        photoTitle.textContent = item.title;
      }
      if (photoCounter) {
        photoCounter.textContent = photoIndex + 1 + " / " + photoImages.length;
      }
      if (photoDots) {
        photoDots.innerHTML = "";
        photoImages.forEach(function (_, i) {
          var dot = document.createElement("span");
          dot.className = "photo-dot" + (i === photoIndex ? " active" : "");
          photoDots.appendChild(dot);
        });
      }
      if (photoSite) {
        if (photoSiteUrl) {
          photoSite.href = photoSiteUrl;
          photoSite.hidden = false;
        } else {
          photoSite.hidden = true;
        }
      }
      if (photoDownload) {
        if (photoDownloadUrl) {
          photoDownload.href = photoDownloadUrl;
          photoDownload.hidden = false;
        } else {
          photoDownload.hidden = true;
        }
      }
    }

    function openPhotoModal() {
      photoModal.hidden = false;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          photoModal.classList.add("open");
        });
      });
      updatePhoto();
      document.body.style.overflow = "hidden";
    }

    function closePhotoModal() {
      photoModal.classList.remove("open");
      document.body.style.overflow = "";
      setTimeout(function () {
        photoModal.hidden = true;
      }, 450);
    }

    function photoStep(dir) {
      photoIndex = (photoIndex + dir + photoImages.length) % photoImages.length;
      updatePhoto();
    }

    photoGalleries.forEach(function (gallery) {
      if (!gallery.trigger) return;
      gallery.trigger.addEventListener("click", function () {
        photoImages = gallery.items;
        photoSiteUrl = gallery.site;
        photoDownloadUrl = gallery.download;
        photoIndex = 0;
        openPhotoModal();
      });
      gallery.trigger.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          photoImages = gallery.items;
          photoSiteUrl = gallery.site;
          photoDownloadUrl = gallery.download;
          photoIndex = 0;
          openPhotoModal();
        }
      });
    });

    photoModal.querySelectorAll("[data-photo-close]").forEach(function (el) {
      el.addEventListener("click", closePhotoModal);
    });

    if (photoPrev) {
      photoPrev.addEventListener("click", function () {
        photoStep(-1);
      });
    }
    if (photoNext) {
      photoNext.addEventListener("click", function () {
        photoStep(1);
      });
    }

    document.addEventListener("keydown", function (e) {
      if (photoModal.hidden) return;
      if (e.key === "Escape") {
        closePhotoModal();
      } else if (e.key === "ArrowLeft") {
        photoStep(-1);
      } else if (e.key === "ArrowRight") {
        photoStep(1);
      }
    });

    var touchX = null;
    if (photoStage) {
      photoStage.addEventListener("touchstart", function (e) {
        touchX = e.touches[0].clientX;
      }, { passive: true });

      photoStage.addEventListener("touchend", function (e) {
        if (touchX === null) return;
        var dx = e.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(dx) > 40) {
          photoStep(dx > 0 ? -1 : 1);
        }
      }, { passive: true });
    }
  }
})();
