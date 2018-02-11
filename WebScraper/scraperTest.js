const rp = require('request-promise');
const cheerio = require('cheerio');
const db = require('./AWS_Helpers');
const fs = require('fs');


scrapeSite(
    "http://www.skibowl.com/winter/mt-hood-weather-conditions",
    "mthoodskibowl.json",
    (data) => {
        console.log(
            "resort "+  data.resort + "\n" +
            "overNightSnowFall "+ data.type.overNightSnowFall+"\n" +
            "snowFallOneDay "+ data.type.snowFallOneDay+"\n" +
            "snowFallTwoDay "+ data.type.snowFallTwoDay+"\n" +
            "snowDepthBase "+ data.type.snowDepthBase+"\n" +
            "snowDepthMidMtn "+ data.type.snowDepthMidMtn+"\n" +
            "seasonSnowFall "+ data.type.seasonSnowFall

        );
    }
    )

function scrapeSite(url, resort, callback) {
    const options = {
        uri: url,
        transform: function (body) {
            return cheerio.load(body);
        }
    };

    console.log("Fetching data from site...");
    rp(options)
        .then(($) => {
            console.log("Data received");

            //Temporary solution for selectors
            //Need to find way to properly store these in the resort json files and parse out
            //Marked N/A if info not found on site
            //------------------------------------------------------------------------------
            //------------------                SELECTORS             ----------------------
            //------------------------------------------------------------------------------
            var currentResort = "";

            var stevensPass = {
                resort: "Stevens Pass",
                selectors: {
                    reportDateUpdated: $('.page-report-snowfall-value').text(),
                    overNightSnowFall: $($('.page-report-snowfall-value')[0]).text().slice(0, -1),
                    snowFallOneDay: $($('.page-report-snowfall-value')[1]).text().slice(0, -1),
                    snowFallTwoDay: $($('.page-report-snowfall-value')[2]).text().slice(0, -1),
                    snowDepthBase: $($('.page-report-snowdepth-value')[0]).text().slice(0, -1),
                    snowDepthMidMtn: $($('.page-report-snowdepth-value')[1]).text().slice(0, -1),
                    seasonSnowFall: $($('.page-report-snowdepth-value')[2]).text().slice(0, -1)
                }
            };

            var snoqualmiePass = {
                resort: "Snoqualmie Pass",
                selectors: {
                    reportDateUpdated: $($('#block-conditions-overview .subtitle')).text(),
                    overNightSnowFall: $($('.condition-snow .value')[0]).text(),
                    snowFallOneDay: $($('.condition-snow .value')[10]).text(),
                    snowFallTwoDay: $($('.condition-snow .value')[11]).text(),
                    snowDepthBase: $($('.condition-snow-base .value')[2]).text(),
                    snowDepthMidMtn: $($('.condition-snow-base .value')[1]).text(),
                    seasonSnowFall: $($('.content .total .value')[0]).text().slice(0, -1)
                }
            };

            var crystalMountain = {
                resort: "Crystal Mountain",
                selectors: {
                    reportDateUpdated: "N/A",
                    overNightSnowFall: $('#overnight2').text().slice(0, -1),
                    snowFallOneDay: $('#hours-24-2').text().slice(0, -1),
                    snowFallTwoDay: $('#hours-48-2').text().slice(0, -1),
                    snowDepthBase: $('#bottom-depth').text().slice(0, -1),
                    snowDepthMidMtn: $('#top-depth').text().slice(0, -1),
                    seasonSnowFall: $('#season-total').text().slice(0, -1)
                }
            };

            var mtBaker = {
                resort: "Mount Baker",
                selectors: {
                    reportDateUpdated: $('.report-timestamp').text().replace(/\n/g, "").replace("//", ", "),
                    overNightSnowFall: $('.report-snowfall-value-12 .unit-i').text().slice(0, -1),
                    snowFallOneDay: $('.report-snowfall-value-24 .unit-i').text().slice(0, -1),
                    snowFallTwoDay: $('.report-snowfall-value-48 .unit-i').text().slice(0, -1),
                    snowDepthBase: $($('.report-snowbase-value .unit-i')[0]).text().slice(0, -1),
                    snowDepthMidMtn: $($('.report-snowbase-value .unit-i')[1]).text().slice(0, -1),
                    seasonSnowFall: ($($('.report-snowbase-value .unit-i')[0]).text().slice(0, -1)) >= $($('.report-snowbase-value .unit-i')[1]).text().slice(0, -1) ? ($($('.report-snowbase-value .unit-i')[0]).text().slice(0, -1)) : $($('.report-snowbase-value .unit-i')[1]).text().slice(0, -1)
                }
            };

            var missionRidge = {
                resort: "Mission Ridge",
                selectors: {
                    reportDateUpdated: $('.bluebar-time').text().trim(),
                    overNightSnowFall: $($('.weather.data-table .odd .data')[5]).text().slice(0, -1),
                    snowFallOneDay: $($('.weather.data-table .even .data')[2]).text().slice(0, -1),
                    snowFallTwoDay: $($('.weather.data-table .odd .data')[2]).text().slice(0, -1),
                    snowDepthBase: $($('.weather.data-table .even .data')[11]).text() == "-" ? "N/A" : $($('.weather.data-table .even .data')[11]).text().slice(0, -1),
                    snowDepthMidMtn: $($('.weather.data-table .even .data')[9]).text() == "-" ? "N/A" : $($('.weather.data-table .even .data')[9]).text().slice(0, -1),
                    seasonSnowFall: "N/A"
                }
            };

            var mtHoodMeadows = {
                resort: "Mount Hood",
                selectors: {
                    reportDateUpdated: $('.conditions-glance-widget .conditions-current ').text().trim(),
                    overNightSnowFall: $($('.reading.depth')[0]).text().slice(0, -1),
                    snowFallOneDay: $($('.reading.depth')[1]).text().slice(0, -1),
                    snowFallTwoDay: $($('.reading.depth')[2]).text().slice(0, -1),
                    snowDepthBase: $('.snowdepth-base .reading.depth').text().substring(5).split("\"", 1)[0],
                    snowDepthMidMtn: $('.snowdepth-mid .reading.depth').text().substring(4).split("\"", 1)[0],
                    seasonSnowFall: $('.snowdepth-ytd .reading.depth').text().slice(0, -1)
                }
            };

            var mtHoodTimberline = {
                resort: "Mt Hood Timberline",
                selectors: {
                    reportDateUpdated: $('.conditions-panel .bg-dark-blue .uk-text-contrast').text().trim(),
                    overNightSnowFall: $($('.conditions-panel.bg-dark-blue.uk-text-contrast dt')[1]).text().slice(0,-1),
                    snowFallOneDay: $($('.conditions-panel.bg-dark-blue.uk-text-contrast dt')[2]).text().slice(0,-1),
                    snowFallTwoDay: $($('.conditions-panel.bg-dark-blue.uk-text-contrast dt')[3]).text().slice(0,-1),
                    snowDepthBase: $($('.conditions-panel.bg-dark-blue.uk-text-contrast dt')[4]).text().slice(0,-1),
                    snowDepthMidMtn: 'N/A',
                    seasonSnowFall: $($('.conditions-panel.bg-dark-blue.uk-text-contrast dt')[8]).text().slice(0,-1),
                }
            };

            var mtHoodSkibowl = {
                resort: "Mt Hood Skibowl",
                selectors: {
                    reportDateUpdated: "N/A",
                    overNightSnowFall: "N/A",
                    snowFallOneDay: "N/A",
                    snowFallTwoDay: "N/A",
                    snowDepthBase: $($('.currentConditions td')[9]).text().split("-",1)[0].trim().slice(0,-1),
                    snowDepthMidMtn: $($('.currentConditions .info')[4]).text().split("-").pop().slice(0,-1).trim(),
                    seasonSnowFall: $($('.currentConditions td')[11]).text().slice(0,-1)
                }
            };

            var mtBachelor = {
                resort: "Mount Bachelor",
                selectors: {
                    reportDateUpdated: "N/A",
                    overNightSnowFall: $($('.key')[0]).text().slice(0, -1),
                    snowFallOneDay: $($('.key')[1]).text().slice(0, -1),
                    snowFallTwoDay: $($('.key')[2]).text().slice(0, -1),
                    snowDepthBase: $($('.key')[11]).text().slice(0, -1),
                    snowDepthMidMtn: $($('.key')[5]).text().slice(0, -1),
                    seasonSnowFall: $($('.key')[10]).text().slice(0, -1),
                }
            };

            var schweitzer = {
                resort: "Schweitzer",
                selectors: {
                    reportDateUpdated: $('.snow-report-last-updated').text(),
                    overNightSnowFall: $($('.quickList .hour .convert.inches')[0]).text().trim().slice(0, -1),
                    snowFallOneDay: $($('.quickList .hour .convert.inches')[1]).text().trim().slice(0, -1),
                    snowFallTwoDay: $($('.quickList .hour .convert.inches')[2]).text().trim().slice(0, -1),
                    snowDepthBase: $($('.quickList.depths .convert.inches')[2]).text().trim().slice(0, -1),
                    snowDepthMidMtn: $($('.quickList.depths .convert.inches')[1]).text().trim().slice(0, -1),
                    seasonSnowFall: $($('.quickList .season .convert.inches')).text().trim().slice(0, -1),
                }
            };

            var sunValley = {
                resort: "Sun Valley",
                selectors: {
                    reportDateUpdated: "N/A",
                    overNightSnowFall: $($('.weather-time h3')[0]).text().slice(0, -1),
                    snowFallOneDay: $($('.weather-time h3')[1]).text().slice(0, -1),
                    snowFallTwoDay: $($('.weather-time h3')[2]).text().slice(0, -1),
                    snowDepthBase: $($('.weather-data h3')[0]).text().slice(0, -1),
                    snowDepthMidMtn: $($('.weather-data h3')[1]).text().slice(0, -1),
                    seasonSnowFall: $($('.weather-data h3')[2]).text().slice(0, -1)
                }
            };

            // var bogusBasin = { //TODO (numbers aren't working with the selectors, give undefined??
            //     resort: "Bogus Basin",
            //     selectors: {
            //         reportDateUpdated: "N/A",
            //         overNightSnowFall: $('.overnight-stat.stat-area').innerText,
            //         snowFallOneDay: $('#conditions-snow-last-24').innerText,
            //         snowFallTwoDay: $('#conditions-snow-last-48').text(),
            //         snowDepthBase: $('.snowdepth-base .reading.depth').text(),
            //         snowDepthMidMtn: $('.snowdepth-mid .reading.depth').text(),
            //         seasonSnowFall: $($('span#conditions-snow-season-total')[0])
            //     }
            // };

            //Assign current resort to use selectors of the currently selected resort
            switch (resort) {
                case "stevens.json":
                    currentResort = stevensPass;
                    break;
                case "crystal.json":
                    currentResort = crystalMountain;
                    break;
                case "snoqualmie.json":
                    currentResort = snoqualmiePass;
                    break;
                case "baker.json":
                    currentResort = mtBaker;
                    break;
                case "mission_ridge.json":
                    currentResort = missionRidge;
                    break;
                case "mthoodmeadows.json":
                    currentResort = mtHoodMeadows;
                    break;
                case "mthoodtimberline.json":
                    currentResort = mtHoodTimberline;
                    break;
                case "mthoodskibowl.json":
                    currentResort = mtHoodSkibowl;
                    break;
                case "mtbachelor.json":
                    currentResort = mtBachelor;
                    break;
                case "schweitzer.json":
                    currentResort = schweitzer;
                    break;
                case "sun_valley.json":
                    currentResort = sunValley;
                    break;
                // case "bogus_basin.json":
                //     currentResort = bogusBasin;
                //     break;
                default:
                    callback("ERROR: Invalid Resort");
                    break;
            }

            var data = {
                resort: currentResort.resort,
                type: currentResort.selectors
            };
            callback(data);
        })
        .catch((err) => {
            console.log(err);
            callback("ERROR");
        });
};