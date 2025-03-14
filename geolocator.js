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
        onDismiss: null,
        locales: 'a[data-locale]',
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
     * Send a POST request to the `geolocate.json` API.
     * This will return the recommended and preferred locale data.
     *
     * Note, geolocation is ignored if the user is in Evance's edit mode.
     *
     * @return {void}
     */
    function geolocate(responseHandler) {
        // We only need to geolocate if we're not on our preferred locale already.
        if (isEditMode() || isCurrentLocale(getPreferredLocaleCode())) {
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
     * Listens to click events on locale menu items.
     * This works in conjunction with the `config.locales` selector.
     * Locale menu items should be anchor links with a `data-locale` attribute containing the the `locale.id`.
     * The `href` of the locale link MUST be the locale's homepage (e.g. `/en-us`).
     */
    function handleLocaleMenu() {
        document.querySelectorAll(config.locales).forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const currentPrefix = document.querySelector('meta[name="ev:locale:uri"]')?.getAttribute('content') || '';
                const path = window.location.pathname.slice(currentPrefix.length);
                handleLocaleRedirect({
                    id: this.getAttribute('data-locale'),
                    url: this.getAttribute('href') !== '/' ? this.getAttribute('href') + path : path
                });
            });
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
     * Returns `true` if the browser is currently in Evance's edit mode.
     */
    function isEditMode() {
        const editMode = $('meta[name="ev:editmode"]');
        return (
            editMode.length > 0
            && window.self !== window.top
        );
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
        const expires = config.cookieDays  * 24 * 60 * 60;
        document.cookie = `${config.cookieName}=${locale.id}; path=/; max-age=${expires}; secure`;
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
            handleLocaleMenu();
        },
        prompt: function() {
            geolocate(handleLocalePrompt);
            handleLocaleMenu();
        },
        locales: function() {
            handleLocaleMenu();
        }
    };
};