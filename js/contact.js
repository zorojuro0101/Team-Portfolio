(function () {
  "use strict";

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
    
    // Sort alphabetically, but keep Philippines on top or sorted
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
    // Start with fallback immediately so user has zero wait time
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
        console.warn("Could not fetch countries API, used fallback list.", err);
      });
  }

  fetchCountries();

  // Initialize Supabase client
  var supabaseClient = null;
  var config = window.SUPABASE_CONFIG || {};

  if (window.supabase && config.url && config.anonKey && !config.url.includes("your-project-id")) {
    try {
      supabaseClient = window.supabase.createClient(config.url, config.anonKey);
    } catch (e) {
      console.error("Supabase init error:", e);
    }
  }

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

      // Basic validation
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
        submitBtn.innerHTML = '<svg class="spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="30 60"></circle></svg> Submitting...';
      }

      var payload = {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        company_org: companyOrg.trim() || null,
        country: country.trim() || null,
        service_interest: service.trim() || null,
        message: message.trim(),
        created_at: new Date().toISOString()
      };

      // Check if Supabase credentials are configured
      var isSupabaseConfigured = supabaseClient && config.url && !config.url.includes("your-project-id");

      if (isSupabaseConfigured) {
        var tableName = config.tableName || "contact_inquiries";
        supabaseClient
          .from(tableName)
          .insert([payload])
          .then(function (res) {
            if (res.error) {
              console.error("Supabase insert error:", res.error);
              showFeedback("error", "Failed to submit inquiry: " + (res.error.message || "Please check your Supabase table and permissions."));
            } else {
              showFeedback("success", "<strong>Thank you!</strong> Your message has been sent successfully. We will get in touch with you shortly.");
              contactForm.reset();
              if (countrySelect) countrySelect.value = "Philippines";
            }
          })
          .catch(function (err) {
            console.error("Submission error:", err);
            showFeedback("error", "An error occurred while sending your message. Please try again.");
          })
          .finally(function () {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalBtnHtml;
            }
          });
      } else {
        // Simulated local fallback if user has not yet entered their Supabase keys
        setTimeout(function () {
          console.log("[Demo Mode] Form Submitted Payload:", payload);
          showFeedback(
            "success",
            "<strong>Inquiry recorded!</strong> (<em>Note: Demo mode active. Set your Supabase URL & Anon Key in <code>js/supabase-config.js</code> to persist to database.</em>)"
          );
          contactForm.reset();
          if (countrySelect) countrySelect.value = "Philippines";
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
          }
        }, 750);
      }
    });
  }
})();
