/////////////////////////////////////////// CONFIG START
	var urlParams = new URLSearchParams(window.location.search);
	
	var active = urlParams.get("active") || 'YOUR_IMAGE_HERE_WHEN_YOU_ARE_TALKING.gif' 					// image/gif that is displayed when the level is above the threshold
	var inactive = urlParams.get("inactive") || 'YOUR_IMAGE_HERE_WHEN_YOU_ARE_NOT_TALKING.gif' 				// image/gif that is displayed when the level is below the threshold
	
	var options = {
        on:                         false,  								//if sound level is higher then thresold and longer then minimum delta time
        peek:                       false,  								//peek flag
        enable:                     true,   								//if sound events is triggered
        level:                      0,      								//raw level
        normalized:                 0,      								//normalized level (with dynamic noise level)
        noise:                      0,      								//raw noise level
        minSoundLevel:              urlParams.get("threshold") || 1.5,   	//minmum sound level above noise level to trigger start event
        minSoundLevel_normalized:   urlParams.get("threshold") || 1.5,   	//normalized minimum sound level above noise level to trigger start event
        max:                        60,
        max_normalized:             60,
        minDeltaTime:               urlParams.get("delay") || 150,     		//delay in ms before 'active' triggers after level got above threshold
        duration:                   urlParams.get("release") || 0 			//time in ms that 'active' should persist after level dropped below threshold
    };
/////////////////////////////////////////// CONFIG END
	
		
	
	
/////////////////////////////////////////// LIB START
	/* helpers */
Array.prototype.average = function () {
    var i = 0,
        l = this.length,
        s = 0;

    for (i = 0; i < l; i++) {
        s += this[i];
    }

    return s / l;
};

function soundMeterCtrl (options) {

    var self = this;

    //cross browser audio support
    var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || false;
    var audioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || false;

    var sound = {
        on:                         false,  //if sound level is higher then thresold and longer then minimum delta time
        peek:                       false,  //peek flag
        enable:                     true,   //if sound events is triggered
        level:                      0,      //raw level
        normalized:                 0,      //normalized level (with dynamic noise level)
        noise:                      0,      //raw noise level
        minSoundLevel:              1.5,     //minmum sound level above noise level to trigger start event
        minSoundLevel_normalized:   1.5,     //normalized minimum sound level above noise level to trigger start event
        max:                        60,
        max_normalized:             60,
        minDeltaTime:               150,     //delta time [ms] if peek duration is longer than minDeltaTime start blow event is triggered
        duration:                   0
    };
	
	sound = Object.assign({}, sound, options);


    this.init = function () {
        //soundMeter initialization
        var initSuccessful  = new Event ('sound.init.ok'),
            initFail        = new Event ('sound.init.fail'),
            dynamicLevel    = new Event ('sound.dynamic.level');


        var buffer_size     = 125,                               //how many samples take place in normalize process
            buffer          = new Array (buffer_size),          //buffer for normalize level
            sample          = 0,                                //sample count (iterator var)
            inited          = false;                            //initial fill of buffer


        if (typeof getUserMedia === "function") {
            getUserMedia.call  (navigator,
                {audio:true},
                function(stream) {
                    //Audio context initalization
                    audioCtx        = new audioContext();
                    analyser        = audioCtx.createAnalyser();
                    microphone      = audioCtx.createMediaStreamSource(stream);
                    javascriptNode  = audioCtx.createScriptProcessor(2048, 1, 1);

                    analyser.smoothingTimeConstant = 0.8;
                    analyser.fftSize = 1024;

                    microphone.connect(analyser);
                    analyser.connect(javascriptNode);
                    javascriptNode.connect(audioCtx.destination);

                    //reinit views for blowing version
                    document.dispatchEvent (initSuccessful);

                    //handle volume meter
                    javascriptNode.onaudioprocess = function () {
                        var array = new Uint8Array(analyser.frequencyBinCount);
                        analyser.getByteFrequencyData(array);
                        var values = 0;

                        var length = array.length;
                        for (var i = 0; i < length; i++) {
                            values += (array[i]);
                        }

                        var average = values / length;

                        sound.level = average;

                        if (inited) {
                            buffer = buffer.slice(1);
                            buffer.push (average);

                            sound.normalized = average - buffer.average() < 0 ? 0 : average - buffer.average();
                            sound.noise = average - sound.normalized;

							sound.minSoundLevel_normalized = sound.minSoundLevel - ((sound.noise / 180) * sound.minSoundLevel);
                            if (!sound.on) {
                                sound.max_normalized = sound.max - sound.noise;
                            }

                        } else {
                            buffer[sample++] = average;
                        }

                        if (!inited && sample > buffer_size) {
                            sample = 0;
                            inited = true;

                            document.dispatchEvent (dynamicLevel);
                        }

                        self.checkLevels ();
                    };
                },
                function () {
                    document.dispatchEvent (initFail);
                }
            );
        } else {
            document.dispatchEvent (initFail);
        }
    };

    /**
     * check sound levels
     *
     * dispatch events
     */
    this.checkLevels = function () {
        if (!sound.enable) {
            return false;
        }

        //start
        if (!sound.on && !sound.peek && sound.normalized > sound.minSoundLevel_normalized ) {
            sound.peek = true;
            sound.duration = 0;
            sound.start = Date.now ();
        }

        if (!sound.on && sound.peek && sound.normalized > sound.minSoundLevel_normalized ) {
            sound.duration = Date.now () - sound.start;
        }

        if (!sound.on && sound.peek && sound.duration > sound.minDeltaTime && sound.normalized > sound.minSoundLevel_normalized ) {
            sound.on = true;
            sound.start = Date.now ();

            var blowStart = new CustomEvent ('sound.blow.start', { detail: {
                level: sound.level,
                normalized: sound.normalized,
                noise: sound.noise,
                max: sound.max_normalized,
                duration: 0
            }});
            document.dispatchEvent (blowStart);
        }

        //during
        if (sound.on && sound.normalized > sound.minSoundLevel_normalized) {
            sound.duration = Date.now () - sound.start;

            var blowDuring = new CustomEvent ('sound.blow.during', { detail: {
                level: sound.level,
                normalized: sound.normalized,
                noise: sound.noise,
                max: sound.max_normalized,
                duration: sound.duration
            }});
            document.dispatchEvent (blowDuring);
        }

        //stop
        if (sound.on && sound.normalized < sound.minSoundLevel_normalized) {
            sound.on = false;
            sound.peek = false;
            sound.stop = Date.now ();
            sound.duration = sound.stop - sound.start;

            var blowStop = new CustomEvent ('sound.blow.stop', { detail: {
                level: sound.level,
                normalized: sound.normalized,
                noise: sound.noise,
                max: sound.max_normalized,
                duration: sound.duration
            }});
            document.dispatchEvent (blowStop);
        }

        //stop peek
        if (sound.peek && sound.normalized < sound.minSoundLevel_normalized) {
            sound.peek = false;
            sound.duration = 0;
        }
    };

    self.init ();
};
	/////////////////////////////////////////// LIB END
	
	var instance = new soundMeterCtrl (options);
	
	var setImage = function(name){
		var imgTag = document.createElement("img");
			imgTag.id = "gif";
			imgTag.src = name;
			document.getElementById("gif").parentNode.replaceChild(imgTag, document.getElementById("gif"));
	};
	
	document.addEventListener("sound.init.ok", function() {
		setImage(inactive);
	});
	
	document.addEventListener("sound.blow.start", function() {
		setImage(active);
	});
	document.addEventListener("sound.blow.stop", function() {	
		setImage(inactive);
	});
