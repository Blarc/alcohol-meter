/*!
 * @license Open source under BSD 2-clause (http://choosealicense.com/licenses/bsd-2-clause/)
 * Copyright (c) 2015, Curtis Bratton
 * All rights reserved.
 *
 * Liquid Fill Gauge v1.1
 */
function liquidFillGaugeDefaultSettings(){
    return {
        minValue: 0, // The gauge minimum value.
        maxValue: 5, // The gauge maximum value.
        circleThickness: 0.05, // The outer circle thickness as a percentage of it's radius.
        circleFillGap: 0.05, // The size of the gap between the outer circle and wave circle as a percentage of the outer circles radius.
        circleColor: "#178BCA", // The color of the outer circle.
        waveHeight: 0.05, // The wave height as a percentage of the radius of the wave circle.
        waveCount: 1, // The number of full waves per width of the wave circle.
        waveRiseTime: 1000, // The amount of time in milliseconds for the wave to rise from 0 to it's final height.
        waveAnimateTime: 18000, // The amount of time in milliseconds for a full wave to enter the wave circle.
        waveRise: true, // Control if the wave should rise from 0 to it's full height, or start at it's full height.
        waveHeightScaling: true, // Controls wave size scaling at low and high fill percentages. When true, wave height reaches it's maximum at 50% fill, and minimum at 0% and 100% fill. This helps to prevent the wave from making the wave circle from appear totally full or empty when near it's minimum or maximum fill.
        waveAnimate: true, // Controls if the wave scrolls or is static.
        waveColor: "#178BCA", // The color of the fill wave.
        waveOffset: 0, // The amount to initially offset the wave. 0 = no offset. 1 = offset of one full wave.
        textVertPosition: .5, // The height at which to display the percentage text withing the wave circle. 0 = bottom, 1 = top.
        textSize: 1, // The relative height of the text to display in the wave circle. 1 = 50%
        valueCountUp: true, // If true, the displayed value counts up from 0 to it's final value upon loading. If false, the final value is displayed.
        displayPercent: true, // If true, a % symbol is displayed after the value.
        textColor: "#045681", // The color of the value text when the wave does not overlap it.
        waveTextColor: "#A4DBf8" // The color of the value text when the wave overlaps it.
    };
}

function loadLiquidFillGauge(elementId, value, config) {
    if(config == null) config = liquidFillGaugeDefaultSettings();

    var gauge = d3.select("#" + elementId);
    var radius = Math.min(parseInt(gauge.style("width")), parseInt(gauge.style("height")))/2;
    var locationX = parseInt(gauge.style("width"))/2 - radius;
    var locationY = parseInt(gauge.style("height"))/2 - radius;
    var fillPercent = Math.max(config.minValue, Math.min(config.maxValue, value))/config.maxValue;

    var waveHeightScale;
    if(config.waveHeightScaling){
        waveHeightScale = d3.scale.linear()
            .range([0,config.waveHeight,0])
            .domain([0,50,100]);
    } else {
        waveHeightScale = d3.scale.linear()
            .range([config.waveHeight,config.waveHeight])
            .domain([0,100]);
    }

    var textPixels = (config.textSize*radius/2);
    var textFinalValue = parseFloat(value).toFixed(2);
    var textStartValue = config.valueCountUp?config.minValue:textFinalValue;
    var percentText = config.displayPercent?"‰":"";
    var circleThickness = config.circleThickness * radius;
    var circleFillGap = config.circleFillGap * radius;
    var fillCircleMargin = circleThickness + circleFillGap;
    var fillCircleRadius = radius - fillCircleMargin;
    var waveHeight = fillCircleRadius*waveHeightScale(fillPercent*100);

    var waveLength = fillCircleRadius*2/config.waveCount;
    var waveClipCount = 1+config.waveCount;
    var waveClipWidth = waveLength*waveClipCount;

    // Rounding functions so that the correct number of decimal places is always displayed as the value counts up.
    var textRounder = function(value){ return Math.round(value); };
    if(parseFloat(textFinalValue) != parseFloat(textRounder(textFinalValue))){
        textRounder = function(value){ return parseFloat(value).toFixed(1); };
    }
    if(parseFloat(textFinalValue) != parseFloat(textRounder(textFinalValue))){
        textRounder = function(value){ return parseFloat(value).toFixed(2); };
    }

    // Data for building the clip wave area.
    var data = [];
    for(var i = 0; i <= 40*waveClipCount; i++){
        data.push({x: i/(40*waveClipCount), y: (i/(40))});
    }

    // Scales for drawing the outer circle.
    var gaugeCircleX = d3.scale.linear().range([0,2*Math.PI]).domain([0,1]);
    var gaugeCircleY = d3.scale.linear().range([0,radius]).domain([0,radius]);

    // Scales for controlling the size of the clipping path.
    var waveScaleX = d3.scale.linear().range([0,waveClipWidth]).domain([0,1]);
    var waveScaleY = d3.scale.linear().range([0,waveHeight]).domain([0,1]);

    // Scales for controlling the position of the clipping path.
    var waveRiseScale = d3.scale.linear()
        // The clipping area size is the height of the fill circle + the wave height, so we position the clip wave
        // such that the it will overlap the fill circle at all when at 0%, and will totally cover the fill
        // circle at 100%.
        .range([(fillCircleMargin+fillCircleRadius*2+waveHeight),(fillCircleMargin-waveHeight)])
        .domain([0,1]);
    var waveAnimateScale = d3.scale.linear()
        .range([0, waveClipWidth-fillCircleRadius*2]) // Push the clip area one full wave then snap back.
        .domain([0,1]);

    // Scale for controlling the position of the text within the gauge.
    var textRiseScaleY = d3.scale.linear()
        .range([fillCircleMargin+fillCircleRadius*2,(fillCircleMargin+textPixels*0.7)])
        .domain([0,1]);

    // Center the gauge within the parent SVG.
    var gaugeGroup = gauge.append("g")
        .attr('transform','translate('+locationX+','+locationY+')');

    // Draw the outer circle.
    var gaugeCircleArc = d3.svg.arc()
        .startAngle(gaugeCircleX(0))
        .endAngle(gaugeCircleX(1))
        .outerRadius(gaugeCircleY(radius))
        .innerRadius(gaugeCircleY(radius-circleThickness));
    gaugeGroup.append("path")
        .attr("d", gaugeCircleArc)
        .style("fill", config.circleColor)
        .attr('transform','translate('+radius+','+radius+')');

    // Text where the wave does not overlap.
    var text1 = gaugeGroup.append("text")
        .text(textRounder(textStartValue) + percentText)
        .attr("class", "liquidFillGaugeText")
        .attr("text-anchor", "middle")
        .attr("font-size", textPixels + "px")
        .style("fill", config.textColor)
        .attr('transform','translate('+radius+','+textRiseScaleY(config.textVertPosition)+')');

    // The clipping wave area.
    var clipArea = d3.svg.area()
        .x(function(d) { return waveScaleX(d.x); } )
        .y0(function(d) { return waveScaleY(Math.sin(Math.PI*2*config.waveOffset*-1 + Math.PI*2*(1-config.waveCount) + d.y*2*Math.PI));} )
        .y1(function(d) { return (fillCircleRadius*2 + waveHeight); } );
    var waveGroup = gaugeGroup.append("defs")
        .append("clipPath")
        .attr("id", "clipWave" + elementId);
    var wave = waveGroup.append("path")
        .datum(data)
        .attr("d", clipArea)
        .attr("T", 0);

    // The inner circle with the clipping wave attached.
    var fillCircleGroup = gaugeGroup.append("g")
        .attr("clip-path", "url(#clipWave" + elementId + ")");
    fillCircleGroup.append("circle")
        .attr("cx", radius)
        .attr("cy", radius)
        .attr("r", fillCircleRadius)
        .style("fill", config.waveColor);

    // Text where the wave does overlap.
    var text2 = fillCircleGroup.append("text")
        .text(textRounder(textStartValue) + percentText)
        .attr("class", "liquidFillGaugeText")
        .attr("text-anchor", "middle")
        .attr("font-size", textPixels + "px")
        .style("fill", config.waveTextColor)
        .attr('transform','translate('+radius+','+textRiseScaleY(config.textVertPosition)+')');

    // Make the value count up.
    if(config.valueCountUp){
        var textTween = function(){
            var i = d3.interpolate(this.textContent, textFinalValue);
            return function(t) { this.textContent = textRounder(i(t)) + percentText; }
        };
        text1.transition()
            .duration(config.waveRiseTime)
            .tween("text", textTween);
        text2.transition()
            .duration(config.waveRiseTime)
            .tween("text", textTween);
    }

    // Make the wave rise. wave and waveGroup are separate so that horizontal and vertical movement can be controlled independently.
    var waveGroupXPosition = fillCircleMargin+fillCircleRadius*2-waveClipWidth;
    if(config.waveRise){
        waveGroup.attr('transform','translate('+waveGroupXPosition+','+waveRiseScale(0)+')')
            .transition()
            .duration(config.waveRiseTime)
            .attr('transform','translate('+waveGroupXPosition+','+waveRiseScale(fillPercent)+')')
            .each("start", function(){ wave.attr('transform','translate(1,0)'); }); // This transform is necessary to get the clip wave positioned correctly when waveRise=true and waveAnimate=false. The wave will not position correctly without this, but it's not clear why this is actually necessary.
    } else {
        waveGroup.attr('transform','translate('+waveGroupXPosition+','+waveRiseScale(fillPercent)+')');
    }

    if(config.waveAnimate) animateWave();

    function animateWave() {
        wave.attr('transform','translate('+waveAnimateScale(wave.attr('T'))+',0)');
        wave.transition()
            .duration(config.waveAnimateTime * (1-wave.attr('T')))
            .ease('linear')
            .attr('transform','translate('+waveAnimateScale(1)+',0)')
            .attr('T', 1)
            .each('end', function(){
                wave.attr('T', 0);
                animateWave(config.waveAnimateTime);
            });
    }

    function GaugeUpdater(){
        this.update = function(value){
            var newFinalValue = parseFloat(value).toFixed(2);
            var textRounderUpdater = function(value){ return Math.round(value); };
            if(parseFloat(newFinalValue) != parseFloat(textRounderUpdater(newFinalValue))){
                textRounderUpdater = function(value){ return parseFloat(value).toFixed(1); };
            }
            if(parseFloat(newFinalValue) != parseFloat(textRounderUpdater(newFinalValue))){
                textRounderUpdater = function(value){ return parseFloat(value).toFixed(2); };
            }

            var textTween = function(){
                var i = d3.interpolate(this.textContent, parseFloat(value).toFixed(2));
                return function(t) { this.textContent = textRounderUpdater(i(t)) + percentText; }
            };

            text1.transition()
                .duration(config.waveRiseTime)
                .tween("text", textTween);
            text2.transition()
                .duration(config.waveRiseTime)
                .tween("text", textTween);

            var fillPercent = Math.max(config.minValue, Math.min(config.maxValue, value))/config.maxValue;
            var waveHeight = fillCircleRadius*waveHeightScale(fillPercent*100);
            var waveRiseScale = d3.scale.linear()
                // The clipping area size is the height of the fill circle + the wave height, so we position the clip wave
                // such that the it will overlap the fill circle at all when at 0%, and will totally cover the fill
                // circle at 100%.
                .range([(fillCircleMargin+fillCircleRadius*2+waveHeight),(fillCircleMargin-waveHeight)])
                .domain([0,1]);
            var newHeight = waveRiseScale(fillPercent);
            var waveScaleX = d3.scale.linear().range([0,waveClipWidth]).domain([0,1]);
            var waveScaleY = d3.scale.linear().range([0,waveHeight]).domain([0,1]);
            var newClipArea;
            if(config.waveHeightScaling){
                newClipArea = d3.svg.area()
                    .x(function(d) { return waveScaleX(d.x); } )
                    .y0(function(d) { return waveScaleY(Math.sin(Math.PI*2*config.waveOffset*-1 + Math.PI*2*(1-config.waveCount) + d.y*2*Math.PI));} )
                    .y1(function(d) { return (fillCircleRadius*2 + waveHeight); } );
            } else {
                newClipArea = clipArea;
            }

            var newWavePosition = config.waveAnimate?waveAnimateScale(1):0;
            wave.transition()
                .duration(0)
                .transition()
                .duration(config.waveAnimate?(config.waveAnimateTime * (1-wave.attr('T'))):(config.waveRiseTime))
                .ease('linear')
                .attr('d', newClipArea)
                .attr('transform','translate('+newWavePosition+',0)')
                .attr('T','1')
                .each("end", function(){
                    if(config.waveAnimate){
                        wave.attr('transform','translate('+waveAnimateScale(0)+',0)');
                        animateWave(config.waveAnimateTime);
                    }
                });
            waveGroup.transition()
                .duration(config.waveRiseTime)
                .attr('transform','translate('+waveGroupXPosition+','+newHeight+')')
        }
    }

    return new GaugeUpdater();
}


var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";


/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */
function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */
function generirajPodatke(stPacienta) {
  sessionId = getSessionId();
  var ehrId = "";

  if (stPacienta == 1) {
    var ime = "Janez";
    var priimek = "Novak";
    var datumRojstva = "1989-06-10"+"T00:00:00.000Z";
  } else if (stPacienta == 2) {
    var ime = "Micka";
    var priimek = "Zmaga";
    var datumRojstva = "1987-07-11"+"T00:00:00.000Z";
  } else if (stPacienta == 3) {
    var ime = "Matic";
    var priimek = "Gril";
    var datumRojstva = "1998-05-05"+"T00:00:00.000Z";
  }

  $.ajaxSetup({
    headers: {"Ehr-Session": sessionId}
  });
  $.ajax({
    url: baseUrl + "/ehr",
    type: 'POST',
    success: function (data) {
      ehrId = data.ehrId;
      var partyData = {
        firstNames: ime,
        lastNames: priimek,
        dateOfBirth: datumRojstva,
        partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
      };
      $.ajax({
        url: baseUrl + "/demographics/party",
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(partyData),
        success: function(party) {
          if (party.action == 'CREATE') {
           $("#kreirajSporociloNav").html("<span class='obvestilo label label-success fade-in'>Podatki vpisani</span>");
           $("#dodajVitalneObstojeciID")[0][stPacienta].value =ehrId;
           if(stPacienta==1){
              zapisiMeritve(ehrId, "177.4", "114.9", "2009-05-20T09:30", "36.1", "95" );
              zapisiMeritve(ehrId, "177.6", "122.0", "2011-05-20T09:30", "36.0", "96" );
              zapisiMeritve(ehrId, "178.5", "119.3", "2013-05-20T09:30", "35.9", "93" );
              zapisiMeritve(ehrId, "176.4", "113.2", "2014-05-20T09:30", "35.8", "91" );
              zapisiMeritve(ehrId, "178.4", "134.7", "2015-05-20T09:30", "36.2", "92" );
              zapisiMeritve(ehrId, "178.3", "123.5", "2016-05-20T09:30", "35.7", "94" );
            }

            else if(stPacienta==2){
              zapisiMeritve(ehrId, "165.5", "81.2", "2008-05-20T09:30", "37.3", "90" );
              zapisiMeritve(ehrId, "165.5", "83.3", "2010-05-20T09:30", "35.5", "89" );
              zapisiMeritve(ehrId, "165.4", "84.5", "2012-05-20T09:30", "35.8", "96" );
              zapisiMeritve(ehrId, "165.4", "86.2", "2013-04-20T09:30", "36.0", "91" );
              zapisiMeritve(ehrId, "165.5", "88.7", "2015-05-20T09:30", "35.7", "92" );
              zapisiMeritve(ehrId, "165.4", "90.2", "2016-05-20T09:30", "36.2", "93" );
            }

            else if(stPacienta==3){
              zapisiMeritve(ehrId, "185.4", "63.2", "2014-05-20T09:30", "35.8", "98" );
              zapisiMeritve(ehrId, "186.5", "64.5", "2015-02-20T09:30", "35.9", "97" );
              zapisiMeritve(ehrId, "187.4", "65.0", "2015-08-20T09:30", "36.5", "99" );
              zapisiMeritve(ehrId, "188.3", "67.9", "2016-02-20T09:30", "35.2", "97" );
              zapisiMeritve(ehrId, "189.4", "69.5", "2017-02-20T09:30", "36.4", "96" );
              zapisiMeritve(ehrId, "190.7", "70.5", "2017-03-20T08:30", "36.1", "99" );
            }
          }
        },
        error: function(err) {
          $("#kreirajSporociloNav").html("<span class='obvestilo label " +
          "label-danger fade-in'>Napaka '" +
          JSON.parse(err.responseText).userMessage + "'!");
        }
      });
    }
  })
  return ehrId;
}


// TODO: Tukaj implementirate funkcionalnost, ki jo podpira vaša aplikacija

function dodajVitalneID() {
  var ehrId = $("#dodajVitalneIDEhr").val();

  if (!ehrId || ehrId.trim().length == 0) {
    $("#dodajVitalneIDSporocilo").html("<span class='obvestilo " +
      "label label-warning fade-in'>Prosim vnesite EHR ID!");
  }
  else {
    $('#preberiObstojeciEHRVitalniDatum')
    .find('option')
    .remove()
    .end()
    .append('<option value=""></option>')
    ;

    dodajVitalne(ehrId);
  }
}

function zapisiMeritve(ehrId, telesnaVisina, telesnaTeza, datumInUra, telesnaTemperatura, nasicenostKrviSKisikom) {
  sessionId = getSessionId();
  $.ajaxSetup({
      headers: {"Ehr-Session": sessionId}
  });
  var podatki = {
    // Struktura predloge je na voljo na naslednjem spletnem naslovu:
    // https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
      "ctx/language": "en",
      "ctx/territory": "SI",
      "ctx/time": datumInUra,
      "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
      "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
      "vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
      "vital_signs/body_temperature/any_event/temperature|unit": "°C",
      "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
  };
  var parametriZahteve = {
      ehrId: ehrId,
      templateId: 'Vital Signs',
      format: 'FLAT'
      //committer: merilec
  };
  $.ajax({
      url: baseUrl + "/composition?" + $.param(parametriZahteve),
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(podatki),
      success: function (res) {
          console.log(res.meta.href);
      },
      error: function(err) {
        console.log(err.responseText);
      }
  });
}

var atm = 0;
function dodajPijacoNaSeznam() {

  var novaPijaca = $("#imePijaca").val();
  var volPijaca = $("#kolicinaPijac").val();
  var alkohol = $("#alkoholPijaca").val();
  var visina = parseInt($("#dodajVitalnotelesnaVisina").val())/100;
  var teza = parseInt($("#dodajVitalnotelesnaTeza").val());
  var temp = parseInt($("#dodajVitalnotelesnaTemperatura").val());
  var kisik = parseInt($("#dodajVitalnonasicenostKrviSKisikom").val());

  if (visina > 0 && teza > 0 && temp > 0 && kisik > 0) {
    $("#seznamZaSpit").append("<li class='list-group-item d-flex justify-content-between align-items-center'>"+novaPijaca+"<span class='badge badge-primary badge-pill'>"+volPijaca+" l</span></li>");
    //racunanje alkohola
    var itm = teza / (visina * visina);
    console.log("itm: "+itm);
    atm += kisik/(itm+temp+800) * volPijaca * alkohol;
    gauge2.update(atm);
    $("#dodajPivoSporocilo").html("<span class='obvestilo label label-success fade-in'>Na zdravje!");
  } else {
    $("#dodajPivoSporocilo").html("<span class='obvestilo label label-warning fade-in'>Neveljavni vitalni podatki");
  }

}

function dodajVitalne(ehrId) {
  var tabMeritev = [];
  var sessionId = getSessionId();
    $.ajax({
      url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
      type: 'GET',
      headers: {"Ehr-Session": sessionId},
      success: function (data) {
        var party = data.party;
        $("#dodajVitalneIme").html("<span><b>"+party.firstNames+" "+ party.lastNames +"</b></span>");
        $.ajax({
          url: baseUrl +"/view/" + ehrId +"/body_temperature",
          type: 'GET',
          headers: {"Ehr-Session": sessionId},
          success: function (res) {
            for (var i in res) {
              $('#preberiObstojeciEHRVitalniDatum').append("<option id='vit"+i+"' value='"+res[i].temperature+"'>"+res[i].time+"</option");
            }
            $.ajax({
              url: baseUrl +"/view/" + ehrId +"/height",
              type: 'GET',
              headers: {"Ehr-Session": sessionId},
              success: function (res) {
                for (var i in res) {
                  $("#vit"+i).val(function(){
                    return this.value+"|"+res[i].height;
                  });
                }
                $.ajax({
                  url: baseUrl +"/view/" + ehrId +"/weight",
                  type: 'GET',
                  headers: {"Ehr-Session": sessionId},
                  success: function (res) {
                    for (var i in res) {
                      $("#vit"+i).val(function(){
                        return this.value+"|"+res[i].weight;
                      });
                    }
                    $.ajax({
                      url: baseUrl +"/view/" + ehrId +"/spO2",
                      type: 'GET',
                      headers: {"Ehr-Session": sessionId},
                      success: function (res) {
                        for (var i in res) {
                          $("#vit"+i).val(function(){
                            return this.value+"|"+res[i].spO2;
                          });
                        }
                      },
                      error: function(err) {
                        $("#dodajVitalneIDSporocilo").html("<span class='obvestilo " +
                          "label label-warning fade-in'>Podatki ne obstajajo ali pa so nepopolni!");
                      }
                    });
                  },
                  error: function(err) {
                    $("#dodajVitalneIDSporocilo").html("<span class='obvestilo " +
                      "label label-warning fade-in'>Podatki ne obstajajo ali pa so nepopolni!");
                  }
                });
              },
              error: function(err) {
                $("#dodajVitalneIDSporocilo").html("<span class='obvestilo " +
                  "label label-warning fade-in'>Podatki ne obstajajo ali pa so nepopolni!");
              }
            });
          },
          error: function(err) {
            $("#dodajVitalneIDSporocilo").html("<span class='obvestilo " +
              "label label-warning fade-in'>Podatki ne obstajajo ali pa so nepopolni!");
          }
        });
      },
      error: function(err) {
        $("#dodajVitalneIDSporocilo").html("<span class='obvestilo " +
          "label label-danger fade-in'>Neveljaven EHR ID!");
      }
    });
}

function preveriEHRid() {
  var sessionId = getSessionId();
  var ehrId = $("#dodajEHRVnos").val();

  if (!ehrId || ehrId.trim().length == 0) {
    $("#preveriEHRidSporocilo").html("<span class='obvestilo " +
      "label label-warning fade-in'>Prosim vnesite EHR ID!");
  } else {
    $.ajax({
      url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
      type: 'GET',
      headers: {"Ehr-Session": sessionId},
      success: function (data) {
        var party = data.party;
        $("#dodajImeVnos").html("<span><b>"+party.firstNames +" "+ party.lastNames+"</b></span>");
        $("#preveriEHRidSporocilo").html("<span class='obvestilo " +
          "label label-success fade-in'>Uspesno prebrani podatki!");
      },
      error: function(err) {
        $("#preveriEHRidSporocilo").html("<span class='obvestilo " +
          "label label-danger fade-in'>Neveljaven EHR ID!");
      }
    });
  }
}

function strezniSe() {
  atm = 0;
  gauge2.update(atm);
  $("#seznamZaSpit").empty();
}

function dodajVitalneMeritve() {
  var sessionId = getSessionId();
  var ehrId = $("#dodajEHRVnos").val();

  var datum = $("#dodajVitalneMeritveDatum").val();
  var visina = $("#dodajVitalneMeritveVisina").val();
  var teza = $("#dodajVitalneMeritveTeza").val();
  var temp = $("#dodajVitalneMeritveTemp").val();
  var kisik = $("#dodajVitalneMeritveKisik").val();

  zapisiMeritve(ehrId, visina, teza, datum, temp, kisik);

  $("#dodajVitalneMeritveDatum").val("");
  $("#dodajVitalneMeritveVisina").val("");
  $("#dodajVitalneMeritveTeza").val("");
  $("#dodajVitalneMeritveTemp").val("");
  $("#dodajVitalneMeritveKisik").val("");
}

$(document).ready(function() {

  for (var page = 1; page < 8; page++) {
    $.ajax({
      url: 'https://lcboapi.com/products?page='+page,
      headers: { 'Authorization': 'Token MDplNGYyMTIxOC01ZjVmLTExZTgtOGE0Yy01YjAyZTJlNWYxYjY6QTJEY1pGV1owSHRwemlLdWFvOG9OM09lV1U1c09RZHBVbjBo' }
    }).then(function(data) {
        var products = data.result;
        console.log(products);
        $.each(products, function (i, item) {
          $('#seznamPijac').append($('<option>', { 
            value: item.name+'|'+item.origin+'|'+item.primary_category+'|'+item.alcohol_content+'|'+item.tasting_note+'|'+item.serving_suggestion,
            text : item.name
          }));
        });
    });
  };

  //UREJENI
  $("#kreirajSporociloNav").val("");

  //NEUREJENI

  $("#dodajPivoSporocilo").html("");

  $("#dodajEHRVnos").val("");
  $("#dodajVitalneMeritveDatum").val("");
  $("#dodajVitalneMeritveVisina").val("");
  $("#dodajVitalneMeritveTeza").val("");
  $("#dodajVitalneMeritveTemp").val("");
  $("#dodajVitalneMeritveKisik").val("");

  $("#dodajPivoSporocilo").val("");
  $('#imePijaca').val("");
  $('#izvorPijaca').val("");
  $('#kategorijaPijaca').val("");
  $('#alkoholPijaca').val("");
  $('#okusPijaca').val("");
  $('#strezenjePijaca').val("");

  $('#dodajVitalneIDEhr').val("");
  $('#dodajVitalnotelesnaVisina').val("");
  $('#dodajVitalnotelesnaTeza').val("");
  $('#dodajVitalnotelesnaTemperatura').val("");
  $('#dodajVitalnonasicenostKrviSKisikom').val("");

  $('#dodajVitalneObstojeciID').change(function() {
    $('#dodajVitalneIDEhr').val($(this).val());
    $('#preberiObstojeciEHRVitalniDatum')
    .find('option')
    .remove()
    .end()
    .append('<option value=""></option>')
    ;
  });

  $('#preberiEHRVnos').change(function() {
    $('#preveriEHRidSporocilo').html("");
    $('#dodajEHRVnos').val($(this).val());
    $("#dodajImeVnos").html("<span><b>"+$('#preberiEHRVnos option:selected').text()+"</b></span>");
  });

  $('#preberiObstojeciEHRVitalniDatum').change(function() {
    var podatki = $(this).val().split("|");
    console.log(podatki);
    //$("#dodajVitalneIDSporocilo").html("");
    $('#dodajVitalnotelesnaVisina').val(podatki[1]);
    $('#dodajVitalnotelesnaTeza').val(podatki[2]);
    $('#dodajVitalnotelesnaTemperatura').val(podatki[0]);
    $('#dodajVitalnonasicenostKrviSKisikom').val(podatki[3]);
  });


  $('#seznamPijac').change(function() {
    $("#dodajPivoSporocilo").html("");
    var podatki = $(this).val().split("|");
    $('#imePijaca').val(podatki[0]);
    $('#izvorPijaca').val(podatki[1]);
    $('#kategorijaPijaca').val(podatki[2]);
    if(podatki[3] != null) {
      $('#alkoholPijaca').val(podatki[3]/100);
    } else {
      $('#alkoholPijaca').val("");
    }

    if(podatki[4] == "null") {
       $('#okusPijaca').val("Ni opisa.");
    } else {
      $('#okusPijaca').val(podatki[4]);
    }
    if(podatki[5] == "null") {
       $('#strezenjePijaca').val("Ni opisa.");
    } else {
      $('#strezenjePijaca').val(podatki[5]);
    }
  });
});