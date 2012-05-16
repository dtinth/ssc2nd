
var path = require('path');
var fs = require('fs');

console.log('');
console.log('\033[1;36mssc2nd: StepMania 5 .ssc to Notedrop .txt converter\033[0m');
console.log('');

if (process.argv[2] == null) {
	console.log('Usage: ssc2nd FILE.ssc');
	process.exit(0);
}

var notedatas = [];
var globalTags = {};

function outputFile(filename, contents) {
	console.log('\033[1;33mWriting File: \033[1;37m' + filename + '\033[1;30m...\033[0m');
	fs.writeFileSync(path.join(path.dirname(__filename), filename), contents, 'utf-8');
}

// Read note data
(function() {
	var currentNoteData = null;
	var data = fs.readFileSync(process.argv[2], 'utf-8');

	data = data.replace(/\/\/.*/g, '');
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

// Process BPMs
(function() {
	var events = [];
	var outEvents = [];
	('' + globalTags.bpms).replace(/([0-9\.]+)\s*=\s*([0-9\.]+)/g, function(all, beat, bpm) {
		events.push({
			type: 'bpm',
			beat: 1 * beat,
			bpm: 1 * bpm
		});
	});
	('' + globalTags.timesignatures).replace(/([0-9\.]+)\s*=\s*([0-9\.]+)\s*=\s*([0-9\.]+)/g, function(all, beat, num, den) {
		events.push({
			type: 'timeSignature',
			beat: 1 * beat,
			num: 1 * num,
			den: 1 * den
		});
	});
	events.sort(function(a, b) {
		return a.beat - b.beat;
	});
	function addEvent(time, newBPM, timeSignature) {
		if (time != 0) {
			var ms = Math.round(time * 1000);
			if (outEvents.length > 0 && outEvents[outEvents.length - 1][0] == ms) {
				outEvents.pop();
			}
			outEvents.push([ms, newBPM, timeSignature, -1].join(','));
		}
	}
	(function() {
		var lastTime = 0;
		var lastBeat = 0;
		var bpm = 60;
		var timeSignature = 4;
		events.forEach(function(c) {
			var beat = c.beat;
			var time = lastTime + (beat - lastBeat) * 60 / bpm;
			if (c.type == 'bpm') {
				bpm = c.bpm;
				addEvent(time, bpm, timeSignature);
			} else if (c.type == 'timeSignature') {
				timeSignature = c.num * 4 / c.den;
				addEvent(time, bpm, timeSignature);
			}
			lastTime = time;
			lastBeat = beat;
		});
	})();
	if (outEvents.length > 0) {
		outputFile(globalTags.artist + '-' + globalTags.title + '-MultiBPM.txt', outEvents.join('\n'));
	}
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
							delete longnoteBuffer[column];
						}
					}
				}
			});
		}
		process(players[0], '');
		if (players[1]) process(players[1], '+');
		outputFile(chartName + '.txt', chartData.join('\n'));
	});
})();

console.log('\033[1;32mAll Done!\n\033[0m');
