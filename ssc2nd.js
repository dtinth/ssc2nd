
var fs = require('fs');

if (process.argv[2] == null) {
	console.log('Usage: ssc2nd FILE.ssc');
	process.exit(0);
}

var notedatas = [];
var globalTags = {};

// Read note data
(function() {
	var currentNoteData = null;
	var data = fs.readFileSync(process.argv[2], 'utf-8');

	data = data.replace(/\/\/.*/, '');
	data.replace(/#([^:]+):([^;]*);/g, function(all, key, value) {
		var command = key.toLowerCase();
		if (command == 'notedata') {
			notedatas.push(currentNoteData = {});
		} else if (currentNoteData != null) {
			currentNoteData[command] = value;
		} else {
			globalTags[command] = value;
		}
	});
})();

// Process note data
(function() {
	notedatas.forEach(function(notedata) {
		var keys = 'N';
		if (notedata.stepstype == 'dance-single') keys = '4';
		else if (notedata.stepstype == 'dance-double') keys = '8';
		else if (notedata.stepstype == 'dance-solo') keys = '6';
		var difficulty = 'NM';
		if (notedata.difficulty == 'Hard') difficulty = 'HD';
		else if (notedata.difficulty == 'Challenge') difficulty = 'SU';
		else if (notedata.difficulty == 'Beginner') difficulty = 'LT';
		var chartType = keys + 'K-' + difficulty;
		var chartName = globalTags.subtitle + '-' + globalTags.artist + '-' + globalTags.title + '-' +chartType;
		var chartData = ['// converted by ssc2nd', ''];
		var players = notedata.notes.split(/&/);
		function process(player) {
			var nextStartBeat = 0;
			var nextBarNumber = 0;
			var longnoteBuffer = {};
			player.split(/,/).forEach(function(bar) {
				var startBeat = nextStartBeat;
				var barNumber = nextBarNumber;
				nextStartBeat += 4;
				nextBarNumber ++;
				var items = bar.match(/\S+/g);
				chartData.push('');
				chartData.push('// measure ' + nextBarNumber);
				for (var i = 0; i < items.length; i ++) {
					var item = items[i];
					var beat = (startBeat + i / items.length * 4).toFixed(3)
						.replace(/\.0+$/, '').replace(/(\.\d*)0+$/, '$1');
					for (var j = 0; j < item.length; j ++) {
						var column = j + 1;
						var c = item[j];
						if (c == '1') {
							chartData.push('N,' + beat + ',' + column);
						} else if (c == '2') {
							longnoteBuffer[column] = beat;
						} else if (c == '3') {
							chartData.push('H,' + longnoteBuffer[column] + ',' + beat + ',' + column);
							delete longnoteBuffer[column]
						}
					}
				}
			});
		}
		process(players[0], '');
		if (players[1]) process(players[1], '+');
		fs.writeFileSync(chartName + '.txt', chartData.join('\n'), 'utf-8');
	});
})();
