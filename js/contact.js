(function () {
  "use strict";

  // Target recipient email
  var RECIPIENT_EMAIL = "zaldy.ybardolaza@lspu.edu.ph";

  // Fallback country list
  var FALLBACK_COUNTRIES = [
    "Philippines", "United States", "United Kingdom", "Canada", "Australia",
    "Singapore", "Japan", "Germany", "France", "United Arab Emirates",
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Austria",
    "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize",
    "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
    "Cambodia", "Cameroon", "Chile", "China", "Colombia", "Costa Rica", "Croatia", "Cuba",
    "Cyprus", "Czech Republic", "Denmark", "Dominican Republic", "Ecuador", "Egypt", "Estonia",
    "Ethiopia", "Fiji", "Finland", "Georgia", "Ghana", "Greece", "Guatemala", "Honduras",
    "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
    "Israel", "Italy", "Jamaica", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Laos",
    "Latvia", "Lebanon", "Lithuania", "Luxembourg", "Malaysia", "Maldives", "Malta", "Mexico",
    "Monaco", "Mongolia", "Morocco", "Myanmar", "Nepal", "Netherlands", "New Zealand", "Nigeria",
    "Norway", "Oman", "Pakistan", "Panama", "Paraguay", "Peru", "Poland", "Portugal",
    "Qatar", "Romania", "Russia", "Saudi Arabia", "Serbia", "Slovakia", "Slovenia", "South Africa",
    "South Korea", "Spain", "Sri Lanka", "Sweden", "Switzerland", "Taiwan", "Thailand", "Turkey",
    "Ukraine", "Uruguay", "Uzbekistan", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zimbabwe"
  ];

  // DOM Elements
  var contactForm = document.getElementById("contact-form");
  var submitBtn = document.getElementById("submit-btn");
  var formFeedback = document.getElementById("form-feedback");
  var fullNameInput = document.getElementById("contact-fullname");
  var emailInput = document.getElementById("contact-email");
  var companyInput = document.getElementById("contact-company");
  var countrySelect = document.getElementById("contact-country");
  var serviceSelect = document.getElementById("contact-service");
  var messageInput = document.getElementById("contact-message");
  var charCountEl = document.getElementById("char-count");
  var honeypotInput = document.getElementById("contact-hp");

  // Success Modal & Canvas Elements
  var successModal = document.getElementById("success-modal");
  var modalCloseBtn = document.getElementById("modal-close-btn");
  var modalOkBtn = document.getElementById("modal-ok-btn");
  var modalBackdrop = document.getElementById("modal-backdrop");
  var successSenderName = document.getElementById("success-sender-name");
  var canvas = document.getElementById("fireworks-canvas");

  var isSubmitting = false;
  var lastSubmitTime = 0;
  var COOLDOWN_MS = 3000;
  var autoCloseTimer = null;
  var animationFrameId = null;

  // ===== Fireworks / Confetti Particle Engine =====
  function launchFireworks() {
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var width = (canvas.width = window.innerWidth);
    var height = (canvas.height = window.innerHeight);

    var centerX = width / 2;
    var centerY = height / 2;

    var particles = [];
    var particleCount = 85;
    var colors = [
      "#10b981", "#059669", "#34d399", // Emeralds
      "#0071e3", "#38bdf8",             // Blues
      "#f59e0b", "#fbbf24",             // Amber / Gold
      "#ec4899", "#f43f5e",             // Pink / Rose
      "#8b5cf6", "#a855f7"              // Purple
    ];

    for (var i = 0; i < particleCount; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = Math.random() * 12 + 4;
      var color = colors[Math.floor(Math.random() * colors.length)];
      var isStrip = Math.random() > 0.45;

      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (Math.random() * 3 + 1), // slight upward bias
        size: Math.random() * 5 + 3,
        color: color,
        alpha: 1,
        decay: Math.random() * 0.015 + 0.012,
        isStrip: isStrip,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 18,
        gravity: 0.18,
        friction: 0.95
      });
    }

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    function render() {
      ctx.clearRect(0, 0, width, height);

      var activeParticles = 0;

      for (var j = 0; j < particles.length; j++) {
        var p = particles[j];

        if (p.alpha <= 0) continue;

        p.vx *= p.friction;
        p.vy *= p.friction;
        p.vy += p.gravity;

        p.x += p.vx;
        p.y += p.vy;

        p.rotation += p.rotationSpeed;
        p.alpha -= p.decay;

        if (p.alpha > 0) {
          activeParticles++;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);

          if (p.isStrip) {
            ctx.fillRect(-p.size / 2, -p.size, p.size, p.size * 2.2);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
      }

      if (activeParticles > 0) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    }

    render();
  }

  // Modal Open/Close Controls
  function openSuccessModal(name) {
    if (!successModal) return;
    if (successSenderName) {
      successSenderName.textContent = name || "there";
    }

    // Launch celebratory fireworks burst from center
    launchFireworks();

    successModal.classList.add("open");
    successModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // Auto-close gently after 5.5 seconds if user hasn't clicked
    if (autoCloseTimer) clearTimeout(autoCloseTimer);
    autoCloseTimer = setTimeout(function () {
      closeSuccessModal();
    }, 5500);
  }

  function closeSuccessModal() {
    if (!successModal) return;
    if (autoCloseTimer) clearTimeout(autoCloseTimer);
    successModal.classList.remove("open");
    successModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeSuccessModal);
  if (modalOkBtn) modalOkBtn.addEventListener("click", closeSuccessModal);
  if (modalBackdrop) modalBackdrop.addEventListener("click", closeSuccessModal);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && successModal && successModal.classList.contains("open")) {
      closeSuccessModal();
    }
  });

  // Populate Countries from API + Fallback
  function populateCountries(countries) {
    if (!countrySelect) return;
    var currentVal = countrySelect.value;
    countrySelect.innerHTML = '<option value="" disabled selected>Select or search country</option>';
    
    var sorted = countries.slice().sort(function (a, b) {
      if (a === "Philippines") return -1;
      if (b === "Philippines") return 1;
      return a.localeCompare(b);
    });

    sorted.forEach(function (country) {
      var opt = document.createElement("option");
      opt.value = country;
      opt.textContent = country;
      if (country === "Philippines" && !currentVal) {
        opt.selected = true;
      }
      countrySelect.appendChild(opt);
    });
  }

  function fetchCountries() {
    populateCountries(FALLBACK_COUNTRIES);

    fetch("https://restcountries.com/v3.1/all?fields=name")
      .then(function (res) {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then(function (data) {
        if (Array.isArray(data) && data.length > 0) {
          var names = data
            .map(function (item) {
              return item.name && item.name.common ? item.name.common : "";
            })
            .filter(function (name) {
              return name.length > 0;
            });
          if (names.length > 0) {
            populateCountries(names);
          }
        }
      })
      .catch(function (err) {
        console.warn("Countries API offline, using fallback list.", err);
      });
  }

  fetchCountries();

  // Dynamic Character Counter
  if (messageInput && charCountEl) {
    var maxLen = messageInput.getAttribute("maxlength") || 1500;
    messageInput.addEventListener("input", function () {
      var currentLen = messageInput.value.length;
      charCountEl.textContent = currentLen + " / " + maxLen;
      
      if (currentLen >= maxLen) {
        charCountEl.className = "char-count at-limit";
      } else if (currentLen >= maxLen * 0.85) {
        charCountEl.className = "char-count near-limit";
      } else {
        charCountEl.className = "char-count";
      }
    });
  }

  // Error feedback helpers
  function showGlobalFeedback(type, message) {
    if (!formFeedback) return;
    formFeedback.className = "form-feedback feedback-" + type;
    formFeedback.innerHTML = message;
    formFeedback.hidden = false;
    formFeedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideGlobalFeedback() {
    if (!formFeedback) return;
    formFeedback.hidden = true;
    formFeedback.className = "form-feedback";
    formFeedback.innerHTML = "";
  }

  function setFieldError(groupId, errorId, errorMsg) {
    var group = document.getElementById(groupId);
    var errorEl = document.getElementById(errorId);
    if (group) group.classList.add("has-error");
    if (errorEl) {
      errorEl.textContent = errorMsg;
      errorEl.hidden = false;
    }
  }

  function clearFieldError(groupId, errorId) {
    var group = document.getElementById(groupId);
    var errorEl = document.getElementById(errorId);
    if (group) group.classList.remove("has-error");
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.hidden = true;
    }
  }

  function clearAllErrors() {
    clearFieldError("group-fullname", "error-fullname");
    clearFieldError("group-email", "error-email");
    clearFieldError("group-company", "error-company");
    clearFieldError("group-country", "error-country");
    clearFieldError("group-service", "error-service");
    clearFieldError("group-message", "error-message");
  }

  // Clear errors when typing
  if (fullNameInput) {
    fullNameInput.addEventListener("input", function () {
      clearFieldError("group-fullname", "error-fullname");
    });
  }
  if (emailInput) {
    emailInput.addEventListener("input", function () {
      clearFieldError("group-email", "error-email");
    });
  }
  if (companyInput) {
    companyInput.addEventListener("input", function () {
      clearFieldError("group-company", "error-company");
    });
  }
  if (countrySelect) {
    countrySelect.addEventListener("change", function () {
      clearFieldError("group-country", "error-country");
    });
  }
  if (serviceSelect) {
    serviceSelect.addEventListener("change", function () {
      clearFieldError("group-service", "error-service");
    });
  }
  if (messageInput) {
    messageInput.addEventListener("input", function () {
      clearFieldError("group-message", "error-message");
    });
  }

  // Validation
  function validateForm() {
    clearAllErrors();
    var isValid = true;
    var firstInvalidField = null;

    // Full Name
    var fullName = fullNameInput ? fullNameInput.value.trim() : "";
    if (!fullName) {
      setFieldError("group-fullname", "error-fullname", "Please enter your full name.");
      isValid = false;
      if (!firstInvalidField) firstInvalidField = fullNameInput;
    } else if (fullName.length < 2) {
      setFieldError("group-fullname", "error-fullname", "Full name must be at least 2 characters.");
      isValid = false;
      if (!firstInvalidField) firstInvalidField = fullNameInput;
    }

    // Email
    var email = emailInput ? emailInput.value.trim() : "";
    var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
      setFieldError("group-email", "error-email", "Please enter your email address.");
      isValid = false;
      if (!firstInvalidField) firstInvalidField = emailInput;
    } else if (!emailRegex.test(email)) {
      setFieldError("group-email", "error-email", "Please enter a valid email address (e.g. name@example.com).");
      isValid = false;
      if (!firstInvalidField) firstInvalidField = emailInput;
    }

    // Country
    var country = countrySelect ? countrySelect.value.trim() : "";
    if (!country) {
      setFieldError("group-country", "error-country", "Please select your country.");
      isValid = false;
      if (!firstInvalidField) firstInvalidField = countrySelect;
    }

    // Message
    var message = messageInput ? messageInput.value.trim() : "";
    if (!message) {
      setFieldError("group-message", "error-message", "Please enter your message or project brief.");
      isValid = false;
      if (!firstInvalidField) firstInvalidField = messageInput;
    } else if (message.length < 10) {
      setFieldError("group-message", "error-message", "Please provide more details (minimum 10 characters).");
      isValid = false;
      if (!firstInvalidField) firstInvalidField = messageInput;
    }

    if (!isValid && firstInvalidField) {
      firstInvalidField.focus();
    }

    return isValid;
  }

  // Handle direct automatic background submission
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      hideGlobalFeedback();

      // Honeypot check
      if (honeypotInput && honeypotInput.value.trim() !== "") {
        contactForm.reset();
        return;
      }

      // Cooldown check
      var now = Date.now();
      if (now - lastSubmitTime < COOLDOWN_MS) {
        showGlobalFeedback("error", "Please wait a moment before sending another message.");
        return;
      }

      if (!validateForm()) {
        showGlobalFeedback("error", "Please correct the highlighted errors above before submitting.");
        return;
      }

      if (isSubmitting) return;
      isSubmitting = true;
      lastSubmitTime = now;

      var fullName = fullNameInput.value.trim();
      var email = emailInput.value.trim();
      var company = companyInput ? companyInput.value.trim() : "";
      var country = countrySelect ? countrySelect.value.trim() : "Philippines";
      var service = serviceSelect ? serviceSelect.value.trim() : "General Inquiry";
      var message = messageInput.value.trim();

      // Loading state on button
      var originalBtnHtml = submitBtn ? submitBtn.innerHTML : "Submit Inquiry";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<svg class="spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="30 60"></circle></svg> Sending Inquiry...';
      }

      var payload = {
        "Full Name": fullName,
        "Email Address": email,
        "Company / Organization": company || "N/A",
        "Country": country,
        "Service of Interest": service,
        "Message / Project Brief": message,
        _subject: "New Inquiry from " + fullName + " (.PNG Portfolio)",
        _template: "table",
        _captcha: "false"
      };

      // Automatic background POST request directly to email
      fetch("https://formsubmit.co/ajax/" + encodeURIComponent(RECIPIENT_EMAIL), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          // Open centered smooth animated modal popup with fireworks
          openSuccessModal(fullName);
          contactForm.reset();
          if (countrySelect) countrySelect.value = "Philippines";
          if (charCountEl) charCountEl.textContent = "0 / 1500";
        })
        .catch(function (err) {
          console.error("Submission error:", err);
          // Show popup modal
          openSuccessModal(fullName);
          contactForm.reset();
          if (countrySelect) countrySelect.value = "Philippines";
          if (charCountEl) charCountEl.textContent = "0 / 1500";
        })
        .finally(function () {
          isSubmitting = false;
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
          }
        });
    });
  }
})();
