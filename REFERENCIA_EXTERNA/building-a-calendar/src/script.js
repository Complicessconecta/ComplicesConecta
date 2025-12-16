/*global $, localStorage, angular, alert, document, console, confirm, require */
/*jshint unused:false */
/*jshint plusplus: false, devel: true, nomen: true, indent: 4, maxerr: 50 */

// Methods
Date.prototype.addDays = function (days) {
	var dat = new Date(this.valueOf());
	dat.setDate(dat.getDate() + days);
	return dat;
};


var dateStart = new Date(new Date().getFullYear(), 0, 1);
var dateEnd = dateStart.addDays(365);


Date.prototype.getComparableString = function (seperator) {
	seperator = (typeof seperator !== "undefined") ? seperator : "-";
	var d = new Date();
	return this.getFullYear() + seperator + this.getMonth() + seperator + this.getDate();
};

function createElement(tag, attributes, value) {
	var ele = document.createElement(tag);
	for (var name in attributes) {
		var attr = document.createAttribute(name);
		attr.value = attributes[name];
		ele.setAttributeNode(attr);
		if (typeof value !== "undefined") {
			ele.innerHTML = value;
		}
	}
	return ele;
}

function extend(objSource, objExtend) {
	for (var attr in objExtend) {
		objSource[attr] = objExtend[attr];
	}
	return objSource;
}

function generateDay(date, iRelativeWeek, extraClass, text, iDayOfWeek) {
	var sClass = "day" + ((typeof extraClass !== "undefined") ? " " + extraClass : "");
	var month = (typeof date.getMonth === "function") ? " " + monNames[date.getMonth()] : "";
	if (sClass.indexOf("past") === -1) {
		var past = (typeof date.getMonth === "function") ? ((today - date > iDay) ? " past" : "") : "";
		sClass += past;
	}
	sClass += month;
	var options = {
		"class": sClass,
		"data-dayofweek": (typeof iDayOfWeek !== "undefined") ? iDayOfWeek : date.getDay(),
		"data-relativeweek": iRelativeWeek,
		"data-month": month
	};
	text = (typeof text !== "undefined") ? text : iDayOfWeek;
	return createElement("li", options, text);
}

function addDays(calendar, dateStart, dateEnd) {
	for (var i = dateStart.valueOf(); i < dateEnd.valueOf(); i += iDay) {
		var thisDay = new Date(i);
		var iDayOfWeek = thisDay.getDay();
		var extraClass = "";
		if (todayCompareable === thisDay.getComparableString()) {
			extraClass = "today";
		}
		var day = generateDay(thisDay, iRelativeWeek, extraClass, thisDay.getDate());
		calendar.appendChild(day);
		iRelativeWeek += (iNewWeekOnDay == iDayOfWeek) ? 1 : 0;
	}
}

// Properties
var iSecond = 1000;
var iMinute = iSecond * 60;
var iHour = iMinute * 60;
var iDay = iHour * 24;
var iWeek = iDay * 7;
var iMonth = iDay * 31;
var iYear = iDay * 365;
var container = document.querySelector(".container");
var log = document.querySelector(".log");
var dayNames = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
var monNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
var today = new Date();
var todayCompareable = today.getComparableString();
var temp = [6, 0, 1, 2, 3, 4, 5];

// Setup
var bMondayFirst = true;
var iNewWeekOnDay = (bMondayFirst) ? 0 : 6;
var calendar = createElement("ul", {
	"class": "calendar" + ((bMondayFirst) ? " mondayFirst" : "")
});
var iRelativeWeek = 0;

// Create header
for (var dow = 0; dow < 7; dow++) {
	var day = generateDay("", -1, "header", dayNames[dow], dow);
	calendar.appendChild(day);
}

//  Create days before current day in current week
var past = [];
var testDate = dateStart;
var iDayOfWeek = temp[testDate.getDay()];
for (var i = iDayOfWeek; i >= 0; i--) {
	past.push(testDate);
	testDate -= iDay;
}
for (var i = past.length - 1; i > 0; i--) {
	var thisDay = new Date(past[i]);
	var iDayOfWeek = thisDay.getDay();
	var day = generateDay(thisDay, iRelativeWeek, "past", thisDay.getDate());
	calendar.appendChild(day);

}
//  Make sure that end will be on a sunday
var iDayOfWeek = new Date(dateEnd.valueOf() + iDay).getDay();
if (iDayOfWeek < 7) {
	dateEnd = dateEnd.valueOf() + (7 - iDayOfWeek) * iDay;
}

// Create main timespan
addDays(calendar, dateStart, dateEnd);

// Year
var year = createElement("h1", {
	"class": "year"
}, dateStart.getFullYear());
container.appendChild(year);
container.appendChild(calendar);