(function () {
  "use strict";

  // Destination email address
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

  var lastSubmitTime = 0;
  var COOLDOWN_MS = 2500;

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

  // Error feedback functions
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

  // Handle direct message submission without third-party activation links
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
        showGlobalFeedback("error", "Please correct the highlighted errors above.");
        return;
      }

      lastSubmitTime = now;

      var fullName = fullNameInput.value.trim();
      var email = emailInput.value.trim();
      var company = companyInput ? companyInput.value.trim() : "";
      var country = countrySelect ? countrySelect.value.trim() : "Philippines";
      var service = serviceSelect ? serviceSelect.value.trim() : "General Inquiry";
      var message = messageInput.value.trim();

      // Build clean formatted email body
      var emailSubject = "Project Inquiry from " + fullName + " (" + (service || "General") + ")";
      var emailBody = 
        "Full Name: " + fullName + "\n" +
        "Email Address: " + email + "\n" +
        "Company / Organization: " + (company || "N/A") + "\n" +
        "Country: " + country + "\n" +
        "Service of Interest: " + service + "\n\n" +
        "--------------------------------------------------\n" +
        "Message / Project Brief:\n" +
        message + "\n" +
        "--------------------------------------------------";

      var mailtoUrl = "mailto:" + encodeURIComponent(RECIPIENT_EMAIL) + 
                      "?subject=" + encodeURIComponent(emailSubject) + 
                      "&body=" + encodeURIComponent(emailBody);

      // Trigger direct email dispatch via mailto (no activation link / no 3rd party middleman)
      window.location.href = mailtoUrl;

      // Display clean success state on page
      showGlobalFeedback(
        "success",
        "<strong>Inquiry Ready!</strong> Your email application has been opened to send the message directly to <strong>" + RECIPIENT_EMAIL + "</strong>.<br><br>" +
        "<a href='" + mailtoUrl + "' class='btn btn-primary' style='display:inline-block; font-size:0.875rem; padding:8px 18px; margin-top:6px; color:#ffffff;'>Click here if your email app didn't open</a>"
      );

      contactForm.reset();
      if (countrySelect) countrySelect.value = "Philippines";
      if (charCountEl) charCountEl.textContent = "0 / 1500";
    });
  }
})();
