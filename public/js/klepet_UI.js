function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  var reg = /https?:\/\/[^ ]*\.(?:gif|png|jpg|jpeg)/;
  var jeSlika = sporocilo.match(reg);
  //console.log(jeSlika);
  if (jeSmesko || jeSlika) {
    if (jeSmesko) {
      
      sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('/&gt;', '/>'); 
      console.log(sporocilo);
    } else if (jeSlika) {
      sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<br><img').replace('/&gt;', '/>');
    }
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  }
  var regVideo = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
  var jeVideo = sporocilo.indexOf("https://www.youtube.com/watch?v=") > -1;
  if (jeVideo) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />').replace('&lt;iframe', '<br><iframe').replace('allowfullscreen;&gt', 'allowfullscreen>').replace('&gt;&lt;/iframe&gt', '</iframe>');
    //console.log(sporocilo);
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSmeske(sporocilo);
  sporocilo = dodajVideo(sporocilo);
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      //console.log(divElementHtmlTekst(sistemskoSporocilo));
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    //console.log(divElementEnostavniTekst(sporocilo));
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
    
    $('#seznam-uporabnikov div').click(function() {
        var uporabnikZasebno = '/zasebno ' + '"' + $(this).text()+ '" ';
        var tekst = $('#poslji-sporocilo');
        tekst.val(uporabnikZasebno);
        $('#poslji-sporocilo').focus();
    });
  });
  
  socket.on('dregljaj', function(vzdevek) {
    $('#vsebina').jrumble();
    $('#vsebina').trigger('startRumble');
    setTimeout(function() {
      $('#vsebina').trigger('stopRumble');
    }, 1500);
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var reg = /https?:\/\/[^ ]*\.(?:gif|png|jpg|jpeg)/;
  var jeSlika = vhodnoBesedilo.match(reg);
  //console.log(vhodnoBesedilo.match(reg));
  //console.log(jeSlika);
  if (jeSlika) {
    //console.log(jeSlika);
    var zasebno = vhodnoBesedilo.indexOf('/zasebno') > -1;
    if (zasebno) {
      var konec = vhodnoBesedilo.length - 2;
      var novo = vhodnoBesedilo.substring(0, konec + 1);
      novo += "<img src='" + jeSlika + "' style='width: 200px; margin-left: 20px' />";
      novo += '"';
      vhodnoBesedilo = novo;
    } else {
      vhodnoBesedilo = vhodnoBesedilo + "<img src='" + jeSlika + "' style='width: 200px; margin-left: 20px' />"; 
    }
  }
  
  
  
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  //console.log(vhodnoBesedilo);
  return vhodnoBesedilo;
}

function dodajVideo(vhodnoBesedilo) {
  //var video = vhodnoBesedilo.indexOf("https://www.youtube.com/watch?v=") > -1;
  //console.log(video);
  var regVideo = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
  var jeVideo = vhodnoBesedilo.match(regVideo);
  //console.log(vhodnoBesedilo);
  //console.log(jeVideo);
  if (jeVideo) {
    //console.log(jeVideo);
    vhodnoBesedilo += "<iframe src='https://www.youtube.com/embed/" + jeVideo[1] + "' style:'width: 200px; height: 150px; margin-left: 20px;' allowfullscreen></iframe>";
  }
  return vhodnoBesedilo;
}
