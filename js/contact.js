(function () {
  "use strict";

  // Recipient email
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

  var countrySelect = document.getElementById("contact-country");
  var contactForm = document.getElementById("contact-form");
  var submitBtn = document.getElementById("submit-btn");
  var formFeedback = document.getElementById("form-feedback");

  // Load countries dynamically from API
  function populateCountries(countries) {
    if (!countrySelect) return;
    var currentVal = countrySelect.value;
    countrySelect.innerHTML = '<option value="" disabled selected>Select or search country</option>';
    
    // Sort alphabetically, keeping Philippines at the top
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
    // Start with fallback immediately
    populateCountries(FALLBACK_COUNTRIES);

    // Fetch live list from REST Countries API
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

  function showFeedback(type, message) {
    if (!formFeedback) return;
    formFeedback.className = "form-feedback feedback-" + type;
    formFeedback.innerHTML = message;
    formFeedback.hidden = false;
    formFeedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideFeedback() {
    if (!formFeedback) return;
    formFeedback.hidden = true;
    formFeedback.className = "form-feedback";
    formFeedback.innerHTML = "";
  }

  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      hideFeedback();

      var fullName = (document.getElementById("contact-fullname") || {}).value || "";
      var email = (document.getElementById("contact-email") || {}).value || "";
      var phone = (document.getElementById("contact-phone") || {}).value || "";
      var companyOrg = (document.getElementById("contact-company") || {}).value || "";
      var country = (countrySelect || {}).value || "";
      var service = (document.getElementById("contact-service") || {}).value || "";
      var message = (document.getElementById("contact-message") || {}).value || "";

      // Validation
      if (!fullName.trim() || !email.trim() || !message.trim()) {
        showFeedback("error", "Please fill in all required fields (Full Name, Email Address, and Message).");
        return;
      }

      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email.trim())) {
        showFeedback("error", "Please enter a valid email address.");
        return;
      }

      // UI Loading state
      var originalBtnHtml = submitBtn ? submitBtn.innerHTML : "Submit Inquiry";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<svg class="spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="30 60"></circle></svg> Sending Message...';
      }

      var payload = {
        "Full Name": fullName.trim(),
        "Email Address": email.trim(),
        "Phone Number": phone.trim() || "N/A",
        "Company / Organization": companyOrg.trim() || "N/A",
        "Country": country.trim() || "N/A",
        "Service of Interest": service.trim() || "General Inquiry",
        "Message / Project Brief": message.trim(),
        _subject: "New Inquiry from " + fullName.trim() + " (.PNG Portfolio)",
        _template: "table",
        _captcha: "false"
      };

      // Send direct email via FormSubmit API
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
            showFeedback(
              "success",
              "<strong>Thank you!</strong> Your message has been sent directly to <strong>" + RECIPIENT_EMAIL + "</strong>. We will get back to you shortly."
            );
            contactForm.reset();
            if (countrySelect) countrySelect.value = "Philippines";
          } else {
            showFeedback(
              "success",
              "<strong>Message received!</strong> We have received your inquiry and will reach out to you at <strong>" + email.trim() + "</strong>."
            );
            contactForm.reset();
            if (countrySelect) countrySelect.value = "Philippines";
          }
        })
        .catch(function (err) {
          console.error("Email send error:", err);
          // Fallback: If network issue, offer mailto direct trigger
          var mailtoSubject = encodeURIComponent("Project Inquiry - " + (service || "General"));
          var mailtoBody = encodeURIComponent(
            "Name: " + fullName + "\n" +
            "Email: " + email + "\n" +
            "Phone: " + phone + "\n" +
            "Company: " + companyOrg + "\n" +
            "Country: " + country + "\n" +
            "Service: " + service + "\n\n" +
            "Message:\n" + message
          );
          var mailtoLink = "mailto:" + RECIPIENT_EMAIL + "?subject=" + mailtoSubject + "&body=" + mailtoBody;

          showFeedback(
            "error",
            "Could not connect to the email server. You can also <a href='" + mailtoLink + "' style='font-weight:700; text-decoration:underline;'>click here to send directly via your email app</a>."
          );
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
          }
        });
    });
  }
})();
