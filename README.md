# A thousand Twitter pictures #

Application to flash lots of twitter pictures across the screen

## Setup ##

#### config.js ####
Edit config.js with your own Twitter keys.

Change the ```searchterms``` option to add your twitter searches

#### public/javascript/index.js ####
Edit ```public/javascript/index.js``` to change the way you want the flashing to start...

## How to start flashing ##
Load the root page ```/``` and the flashing will start after 500ms. You can edit ```public/javascript/index.js``` to make it start with a push on the **start button** or with a call to ```/start```.

## What will happen ##
All pictures from the tweets matching the ```searchterms``` (including Instagram) will be flashed on the screen. The app also connects to the Twitter streaming API to monitor new tweets. They will be shown when they come in.