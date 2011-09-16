/*
 * atthattime: a jQuery plugin, version: 0.0.1 (2011-09-16)
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
      granularity: "seconds",
      strings: {
        prefixAgo: null,
        prefixFromNow: null,
        suffixAgo: "ago",
        suffixFromNow: "from now",
        seconds: "less than a minute",
        thisMinute: "this minute",
        minute: "about a minute",
        minutes: "%d minutes",
        thisHour: "this hour",
        hour: "about an hour",
        hours: "about %d hours",
        thisDay: "today",
        day: "a day",
        days: "%d days",
        thisMonth: "this month",
        month: "about a month",
        months: "%d months",
        thisYear: "this year",
        year: "about a year",
        years: "%d years",
        numbers: []
      }
    },
    inWords: function(distanceMillis) {
      var $l = this.settings.strings;
      var prefix = $l.prefixAgo;
      var suffix = $l.suffixAgo;
      if (this.settings.allowFuture) {
        if (distanceMillis < 0) {
          prefix = $l.prefixFromNow;
          suffix = $l.suffixFromNow;
        }
        distanceMillis = Math.abs(distanceMillis);
      }

      var seconds = distanceMillis / 1000;
      var minutes = seconds / 60;
      var hours = minutes / 60;
      var days = hours / 24;
      var years = days / 365;

      function substitute(stringOrFunction, number) {
        var string = $.isFunction(stringOrFunction) ? stringOrFunction(number, distanceMillis) : stringOrFunction;
        var value = ($l.numbers && $l.numbers[number]) || number;
        return string.replace(/%d/i, value);
      }

      var words;

      if (isShown('seconds') && seconds < 45) {
        words = substitute($l.seconds, Math.round(seconds));
      } else if (!isShown('seconds') && isShown('minutes') && seconds < 45) {
        words = substitute($l.thisMinute, Math.round(seconds));
        suffix = prefix = null;
      } else if (isShown('minutes') && seconds < 90) {
        words = substitute($l.minute, 1);
      } else if (isShown('minutes') && minutes < 45) {
        words = substitute($l.minutes, Math.round(minutes));
      } else if (!isShown('minutes') && isShown('hours') && minutes < 45) {
        words = substitute($l.thisHour, Math.round(minutes));
        suffix = prefix = null;
      } else if (isShown('hours') && minutes < 90) {
        words = substitute($l.hour, 1);
      } else if (isShown('hours') && hours < 24) {
        words = substitute($l.hours, Math.round(hours));
      } else if (!isShown('hours') && isShown('days') && hours < 24) {
        words = substitute($l.thisDay, Math.round(hours));
        suffix = prefix = null;
      } else if (isShown('days') && hours < 48) {
        words = substitute($l.day, 1);
      } else if (isShown('days') && days < 30) {
        words = substitute($l.days, Math.floor(days));
      } else if (!isShown('days') && isShown('months') && days < 30) {
        words = substitute($l.thisMonth, Math.floor(days));
        suffix = prefix = null;
      } else if (isShown('months') && days < 60) {
        words = substitute($l.month, 1);
      } else if (isShown('months') && days < 365) {
        words = substitute($l.months, Math.floor(days / 30));
      } else if (!isShown('months') && days < 365) {
        words = substitute($l.thisYear, Math.floor(days / 30));
        suffix = prefix = null;
      } else if (years < 2) {
        words = substitute($l.year, 1);
      } else {
        words = substitute($l.years, Math.floor(years));
      }

      return $.trim([prefix, words, suffix].join(" "));
    },
    parse: function(iso8601) {
      var s = $.trim(iso8601);
      s = s.replace(/\.\d\d\d+/,""); // remove milliseconds
      s = s.replace(/-/,"/").replace(/-/,"/");
      s = s.replace(/T/," ").replace(/Z/," UTC");
      s = s.replace(/([\+\-]\d\d)\:?(\d\d)/," $1$2"); // -04:00 -> -0400
      return new Date(s);
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
    return $att.inWords(distance(date));
  }

  function isShown(timeUnit) {
    var grain = $att.settings.granularity || "seconds";
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

  function distance(date) {
    return (new Date().getTime() - date.getTime());
  }

  // fix for IE6 suckage
  document.createElement("abbr");
  document.createElement("time");
}(jQuery));
