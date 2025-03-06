# theme-geolocator-js
JavaScript code to help implement geotargeting prompts or redirects on Evance themes
using the [Evance Geolocation Ajax API](https://www.evance.it/help/themes/ajax/geolocation).

This scripts supports two methods for locale geotargeting:
1. Suggested locale prompts (recommended) - you've probably seen something similar on large sites like Amazon, or Apple.
2. Automatic redirects - redirect users to the most appropriate locale.

We recommend using "Suggested locale prompts" because it offers a better user experience.

This script uses a cookie `ev-locale` to store the user's locale preference.
This is an operational cookie and does not store any personally identifiable data.

## Requirements
This script requires jQuery and the jQuery.cookie extension. 
Both of these are included by default into most Evance themes.

## Installation
Download the `geolocator.js` file or copy the code and
add it into your Evance Theme's available JavaScript files. 
Usually these are located in the `~/theme/common/js` directory.

Add the `~/theme/common/js/geolocator.js` file into your list of imported scripts. 
This is usually `~/theme/common/js/common.json`.

```javascript
{
    "files": [
        
        // ... existing scripts ...
            
        "~/theme/common/js/geolocator.js"
    ]
}
```

### Suggested locale prompts
Open your default layout for your website, 
this is usually `~/theme/layouts/index.evml`.

Add the following HTML code just after the `<body>` tag. 
This will act as a container for the locale suggestion prompt.

```html
<div id="geolocator-prompt"></div>
```

Next, add a JavaScript template:
```html
<script id="geolocator-template" type="text/x-template">
    Visit our <%= countryName %> store in <%= currencyCode %>.
    <a href="<%= url %>" class="geolocator--continue">Continue</a>
    <a href="#dismiss" class="geolocator--dismiss">Stay</a>
</script>
```
This allows control over the message, look and feel of the prompt.
Where `<%= %>` represents an output tag and `<% %>` represents logic.

Available variables are:
- `id` - the URL identifier of a locale (e.g. `en-us`)
- `countryCode` - the locale's ISO-3166 alpa-2 country code in uppercase (e.g. `US`).
- `countryName` - the country name.
- `currencyCode` - the ISO-4217 code for the locale's currency in uppercase (e.g. `USD`).
- `languageCode` - the ISO-639-1 code for the locale' language in lowercase (e.g. `en`)
- `languageName` - the language name.
- `timezone` - a timezone string (e.g. `Europe/London`)
- `url` - the redirection URL to set and save the preferred locale.

Next, add the following to your site's custom JavaScript, 
either within an existing `.js` file, or a new one.

```javascript
const geolocator = new Geolocator();
geolocator.prompt();
```

### Redirecting users
Add the following JavaScript code to your site's custom JavaScript.
Unlike suggestion prompts, this does not require any other code.

```javascript
const geolocator = new Geolocator();
geolocator.redirect();
```

---

## Configuration
Configuration options may be passed to the Geolocator construct.

### `container`
The query selector for the Geolocator prompt container. Defaults to `#geolocator-prompt`.

### `continue`
The query selector representing the "continue to suggested locale" link within the Geolocator prompt.
Defaults to `.geolocator--continue`.

### `dismiss`
The query selector representing the "dismiss, stay on current locale" link within the Geolocator prompt.
Defaults to `.geolocator--dismiss`.

### `locales`
Represents a query selector for locale anchor links, typically within a locale menu.
The anchor link MUST:
- have a `data-locale` attribute containing the `locale.id` value.
- the `href` attribute MUST be that of the locale's homepage (`locale.url`).

Defaults to `a[data-locale]`.

```html
<a href="{{ locale.url }}" data-locale="{{ locale.id }}">
    ...
</a>
```

This allows the locales menu to integrate with the geolocator script, which listens to `click` events
on each locale anchor. On click the geolocator script will set the `locale.id` as the preferred locale
within the `ev-locale` cookie before redirecting the user to localized version of the current 
path (`window.location.pathname`).

### `onPrompt`
Add your own functionality when a suggested locale prompt is shown.
```javascript
const geolocator = new Geolocator({
    onPrompt: function(locale) {
        console.log(locale); // The suggested locale object
        console.log(this); // The container element
    }
});
geolocator.prompt();
```

### `onContinue`
A user should be allowed to continue with the suggested locale from the prompt. This may differ depending on a user's
previous preference, or a recommended locale based on the user's IP address and geo-targeting in Evance.
By default, the script will look for any `.geolocator--continue` element within your container element. 
When clicked the suggested locale is saved in the `ev-locale` cookie as a preference and then the user
is redirected to the suggested locale. The class name expected is customisable by adding a `continue`
selector to your config:

```javascript
const geolocator = new Geolocator({
    continue: '#my-continue-button',
    onContinue: function(locale) {
        console.log(locale); // The suggested locale object
        console.log(this); // The container element
    }
});
geolocator.prompt();
```


### `onDismiss`
A user should be allowed to dismiss a suggested locale prompt. 
By default, this script will look for any `.geolocator--dismiss` element within your container element,
which will empty the container when clicked. 
However, you can customise this behaviour
by adding a `dismiss` selector and/or `onDismiss` method to your config.

```javascript
const geolocator = new Geolocator({
    dismiss: '#my-dismiss-button',
    onDismiss: function() {
        console.log(this); // The container element
    }
});
geolocator.prompt();
```

### `template`
The query selector id of the JavaScript template for the geolocation prompt. 
Defaults to `#geolocator-template`. Full information on the template and available variables
are in the installation guide above. 

---

## Minification
Evance will automatically minify JavaScript included into themes.
Hence, we have not published a minified version. 
Simply install and let Evance handle minification for you.
