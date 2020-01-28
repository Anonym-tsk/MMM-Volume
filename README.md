# MMM-Volume
Volume controller for MagicMirror

## Screenshot
![Screenshot](https://raw.githubusercontent.com/eouia/MMM-Volume/master/mmm-volume.png)

## Install
```sh
cd ~/MagicMirror/modules
git clone https://github.com/eouia/MMM-Volume
```

## Configuration

### Simple
```js
{
  module: "MMM-Volume",
  position: "top_left", // It is meaningless. but you should set.
  config: {
    usePresetScript: "ALSA", // "ALSA" is supported by default.
    volumeOnStart: 50,
  }
},
```

### Details & Defaults (For Experts)
```js
{
  module: "MMM-Volume",
  position: "top_left", // It is meaningless. but you should set.
  config: {
    usePresetScript: "ALSA",
    // When set to `null`, `getVolumeScript` and `setVolumeScript` will be used directly. See the experts section.
    // For available presetScript, See `presetScript{}`

    upDownScale: 5,
    // for VOLUME_UP or VOLUME_DOWN.

    volumeOnStart: 10,
    // If you set this, this volume will be applied on start of MagicMirror

    volumeText: "Vol: #VOLUME#%",
    // Showing volume.

    hideDelay: 2000,
    // After X milliseconds from showing, volume gain-meter will be disappeared.

    fadeDelay: 200,
    // If the volume is restored with a fade effect this time in milliseconds will be waited between to scales

    telegramMessages: {
      CUR_VOLUME : "Current Volume is *#VOLUME#*.",
      SET_VOLUME : "Setting Volume to *#VOLUME#*",
      INVALID : "Invalid parameters. `/vol` or `/vol 0~100` is allowed."
    },

    // Usually You might not need to modify belows; Only for Experts.

    getVolumeScript: ``, //get 0~100
    setVolumeScript: ``, //set 0~100
    // volume control scripts for Other systems. If you set null to `usePresetScript`, these fields will be used instead.

     presetScript: {
      "OSX": {
        getVolumeScript: `osascript -e 'output volume of (get volume settings)'`, // get 0~100
        setVolumeScript: `osascript -e 'set volume output volume #VOLUME#'` // set 0~100
      },
      "ALSA": {
       getVolumeScript: `amixer sget 'PCM' | awk -F"[][]" '{print ""$2""}' | grep %  | awk '{gsub ( /%/, "" ) ; print}'`, // get 0~100
        setVolumeScript: `amixer sset -M 'PCM' #VOLUME#%`, //set 0~100
      },
      "HIFIBERRY-DAC": {
        getVolumeScript: `amixer sget 'Digital' | grep -E -o '[[:digit:]]+%' | head -n 1| sed 's/%//g'`, // get 0~100
        setVolumeScript: `amixer sset -M 'Digital' #VOLUME#%`, // set 0~100
      },
      "PULSE": {
        getVolumeScript: `amixer get Master  | awk -F"[][]" '{print ""$2""}' | grep %  | awk 'NR==1{print $1}' | awk '{gsub(/%/,"") ; print}'`, // get 0~100
        setVolumeScript: `amixer set Master #VOLUME#% -q`, // set 0~100
      },
      "RESPEAKER_SPEAKER": {
        getVolumeScript: `amixer -M sget Speaker | grep -E -o '[[:digit:]]+%' | head -n 1| sed 's/%//g'`, // get 0~100
        setVolumeScript: `amixer -M sset Speaker #VOLUME#%`, // set 0~100
      },
      "RESPEAKER_PLAYBACK": {
        getVolumeScript: `amixer -M sget Playback | grep -E -o '[[:digit:]]+%' | head -n 1| sed 's/%//g'`, // get 0~100
        setVolumeScript: `amixer -M sset Playback #VOLUME#%`, // set 0~100
      },
    },


    notifications: {
      VOLUME_GET : "VOLUME_GET",
      VOLUME_SET : "VOLUME_SET",
      VOLUME_UP : "VOLUME_UP",
      VOLUME_DOWN: "VOLUME_DOWN",
      VOLUME_STORE : "VOLUME_STORE",
      VOLUME_RESTORE : "VOLUME_RESTORE",
      VOLUME_TOGGLE : "VOLUME_TOGGLE",
      CURRENT_VOLUME : "CURRENT_VOLUME",
    },
    // You can redefine notifications if you need.
  }
},
```


## Usage

### By `Notification`

|notification | payload | description
|---|---|---|
|VOLUME_GET | - | Getting current volume
|VOLUME_SET | 0 - 100 | Setting Volume to `number`. 0 is mute and 100 is maximum
|VOLUME_UP | {upDownScale: NUMBER} or `null` for default value | Volume up by `upDownScale`
|VOLUME_DOWN | {upDownScale: NUMBER} or `null` for default value| Volume down by `upDownScale`
|VOLUME_STORE | `null` or `0-100` | Storing current volume and setting the volume to `number`.<br/> If payload be `null`, volume will not be changed. (just stored)
|VOLUME_RESTORE | {faded:true or false; upDownScale:NUMBER} | Setting volume with stored previously

If volume is changed or `VOLUME_GET` is called, the current volume as result will be notified by `CURRENT_VOLUME` notification with `payload=0-100`.



### By `MMM-TelegramBot`
|command | description
|--- |---
|`/vol` | Getting Current Volume
|`/vol NUMBER` | Setting Volume to `NUMBER`(0-100)


## Styling
See `MMM-Volume.css`


## Notice
Not fully tested on RPI. I'm waiting your bug report.
