# OBSghettoVTuber
BrowserSource HTML/Javascript to switch one image with another depending on your voice-level

# Original Objective
- Display a .gif 'A' when i'm not talking (mouth closed)
- Display a .gif 'B' when i'm talking (mouth opens and closes)

# Credits
- idea from reddit user 'anothererror' (https://www.reddit.com/r/Twitch/comments/cnjtis/gif_avatar_that_speaks_when_there_is_microphone/ewcf699?utm_source=share&utm_medium=web2x&context=3)
- SoundMeter lib was used (https://github.com/fookoo/sound-meter)

# Usage - local
- download the files and place them, ideally, in the same folder as your images
- open the "mic.js" with a text-editor
- replace the 'YOUR_IMAGE_HERE_WHEN_YOU_ARE_TALKING.gif' and 'YOUR_IMAGE_HERE_WHEN_YOU_ARE_NOT_TALKING.gif' with your images/gifs
- save
- open the player.html in your browser and allow acces to the mic (to check if the voice-levels are to your liking)
- if the switching of the images does not match your voice-levels adjust the number behind 'threshold' within 'mic.js'
- go into OBS and create a new BrowserSource
- choose 'Local' and select the player.html

# Usage - remote
if you choose to host mic.js and player.html on a webserver you can dynamically change paramaters and images via the following parameter:
- active (image/gif that is displayed when the level is above the threshold)
- inactive (image/gif that is displayed when the level is below the threshold)
- threshold (minmum sound level above noise level to trigger start event)
- delay (delay in ms before 'active' triggers after level got above threshold)
- release (time in ms that 'active' should persist after level dropped below threshold)

# supported image-formats
- tested with ".gif", but it should support everything that is supported by an img-tag (see: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img)


