const Socket = (function() {
    // This stores the current Socket.IO socket
    let socket = null;
    // other player information
    let player_dir = null;
    let x_pos = null;
    let y_pos = null;

    // This function gets the socket from the module
    const getSocket = function() {
        return socket;
    };

    // This function connects the server and initializes the socket
    const connect = function() {
        socket = io();

        // Wait for the socket to connect successfully
        socket.on("connect", () => {
            // Get the online user list
            //when browser connect to server successfully then will send "get users" to server
            socket.emit("get users");
        });

        // Set up the users event
        socket.on("users", (onlineUsers) => {
            onlineUsers = JSON.parse(onlineUsers);

            //REMOVE TIHS PART
            // console.log("in browser now the onlineUsers is", onlineUsers);

            // Show the online users
            OnlineUsersPanel.update(onlineUsers);
        });

        // Set up the add user event
        socket.on("add user", (user) => {
            user = JSON.parse(user);

            // Add the online user
            OnlineUsersPanel.addUser(user);
        });

        // Set up the remove user event
        socket.on("remove user", (user) => {
            user = JSON.parse(user);

            // Remove the online user
            OnlineUsersPanel.removeUser(user);
        });

        //change another player position
        socket.on("update player position", (position) => {
            position = JSON.parse(position);
            // SUCCESS to console.log("in update", position);
            player_dir = position.player_direction;
            x_pos = position.x_position;
            y_pos =  position.y_position;
        });
    };

    // This function disconnects the socket from the server
    const disconnect = function() {
        socket.disconnect();
        socket = null;
    };

    //change another player position
    const postPlayerPosition = function(direction,x,y) {
        if (socket && socket.connected) {
            socket.emit("player position", String(direction), String(x), String(y));
        }
    };
    //change another player position
    // call from player.update line127
    const getPlayerPosition = function() {
        const info = {player_dir:player_dir ,x_pos: x_pos ,y_pos: y_pos};
        return info;
    };

    return { getSocket, connect, disconnect, postPlayerPosition, getPlayerPosition};
})();
