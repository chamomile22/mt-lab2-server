const ws = require('ws');

const games = {};

const wss = new ws.WebSocketServer({ port: 8080 }, () => console.log(`Server started on 8080`))

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const req = JSON.parse(message)
    switch (req.event) {
      case 'connect':
        ws.nickname = req.payload.username;
        initGames(ws, req.payload.gameId)
        broadcastMessage(req);
        break;
      case 'disconnection':
        broadcastMessage(message);
        break;
      case 'error':
        broadcastMessage(message);
        break;
    }
  });
})

function initGames(ws, gameId) {
  if (!games[gameId]) {
    games[gameId] = [ws];
  }
  
  if (games[gameId] && games[gameId]?.length < 2) {
    games[gameId] = [...games[gameId], ws];
  }
  
  if (games[gameId] && games[gameId]?.length === 2) {
    games[gameId].filter(({ nickname }) => nickname !== ws.nickname)
    games[gameId] = [...games[gameId], ws];
  }
}

function broadcastMessage(params) {
  let res;
  const { username, gameId } = params.payload;
  games[gameId].forEach(user => {
    switch (params.event) {
      case 'connect':
        res = {
          type: 'connectToGame',
          payload: {
            success: true,
            rivalName: games[gameId].find(rival => rival.nickname !== user.nickname),
            username: user.nickname
          }
        }
        break;
      case 'readyToPlay':
        res = {
          type: 'readyToPlay',
          payload: {
            canStart: games[gameId].length > 1,
            username
          }
        }
        break;
      case 'shoot':
        res = {
          type: 'shoot',
          payload: params.payload
        }
        break;
      case 'checkShoot':
        res = {
          type: 'isHit',
          payload: params.payload
        }
        break;
      default:
        res = {
          type: 'logout',
          payload: params.payload
        }
        break;
    }
    user.send(JSON.stringify(res));
  })
  wss.clients.forEach(client => {
    client.send(JSON.stringify(message))
  })
}