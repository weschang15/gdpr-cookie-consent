import { getCookie, onReady, setCookie, styled } from "./utils";

/**
 * Cookie Consent
 *
 * Provide user consent actions based on where they are located via IP address. This script uses
 * GeoIP DB to do country code lookups based on IP address and will determine the appropriate actions to render for the user.
 *
 * @version 1.0.0
 * @author Wesley Chang
 */
(function(CookieConsent) {
  // stop from running again, if accidently included more than once.
  if (CookieConsent.hasInitialised) return;

  const COOKIE_CONFIG = {
    domain: document.location.hostname,
    expire: 365,
    name: "cc",
    path: "/",
    values: {
      dismissed: "dismissed",
      accepted: "accepted",
      rejected: "rejected"
    }
  };

  CookieConsent.status = {
    accepted: "accepted",
    rejected: "rejected",
    dismissed: "dismissed"
  };

  CookieConsent.Popup = (function() {
    const DEFAULT_ELEMENTS = {
      animationClass: "cc-animated",
      classNamePrefix: "cc",
      withAnimation: true,
      content: `We use cookies to improve your online experience. To learn more about the cookies we use and how we process your personal information, please read our <a href="https://undisclosed.com/privacy-policy" target="_blank" rel="noopener noreferrer">privacy policy</a> and <a href="https://undisclosed.com/cookie-policy" target="_blank" rel="noopener noreferrer">cookie policy.</a>`,
      buttons: {
        reject: {
          styles: {
            backgroundColor: "#fff",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
            color: "#4d4d4d",
            cursor: "pointer",
            fontWeight: 600,
            marginRight: "0.5em",
            padding: "0.5em 1em"
          },
          className: "cc__button cc__reject",
          content: "Reject"
        },
        accept: {
          styles: {
            backgroundColor: "#3FBFAD",
            border: "1px solid #3FBFAD",
            borderRadius: "4px",
            color: "#0d2623",
            cursor: "pointer",
            fontWeight: 600,
            marginRight: "0.5em",
            padding: "0.5em 1em"
          },
          className: "cc__button cc__accept",
          content: "Accept"
        },
        dismiss: {
          styles: {
            backgroundColor: "#3FBFAD",
            border: "1px solid #3FBFAD",
            borderRadius: "4px",
            color: "#0d2623",
            cursor: "pointer",
            fontWeight: 600,
            marginRight: "0.5em",
            padding: "0.5em 1em"
          },
          className: "cc__button cc__dismiss",
          content: "Accept & Dismiss"
        }
      }
    };

    const DEFAULT_STYLES = {
      mobile: [
        {
          borderRadius: "4px",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.3)",
          fontSize: "13px",
          zIndex: 99,
          background: "#fff",
          bottom: "30px",
          left: "30px",
          padding: "10px",
          position: "fixed",
          width: "calc(100% - 60px)"
        }
      ],
      smallUp: [
        "(min-width: 480px)",
        {
          borderRadius: "4px",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.3)",
          fontSize: "13px",
          maxWidth: "220px",
          zIndex: 99,
          background: "#fff",
          bottom: "16px",
          left: "16px",
          padding: "10px",
          position: "fixed"
        }
      ]
    };

    const DEFAULT_ACTION_CALLBACKS = {
      onAcceptCallback: () => null,
      onRejectCallback: () => null,
      onDismissCallback: () => null
    };

    function applyResponsiveCss(viewport, component) {
      if (!component) {
        throw new Error(`Must provide component to apply CSS.`);
      }

      const { mobile, smallUp } = DEFAULT_STYLES;
      if (viewport.matches) {
        component.setAttribute("style", styled(smallUp[1]));
      } else {
        component.setAttribute("style", styled(mobile[0]));
      }
    }

    function applyDefaultStyles(component) {
      const { smallUp } = DEFAULT_STYLES;
      const viewport = window.matchMedia(smallUp[0]);
      viewport.addListener(viewport => applyResponsiveCss(viewport, component));
      applyResponsiveCss(viewport, component);
    }

    function insertAnimationStyles() {
      const animation = `
        .${DEFAULT_ELEMENTS.animationClass} {
          animation: slide-up 0.4s ease;
        }

        @keyframes slide-up {
          0% {
              opacity: 0;
              transform: translate3d(0, 20px, 0);
          }
          100% {
              opacity: 1;
              transform: translate3d(0, 0, 0);
          }
        }
      `;

      const head = document.head;
      const style = document.createElement("style");
      style.appendChild(document.createTextNode(animation));
      style.setAttribute("type", "text/css");
      style.setAttribute("id", "cc-styles");

      head.appendChild(style);
    }

    class Popup {
      constructor(dismissable, overrides = {}) {
        const options = { ...DEFAULT_ELEMENTS, ...overrides };

        this.popup = document.createElement("aside");
        this.popup.setAttribute("class", options.classNamePrefix);
        this.popup.setAttribute("id", options.classNamePrefix);

        if (options.withAnimation) {
          insertAnimationStyles();
          this.popup.classList.add(options.animationClass);
        }

        this.options = options;

        this.applyMessage()
          .applyButtons(dismissable)
          .applyDataAttributes(dismissable);

        applyDefaultStyles(this.popup);
      }

      applyDataAttributes(dismissable) {
        const { popup } = this;
        popup.setAttribute("data-dismissable", dismissable);
        return this;
      }

      applyMessage(el, message, overrides = {}) {
        const { options, popup } = this;
        const innerHTML = message || options.content;
        const className =
          overrides.className || `${options.classNamePrefix}__content`;

        if (innerHTML) {
          const content = document.createElement("p");
          content.setAttribute("class", className);
          content.innerHTML = innerHTML;

          const component = el ? el : popup;
          component.appendChild(content);
        }

        return this;
      }

      applyButtons(dismissable) {
        const { options, popup } = this;

        const innerHTML = Object.entries(options.buttons)
          .filter(([type]) =>
            dismissable ? type === "dismiss" : type !== "dismiss"
          )
          .map(([_, settings]) => {
            const { className, content, styles } = settings;
            const button = document.createElement("button");

            button.setAttribute("style", styled(styles));
            button.setAttribute("class", className);
            button.textContent = content.trim();

            return button.outerHTML;
          })
          .join("");

        const className = `${options.classNamePrefix}__actions`;

        if (innerHTML) {
          const actions = document.createElement("div");
          actions.setAttribute("class", className);
          actions.innerHTML = innerHTML;

          popup.appendChild(actions);
        }

        return this;
      }

      render() {
        // We only want to render this popup if it hasn't been rendered before
        if (!document.getElementById(this.options.classNamePrefix)) {
          document.body.appendChild(this.popup);
        }
      }
    }

    return class CookieBanner extends Popup {
      constructor(law = {}, callbacks = {}) {
        // Initialize Parent Class in order to inherit its methods
        super(law.dismissable);

        this.callbacks = { ...DEFAULT_ACTION_CALLBACKS, ...callbacks };
        this.law = law;

        this._autoDismissTimeout = null;

        // We have to bind the event handler functions because the function context changes
        // from CookieBanner to the DOM element that triggered the event (i.e. button)
        // this needs to happen before we initialize our event listeners so that they are bound
        // to the Object prior to execution
        this._handleAccept = this._handleAccept.bind(this);
        this._handleReject = this._handleReject.bind(this);
        this._handleDismiss = this._handleDismiss.bind(this);

        // We want to make sure that our whitelisted regions trigger the same effect that
        // a autodismiss action does, so instead of rendering the popup and then using a setTimeout, we
        // instead simply invoke and return the setTimeout callback func to bail out early
        if (this.law.isWhitelisted) {
          return this._handleDismiss();
        }

        this.autoOpen()
          .applyAccept()
          .applyReject()
          .applyDismiss();
      }

      autoOpen() {
        if (!this.hasConsented()) {
          super.render();
        }

        return this;
      }

      _handleAccept(e) {
        setCookie(COOKIE_CONFIG.name, COOKIE_CONFIG.values.accepted);
        this.callbacks.onAcceptCallback();
        this.destroy();
      }

      applyAccept() {
        // We can assume that explicit action is required if we are not allowed to dismiss the popup
        if (!this.law.dismissable) {
          this.popup
            .querySelector(".cc__accept")
            .addEventListener("click", this._handleAccept);
        }

        return this;
      }

      _handleDismiss(e) {
        setCookie(COOKIE_CONFIG.name, COOKIE_CONFIG.values.dismissed);
        this.callbacks.onDismissCallback();
        this.destroy();
      }

      applyDismiss() {
        if (this.law.dismissable) {
          // let's automatically set a cookie to specify that a user has dismissed the notification
          this._autoDismissTimeout = setTimeout(this._handleDismiss, 2500);

          // Attach event handler to dismiss popup automatically
          this.popup
            .querySelector(".cc__dismiss")
            .addEventListener("click", this._handleDismiss);
        }

        return this;
      }

      _handleReject() {
        // If a user rejects cookies, then we can't drop cookies.
        // Instead, we'll just destroy the CookiePopup for the current page view
        // We should also send a GA event to track
        this.callbacks.onRejectCallback();
        this.destroy();
      }

      applyReject() {
        // We can assume that explicit action is required if we are not allowed to dismiss the popup
        if (!this.law.dismissable) {
          this.popup
            .querySelector(".cc__reject")
            .addEventListener("click", this._handleReject);
        }

        return this;
      }

      destroy() {
        // Remove all event handlers
        const buttons = this.popup.querySelectorAll(".cc__button");

        // Let's destroy all event listeners
        if (buttons.length) {
          Array.from(buttons).forEach(button => {
            button.removeEventListener("click", this._handleAccept);
            button.removeEventListener("click", this._handleReject);
            button.removeEventListener("click", this._handleDismiss);
          });
        }

        this.popup.remove();
      }

      getStatus() {
        return getCookie(COOKIE_CONFIG.name);
      }

      hasConsented() {
        return (
          this.getStatus() === CookieConsent.status.accepted ||
          this.getStatus() === CookieConsent.status.dismissed
        );
      }
    };
  })();

  CookieConsent.Location = (function() {
    return class Geolocation {
      constructor(apiKey) {
        if (!apiKey) {
          throw new Error(`Missing parameter 'apiKey.' `);
        }

        this.key = apiKey;
      }

      async getCountry() {
        const res = await fetch(`https://geoip-db.com/json/${this.key}`);
        const {
          country_code: countryCode,
          country_name: countryName
        } = await res.json();

        return {
          countryCode,
          countryName
        };
      }
    };
  })();

  CookieConsent.Law = (function() {
    const DEFAULT_OPTIONS = {
      // countries that enforce some version of a cookie law
      hasLaw: [
        "AD",
        "AI",
        "AT",
        "AW",
        "AX",
        "BE",
        "BG",
        "BL",
        "BM",
        "CH",
        "CW",
        "CY",
        "CZ",
        "DE",
        "DK",
        "EE",
        "ES",
        "FI",
        "FK",
        "FR",
        "GB",
        "GF",
        "GG",
        "GI",
        "GI",
        "GL",
        "GP",
        "GR",
        "GS",
        "HR",
        "HU",
        "IE",
        "IO",
        "IT",
        "JE",
        "KY",
        "LI",
        "LT",
        "LU",
        "LV",
        "MC",
        "ME",
        "MF",
        "MQ",
        "MS",
        "MT",
        "NC",
        "NL",
        "PF",
        "PL",
        "PM",
        "PN",
        "PT",
        "RE",
        "RO",
        "SE",
        "SH",
        "SI",
        "SK",
        "SM",
        "SX",
        "TC",
        "TF",
        "VA",
        "VG",
        "WF",
        "YT"
      ],

      // Countries that are not subject to Cookie Law
      whitelist: ["US"]
    };

    return class CookieLaw {
      constructor(country = {}) {
        this.country = country;
      }

      /**
       * Alternative function to set the users current country location
       *
       * @param {Object} country Details about users country, this is usually returned data from service call GeoIP DB
       * @return {CookieLaw}
       */
      setCountry(country) {
        if (!country) {
          throw new Error("Undefined parameter `Country`.");
        }

        this.country = country;

        return this;
      }

      get(countryCode) {
        const { country } = this;
        const { hasLaw, whitelist } = DEFAULT_OPTIONS;

        // Allow the option to override the default country code with a user specified cc
        const cc = countryCode || country.countryCode;

        return {
          hasLaw: hasLaw.includes(cc),
          isWhitelisted: whitelist.includes(cc)
        };
      }

      apply(countryCode) {
        // Retrieve object detailing regions cookie law
        const country = this.get(countryCode);

        // Custom popup configuration settings available for a user provided by their country's Cookie Law
        const settings = { dismissable: true };

        // We can only configure autodismiss if the region does not have some sort of cookie law
        if (country.hasLaw) {
          settings.dismissable = false;
        }

        return {
          ...country,
          ...settings
        };
      }
    };
  })();

  CookieConsent.init = async function(config = {}) {
    const { apiKey, callbacks = {} } = config;

    const hasConsented = () => {
      const cookie = getCookie(COOKIE_CONFIG.name);
      return (
        cookie === this.status.accepted || cookie === this.status.dismissed
      );
    };

    if (hasConsented()) {
      return;
    }

    const locator = new CookieConsent.Location(apiKey);
    const country = await locator.getCountry();

    const countryLaw = new CookieConsent.Law(country);
    const law = countryLaw.apply();

    delete this.Law;
    delete this.Location;

    return new CookieConsent.Popup(law, callbacks);
  };

  // This will let us know if this script has been loading previously
  CookieConsent.hasInitialised = true;

  window.CookieConsent = CookieConsent;
})(window.CookieConsent || {});

function go() {
  // Example of integrating with GTM
  const dataLayer = window.dataLayer || [];

  window.CookieConsent.init({
    apiKey: "undisclosed",
    callbacks: {
      onAcceptCallback: () => {
        // Example of integrating with GTM
        dataLayer.push({
          event: "cookie_consent_event",
          cookie_consent_response: "accepted"
        });
      },
      onDismissCallback: () => {
        // Example of integrating with GTM
        dataLayer.push({
          event: "cookie_consent_event",
          cookie_consent_response: "dismissed"
        });
      },
      onRejectCallback: () => {
        // Example of integrating with GTM
        dataLayer.push({
          event: "cookie_consent_event",
          cookie_consent_response: "rejected"
        });
      }
    }
  });
}

onReady(go);
