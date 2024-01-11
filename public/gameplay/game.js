const RAD = Math.PI / 180;
const scrn = document.getElementById("flappy-canvas");
const sctx = scrn.getContext("2d");
let sent = false;
scrn.tabIndex = 1;

//set score of  player 1 and 2
let player1_Score = 10000;
let player2_Score = 10000;

let countdownStarted = false;
let time_in_minutes = "";
let interval;

function Timecountdown(duration) {
  return new Promise(resolve => {
    let timer = duration, minutes, seconds;

    interval = setInterval(() => {
      minutes = parseInt(timer / 60, 10);
      seconds = parseInt(timer % 60, 10);

      minutes = minutes < 10 ? "0" + minutes : minutes; 
      seconds = seconds < 10 ? "0" + seconds : seconds;

      resolve(`${minutes}:${seconds}`);

      //lose if time is 00:00
      if((seconds == "00") && (minutes == "00")){
        // console.log("time to lose");
        state.curr = state.gameOver;
        time_in_minutes = "";
        clearInterval(interval);
      }

      if (--timer < 0) {
        timer = duration; 
      }

      time_in_minutes = minutes + ":" + seconds;
      // console.log("time_in_minutes is", time_in_minutes);

    }, 1000);
  });
}

let p1cheat = false;
let p2cheat = false;

socket.on("update_player_bird_info", (info) => { 
  bird_info = JSON.parse(info);
  // console.log("bird_info is", bird_info); 
  rec_id = bird_info.id;
  y_pos = bird_info.y;
  bird_frame =  bird_info.frame;
  bird_speed =  bird_info.speed;
  // console.log("rec_id is", rec_id, "y_pos is", y_pos, "bird_frame is", bird_frame, "bird_speed is", bird_speed);

  //update the other player's bird position
  if (bird_2.id == rec_id){
    bird_2.y = y_pos;
    bird_2.frame = bird_frame;
    bird_2.speed = bird_speed;
  }
});

socket.on("flappy_bird_start", () => {
  console.log("flappy_bird_start");
  sent = false;
  state.curr = state.Play;
  frames = 0;
  SFX.start.play();
});

socket.on("flappy_bird_restart", () => {
  console.log("flappy_bird_restart");
  state.curr = state.getReady;
  bird.speed = 0;
  bird.y = 100;
  bird_2.speed = 0;
  bird_2.y = 100;
  pipe.pipes = [];
  coin.coins = [];
  trash.trashs = [];
  trap.traps = [];
  flappy_bird_UI.score.curr = 0;
  flappy_bird_UI.score.points = 0;
  SFX.played = false;
  sent = false;
  p1cheat = false;
  p2cheat = false;
  player1_Score = 10000;
  player2_Score = 10000;
});

//make a new pipe when the first user frames % 100 == 0
socket.on("make_pipe", (json) => {
  // console.log("make pipe at y=", parseFloat(JSON.parse(json).y));
  let y = JSON.parse(json).y;
  pipe.pipes.push({
    x: parseFloat(scrn.width),
    y: y,
  });
});

socket.on("make_coins", (json) => {
  // console.log("make conins at y=", parseFloat(JSON.parse(json).y));
  let y = JSON.parse(json).y;
  coin.coins.push({
    sx : 0,
    gotten: false,
    x: parseFloat(scrn.width),
    y: y+420,
  });
});

socket.on("make_trashs", (json) => {
  // console.log("make trash at y=", parseFloat(JSON.parse(json).y));
  let y = JSON.parse(json).y;
  trash.trashs.push({
    x: parseFloat(scrn.width),
    y: y+500,
    gotten: false
  });
});

socket.on("make_traps", (json) => {
  // console.log("make trap at y=", parseFloat(JSON.parse(json).y));
  let y = JSON.parse(json).y;
  trap.traps.push({
    x: parseFloat(scrn.width),
    y: y+500,
    gotten: false,
  });
});

//when p2 activate/deactivate cheat
socket.on("cheat_mode", (json) => {
  let id = parseInt(JSON.parse(json).id);
  if (id != bird.id){
    if (p2cheat == true){
      console.log("p2 cheat mode is off");
      p2cheat = false;
    }
    else{
      console.log("p2 cheat mode is on");
      p2cheat = true;
    }
  }
});

socket.on("update player score", (json) => {
  //get name player 1 and 2
  const Player1 = document.getElementById('game-start-player-1-name');
  const player1Name = (Player1.innerHTML).substring(1,(Player1.innerHTML).length - 1);

  const Player2 = document.getElementById('game-start-player-2-name');
  const player2Name = (Player2.innerHTML).substring(1, (Player2.innerHTML).length - 1);

  let player_Name = JSON.parse(json).player_Name;
  let player_Score = JSON.parse(json).player_Score;

  if(player_Name == player1Name){
    player1_Score = player_Score;
  }
  else if(player_Name == player2Name){
    player2_Score = player_Score;
  }

  // console.log("now ", player1Name, " has", player1_Score, " and ",player2Name, "has", player2_Score);
});


scrn.addEventListener("click", () => {
  switch (state.curr) {
    case state.getReady:
      if (!sent){
        socket.emit("go_game", bird.id);
        sent = true;
      }
      break;
    case state.Play:
      bird.flap();
      break;
    case state.trapped:
      bird.flap();
      break;
    case state.gameOver:
      //set timer to 0
      time_in_minutes = "";
      clearInterval(interval);

      if (!sent){
        socket.emit("end_game", bird.id);
        sent = true;
      }
      // //hide the game page
      // $("#flappy-canvas").hide();
      // //show the game start page
      // $("#game-start-page").show();
      break;
  }
});

scrn.onkeydown = function keyDown(e) {
  if (e.keyCode == 32 || e.keyCode == 87 || e.keyCode == 38) {
    // Space Key or W key or arrow up
    switch (state.curr) {
      case state.getReady:
        if (!sent){
          socket.emit("start_game", bird.id);
          sent = true;
        }
        break;
      case state.Play:
        bird.flap();
        break;
      case state.trapped:
        bird.flap();
        break;
      case state.gameOver:
        //set timer to 0
        time_in_minutes = "";
        clearInterval(interval);

        if (!sent){
          socket.emit("end_game", bird.id);
          sent = true;
        }
        break;
    }
  } else if (e.keyCode == 16) {
    // shift key
    if (state.curr == state.Play || state.curr == state.trapped) {
      socket.emit("sending_cheat_mode", JSON.stringify({id:bird.id}));
      if (p1cheat == false){
        p1cheat = true;
      }else{
        p1cheat = false;
      }
    }
  }
};

let frames = 0;
let dx = 2;
let index = 0;
const state = {
  curr: 0,
  getReady: 0,
  Play: 1,
  gameOver: 2,
  trapped: 3,
};
const SFX = {
  start: new Audio(),
  flap: new Audio(),
  score: new Audio(),
  hit: new Audio(),
  die: new Audio(),
  coins: new Audio(),
  trashs: new Audio(),
  traps: new Audio(),
  played: false,
};
const gnd = {
  sprite: new Image(),
  x: 0,
  y: 0,
  draw: function () {
    this.y = parseFloat(scrn.height - this.sprite.height);
    sctx.drawImage(this.sprite, this.x, this.y);
  },
  update: function () {
    if (state.curr != state.Play && state.curr != state.trapped) return;
    this.x -= dx;
    this.x = this.x % (this.sprite.width / 2);
  },
};
const pipe = {
  top: { sprite: new Image() },
  bot: { sprite: new Image() },
  gap: 130,
  moved: true,
  pipes: [],
  draw: function () {
    for (let i = 0; i < this.pipes.length; i++) {
      let p = this.pipes[i];
      sctx.drawImage(this.top.sprite, p.x, p.y);
      sctx.drawImage(
        this.bot.sprite,
        p.x,
        p.y + parseFloat(this.top.sprite.height) + this.gap
      );
    }
  },
  update: function () {
    if (state.curr != state.Play && state.curr != state.trapped) return;
    if ((frames+50) % 100 == 0) {
      socket.emit("request_pipe", JSON.stringify({id:bird.id, frames:frames}));
      // console.log("Asking for pipe")
    }
    this.pipes.forEach((pipe) => {
      pipe.x -= dx;
    });

    if (this.pipes.length && this.pipes[0].x < -this.top.sprite.width) {
      this.pipes.shift();
      this.moved = true;
    }
  },
};

// For the coins
const coin = {
  sprite: new Image(),
  moved: true,
  coins: [],
  draw: function () {
    for (let i = 0; i < this.coins.length; i++) {
      let p = this.coins[i];
      sctx.drawImage(this.sprite,
        p.sx, 
        0,
        200, 220, // size of sprtie sheet
        p.x, p.y, // where to draw it, i.e. p.x and p.y
        35,35);   // size
    }
    // console.log("Drawing coins")
  },
  update: function () {
    if (state.curr != state.Play && state.curr != state.trapped) return;
    if (frames % 100 == 0 && frames % 500 !=0 && frames %1100 != 0)  {
      socket.emit("request_coins", JSON.stringify({id:bird.id, frames:frames}));
      // console.log("Asking for coins")
    }
    this.coins.forEach((coin) => {
      coin.x -= dx;
      if (frames % 10 == 0) {
        index++;
      }
      if(index>=6){
        index = 0
      }
      coin.sx =  index*200;
    });

    if (this.coins.length && this.coins[0].x < -50) {
      this.coins.shift();
      this.moved = true;
    }
  },
};

// trash
const trash = {
  sprite: new Image(),
  moved: true,
  trashs: [],
  draw: function () {
    for (let i = 0; i < this.trashs.length; i++) {
      let p = this.trashs[i];
      sctx.drawImage(this.sprite,
        p.x, p.y, // where to draw it, i.e. p.x and p.y
        35,35);   // size
    }
  },
  update: function () {
    if (state.curr != state.Play && state.curr != state.trapped) return;
    if (frames % 500 == 0 && frames %1100 != 0) {
      socket.emit("request_trashs", JSON.stringify({id:bird.id, frames:frames}));
    }
    this.trashs.forEach((trash) => {
      trash.x -= dx;
    });

    if (this.trashs.length && this.trashs[0].x < -50) {
      this.trashs.shift();
      this.moved = true;
    }
  },
};

//trap
const trap = {
  sprite: new Image(),
  moved: true,
  traps: [],
  draw: function () {
    for (let i = 0; i < this.traps.length; i++) {
      let p = this.traps[i];
      sctx.drawImage(this.sprite,
        p.x, p.y, // where to draw it, i.e. p.x and p.y
        35,35);   // size
    }
  },
  update: function () {
    if (state.curr != state.Play && state.curr != state.trapped) return;
    if (frames % 1100 == 0) {
      socket.emit("request_traps", JSON.stringify({id:bird.id, frames:frames}));
    }
    this.traps.forEach((trap) => {
      trap.x -= dx;
    });

    if (this.traps.length && this.traps[0].x < -50) {
      this.traps.shift();
      this.moved = true;
    }
  },
};

const flappy_bird_UI = {
  getReady: { sprite: new Image() },
  gameOver: { sprite: new Image() },
  tap: [{ sprite: new Image() }, { sprite: new Image() }],
  score: {
    curr: 0,
    best: 0,
    points: 0,
  },
  x: 0,
  y: 0,
  tx: 0,
  ty: 0,
  frame: 0,
  draw: function () {
    switch (state.curr) {
      case state.getReady:
        this.y = parseFloat(scrn.height - this.getReady.sprite.height) / 2;
        this.x = parseFloat(scrn.width - this.getReady.sprite.width) / 2;
        this.tx = parseFloat(scrn.width - this.tap[0].sprite.width) / 2;
        this.ty =
          this.y + this.getReady.sprite.height - this.tap[0].sprite.height;
        sctx.drawImage(this.getReady.sprite, this.x, this.y);
        sctx.drawImage(this.tap[this.frame].sprite, this.tx, this.ty);
        break;
      case state.gameOver:
        //set timer to 0
        time_in_minutes = "";
        clearInterval(interval);
        
        this.y = parseFloat(scrn.height - this.gameOver.sprite.height) / 2;
        this.x = parseFloat(scrn.width - this.gameOver.sprite.width) / 2;
        this.tx = parseFloat(scrn.width - this.tap[0].sprite.width) / 2;
        this.ty =
        this.y + this.gameOver.sprite.height - this.tap[0].sprite.height;
        //Alpha: dont draw yet until both users lose
        // sctx.drawImage(this.gameOver.sprite, this.x, this.y);
        // sctx.drawImage(this.tap[this.frame].sprite, this.tx, this.ty);
        break;
    }
    this.drawScore();
  },
  drawScore: function () {
    sctx.fillStyle = "#FFFFFF";
    sctx.strokeStyle = "#000000";
    switch (state.curr) {
      case state.getReady:
        sctx.lineWidth = "2";
        sctx.font = "35px Squada One";
        // print waiting for other player message when the other player is not ready
        if (sent){
          sctx.fillText("Waiting for other player...", scrn.width / 2 - 150, scrn.height / 2 + 100);
          sctx.strokeText("Waiting for other player...", scrn.width / 2 - 150, scrn.height / 2 + 100);
        }
        break;
      case state.Play:
        sctx.lineWidth = "2";
        sctx.font = "35px Squada One";
        sctx.fillText(this.score.curr, scrn.width / 2 - 5, 50);
        sctx.strokeText(this.score.curr, scrn.width / 2 - 5, 50);

        if(!countdownStarted) {
          countdownStarted = true;
          Timecountdown(120).then(time => {
            // console.log("time is", time);
          });
        }

        sctx.fillText(time_in_minutes, scrn.width / 2 + 40, 50);
        sctx.strokeText(time_in_minutes, scrn.width / 2 + 40, 50);

        if (p1cheat == true){
          sctx.fillText("P1: Cheat Mode On", 20, 50);
          sctx.strokeText("P1: Cheat Mode On", 20, 50);
        }
        if (p2cheat == true){
          sctx.fillText("P2: Cheat Mode On", 20, 100);
          sctx.strokeText("P2: Cheat Mode On", 20, 100);
        }
        break;
      case state.trapped:
        sctx.lineWidth = "2";
        sctx.font = "35px Squada One";
        sctx.fillText(this.score.curr, scrn.width / 2 - 5, 50);
        sctx.strokeText(this.score.curr, scrn.width / 2 - 5, 50);

        //draw timer 
        sctx.fillText(time_in_minutes, scrn.width / 2 + 40, 50);
        sctx.strokeText(time_in_minutes, scrn.width / 2 + 40, 50);


        if (p1cheat == true){
          sctx.fillText("P1: Cheat Mode On", 20, 50);
          sctx.strokeText("P1: Cheat Mode On", 20, 50);
        }
        if (p2cheat == true){
          sctx.fillText("P2: Cheat Mode On", 20, 100);
          sctx.strokeText("P2: Cheat Mode On", 20, 100);
        }
        break;
      case state.gameOver:
        //set timer to 0
        time_in_minutes = "";
        clearInterval(interval);

        sctx.lineWidth = "2";
        sctx.font = "40px Squada One";

        //stop the timer
        countdownStarted = false;

        //get name of player 1 and 2
        const Player1 = document.getElementById('game-start-player-1-name');
        const player1Name = (Player1.innerHTML).substring(1,(Player1.innerHTML).length - 1);
      
        const Player2 = document.getElementById('game-start-player-2-name');
        const player2Name = (Player2.innerHTML).substring(1, (Player2.innerHTML).length - 1);

        
        //player 1 lose, so send his score to server
        socket.emit("send_score", player1Name, this.score.curr);

        if(player1_Score == 10000){
          player1_Score = "Still playing";
        }
        if(player2_Score == 10000){
          player2_Score = "Still playing";
        }

        let sc1 = `SCORE of ${player1Name}:     ${this.score.curr}`;
        let sc2 = `SCORE of ${player2Name}:     ${player2_Score}`;
        try {
          this.score.best = Math.max(
            this.score.curr,
            localStorage.getItem("best")
          );
          localStorage.setItem("best", this.score.best);
          let bs = `YOUR BEST  :     ${this.score.best}`;

          //show marks of player 1
          sctx.fillText(sc1, scrn.width / 2 - 80, scrn.height / 2 - 30);
          sctx.strokeText(sc1, scrn.width / 2 - 80, scrn.height / 2 - 30);
          //show marks of player 2
          sctx.fillText(sc2, scrn.width / 2 - 80, scrn.height / 2 + 0);
          sctx.strokeText(sc2, scrn.width / 2 - 80, scrn.height / 2 + 0);

          let win_message = '';
          if((player2_Score == 10000) || (player2_Score == 10000)){ 
            //one of the player has not end game
            win_message = '';
          }
          else if(player2_Score > this.score.curr){ 
            //player 2 win
            win_message = `${player2Name} WIN !!!`;
          }
          else if(this.score.curr > player2_Score){ 
            //player 1 win
            win_message = `${player1Name} WIN !!!`;
          }
          
          sctx.fillText(win_message, scrn.width / 2 - 80, scrn.height / 2 + 30);
          sctx.strokeText(win_message, scrn.width / 2 - 80, scrn.height / 2 + 30);

          sctx.fillText(bs, scrn.width / 2 - 80, scrn.height / 2 + 60);
          sctx.strokeText(bs, scrn.width / 2 - 80, scrn.height / 2 + 60);

          let message_for_restart_1 = "click to restart game with this player "
          let message_for_restart_2 =  "or refresh page to exchnage player";

          sctx.fillText(message_for_restart_1, scrn.width / 2 - 200, scrn.height / 2 + 130);
          sctx.strokeText(message_for_restart_1, scrn.width / 2 - 200, scrn.height / 2 + 130);

          sctx.fillText(message_for_restart_2, scrn.width / 2 - 200, scrn.height / 2 + 160);
          sctx.strokeText(message_for_restart_2, scrn.width / 2 - 200, scrn.height / 2 + 160);

        } catch (e) {
          sctx.fillText(sc, scrn.width / 2 - 85, scrn.height / 2 + 15);
          sctx.strokeText(sc, scrn.width / 2 - 85, scrn.height / 2 + 15);
        }
        // print waiting for other player message when the other player is not ready
        if (sent){
          sctx.fillText("Waiting for other player...", scrn.width / 2 - 150, scrn.height / 2 + 100);
          sctx.strokeText("Waiting for other player...", scrn.width / 2 - 150, scrn.height / 2 + 100);
        }
        break;
    }
  },
  update: function () {
    if (state.curr == state.Play ||state.curr==state.trapped) return;
    this.frame += frames % 10 == 0 ? 1 : 0;
    this.frame = this.frame % this.tap.length;
  },
};

gnd.sprite.src = "gameplay/img/ground.png";
bg.sprite.src = "gameplay/img/BG.png";
pipe.top.sprite.src = "gameplay/img/toppipe.png";
pipe.bot.sprite.src = "gameplay/img/botpipe.png";
flappy_bird_UI.gameOver.sprite.src = "gameplay/img/go.png";
flappy_bird_UI.getReady.sprite.src = "gameplay/img/getready.png";
flappy_bird_UI.tap[0].sprite.src = "gameplay/img/tap/t0.png";
flappy_bird_UI.tap[1].sprite.src = "gameplay/img/tap/t1.png";
coin.sprite.src = "gameplay/img/coins/coins.png";
trash.sprite.src = "gameplay/img/trash/trash.png";
trap.sprite.src = "gameplay/img/trap/trap.png";

//newly changed
// bird.animations[0].sprite.src = "gameplay/img/bird/b0.png";
// bird.animations[1].sprite.src = "gameplay/img/bird/b1.png";
// bird.animations[2].sprite.src = "gameplay/img/bird/b2.png";
// bird.animations[3].sprite.src = "gameplay/img/bird/b0.png";
SFX.start.src = "gameplay/sfx/start.wav";
SFX.flap.src = "gameplay/sfx/flap.wav";
SFX.score.src = "gameplay/sfx/score.wav";
SFX.hit.src = "gameplay/sfx/hit.wav";
SFX.die.src = "gameplay/sfx/die.wav";
SFX.coins.src = "gameplay/sfx/coins.mp3";
SFX.trashs.src = "gameplay/sfx/trashs.mp3";
SFX.traps.src = "gameplay/sfx/traps.mp3";


function gameLoop() {
  update();
  draw();
  frames++;
}

function update() {
  bird.update();
  gnd.update();
  pipe.update();
  flappy_bird_UI.update();
  bird_2.update();
  coin.update();
  trash.update();
  trap.update();
}

function draw() {
  //newly added
  sctx.fillStyle = background_Color;
  sctx.fillRect(0, 0, scrn.width, scrn.height);
  bg.draw();
  pipe.draw();
  coin.draw();
  trash.draw();
  trap.draw();

  bird.draw();
  gnd.draw();
  flappy_bird_UI.draw();
  bird_2.draw();
}

setInterval(gameLoop, 20);
