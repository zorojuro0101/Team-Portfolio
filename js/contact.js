(function () {
  "use strict";

  // Recipient email address
  var RECIPIENT_EMAIL = "zaldy.ybardolaza@lspu.edu.ph";

  // Fallback country list in case of network issues with the external API
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

  var isSubmitting = false;
  var lastSubmitTime = 0;
  var COOLDOWN_MS = 3500;

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
        if (!res.ok) throw new Error("API response error");
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
        console.warn("Could not fetch countries API, using fallback list.", err);
      });
  }

  fetchCountries();

  // Character counter for message textarea
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

  // Feedback display helpers
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

  function setFieldError(fieldId, groupId, errorId, errorMsg) {
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

  // Real-time input listeners to clear errors as user types
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

  // Comprehensive Form Validation
  function validateForm() {
    clearAllErrors();
    var isValid = true;
    var firstInvalidField = null;

    // 1. Validate Full Name
    var fullName = fullNameInput ? fullNameInput.value.trim() : "";
    if (!fullName) {
      setFieldError("contact-fullname", "group-fullname", "error-fullname", "Please enter your full name.");
      isValid = false;
      if (!firstInvalidField) firstInvalidField = fullNameInput;
    } else if (fullName.length < 2) {
      setFieldError("contact-fullname", "group-fullname", "error-fullname", "Full name must be at least 2 characters.");
      isValid = false;
      if (!firstInvalidField) firstInvalidField = fullNameInput;
    } else if (fullName.length > 70) {
      setFieldError("contact-fullname", "group-fullname", "error-fullname", "Full name must not exceed 70 characters.");
      isValid = false;
      if (!firstInvalidField) firstInvalidField = fullNameInput;
    } else if (/^[\d\s!@#$%^&*()_+=\[\]{};:"\\|<>/?]+$/.test(fullName)) {
      setFieldError("contact-fullname", "group-fullname", "error-fullname", "Please enter a valid person or organization name.");
      isValid = false;
      if (!firstInvalidField) firstInvalidField = fullNameInput;
    }

    // 2. Validate Email Address
    var email = emailInput ? emailInput.value.trim() : "";
    var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
      setFieldError("contact-email", "group-email", "error-email", "Please enter your email address.");
      isValid = false;
      if (!firstInvalidField) firstInvalidField = emailInput;
    } else if (!emailRegex.test(email)) {
      setFieldError("contact-email", "group-email", "error-email", "Please enter a valid email address (e.g. name@example.com).");
      isValid = false;
      if (!firstInvalidField) firstInvalidField = emailInput;
    } else if (email.length > 90) {
      setFieldError("contact-email", "group-email", "error-email", "Email address is too long (maximum 90 characters).");
      isValid = false;
      if (!firstInvalidField) firstInvalidField = emailInput;
    }

    // 3. Validate Company (Optional, max length check)
    var company = companyInput ? companyInput.value.trim() : "";
    if (company.length > 100) {
      setFieldError("contact-company", "group-company", "error-company", "Company name must not exceed 100 characters.");
      isValid = false;
      if (!firstInvalidField) firstInvalidField = companyInput;
    }

    // 4. Validate Country
    var country = countrySelect ? countrySelect.value.trim() : "";
    if (!country) {
      setFieldError("contact-country", "group-country", "error-country", "Please select your country.");
      isValid = false;
      if (!firstInvalidField) firstInvalidField = countrySelect;
    }

    // 5. Validate Message
    var message = messageInput ? messageInput.value.trim() : "";
    if (!message) {
      setFieldError("contact-message", "group-message", "error-message", "Please enter your message or project brief.");
      isValid = false;
      if (!firstInvalidField) firstInvalidField = messageInput;
    } else if (message.length < 10) {
      setFieldError("contact-message", "group-message", "error-message", "Please provide more details (minimum 10 characters).");
      isValid = false;
      if (!firstInvalidField) firstInvalidField = messageInput;
    } else if (message.length > 1500) {
      setFieldError("contact-message", "group-message", "error-message", "Message exceeds 1,500 characters limit.");
      isValid = false;
      if (!firstInvalidField) firstInvalidField = messageInput;
    }

    if (!isValid && firstInvalidField) {
      firstInvalidField.focus();
    }

    return isValid;
  }

  // Form Submit Handler
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      hideGlobalFeedback();

      // Check anti-spam honeypot
      if (honeypotInput && honeypotInput.value.trim() !== "") {
        console.warn("Spam detected via honeypot.");
        showGlobalFeedback("success", "<strong>Thank you!</strong> Your message has been received.");
        contactForm.reset();
        return;
      }

      // Check rate-limiting cooldown
      var now = Date.now();
      if (now - lastSubmitTime < COOLDOWN_MS) {
        showGlobalFeedback("error", "Please wait a moment before sending another message.");
        return;
      }

      // Run strict validation
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
      var country = countrySelect ? countrySelect.value.trim() : "";
      var service = serviceSelect ? serviceSelect.value.trim() : "";
      var message = messageInput.value.trim();

      // Set button loading state
      var originalBtnHtml = submitBtn ? submitBtn.innerHTML : "Submit Inquiry";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<svg class="spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="30 60"></circle></svg> Sending Inquiry...';
      }

      var payload = {
        "Full Name": fullName,
        "Email Address": email,
        "Company / Organization": company || "N/A",
        "Country": country || "Philippines",
        "Service of Interest": service || "General Inquiry",
        "Message / Project Brief": message,
        _subject: "New Inquiry from " + fullName + " (.PNG Portfolio)",
        _template: "table",
        _captcha: "false"
      };

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
          if (data && (data.success === "true" || data.success === true || data.message)) {
            showGlobalFeedback(
              "success",
              "<strong>Thank you!</strong> Your message has been sent successfully to <strong>" + RECIPIENT_EMAIL + "</strong>. We will get in touch with you shortly."
            );
            contactForm.reset();
            if (countrySelect) countrySelect.value = "Philippines";
            if (charCountEl) charCountEl.textContent = "0 / 1500";
          } else {
            showGlobalFeedback(
              "success",
              "<strong>Message received!</strong> We have received your inquiry and will reach out to you at <strong>" + email + "</strong>."
            );
            contactForm.reset();
            if (countrySelect) countrySelect.value = "Philippines";
            if (charCountEl) charCountEl.textContent = "0 / 1500";
          }
        })
        .catch(function (err) {
          console.error("Email submission error:", err);
          var mailtoSubject = encodeURIComponent("Project Inquiry - " + (service || "General"));
          var mailtoBody = encodeURIComponent(
            "Name: " + fullName + "\n" +
            "Email: " + email + "\n" +
            "Company: " + company + "\n" +
            "Country: " + country + "\n" +
            "Service: " + service + "\n\n" +
            "Message:\n" + message
          );
          var mailtoLink = "mailto:" + RECIPIENT_EMAIL + "?subject=" + mailtoSubject + "&body=" + mailtoBody;

          showGlobalFeedback(
            "error",
            "Could not connect to the form server. You can <a href='" + mailtoLink + "' style='font-weight:700; text-decoration:underline;'>click here to send directly via your email client</a>."
          );
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
