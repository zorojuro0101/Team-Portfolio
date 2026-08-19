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

  var galleryTriggers = document.querySelectorAll("[data-gallery]");
  var photoModal = document.getElementById("photo-modal");
  if (galleryTriggers.length && photoModal) {
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

    galleryTriggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        photoImages = JSON.parse(trigger.getAttribute("data-gallery"));
        photoSiteUrl = trigger.getAttribute("data-site");
        photoDownloadUrl = trigger.getAttribute("data-download");
        var acct = trigger.getAttribute("data-account");
        accountData = acct ? JSON.parse(acct) : null;
        if (photoSample) {
          photoSample.hidden = !accountData;
        }
        if (photoStage) {
          photoStage.classList.toggle("inset", trigger.id === "uniorg-trigger");
        }
        photoIndex = 0;
        openPhotoModal();
      });
      trigger.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          photoImages = JSON.parse(trigger.getAttribute("data-gallery"));
          photoSiteUrl = trigger.getAttribute("data-site");
          photoDownloadUrl = trigger.getAttribute("data-download");
          var acct = trigger.getAttribute("data-account");
          accountData = acct ? JSON.parse(acct) : null;
          if (photoSample) {
            photoSample.hidden = !accountData;
          }
          if (photoStage) {
            photoStage.classList.toggle("inset", trigger.id === "uniorg-trigger");
          }
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
      if (accountModal && !accountModal.hidden) return;
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

  var accountModal = document.getElementById("account-modal");
  var photoSample = document.getElementById("photo-sample");
  var accountEmail = document.getElementById("account-email");
  var accountPassword = document.getElementById("account-password");
  var accountCta = document.getElementById("account-cta");
  var accountData = null;

  function openAccountModal() {
    if (!accountModal) return;
    if (photoModal && !photoModal.hidden) {
      photoModal.classList.add("shift-left");
    }
    if (accountData) {
      var idLabel = document.getElementById("account-id-label");
      if (accountData.id) {
        if (accountEmail) accountEmail.textContent = accountData.id;
        if (idLabel) idLabel.textContent = "Student ID";
      } else {
        if (accountEmail) accountEmail.textContent = accountData.email;
        if (idLabel) idLabel.textContent = "Email";
      }
      if (accountPassword) accountPassword.textContent = accountData.password;
    }
    if (accountCta) {
      if (photoSiteUrl) {
        accountCta.href = photoSiteUrl;
        accountCta.innerHTML = 'Open Website <svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/></svg>';
        accountCta.hidden = false;
      } else if (photoDownloadUrl) {
        accountCta.href = photoDownloadUrl;
        accountCta.innerHTML = 'Download APK <svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>';
        accountCta.hidden = false;
      } else {
        accountCta.hidden = true;
      }
    }
    accountModal.hidden = false;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        accountModal.classList.add("open");
      });
    });
    document.body.style.overflow = "hidden";
  }

  function closeAccountModal() {
    if (!accountModal || accountModal.hidden) return;
    accountModal.classList.remove("open");
    if (photoModal) photoModal.classList.remove("shift-left");
    setTimeout(function () {
      accountModal.hidden = true;
    }, 450);
    if (photoModal && photoModal.hidden) {
      document.body.style.overflow = "";
    }
  }

  if (photoSample) {
    photoSample.addEventListener("click", openAccountModal);
  }

  if (accountModal) {
    accountModal.querySelectorAll("[data-account-close]").forEach(function (el) {
      el.addEventListener("click", closeAccountModal);
    });
  }

  document.querySelectorAll("[data-copy-target]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = document.getElementById(btn.getAttribute("data-copy-target"));
      var text = target ? target.textContent.trim() : "";
      var label = btn.querySelector("[data-copy-label]");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          if (label) {
            var original = label.textContent;
            label.textContent = "Copied!";
            setTimeout(function () {
              label.textContent = original;
            }, 1600);
          }
        });
      }
    });
  });

  // ===== Automated Project Slideshow Crossfade =====
  var slideshowTracks = document.querySelectorAll("[data-slideshow]");
  if (slideshowTracks.length) {
    slideshowTracks.forEach(function (track) {
      var slides = track.querySelectorAll(".slideshow-slide");
      if (slides.length <= 1) return;
      var currentSlide = 0;
      setInterval(function () {
        slides[currentSlide].classList.remove("active");
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add("active");
      }, 3500);
    });
  }

  document.addEventListener("keydown", function (e) {
    if (accountModal && !accountModal.hidden && e.key === "Escape") {
      closeAccountModal();
    }
  });
})();
