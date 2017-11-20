'use strict';
var https = require('https');
var Alexa = require('alexa-sdk');
var db = require('./AWS_Helpers');

var APP_ID = "amzn1.ask.skill.e5412491-db0b-43bc-a0c0-80e97c784009";
var SKILL_NAME = "Snow Report";
var WELCOME_MESSAGE = "Welcome to Snow Report. What would you like to know?";
var HELP_MESSAGE = "INSERT HELP MESSAGE";
var HELP_REPROMPT = "INSERT HELP REPROMPT";
var DIDNT_UNDERSTAND_MESSAGE = "I'm sorry, I didn't understand that. Try again.";
var STOP_MESSAGE = "Goodbye!";
var ERROR_MESSAGE = "I'm sorry, there was an error with getting that information. Please try again.";

var outputMsg = "";

//=========================================================================================================================================
// Handlers
//=========================================================================================================================================
exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        this.emit(':ask', WELCOME_MESSAGE, HELP_MESSAGE);
    },
    'forecastToday': function () {
        var slotResort = this.event.request.intent.slots.Resort.value;
        ///------------------HOLD TILL FIGURE OUT WHY RESOLUTION NOW PASSED IN REQUEST (Doesnt work in Build Screen, works on echosim/device---------
        var resortID;
        if (this.event.request.intent.slots.Resort.resolutions) {
            var resolution = this.event.request.intent.slots.Resort.resolutions.resolutionsPerAuthority;
            resortID = resolution[0].values[0].value.id;
            console.log("resolution id: " + resortID);
        }
        //-----------------------END HOLD---------------------
        if (!slotResort) {
            console.log("NOT a valid resort");
            this.emit(':ask', "Sorry, I don't know that resort. If you'd like to know the resorts I support just ask me what resorts I support");
            //todo: handle the err better
        }
        else {
            console.log("Resort is: " + slotResort);
            //----------------TEMP SOLUTION UNTIL RESOLUTION WORKING PROPERLY
            var slotResortID = "";
            slotResort = slotResort.toLowerCase();
            switch (slotResort) {
                case "stevens":
                case "stevens pass":
                    slotResortID = "Stevens_Pass";
                    break;
                case "snoqualmie":
                case "snoqualmie pass":
                    slotResortID = "Snoqualmie_Pass";
                    break;
                case "crystal":
                case "crystal mountain":
                    slotResortID = "Crystal_Mountain";
                    break;
                case "mount baker":
                case "mt baker":
                case "baker":
                    slotResortID = "Mt_Baker";
                    break;
                case "mission ridge":
                    slotResortID = "Mission_Ridge";
                    break;
                default:
                    slotResortID = "ERROR";
            }
            var resortName = slotResortID.split('_').join(' ');
            //-------------------------------------
            getWeather(slotResortID, (response) => {
                if (response == null) {
                    outputMsg = ERROR_MESSAGE;
                    this.emit(':ask', outputMsg);
                }
                else {
                    var responseData = JSON.parse(response);
                    if (responseData.status == "OK") { //only returned if resort not matched in switch and uses default url
                        outputMsg = "There was an error getting the weather for " + resortName;
                    }
                    else {
                        var forecast = responseData.properties.periods[0].detailedForecast;
                        outputMsg = "Today's forecast for " + resortName + " is, " + forecast;
                    }
                    this.emit(':tell', outputMsg);
                }
            })
        }
    },
    'snowReportOvernight': function () {
        var params = {
            TableName: "SkiResortData",
            Key: {
                "resort": "Stevens Pass"
            }
        };

        db.getData(params, (response) => {
            //Empty response may be caused by incorrect resort name
            if (Object.keys(response).length === 0) {
                outputMsg = ERROR_MESSAGE;
                this.emit(':ask', outputMsg);
            }
            else {
                var overNightSnow = response.Item.overNightSnowFall;
                outputMsg = "Steven's Pass got " + overNightSnow + " inches of snow over night.";
                this.emit(':tell', outputMsg);
            }
        });
    },
    'temperatureToday': function () {
        var slotResort = this.event.request.intent.slots.Resort.value;
        ///------------------HOLD TILL FIGURE OUT WHY RESOLUTION NOW PASSED IN REQUEST (Doesnt work in Build Screen, works on echosim/device---------
        var resortID;
        if (this.event.request.intent.slots.Resort.resolutions) {
            var resolution = this.event.request.intent.slots.Resort.resolutions.resolutionsPerAuthority;
            resortID = resolution[0].values[0].value.id;
            console.log("resolution id: " + resortID);
        }


        //-----------------------END HOLD---------------------

        if (!slotResort) {
            console.log("NOT a valid resort");
            this.emit(':ask', "Sorry, I don't know that resort. If you'd like to know the resorts I support just ask me what resorts I support");
            //todo: handle the err better
        }
        else {
            console.log("Resort is: " + slotResort);
            //----------------TEMP SOLUTION UNTIL RESOLUTION WORKING PROPERLY
            var slotResortID = "";
            slotResort = slotResort.toLowerCase();
            switch (slotResort) {
                case "stevens":
                case "stevens pass":
                    slotResortID = "Stevens_Pass";
                    break;
                case "snoqualmie":
                case "snoqualmie pass":
                    slotResortID = "Snoqualmie_Pass";
                    break;
                case "crystal":
                case "crystal mountain":
                    slotResortID = "Crystal_Mountain";
                    break;
                case "mount baker":
                case "mt baker":
                case "baker":
                    slotResortID = "Mt_Baker";
                    break;
                case "mission ridge":
                    slotResortID = "Mission_Ridge";
                    break;
                default:
                    slotResortID = "ERROR";
            }
            var resortName = slotResortID.split('_').join(' ');
            //-------------------------------------
            getWeather(slotResortID, (response) => {
                if (response == null) {
                    outputMsg = ERROR_MESSAGE;
                    this.emit(':ask', outputMsg);
                }
                else {
                    var responseData = JSON.parse(response);
                    if (responseData.status == "OK") { //only returned if resort not matched in switch and uses default url
                        outputMsg = "There was an error getting the weather for " + resortName;
                    }
                    else {
                        var temperature = responseData.properties.periods[0].temperature;
                        var tempTrend = responseData.properties.periods[0].temperatureTrend;
                        var shortForecast = responseData.properties.periods[0].shortForecast;

                        outputMsg = "The temperature at " + resortName + " is " + temperature + " degrees";

                        if (tempTrend !== "null" && tempTrend != null) {
                            outputMsg += " and " + tempTrend;
                        }

                        outputMsg += ", with a forecast of " + shortForecast;

                        //TEMP REMOVE eventually
                        if (resortID) {
                            outputMsg += ", resort id is " + resortID;
                        }
                    }
                    this.emit(':tell', outputMsg);
                }
            })
        }
    },
    'temperatureWeekDay': function () {
        var slotDay = this.event.request.intent.slots.Day.value;
        if (slotDay === "friday") { //TODO: wait till request schema is fixed to remove this
            slotDay = "Friday";
        }

        var slotResort = this.event.request.intent.slots.Resort.value;
        ///------------------HOLD TILL FIGURE OUT WHY RESOLUTION NOW PASSED IN REQUEST (Doesnt work in Build Screen, works on echosim/device---------
        var resortID;
        if (this.event.request.intent.slots.Resort.resolutions) {
            var resolution = this.event.request.intent.slots.Resort.resolutions.resolutionsPerAuthority;
            resortID = resolution[0].values[0].value.id;
            console.log("resolution id: " + resortID);
        }
        //-----------------------END HOLD---------------------

        if (!slotResort) {
            console.log("NOT a valid resort");
            this.emit(':ask', "Sorry, I don't know that resort. If you'd like to know the resorts I support just ask me what resorts I support");
            //todo: handle the err better
        }
        else {
            console.log("Resort is: " + slotResort);
            //----------------TEMP SOLUTION UNTIL RESOLUTION WORKING PROPERLY
            var slotResortID = "";
            slotResort = slotResort.toLowerCase();
            switch (slotResort) {
                case "stevens":
                case "stevens pass":
                    slotResortID = "Stevens_Pass";
                    break;
                case "snoqualmie":
                case "snoqualmie pass":
                    slotResortID = "Snoqualmie_Pass";
                    break;
                case "crystal":
                case "crystal mountain":
                    slotResortID = "Crystal_Mountain";
                    break;
                case "mount baker":
                case "mt baker":
                case "baker":
                    slotResortID = "Mt_Baker";
                    break;
                case "mission ridge":
                    slotResortID = "Mission_Ridge";
                    break;
                default:
                    slotResortID = "ERROR";
            }
            //----------------------------------
            var resortName = slotResortID.split('_').join(' ');

            //Check if valid day
            var daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            if (daysOfWeek.indexOf(slotDay) >= 0) {
                getWeather(slotResortID, (response) => {
                        if (response == null) {
                            outputMsg = ERROR_MESSAGE;
                            this.emit(':ask', outputMsg);
                        }
                        else {
                            var responseData = JSON.parse(response);
                            if (responseData.status == "OK") { //only returned if resort not matched in switch and uses default url
                                outputMsg = "There was an error getting the weather for " + resortName;
                            }
                            else {
                                var shortForecast = responseData.properties.periods[0].shortForecast;
                                //search for value of day asked for, make sure exists
                                var periodsNum = [];
                                for (var i = 0; i < responseData.properties.periods.length; i++) {
                                    var obj = responseData.properties.periods[i].name;
                                    if (obj.indexOf(slotDay) >= 0) {
                                        periodsNum.push(i);
                                    }
                                }
                                if (periodsNum == "") {
                                    //day not found in response (either is asking for 7th day,
                                    // or specially named holiday replaced day name IE: Veterans day instead of Saturday
                                    console.log("Couldn't find weather data for day: " + slotDay);
                                    this.emit(':tell', "Sorry, I don't have the extended forecast for " + slotDay); //todo: check error response is appropriate
                                }
                                else {
                                    outputMsg = "The temperature at " + resortName + " on " + slotDay + " will be a high of " + responseData.properties.periods[(periodsNum[0])].temperature;
                                    if (periodsNum.length > 1) { //night
                                        outputMsg += " with a low of " + responseData.properties.periods[(periodsNum[1])].temperature;
                                    }

                                    outputMsg += ", with a forecast of " + shortForecast;
                                    this.emit(':tell', outputMsg);
                                }
                            }
                        }
                    }
                );

            }
            else {
                console.log("Day not recognized.");
                this.emit(':ask', "Sorry, I didn't understand that. Try again please."); //todo test is this is good response
            }
        }
    },
    'AMAZON.HelpIntent': function () {
        var speechOutput = HELP_MESSAGE;
        var reprompt = HELP_REPROMPT;
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', STOP_MESSAGE);
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', STOP_MESSAGE);
    },
    'Unhandled': function () {
        this.emit(':ask', DIDNT_UNDERSTAND_MESSAGE, HELP_REPROMPT);
    },
    'CatchAll': function () {
        this.emit(':ask', DIDNT_UNDERSTAND_MESSAGE, HELP_REPROMPT);
    }
};

//=========================================================================================================================================
// Helper functions
//=========================================================================================================================================

//Makes a request to get the 7 day forecast for Stevens Pass
//Returns a json object
function getWeather(resort, callback) {
    var urlPath = "";
    switch (resort) {
        case "Stevens_Pass":
            urlPath = '/points/47.7459,-121.0891/forecast';
            console.log("Stevens Pass Weather");
            break;
        case "Snoqualmie_Pass":
            urlPath = '/points/47.4374,-121.4154/forecast';
            console.log("Snoqualmie weather");
            break;
        case "Crystal_Mountain":
            urlPath = '/points/46.9291,-121.501/forecast';
            console.log("Crystal weather");
            break;
        case "Mt_Baker":
            urlPath = '/points/48.8541,-121.68/forecast';
            console.log("Baker weather");
            break;
        case "Mission_Ridge":
            urlPath = '/points/47.2867,-120.4184/forecast';
            console.log("Mission ridge weather");
            break;
        default:

            break;
    }
    var options = {
        host: 'api.weather.gov',
        path: urlPath,
        method: 'GET',
        headers: {
            'user-agent': 'Snow-Report,',
            'accept': 'application/json'
        }
    };

    var req = https.request(options, res => {
        res.setEncoding('utf8');
        var returnData = "";

        res.on('data', chunk => {
            returnData += chunk;
        });

        res.on('end', () => {
            callback(returnData);
        });
    });
    req.end();
};