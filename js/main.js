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

  var serviceCards = document.querySelectorAll("[data-service]");
  if (serviceCards.length) {
    var isMobile = function () {
      return window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
    };

    function closeServicePanels(except) {
      serviceCards.forEach(function (card) {
        if (card === except) return;
        card.classList.remove("open");
        var t = card.querySelector(".service-trigger");
        if (t) {
          t.setAttribute("aria-expanded", "false");
          var g = t.querySelector(".service-trigger-icon-group");
          if (g) g.style.transform = "";
        }
      });
    }

    // ---- Tech-stack marquee: slow right-to-left auto-scroll, fast drag-to-scrub ----
    function setupMarquee(container) {
      if (container.classList.contains("is-marquee")) return;

      var track = document.createElement("div");
      track.className = "marquee-track";
      var group = document.createElement("div");
      group.className = "marquee-group";
      while (container.firstChild) {
        group.appendChild(container.firstChild);
      }
      track.appendChild(group);
      container.appendChild(track);
      container.classList.add("is-marquee");

      var reduced =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var state = {
        offset: 0,
        speed: 0.3, // px per frame - slow and steady
        groupWidth: 0,
        built: false,
        dragging: false,
        startX: 0,
        startOffset: 0
      };

      function build() {
        var viewportW = container.clientWidth;
        if (viewportW < 10) return false;
        while (track.children.length > 1) {
          track.removeChild(track.lastElementChild);
        }
        var copy = group.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        track.appendChild(copy);
        while (track.scrollWidth < viewportW * 2) {
          track.appendChild(copy.cloneNode(true));
        }
        state.groupWidth = group.offsetWidth;
        state.built = true;
        return true;
      }

      function frame() {
        requestAnimationFrame(frame);
        var card = container.closest(".service-card");
        if (!card || !card.classList.contains("open")) return;
        if (state.dragging || reduced) return;
        if (!state.built) {
          if (!build()) return;
          track.style.transform = "translateX(0)";
        } else if (track.scrollWidth < container.clientWidth * 2) {
          // Panel may still be expanding - rebuild once the size is stable
          state.built = false;
          state.offset = 0;
          track.style.transform = "translateX(0)";
          if (!build()) return;
        }
        state.offset -= state.speed;
        if (state.groupWidth && state.offset <= -state.groupWidth) {
          state.offset += state.groupWidth;
        }
        track.style.transform = "translateX(" + state.offset + "px)";
      }

      function onDown(e) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        state.dragging = true;
        if (!state.built) build();
        state.startX = e.clientX;
        state.startOffset = state.offset;
        if (container.setPointerCapture) {
          try {
            container.setPointerCapture(e.pointerId);
          } catch (err) {}
        }
        e.preventDefault();
      }

      function onMove(e) {
        if (!state.dragging) return;
        state.offset = state.startOffset + (e.clientX - state.startX);
        var gw = state.groupWidth;
        if (gw) {
          if (state.offset > 0) state.offset -= gw;
          if (state.offset <= -gw) state.offset += gw;
        }
        track.style.transform = "translateX(" + state.offset + "px)";
      }

      function onUp() {
        state.dragging = false;
      }

      container.addEventListener("pointerdown", onDown);
      container.addEventListener("pointermove", onMove);
      container.addEventListener("pointerup", onUp);
      container.addEventListener("pointercancel", onUp);
      container.addEventListener("lostpointercapture", onUp);

      requestAnimationFrame(frame);
    }

    serviceCards.forEach(function (card) {
      var trigger = card.querySelector(".service-trigger");
      var stackTags = card.querySelector(".service-stack-tags");

      // Mini tech-stack preview in the collapsed header (first 3 logos + "+N")
      if (trigger && stackTags && !trigger.querySelector(".service-trigger-preview")) {
        var logos = stackTags.querySelectorAll(".stack-tag svg");
        if (logos.length) {
          var preview = document.createElement("span");
          preview.className = "service-trigger-preview";
          preview.setAttribute("aria-hidden", "true");
          var shown = Math.min(logos.length, 3);
          for (var i = 0; i < shown; i++) {
            var clone = logos[i].cloneNode(true);
            clone.removeAttribute("width");
            clone.removeAttribute("height");
            clone.setAttribute("class", "preview-logo");
            preview.appendChild(clone);
          }
          if (logos.length > shown) {
            var more = document.createElement("span");
            more.className = "preview-more";
            more.textContent = "+" + (logos.length - shown);
            preview.appendChild(more);
          }
          var chevron = trigger.querySelector(".service-chevron");
          trigger.insertBefore(preview, chevron);
        }
      }

      if (stackTags) setupMarquee(stackTags);

      if (!trigger) return;
      var iconGroup = trigger.querySelector(".service-trigger-icon-group");
      if (iconGroup) iconGroup.style.willChange = "transform";

      function flipOpen() {
        card.classList.add("open");
        trigger.setAttribute("aria-expanded", "true");
      }

      function flipClose() {
        card.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
      }

      trigger.addEventListener("click", function () {
        var wasOpen = card.classList.contains("open");
        serviceCards.forEach(function (other) {
          if (other === card) return;
          if (!other.classList.contains("open")) return;
          other.classList.remove("open");
          var ot = other.querySelector(".service-trigger");
          if (ot) ot.setAttribute("aria-expanded", "false");
        });

        if (wasOpen) {
          flipClose();
          return;
        }
        flipOpen();
        setTimeout(function () {
          var rect = card.getBoundingClientRect();
          if (rect.top < 88) {
            card.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        }, 260);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var openCard = document.querySelector(".service-card.open");
      if (!openCard) return;
      openCard.classList.remove("open");
      var t = openCard.querySelector(".service-trigger");
      if (t) {
        t.setAttribute("aria-expanded", "false");
        t.focus();
      }
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
        if (next && window.matchMedia && window.matchMedia("(max-width: 768px)").matches) {
          // mobile: scroll down to the large circular image/details that appears
          setTimeout(function () {
            var activePanel = document.querySelector('.showcase-panel.active');
            var target = activePanel || showcaseStage;
            if (!target) return;
            var headerEl = document.querySelector(".site-header");
            var headerH = headerEl ? headerEl.offsetHeight : 0;
            var top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
            window.scrollTo({ top: top, behavior: "smooth" });
          }, 120);
        }
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

  // ===== Hover-Triggered Project Slideshow Crossfade =====
  var showcaseItems = document.querySelectorAll(".project-showcase-item");
  if (showcaseItems.length) {
    showcaseItems.forEach(function (item) {
      var track = item.querySelector("[data-slideshow]");
      if (!track) return;
      var slides = track.querySelectorAll(".slideshow-slide");
      if (slides.length <= 1) return;

      var currentSlide = 0;
      var slideInterval = null;

      function nextSlide() {
        slides[currentSlide].classList.remove("active");
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add("active");
      }

      function startSlideshow() {
        if (slideInterval) return;
        // Trigger first step smoothly after a quick moment, then loop
        slideInterval = setInterval(nextSlide, 2200);
      }

      function stopSlideshow() {
        if (slideInterval) {
          clearInterval(slideInterval);
          slideInterval = null;
        }
      }

      item.addEventListener("mouseenter", startSlideshow);
      item.addEventListener("mouseleave", stopSlideshow);
    });
  }

  document.addEventListener("keydown", function (e) {
    if (accountModal && !accountModal.hidden && e.key === "Escape") {
      closeAccountModal();
    }
  });
})();
