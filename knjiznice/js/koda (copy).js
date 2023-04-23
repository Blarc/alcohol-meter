
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
           $("#kreirajSporocilo").html("<span class='obvestilo label label-success fade-in'>Podatki vpisani</span>");
           $("#preberiObstojeciEHRVitalni")[0][stPacienta].value =ehrId;
           if(stPacienta==1){
              zapisiMeritve(ehrId, "178.4", "109.9", "2009-05-20T09:30", "36.1", "95" );
              zapisiMeritve(ehrId, "178.6", "112.0", "2011-05-20T09:30", "36.0", "96" );
              zapisiMeritve(ehrId, "178.5", "110.3", "2013-05-20T09:30", "35.9", "98" );
              zapisiMeritve(ehrId, "178.4", "108.2", "2014-05-20T09:30", "35.8", "97" );
              zapisiMeritve(ehrId, "178.4", "104.7", "2015-05-20T09:30", "36.2", "97" );
              zapisiMeritve(ehrId, "178.3", "101.5", "2016-05-20T09:30", "35.7", "96" );
            }

            else if(stPacienta==2){
              zapisiMeritve(ehrId, "185.5", "81.2", "2008-05-20T09:30", "36.3", "97" );
              zapisiMeritve(ehrId, "185.5", "83.3", "2010-05-20T09:30", "35.5", "98" );
              zapisiMeritve(ehrId, "185.4", "84.5", "2012-05-20T09:30", "35.8", "96" );
              zapisiMeritve(ehrId, "185.4", "86.2", "2013-04-20T09:30", "36.0", "95" );
              zapisiMeritve(ehrId, "185.5", "88.7", "2015-05-20T09:30", "35.7", "94" );
              zapisiMeritve(ehrId, "185.4", "90.2", "2016-05-20T09:30", "36.2", "97" );
            }

            else if(stPacienta==3){
              zapisiMeritve(ehrId, "158.4", "58.2", "2014-05-20T09:30", "35.8", "98" );
              zapisiMeritve(ehrId, "158.5", "59.5", "2015-02-20T09:30", "35.9", "97" );
              zapisiMeritve(ehrId, "158.4", "60.0", "2015-08-20T09:30", "35.5", "99" );
              zapisiMeritve(ehrId, "158.3", "57.9", "2016-02-20T09:30", "35.2", "97" );
              zapisiMeritve(ehrId, "158.4", "58.5", "2017-02-20T09:30", "35.4", "96" );
              zapisiMeritve(ehrId, "158.7", "54.5", "2017-03-20T08:30", "36.1", "95" );
            }
          }
        },
        error: function(err) {
          $("#kreirajSporocilo").html("<span class='obvestilo label " +
          "label-danger fade-in'>Napaka '" +
          JSON.parse(err.responseText).userMessage + "'!");
        }
      });
    }
  })
  return ehrId;
}


// TODO: Tukaj implementirate funkcionalnost, ki jo podpira vaša aplikacija
function preberiEHRodBolnika() {
  sessionId = getSessionId();

  var ehrId = $("#preberiEHRid").val();

  if (!ehrId || ehrId.trim().length == 0) {
    $("#preberiSporocilo").html("<span class='obvestilo label label-warning " +
      "fade-in'>Prosim vnesite zahtevan podatek!");
  } else {
    $.ajax({
      url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
      type: 'GET',
      headers: {"Ehr-Session": sessionId},
        success: function (data) {
          var party = data.party;
          $("#preberiSporocilo").html("<span class='obvestilo label label-success fade-in'>Podatki vpisani</span>");
          $("#preberiIme").val(party.firstNames);
          $("#preberiPriimek").val(party.lastNames);
          $("#preberiDatumRoj").val(party.dateOfBirth);
          $("#preberiID").val(ehrId);
      },
      error: function(err) {
        $("#preberiSporocilo").html("<span class='obvestilo label " +
          "label-danger fade-in'>Napaka '" +
          JSON.parse(err.responseText).userMessage + "'!");
      }
    });
  }
}

function dodajVitalneID() {
  var ehrId = $("#dodajVitalneIDEhr").val();

  if (!ehrId || ehrId.trim().length == 0) {
    $("#dodajVitalneIDsporocilo").html("<span class='obvestilo " +
      "label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
  }
  else {
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

var seznamPijacPodatki = [];

function dodajPijacoNaSeznam() {
  var novaPijaca = $("#imePijaca").val();
  var volPijaca = $("#kolicinaPijac").val();
  var pijacaPodatki = {alco: $("#alkoholPijaca").val(), vol: $("#kolicinaPijac").val()};
  seznamPijacPodatki.push(pijacaPodatki);
  console.log(seznamPijacPodatki);
  $(".seznamZaSpit").append("<li class='list-group-item d-flex justify-content-between align-items-center'>"+novaPijaca+"<span class='badge badge-primary badge-pill'>"+volPijaca+" l</span></li>");
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
                        console.log("hello2");
                      }
                    });
                  },
                  error: function(err) {
                    console.log("hello");
                  }
                });
              },
              error: function(err) {
                console.log("hello");
              }
            });
          },
          error: function(err) {
            console.log("hello");
          }
        });
      },
      error: function(err) {
        console.log("hello");
      }
    });
}

$(document).ready(function() {

  for (var page = 1; page < 3; page++) {
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

  $("#kreirajSporocilo").val("");
  $("#preberiIme").val("");
  $("#preberiPriimek").val("");
  $("#preberiDatumRoj").val("");
  $("#preberiID").val("");

  $("#dodajPivoSporocilo").val("");
  $("#imePivo").val("");
  $("#drzavaPivo").val("");
  $("#sestavinePivo").val("");
  $("#alergeniPivo").val("");
  $("#alkoholPivo").val("");

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

  $('#preberiObstojeciEHRVitalni').change(function() {
    $('#dodajVitalneIDEhr').val($(this).val());
    $('#preberiObstojeciEHRVitalniDatum')
    .find('option')
    .remove()
    .end()
    .append('<option value=""></option>')
    ;
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