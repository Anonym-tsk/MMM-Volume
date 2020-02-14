/* Magic Mirror
 * Node Helper: MMM-Volume
 *
 * By eouia0819@gmail.com
 * MIT Licensed.
 */

var exec = require('child_process').exec

var NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
  start : function() {
    this.config = {}
  },

  socketNotificationReceived : function(notification, payload) {
    if (notification === "CONFIG") {
      this.config = payload
      if (this.config.volumeOnStart !== null) {
        this.setVolume(this.config.volumeOnStart, (volume)=>{
          this.sendSocketNotification("VOLUME_RESULT", volume)
        })
      } else this.socketNotificationReceived(this.config.notifications.VOLUME_GET)
    }

    switch (notification) {
      case this.config.notifications.VOLUME_GET:
        this.getVolume((volume)=>{
          this.sendSocketNotification("VOLUME_RESULT", volume)
        })
        break
      case this.config.notifications.VOLUME_SET:
        this.setVolume(payload, (volume)=>{
          this.sendSocketNotification("VOLUME_RESULT", volume)
        })
        break
    }
  },

  getVolume: function(callback=null) {
    exec (this.config.getVolumeScript, (err, stdout, stderr)=>{
      if (err) {
        console.log("[VOLUME] Get Volume Error:", err)
      } else {
        var volume = parseInt(stdout)
        console.log("[VOLUME] Get Volume:",volume)
        if (callback) {
          callback(volume)
        }
      }
    })
  },

  setVolume: function(volume, callback=null) {
    var script = this.config.setVolumeScript.replace("#VOLUME#", volume)
    exec (script, (err, stdout, stderr)=>{
      if (err) {
        console.log("[VOLUME] Set Volume Error:", err)
      } else {
        console.log("[VOLUME] Set Volume To:", volume)
        if (callback) {
          callback(volume)
        }
      }
    })
  }
})
