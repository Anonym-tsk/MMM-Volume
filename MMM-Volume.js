/* Magic Mirror
 * Module: MMM-Volume
 *
 * By eouia0819@gmail.com
 * MIT Licensed.
 */

Module.register("MMM-Volume", {
  defaults: {
    // for OSX
    getVolumeScript: ``, //get 0~100
    setVolumeScript: ``, //set 0~100

    // for RPI ALSA mixer
    //getVolumeScript: `amixer sget 'PCM' | awk -F"[][]" '{print ""$2""}' | grep %  | awk ' { gsub ( /[%]/, "" )`, //get 0~100
    //setVolumeScript: ` amixer sset 'PCM' *VOLUME*%`, //set 0~100

    // for RPI ALSA mixer with HiFiBerry AMP2
    //getVolumeScript: 'amixer sget \'Digital\' | grep -E -o \'[[:digit:]]+%\' | head -n 1| sed \'s/%//g\'', // get 0~100
    //setVolumeScript: 'amixer sset -M \'Digital\' #VOLUME#%', // set 0~100

    usePresetScript: "ALSA", // null or "OSX" or "ALSA", When set to `null`, `getVolumeScript` and `setVolumeScript` will be used directly.
    hideDelay: 2000, // 0 for showing always. over 0, After X millisec from showing, will be disappeared.
    upDownScale: 5,
    volumeOnStart: 10,
    fadeDelay: 200,

    volumeText: "Vol: #VOLUME#%",

    telegramMessages: {
      CUR_VOLUME : "Current Volume is *#VOLUME#* %",
      SET_VOLUME : "Setting Volume to *#VOLUME#* %",
      INVALID : "Invalid parameters. `/vol` or `/vol 0~100` is allowed."
    },

    // Usually You might not need to modify belows; Only for Experts.
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
        getVolumeScript: `amixer sget -M 'Digital' | grep -E -o '[[:digit:]]+%' | head -n 1| sed 's/%//g'`, // get 0~100
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
      VOLUME_DOWN : "VOLUME_DOWN",
      VOLUME_STORE : "VOLUME_STORE",
      VOLUME_RESTORE : "VOLUME_RESTORE",
      VOLUME_TOGGLE : "VOLUME_TOGGLE",
      CURRENT_VOLUME : "CURRENT_VOLUME",
    },
  },

  getStyles: function() {
    return ["MMM-Volume.css"]
  },

  start: function() {
    this.currentVolume = 0
    this.storedVolume = null
    if (this.config.presetScript.hasOwnProperty(this.config.usePresetScript)) {
      var sc = this.config.presetScript[this.config.usePresetScript]
      this.config.getVolumeScript = sc.getVolumeScript
      this.config.setVolumeScript = sc.setVolumeScript
    }
    this.sendSocketNotification("CONFIG", this.config)
  },

  notificationReceived: function(noti, payload=null) {
    var curUpDownScale = (payload && payload.upDownScale) ? payload.upDownScale : this.config.upDownScale

    switch(noti) {
      case this.config.notifications.VOLUME_GET:
        this.sendSocketNotification(noti, payload)
        break
      case this.config.notifications.VOLUME_SET:
        this.sendSocketNotification(noti, payload)
        break
      case this.config.notifications.VOLUME_UP:
        var vol = this.currentVolume + curUpDownScale
        if (vol > 100) vol = 100
        this.sendSocketNotification(this.config.notifications.VOLUME_SET, vol)
        break
      case this.config.notifications.VOLUME_DOWN:
        var vol = this.currentVolume - curUpDownScale
        if (vol < 0) vol = 0
        this.sendSocketNotification(this.config.notifications.VOLUME_SET, vol)
        break
      case this.config.notifications.VOLUME_STORE:
        this.storeVolume(payload)
        break
      case this.config.notifications.VOLUME_RESTORE:
        this.restoreVolume(payload)
        break
      case this.config.notifications.VOLUME_TOGGLE:
        if (this.currentVolume === 0) {
          this.restoreVolume(payload)
        } else {
          payload.value = 0
          this.storeVolume(payload)
        }
        break
    }
  },

  sleep: function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  storeVolume: function (options){
    this.storedVolume = this.currentVolume
    if ((typeof options !== 'undefined') && (options !== null)){
      if (Number.isInteger(options)) {
        this.sendSocketNotification(this.config.notifications.VOLUME_SET, options)
      } else {
        if ((typeof options.faded !== 'undefined') && (options.faded === true)) {
          var curUpDownScale = this.config.upDownScale
          if (typeof options.upDownScale !== 'undefined') {
            curUpDownScale = options.upDownScale
          }
          this.fadeVolume(options.value, curUpDownScale)
        } else {
          this.sendSocketNotification(this.config.notifications.VOLUME_SET, options.value)
        }
      }
    }
  },

  restoreVolume: async function(options){
    if (this.storedVolume !== null) {
      if((options !== null) && (typeof options.faded !== 'undefined') && (options.faded === true)) {
        var curUpDownScale = this.config.upDownScale
        if (typeof options.upDownScale !== 'undefined') {
          curUpDownScale = options.upDownScale
        }
        this.fadeVolume(this.storedVolume, curUpDownScale)
      } else {
        this.sendSocketNotification(this.config.notifications.VOLUME_SET, this.storedVolume)
      }
    }
  },

  fadeVolume: async function (newVolume, scale) {
    var newTempVolume
    if (this.currentVolume < newVolume) {
      while (this.currentVolume < newVolume) {
        newTempVolume = this.currentVolume + scale
        if (newTempVolume > newVolume) {
          newTempVolume = newVolume
        }
        this.sendSocketNotification(this.config.notifications.VOLUME_SET, newTempVolume)
        await this.sleep(this.config.fadeDelay)
      }
    } else {
      while (this.currentVolume > newVolume) {
        newTempVolume = this.currentVolume - scale
        if (newTempVolume < newVolume) {
          newTempVolume = newVolume
        }
        this.sendSocketNotification(this.config.notifications.VOLUME_SET, newTempVolume)
        await this.sleep(this.config.fadeDelay)
      }
    }
  },

  socketNotificationReceived: function(noti, payload) {
    if (noti == "VOLUME_RESULT") {
      var oldVolume = this.currentVolume
      this.currentVolume = payload
      this.drawVolume(this.currentVolume, oldVolume)
      this.sendNotification(this.config.notifications.CURRENT_VOLUME, this.currentVolume)
    }
  },

  getDom: function() {
    var container = document.createElement("div")
    container.id = "VOLUME_CONTAINER"
    var text = document.createElement("div")
    text.id = "VOLUME_TEXT"
    container.appendChild(text)
    var bar = document.createElement("div")
    bar.id = "VOLUME_BAR"
    container.appendChild(bar)
    return container
  },

  drawVolume: function(current, old) {
    var container = document.getElementById("VOLUME_CONTAINER")
    container.classList.remove("hidden")
    var text = document.getElementById("VOLUME_TEXT")
    text.innerHTML = this.config.volumeText.replace("#VOLUME#", current)
    var bar = document.getElementById("VOLUME_BAR")
    bar.style.width = current + "%"
    setTimeout(()=>{
      container.classList.add("hidden")
    }, this.config.hideDelay)
  },

  getCommands : function(register) {
    register.add({
      command: "vol",
      callback: "cmdVolume",
      argsPattern: [/(?:\b|-)([1-9]{1,2}[0]?|100|0)\b/i],
    })
  },

  cmdVolume: function(command, handler) {
    function isNumeric(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    }
    var args = handler.args
    if (args == null) {
      this.getCurrentVolume(handler)
    } else if (args >= 0 && args <= 100) {
      handler.reply("TEXT", this.config.telegramMessages.SET_VOLUME.replace("#VOLUME#", args), {parse_mode:'Markdown'})
      this.sendSocketNotification(this.config.notifications.VOLUME_SET, args)
    } else {
      handler.reply("TEXT", this.config.telegramMessages.INVALID, {parse_mode:'Markdown'})
    }
  },

  getCurrentVolume: function(handler) {
    this.notificationReceived(this.config.notifications.VOLUME_GET)
    setTimeout(()=>{
      handler.reply("TEXT", this.config.telegramMessages.CUR_VOLUME.replace("#VOLUME#", this.currentVolume), {parse_mode:'Markdown'})
    }, 1000)
  }
})
