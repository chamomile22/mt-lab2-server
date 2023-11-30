const { WebSocketServer } = require("ws");

const games = {};

function start() {
  const wss = new WebSocketServer({ port: 4000 }, () => console.log(`Server started on 4000`))
  
  wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
      const req = JSON.parse(message.toString())
      if (req.event === 'connect') {
        ws.nickname = req.payload.username;
        initGames(ws, req.payload.gameId);
      }
      broadcastMessage(req);
    });
  })
  
  function initGames(ws, gameId) {
    if (!games[gameId]) {
      ws.firstPlayer = true;
      games[gameId] = [ws];
    }
    
    if (games[gameId] && games[gameId]?.length < 2) {
      games[gameId] = [...games[gameId], ws];
    }
    
    if (games[gameId] && games[gameId].length === 2) {
      games[gameId] = games[gameId].filter((wsc) => {
        return wsc.nickname !== ws.nickname
      });

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
              canStart: games[gameId].length === 2,
              firstPlayer: user.firstPlayer | false,
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
        case 'win':
          res = {
            type: 'won',
            payload: params.payload
          }
          break;
        default:
          break;
      }
      user.send(JSON.stringify(res));
    })
  }
}

start();