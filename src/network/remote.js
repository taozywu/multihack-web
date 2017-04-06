/* globals io */

// TODO: Replace socket forwarding with WebRTC
var VoiceCall = require('./voice')

function RemoteManager (hostname, room) {
  var self = this

  self.room = room

  self._handlers = {}
  self._socket = new io(hostname)

  self._socket.emit('join', {
    room: room
  })

  self._socket.on('forward', function (data) {
    console.log(data)
    self._emit(data.event, data)
  })  
  
  // Get a file
  self._socket.on('provideFile', function (data) {
    console.log('got provideFile')
    self._emit('provideFile', data)
  })
  
  // Get a request for all files
  self._socket.on('requestProject', function (data) {
    console.log('got requestProject')
    self._emit('requestProject', data)
  })
  
  self.voice = new VoiceCall(self._socket, room)
}

RemoteManager.prototype.deleteFile = function (filePath) {
  var self = this

  self._socket.emit('forward', {
    event: 'deleteFile',
    filePath: filePath
  })
}

RemoteManager.prototype.change = function (filePath, change) {
  var self = this

  console.log(filePath)
  self._socket.emit('forward', {
    event: 'change',
    filePath: filePath,
    change: change
  })
}

RemoteManager.prototype.requestProject = function () {
  var self = this
  
  console.log('called requestProject')
  self._socket.emit('requestProject')
}

RemoteManager.prototype.provideFile = function (filePath, content, requester, num, total) {
  var self = this
  
  self._socket.emit('provideFile', {
    filePath: filePath,
    content: content,
    requester: requester,
    num: num,
    total: total
  })
}


RemoteManager.prototype.destroy = function () {
  var self = this

  self.room = null
  self.peers = null
  self._handlers = null
  self._socket.disconnect()
  self._socket = null
}

RemoteManager.prototype._emit = function (event, data) {
  var self = this
  var fns = self._handlers[event] || []
  var fn
  var i

  for (i = 0; i < fns.length; i++) {
    fn = fns[i]
    if (fn && typeof (fn) === 'function') {
      fn(data)
    }
  }
}

RemoteManager.prototype.on = function (event, handler) {
  var self = this

  if (!self._handlers[event]) {
    self._handlers[event] = []
  }

  self._handlers[event].push(handler)
}

module.exports = RemoteManager
