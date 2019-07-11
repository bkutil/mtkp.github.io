window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;

var uuid = function b(a) {
  return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) :
    ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
};

var dimensions = {
  TRACKING_VERSION: 'dimension1',
  CLIENT_ID: 'dimension2',
  WINDOW_ID: 'dimension3',
  HIT_ID: 'dimension4',
  HIT_TIME: 'dimension5',
  HIT_TYPE: 'dimension6',
};

var metrics = {
  RESPONSE_END_TIME: 'metric1',
  DOM_LOAD_TIME: 'metric2',
  WINDOW_LOAD_TIME: 'metric3',
  PAGE_VISIBLE_TIME: 'metric4',
};

var environments = {
  PRODUCTION: 'prod',
  TESTING:    'test',
}

var properties = {
  PRODUCTION: 'UA-92614650-1',
  TESTING:    'UA-92614650-2',
};

var NULL_VALUE = '(not set)';

var TRACKING_ENV = environments.PRODUCTION;
var TRACKING_CODE = properties.PRODUCTION;
var TRACKING_VERSION = '1';

ga('create', TRACKING_CODE, 'auto', TRACKING_ENV);

// Use browser built-in beacon transport
ga(TRACKING_ENV + '.set', 'transport', 'beacon');

// Seed info. Google Analytics will drop rows with empty dimension values.
Object.keys(dimensions).forEach(function(key) {
  ga(TRACKING_ENV + '.set', dimensions[key], NULL_VALUE);
});

// Send custom dimensions.
ga(function() {
  var tracker = ga.getByName(TRACKING_ENV);
  var clientId = tracker.get('clientId');
  tracker.set({
    // Set tracking version
    [dimensions.TRACKING_VERSION]: TRACKING_VERSION,

    // Expose client id as custom dimension
    [dimensions.CLIENT_ID]: clientId,

    // Set unique window id to track multiple window/tab interactions.
    [dimensions.WINDOW_ID]: uuid(),
  });
});

// Track individual page hits.
ga(function() {
  var tracker = ga.getByName(TRACKING_ENV);
  var originalBuildHitTask = tracker.get('buildHitTask');

  tracker.set('buildHitTask', function(model) {
    model.set(dimensions.HIT_ID, uuid(), true);
    model.set(dimensions.HIT_TIME, String(+new Date), true);
    model.set(dimensions.HIT_TYPE, model.get('hitType'), true);

    originalBuildHitTask(model);
  });
});

// Track performance metrics.
var sendNavigationTimingMetrics = function() {
  if (!(window.performance && window.performance.timing)) return;

  // If the window hasn't loaded, run this function after the `load` event.
  if (document.readyState != 'complete') {
    window.addEventListener('load', sendNavigationTimingMetrics);
    return;
  }

  var nt = performance.timing;
  var navStart = nt.navigationStart;

  var responseEnd = Math.round(nt.responseEnd - navStart);
  var domLoaded = Math.round(nt.domContentLoadedEventStart - navStart);
  var windowLoaded = Math.round(nt.loadEventStart - navStart);

  // In some edge cases browsers return very obviously incorrect NT values,
  // e.g. 0, negative, or future times. This validates values before sending.
  var allValuesAreValid = function(values) {
    return values.every(function(value) { return  value > 0 && value < 6e6; });
  };

  if (allValuesAreValid([responseEnd, domLoaded, windowLoaded])) {
    ga(TRACKING_ENV + '.send', 'event', {
      eventCategory: 'Navigation Timing',
      eventAction: 'track',
      nonInteraction: true,
      [metrics.RESPONSE_END_TIME]: responseEnd,
      [metrics.DOM_LOAD_TIME]: domLoaded,
      [metrics.WINDOW_LOAD_TIME]: windowLoaded,
    });
  }
};
sendNavigationTimingMetrics();

// Load custom plugins from autotrack.js
ga(TRACKING_ENV + '.require', 'outboundLinkTracker');
ga(TRACKING_ENV + '.require', 'cleanUrlTracker', { stripQuery: true, trailingSlash: 'add' });
ga(TRACKING_ENV + '.require', 'pageVisibilityTracker', { visibleMetricIndex: 4, timeZone: 'Europe/Prague' });

// Send page view
ga(TRACKING_ENV + '.send', 'pageview');
