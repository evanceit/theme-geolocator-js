/**
 * # Geolocator
 *
 * A JavaScript object designed for geotargeting on Evance website themes.
 *
 * @param {Object} options
 * @return {{redirect: redirect, prompt: prompt}}
 */
const Geolocator = function(options) {

    let config = $.extend({
        cookieName: 'ev-locale',
        cookieDays: 90,
        container: '#geolocator-prompt',
        continue: '.geolocator--continue',
        dismiss: '.geolocator--dismiss',
        template: '#geolocator-template',
        onContinue: null,
        onPrompt: null,
        onDismiss: null
    }, options);

    /**
     * Returns the current locale code.
     * e.g. 'en-gb' or NULL if the meta tag cannot be found.
     */
    function getCurrentLocaleCode() {
        let localeMeta = $('meta[name="ev:locale"]');
        if (!localeMeta.length) {
            return null;
        }
        return localeMeta.attr('content');
    }

    /**
     * Returns the current value of the ev-locale
     * preferred locale cookie, or NULL.
     */
    function getPreferredLocaleCode() {
        return $.cookie(config.cookieName);
    }

    /**
     * Send a POST request to the geolocate.json API.
     * This will return the recommended and preferred locale data.
     * @return {void}
     */
    function geolocate(responseHandler) {
        // We only need to geolocate if we're not on our preferred locale already.
        if (isCurrentLocale(getPreferredLocaleCode())) {
            return;
        }
        $.post('/utils/geolocate.json', {
            url: window.location.pathname
        }, function (response) {
            // Does the user have a preferred locale?
            // If it does not match the current locale
            // we can ask if they wish to change.
            const localeOptions = response.data.locale;
            if (localeOptions.preferred) {
                responseHandler(localeOptions.preferred);
            } else if (localeOptions.recommended) {
                responseHandler(localeOptions.recommended);
            } else {
                saveCurrentLocale();
            }
        });
    }

    /**
     * Handles a specific locale from the API response.
     * @param {Object} locale
     */
    function handleLocalePrompt(locale) {
        if (!isCurrentLocale(locale.id)) {
            suggestLocale(locale);
        } else {
            saveLocale(locale);
        }
    }

    /**
     * @param {Object} locale
     */
    function handleLocaleRedirect(locale) {
        if (!isCurrentLocale(locale.id)) {
            saveLocale(locale);
            window.location.href = locale.url;
        } else {
            saveLocale(locale);
        }
    }

    /**
     * Returns true if the localeCode supplied matches the current locale.
     * @param {string} localeCode
     * @return {bool}
     */
    function isCurrentLocale(localeCode) {
        return getCurrentLocaleCode() == localeCode;
    }

    /**
     * Set the ev-locale cookie ourselves.
     * This avoids further API interaction.
     */
    function saveCurrentLocale() {
        saveLocale({
            id: getCurrentLocaleCode()
        });
    }

    /**
     * Save the locale provided as the preferred locale.
     * This should then prevent any further geolocation attempts.
     * @param {Object} locale
     */
    function saveLocale(locale) {
        $.cookie(config.cookieName, locale.id, { expires: config.cookieDays, path: '/', secure: true });
    }

    /**
     * Suggest a locale to change to.
     * Requires an empty container element and a template script.
     * @param {Object} locale
     */
    function suggestLocale(locale) {
        let templateEl = $(config.template);
        let containerEl = $(config.container);
        if (!templateEl.length || !containerEl.length) {
            console.warn('Missing template or container elements for Geolocator');
        }
        let template = evance.template(templateEl.html());
        containerEl.html(template(locale));

        if (config.onPrompt) {
            config.onPrompt.call(containerEl, locale);
        }

        $(config.continue, containerEl).on('click', function(e) {
            e.preventDefault();
            if (config.onContinue) {
                config.onContinue.call(containerEl, locale);
            }
            handleLocaleRedirect(locale);
        });

        $(config.dismiss, containerEl).on('click', function(e) {
            e.preventDefault();
            saveCurrentLocale();
            if (config.onDismiss) {
                config.onDismiss.call(containerEl);
            } else {
                containerEl.empty();
            }
        });
    }

    return {
        redirect: function() {
            geolocate(handleLocaleRedirect);
        },
        prompt: function() {
            geolocate(handleLocalePrompt);
        }
    };
};
