const ws = require('ws');

const wss = new ws.WebSocketServer({
  port: 8080,
}, () => console.log(`Server started on 8080`))


wss.on('connection', (ws) => {
  ws.on('message', function (message) {
    message = JSON.parse(message)
    switch (message.event) {
      case 'message':
        broadcastMessage(message);
        break;
      case 'connection':
        broadcastMessage(message);
        break;
      case 'disconnection':
        broadcastMessage(message);
        break;
      case 'error':
        broadcastMessage(message);
        break;
    }
  })
})

function broadcastMessage(message) {
  wss.clients.forEach(client => {
    client.send(JSON.stringify(message))
  })
}