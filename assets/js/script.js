// Having the API key included is a requirement of the project.  We are aware this is extremely bad practice.
var happiKey = "6cee08jelZimDlZuhamu4dj8z6Hes2R3BUAfCerTzePrK80h8QcSAhSg";
var lastFmKey = "8443bdf1c4cc5890510c1a04982da6d7";
var songHistory = {};

$("#search").click(async function () {
    var title = $("#song").val().trim();
    var artist = $("#artist").val().trim();
    if (title && artist) {
        title = toTitleCase(title);
        artist = toTitleCase(artist);
        var track = artist + "+" + title;
        if (track in songHistory) {
            display(track);
            return;
        }
        var lastFmUrl = "https://ws.audioscrobbler.com/2.0/?method=track.getInfo&artist=" + artist + "&track=" + title + "&api_key=" + lastFmKey + "&format=json";
        var lastFmJson = await get(lastFmUrl);
        if (lastFmJson === 2 || lastFmJson.error) {
            clear();
            showModal("Song Not found");
            return;
        }

        var happiDevUrlIds = "https://api.happi.dev/v1/music?q=" + artist + " " + title + "&limit=&apikey=" + happiKey + "&type=track&lyrics=1";

        var happiJson = await get(happiDevUrlIds);
        if (happiJson.success === "false" || happiJson.length === 0 || happiJson === 2) {

            var lyrics = "";
        } else {
            var happiJsonLyrics = await get(happiJson.result[0].api_lyrics + "?apikey=" + happiKey);
            if (happiJsonLyrics.success === "false" || happiJsonLyrics.length === 0 || happiJsonLyrics === 2) {
                var lyrics = "";
            } else {
                var lyrics = happiJsonLyrics.result.lyrics;
            }
        }

        var metadata = {
            "lyrics": lyrics,
        };
        try {
            metadata["album"] = lastFmJson.track.album.title;
        } catch (typeException) {

        }
        try {
            metadata["albumThumbnail"] = lastFmJson.track.album.image[2]['#text']
        } catch (typeException) {

        }
        try {
            metadata["lastFmPlaycount"] = lastFmJson.track.playcount;
        } catch (typeException) {

        }
        try {
            metadata["length"] = parseInt(lastFmJson.track.duration) / 1000;
        } catch (typeException) {

        }
        saveHistory(track, metadata);
        displayHistory();
        display(track);
    } else {
        clear();
        var message = "";
        if (!artist && !title) {
            message = "Please enter an artist and a song";
        } else if (!artist) {
            message = "Please enter an artist";
        } else {
            message = "Please enter a song";
        }
        showModal(message);
        return;
    }
})

/**
 * Displays lyrics & metadata
 */
function display(song) {
    
    if (!song in songHistory) {
        throw new error("Display(song) not found");
    }
    clear();
    var artistTitle = song.split("+");
    $(".titleReturn").text(artistTitle[1]);
    $(".artistReturn").text("by " + artistTitle[0]);
    if (songHistory[song].album) {
        $(".albumReturn").text("Album: " + songHistory[song].album);
    }
    if (songHistory[song].lyrics === "") {
        var noLyrics = $("<h2></h2>").text("No lyrics available")
        $(".lyrics").append(noLyrics);
    } else {
        var lyricsSplit = songHistory[song].lyrics.split("\n");
        lyricsSplit.forEach(line => {
            var linePEl = $("<p></p>").text(line);
            $(".lyrics").append(linePEl);
        });
    }
    if ((!songHistory[song].length && !songHistory[song].lastFmPlaycount && !songHistory[song].albumThumbnail)) {
        var metaH1El = $("<h2></h2>").text("No Metadata Found");
        metaH1El.attr("class", "mx-7 text-2xl font-bold font-serif text-center");
        $(".additionalMetadataReturn").append(metaH1El);
    } else {
        var metaH1El = $("<h2></h2>").text("Metadata:");
        metaH1El.attr("class", "mx-7 text-2xl font-bold font-serif text-center");
        $(".additionalMetadataReturn").append(metaH1El);
        if (songHistory[song].length) {
            var length = $("<p></p>").text("Length: " + Math.floor(parseInt(songHistory[song].length) / 60) + ":" + parseInt(songHistory[song].length) % 60);
            $(".additionalMetadataReturn").append(length);
        }
        if (songHistory[song].lastFmPlaycount) {
            var lastFmPlayCount = $("<p></p>").text("LastFM Play Count: " + songHistory[song].lastFmPlaycount);
            $(".additionalMetadataReturn").append(lastFmPlayCount)
        }
        if (songHistory[song].albumThumbnail) {
            var imgEl = $("<img>");
            imgEl.attr("src", songHistory[song].albumThumbnail);
            $(".additionalMetadataReturn").append(imgEl);
        }
    }
}

/**
 * populates the history div if there is any history to populate it with
 */
function displayHistory() {

    $(".historyDiv").empty();
    var h1 = $("<h1></h1>").text("Previous Searches:")
    h1.attr("class", "text-2xl font-bold font-serif text-center");
    $(".historyDiv").append(h1);
    for (var Key in songHistory) {
        var keySplit = Key.split("+");
        var btnText = keySplit[1] + " by " + keySplit[0];
        var btn = $("<button></button>").text(btnText);
        btn.attr("class", "historyBtn mx-7 my-1 bg-blue-500 hover:bg-blue-700 shadow-md border border-black text-white font-bold py-2 px-4 rounded");
        btn.attr("type", "button");
        $(".historyDiv").append(btn);
        $(".historyBtn").click(function () {
            var btnText = $(this).text();
            var split = btnText.split(" by ");
            display(split[1] + "+" + split[0]);
        })

    }
}

/**
 * clears currently displayed lyrics, metadata, artist, title & album
 * */
function clear() {
    $(".additionalMetadataReturn").empty();
    $(".lyrics").empty();
    $(".titleReturn").text("");
    $(".artistReturn").text("");
    $(".albumReturn").text("");
}

/**
 * songHistory ----->> localstorage
 * @param {string} song - containing artist & title 
 * @param {Object} Object containing metadata
 */
function saveHistory(song, metadata) {
    songHistory[song] = metadata;
    localStorage.setItem('songHistory', JSON.stringify(songHistory));

}

/**
 * Loads history if present from localstorage
 * localStorage key songHistory -> to var songHistory 
 */
function loadHistory() {
    var json_string = localStorage.getItem('songHistory');
    if (json_string) {
        songHistory = JSON.parse(json_string);
    }
}

/////////////////////
// Helper functions//
/////////////////////

/**
 * Simple function for fetching json
 * @param {string} url - api url to fetch from
 * @returns {obj} 
 */
async function get(url) {
    try {
        let response = await fetch(url);
        let json = await response.json();

        return json;

    } catch (error) {
        console.log("an error occured trying to get json");
        return 2
    }
}

/**
 * takes a string and returns title case of that string
 * @param {string} str - string that may or may not currently be in title case
 * @returns {string} - the str in titlecase
 */
function toTitleCase(str) {
    var split = str.split(" ");
    for ( var i = 0; i < split.length;i++){
        split[i] = split[i][0].toUpperCase() + split[i].substr(1).toLowerCase();
    }
    return split.join(" ");
}

/////////////////
// Modal stuff //
/////////////////
var modal = $("#modal");
modal.hide();

/**
 * shows the modal given a message
 * @param {string} message - the message to be displayed
 */
function showModal(message){
    $(".modal-message").text(message);
    modal.show();
    $("#closeMod").click(function () {
        modal.hide();
    });
}

//////////////////////////
// On Startup functions //
//////////////////////////
loadHistory();
displayHistory();

