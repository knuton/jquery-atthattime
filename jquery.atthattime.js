/*
 * atthattime: a jQuery plugin, version: 0.1.0 (2011-09-16)
 * @requires jQuery v1.2.3 or later
 *
 * atthattime is a jQuery plugin that makes it easy to support automatically
 * updating timestamps referring to calendar units instead of absolute time
 * (e.g. "this minute" or "1 day ago").
 *
 * For usage and examples, visit:
 * http://github.com/knuton/jquery-atthattime
 *
 * Copyright (c) 2011, Johannes Emerich (johannes -[at]- emerich [*dot*] de)
 *
 * Licensed under the MIT:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * atthattime heavily lends ideas and code from timeago by Ryan McGeary, which
 * is a similar plugin for automatically updating fuzzy timestamps (e.g. "4
 * minutes ago" or "about 1 day ago"). Check it out: http://timeago.yarp.com/
 *
 * Copyright for timeago as follows:
 * Copyright (c) 2008-2011, Ryan McGeary (ryanonjavascript -[at]- mcgeary [*dot*] org)
 */
(function($) {
  $.atthattime = function(timestamp) {
    if (timestamp instanceof Date) {
      return inWords(timestamp);
    } else if (typeof timestamp === "string") {
      return inWords($.atthattime.parse(timestamp));
    } else {
      return inWords($.atthattime.datetime(timestamp));
    }
  };
  var $att = $.atthattime;

  $.extend($.atthattime, {
    settings: {
      refreshMillis: 60000,
      allowFuture: false,
      smallestGrain: "seconds",
      biggestGrain: "days",
      offset: 0,
      strings: {
        prefixAgo: null,
        prefixFromNow: null,
        suffixAgo: "ago",
        suffixFromNow: "from now",
        thisSecond: "this second",
        seconds: "%d second%n",
        thisMinute: "this minute",
        minutes: "%d minute%n",
        thisHour: "this hour",
        hours: "%d hour%n",
        thisDay: "today",
        days: "%d day%n",
        thisMonth: "this month",
        months: "%d month%n",
        thisYear: "this year",
        years: "%d year%n",
        numbers: []
      }
    },
    inWords: function(then) {
      var $l = this.settings.strings;
      var prefix = $l.prefixAgo;
      var suffix = $l.suffixAgo;

      var cmp = allEqual;

      function substitute(stringOrFunction, number) {
        var string = $.isFunction(stringOrFunction) ? stringOrFunction(number, distanceMillis) : stringOrFunction;
        var value = ($l.numbers && $l.numbers[number]) || number;
        var agreement = number > 1 ? 's' : '';
        return string.replace(/%d/i, value).replace(/%n/i, agreement);
      }

      var now        = new Date();
      now.setMilliseconds(0);
      var yearNow    = now.getFullYear(),
          monthNow   = now.getMonth(),
          dayNow     = now.getDate(),
          hoursNow   = now.getHours(),
          minutesNow = now.getMinutes(),
          secondsNow = now.getSeconds();

      var yearThen    = then.getFullYear(),
          monthThen   = then.getMonth(),
          dayThen     = then.getDate(),
          hoursThen   = then.getHours(),
          minutesThen = then.getMinutes(),
          secondsThen = then.getSeconds();
      
      var distanceMillis = now - then;

      if (this.settings.allowFuture) {
        if (distanceMillis < 0) {
          prefix = $l.prefixFromNow;
          suffix = $l.suffixFromNow;
        }
        distanceMillis = Math.abs(distanceMillis);
      }

      var words;

      if (isShown("seconds") && cmp([yearNow, monthNow, dayNow, hoursNow, minutesNow, secondsNow], [yearThen, monthThen, dayThen, hoursThen, minutesThen, secondsThen])) {
        words = substitute($l.thisSecond);
        suffix = prefix = null;
      } else if (isBiggestGrain("seconds")) {
        words = substitute($l.seconds, distanceMillis);
      } else if (isShown("minutes") && cmp([yearNow, monthNow, dayNow, hoursNow, minutesNow], [yearThen, monthThen, dayThen, hoursThen, minutesThen])) {
        words = substitute($l.thisMinute);
        suffix = prefix = null;
      } else if (isBiggestGrain("minutes")) {
        now.setSeconds(0);
        then.setSeconds(0);
        words = substitute($l.minutes, Math.floor(Math.abs(now - then) / 60000));
      } else if (isShown("hours") && cmp([yearNow, monthNow, dayNow, hoursNow], [yearThen, monthThen, dayThen, hoursThen])) {
        words = substitute($l.thisHour);
        suffix = prefix = null;
      } else if (isBiggestGrain("hours")) {
        now.setSeconds(0); now.setMinutes(0);
        then.setSeconds(0); then.setMinutes(0);
        words = substitute($l.hours, Math.floor(Math.abs(now - then) / 3600000));
      } else if (isShown("days") && cmp([yearNow, monthNow, dayNow], [yearThen, monthThen, dayThen])) {
        words = substitute($l.thisDay);
        suffix = prefix = null;
      } else if (isBiggestGrain("days")) {
        now.setSeconds(0); now.setMinutes(0); now.setHours(0);
        then.setSeconds(0); then.setMinutes(0); then.setHours(0);
        words = substitute($l.days, Math.floor(Math.abs(now - then) / 86400000));
      } else if (isShown("months") && cmp([yearNow, monthNow], [yearThen, monthThen])) {
        words = substitute($l.thisMonth);
        suffix = prefix = null;
      } else if (isBiggestGrain("months")) {
        now.setSeconds(0); now.setMinutes(0); now.setHours(0); now.setDate(1);
        then.setSeconds(0); then.setMinutes(0); then.setHours(0); then.setDate(1);
        words = substitute($l.months, Math.floor(Math.abs(now - then) / 2678400000));
      } else if (isShown("years") && cmp([yearNow], [yearThen])) {
        words = substitute($l.thisYear);
        suffix = prefix = null;
      } else {
        now.setSeconds(0); now.setMinutes(0); now.setHours(0); now.setDate(0); now.setMonths(1);
        then.setSeconds(0); then.setMinutes(0); then.setHours(0); then.setDate(0); now.setMonths(1);
        words = substitute($l.years, Math.floor(Math.abs(now - then) / 32140800000));
      }

      return $.trim([prefix, words, suffix].join(" "));
    },
    parse: function(iso8601) {
      var s = $.trim(iso8601);
      s = s.replace(/\.\d\d\d+/,""); // remove milliseconds
      s = s.replace(/-/,"/").replace(/-/,"/");
      s = s.replace(/T/," ").replace(/Z/," UTC");
      s = s.replace(/([\+\-]\d\d)\:?(\d\d)/," $1$2"); // -04:00 -> -0400
      var result = new Date(s);
      if ($att.settings.offset) result.setSeconds(result.getSeconds() + $att.settings.offset);
      return result;
    },
    datetime: function(elem) {
      // jQuery's `is()` doesn't play well with HTML5 in IE
      var isTime = $(elem).get(0).tagName.toLowerCase() === "time"; // $(elem).is("time");
      var iso8601 = isTime ? $(elem).attr("datetime") : $(elem).attr("title");
      return $att.parse(iso8601);
    }
  });

  $.fn.atthattime = function(options) {
    var $s = $att.settings;
    $.extend(true, $s, options || {});

    var self = this;
    self.each(refresh);

    if ($s.refreshMillis > 0) {
      setInterval(function() { self.each(refresh); }, $s.refreshMillis);
    }
    return self;
  };

  function allEqual (listA, listB) {
    var length = listA.length;
    if (length !== listB.length) return false;
    for (var i = 0; i < length; i++) {
      if (listA[i] !== listB[i]) return false;
    }
    return true;
  }

  function refresh() {
    var data = prepareData(this);
    if (!isNaN(data.datetime)) {
      $(this).text(inWords(data.datetime));
    }
    return this;
  }

  function prepareData(element) {
    element = $(element);
    if (!element.data("atthattime")) {
      element.data("atthattime", { datetime: $att.datetime(element) });
      var text = $.trim(element.text());
      if (text.length > 0) {
        element.attr("title", text);
      }
    }
    return element.data("atthattime");
  }

  function inWords(date) {
    return $att.inWords(date);
  }

  function isShown(timeUnit) {
    var grain = $att.settings.smallestGrain || "seconds";
    switch (timeUnit) {
      case "seconds":
        return grain === "seconds";
      case "minutes":
        return grain === "seconds" || grain === "minutes";
      case "hours":
        return grain === "seconds" || grain === "minutes" || grain === "hours";
      case "days":
        return grain === "seconds" || grain === "minutes" || grain === "hours" ||
          grain === "days";
      case "months":
        return grain === "seconds" || grain === "minutes" || grain === "hours" ||
          grain === "days" || grain === "months";
      case "years":
        return true;
      default:
        return false;
    }
  }

  function isBiggestGrain(timeUnit) {
    return timeUnit === ($att.settings.biggestGrain || "years");
  }

  // fix for IE6 suckage
  document.createElement("abbr");
  document.createElement("time");
}(jQuery));
