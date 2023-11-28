const ws = require('ws');
const { WebSocketServer } = require("ws");

const games = {};

function start() {
  const wss = new WebSocketServer({ port: 4000 }, () => console.log(`Server started on 4000`))
  
  wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
      const req = JSON.parse(message.toString())
      switch (req.event) {
        case 'connect':
          ws.nickname = req.payload.username;
          initGames(ws, req.payload.gameId)
          break;
        case 'disconnection':
          broadcastMessage(message);
          break;
        case 'error':
          broadcastMessage(message);
          break;
      }
      broadcastMessage(req);
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
      games[gameId] = games[gameId].filter(({ nickname }) => nickname !== ws.nickname)
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
              rivalName: games[gameId].find(rival => rival.nickname !== user.nickname)?.nickname,
              username: user.nickname
            }
          }
          break;
        case 'ready':
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
            type: 'afterShoot',
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
      client.send(JSON.stringify(res))
    })
  }
}

start();