const express = require("express");

const bcrypt = require("bcrypt");
const fs = require("fs");
const session = require("express-session");

// Create the Express app
const app = express();

// Use the 'public' folder to serve static files
app.use(express.static("public"));

// Use the json middleware to parse JSON data
app.use(express.json());

// Use the session middleware to maintain sessions
const chatSession = session({
    secret: "game",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { maxAge: 300000 }
});
app.use(chatSession);

// This helper function checks whether the text only contains word characters
function containWordCharsOnly(text) {
    return /^\w+$/.test(text);
}

// Handle the /register endpoint
app.post("/register", (req, res) => {
    // Get the JSON data from the body
    const { username, password } = req.body;

    // D. Reading the users.json file
    const users = JSON.parse(fs.readFileSync("data/users.json"));

    // E. Checking for the user data correctness
    //1. check username && avatar && name && password not empty
    if(!username){
        res.json({status: "error", error: "The username are empty value"});
        return;
    }
    if(!password){
        res.json({status: "error", error: "The password are empty value"});
        return;
    }
    //2. usernmae only contaitn underscores, letters or numbers
    if(!containWordCharsOnly(username)){
        res.json({status: "error", error: "Your user name is invalid as it not only contains underscores, letters or numbers"});
        return;
    }
    //3. check username exist in current list of users
    if(username in users){
        res.json({status: "error", error: "This username already exist"});
        return;
    }

    // G. Adding the new user account
    const hash = bcrypt.hashSync(password,10);


    // H. Saving the users.json file
    // users[username] = {avatar: avatar,name: name, password: hash};
    const new_user = {password: hash};
    users[username] = new_user;
    const new_data = JSON.stringify(users, null, " ")
    fs.writeFileSync("data/users.json", new_data);

    //
    // I. Sending a success response to the browser
    //
    res.json({ status: "success" });
    // Delete when appropriate
    
});

// Handle the /signin endpoint
app.post("/signin", (req, res) => {
    // Get the JSON data from the body
    const { username, password } = req.body;

    //
    // D. Reading the users.json file
    //
    const users = JSON.parse(fs.readFileSync("data/users.json"));

    //
    // E. Checking for username/password
    //
    if(!(username in users)){
        res.json({status: "error", error: "This username is not registered yet"});
        return;
    }

    const hashpsw = users[username].password;
    if(!bcrypt.compareSync(password, hashpsw)){
        res.json({status: "error", error: "This password is wrong"});
        return;
    }

    //
    // G. Sending a success response with the user account
    //

    req.session.user= {username}; //set the username and avata

    res.json({ status: "success", user: {username} });
 
});

// Handle the /validate endpoint
app.get("/validate", (req, res) => {

    //
    // B. Getting req.session.user
    if(!req.session.user){
        res.json({status: "error", error: "No user has signed-in"});
        return;
    }
    const username = req.session.user.username;

    res.json({ status: "success", user: {username} });

    //
    // D. Sending a success response with the user account
    //
});

// Handle the /signout endpoint
app.get("/signout", (req, res) => {

    //
    // Deleting req.session.user
    delete req.session.user;
    //req.session.destroy()

    // Sending a success response
    res.json({ status: "success"});
 

});


//
// ***** Please insert your Lab 6 code here *****
//

// Task 1 create io server
const { createServer } = require("http");
const { Server } = require("socket.io");
const httpServer = createServer( app );
const io = new Server(httpServer);


// task 1.2 using session to stoere iser info in session data
// and need explicitly tell the server to use the server
// ask io to use the seession object for each socket
// then later can use socket.request.session.user to accesss socket ioserver
io.use((socket, next) => {
    chatSession(socket.request, {}, next);
});

//3. the online user list
// JS object to store the online users
const onlineUsers = {};

let readyUsers = [];
let gameStartReadyUsers = [];
let gameEndReadyUsers = [];

let firstUser = 0;
let lastframe = -1;
let lastframeOfCoins = -1;
let lastframeOfTrashs = -1;
let lastframeOfTraps = -1;

let start = false;


// 3.manag/ show/ broadcast online user list 
//wait for and handle the socket connection
//connection evnet is take place at the Socket IO server
io.on("connection", (socket) => {
    
    if(socket.request.session.user){ // check if the session is valid
        //3.1 3.3 add a new user 
        //update the online user list 
        const new_username = socket.request.session.user.username;
        onlineUsers[new_username] = {name: new_username};
        const user_to_retrun = JSON.stringify({username: new_username});
        io.emit("add user", user_to_retrun);
    }

    if(socket.request.session.user){
        const new_username = socket.request.session.user.username;
        //3.3 remove a new user 
        //remove the connection on the browsers socket
        socket.on("disconnect", ()=>{
            delete onlineUsers[new_username];
            const user_to_retrun = JSON.stringify({username: new_username});
            io.emit("remove user", user_to_retrun);
            console.log("onlineUsers is", onlineUsers);
        });
        socket.on("get users", ()=>{
            const userList = JSON.stringify(onlineUsers);
            console.log("userList is", userList);
            socket.emit("users", userList);
        });
        
        //change another player position
        socket.on("player position", (direction, x,y)=>{
            io.emit("update player position", JSON.stringify({player_direction:direction, x_position:x,y_position:y}));
        });
        //ready to start the game
        socket.on("player_ready", (userName, characterID, map_name)=>{
            io.emit("update_player_ready", JSON.stringify({userName:userName, characterID:characterID, map_name:map_name}));
            // readyUsers.push(userName);
            // console.log("readyUsers is", readyUsers);

            // if (readyUsers.length == 2){
            //     setTimeout(()=>{
            //         io.emit("start_game");
            //         readyUsers = [];
            //     }, 4000);
            // }
        });
        // get player position
        socket.on("player_bird_info", (json)=>{
            // send the player position to the other player
            io.emit("update_player_bird_info", json);
        });

        // make a new pipe if the frame is not the last frame
        socket.on("request_pipe", (json)=>{
            let frames = JSON.parse(json).frames;
            if (frames != lastframe){
                console.log("frames is", frames);
                lastframe = frames;
                let y = -210 * Math.min(Math.random() + 1, 1.8);
                io.emit("make_pipe", JSON.stringify({y:y}));
            }
        });

        // make a new coins
        socket.on("request_coins", (json)=>{
            let frames = JSON.parse(json).frames;
            if (frames != lastframeOfCoins){
                console.log("Now making coins");
                lastframeOfCoins = frames;
                let y = -210 * Math.min(Math.random() + 1, 1.8);
                io.emit("make_coins", JSON.stringify({y:y}));
            }
        });

        // make a new trash
        socket.on("request_trashs", (json)=>{
            let frames = JSON.parse(json).frames;
            if (frames != lastframeOfTrashs){
                console.log("Now making trash");
                lastframeOfTrashs = frames;
                let y = -210 * Math.min(Math.random() + 1, 1.8);
                io.emit("make_trashs", JSON.stringify({y:y}));
            }
        });

        socket.on("request_traps", (json)=>{
            let frames = JSON.parse(json).frames;
            if (frames != lastframeOfTraps){
                console.log("Now making trap");
                lastframeOfTraps = frames;
                let y = -210 * Math.min(Math.random() + 1, 1.8);
                io.emit("make_traps", JSON.stringify({y:y}));
            }
        });

        // for going from game start page to game page
        socket.on("start_game", (id)=>{
            readyUsers.push(id);

            if(readyUsers.length == 2){
                io.emit("flappy_bird_start");
                readyUsers = [];
            }else{
                firstUser = id;
            }
        });

        // for starting game after both users are ready in game page
        socket.on("go_game", (id)=>{
            if (!gameStartReadyUsers.includes(id)){
                gameStartReadyUsers.push(id);
            }

            if(gameStartReadyUsers.length == 2){
                io.emit("flappy_bird_start");
                gameStartReadyUsers = [];
            }
        });


        socket.on("end_game", (id)=>{
            if (!gameEndReadyUsers.includes(id)){
                gameEndReadyUsers.push(id);
            }

            if(gameEndReadyUsers.length == 2){
                start = false;
                io.emit("flappy_bird_restart");
                gameEndReadyUsers = [];
            }
        });

        socket.on("send_score", (player1Name, player1_Score)=>{
            // console.log("inside server player1Name is",player1Name, "player1_Score is", player1_Score );
            io.emit("update player score", JSON.stringify({player_Name:player1Name, player_Score:player1_Score}));
        });

        // broadcast cheat message
        socket.on("sending_cheat_mode", (json)=>{
            console.log("inside server sending_cheat_mode json is", json);
            io.emit("cheat_mode", json);
        });


    }
})


// Use a web server to listen at port 8000
httpServer.listen(8000, () => {
    console.log("The chat server has started...");
});
