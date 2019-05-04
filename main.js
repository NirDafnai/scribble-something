const electron = require('electron');
const template = require('./menuTemplate')
const {app, Menu, ipcMain, dialog} = electron;
const net = require('net');
const Window = require('./Window.js')


function appStart(mainMenuTemplate) 
{
    /**
        * Sets the properties of the app and adds listeners to app events.
        * @param {Array} mainMenuTemplate Contains an object for each sub-menu, e.g. 'File', 'Edit' and so forth.
    */

    // Listen for app to be ready
    app.on('ready', () => 
    {
        // Create new window
    
        const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
        Menu.setApplicationMenu(mainMenu);
        
        login_win = new Window(600, 600, "loginWindow.html");
        //signup_win = new Window(800, 700, "signupWindow.html");
        //drawing_win = new Window(1150, 870, "mainWindow.html");
        menu_win = new Window(400, 400, "menuWindow.html");
        //serverbrowser_win = new Window(800, 800, "serverbrowserWindow.html");
        lobby_win = new Window(568, 650, "lobbyWindow.html");

        signupWindowListeners();
        loginWindowListeners();
        mainWindowListeners();
        menuWindowListeners();
        serverbrowserWindowListeners();
        lobbyWindowListeners();
        dataHandler();

        ipcMain.on('sendData', (event, data) => 
        {
            sendData(data);
        }
        );
        
        login_win.browserWindow.on('ready-to-show', () => 
        { 
            //login_win.browserWindow.show(); 
            //login_win.browserWindow.focus();
            login_win.browserWindow.show(); 
            login_win.browserWindow.focus();
                 
        }
        );      
        /*
        drawing_win.browserWindow.on('ready-to-show', () => 
        { 
           //login_win.browserWindow.show(); 
           //login_win.browserWindow.focus();
           drawing_win.browserWindow.show(); 
           drawing_win.browserWindow.focus();
                    
        }
        );
       */
        
        ipcMain.on('openErrorMessage', (event, msg) => 
        {
            dialog.showErrorBox("Error", msg)
        }
        );


        global.img = [];

    }
    );
}


function sendData(data) 
{
    /**
        * Wrapper for socket.write, Gets data, adds a new line to it and sends it to the server. This function is primarily used for IPC events.
        
        @param {String} data The data that is to be sent.
    */
    socket.write(data + "\n")
}

function dataHandler() 
{
    /**
        * Handles data when it is received.
    */
   socket.on('data', (message) => 
   {
        message = message.replace("\r", "");
        let data1 = message.split("\n")
        console.log(data1)
        data1.pop();
        data1.forEach(data => 
        {
            data = data.replace("\r", "");
            console.log(data)
            if (data == "send_canvas") 
            {
                drawing_win.browserWindow.webContents.send("send_canvas");
            }
            else if (data == "clearCanvas") 
            {
                drawing_win.browserWindow.webContents.send("clearCanvas");
            }
            else if (data == "end")
            {
                global.myObject = global.img.join('');
                ipcMain.on("readytoget", () => 
                {
                    drawing_win.browserWindow.webContents.send("canvas");
                    /*
                    setTimeout(() => 
                    {
                        global.img = [];
                    }
                    , 500);
                    */ // takes time for the image to be loaded on to the canvas.
                }
                );
            }
            else if (data == "signed_up") 
            {
                dialog.showMessageBox(signup_win.browserWindow, {
                    message: 'Signup Successful!',
                    buttons: ['OK'],
                    defaultId: 0, // bound to buttons array
                    type: "info",
                    title: "Scribble Something",
                }, response => {
                    if (response === 0) { // bound to buttons array
                        login_win = new Window(600, 600, "loginWindow.html");
                        login_win.browserWindow.on('ready-to-show', () => 
                        { 
                            login_win.browserWindow.show();
                            login_win.browserWindow.focus();
                            signup_win.browserWindow.close();
                        }
                        );  

                    }
                });
            }
            else if (data == "unsucessfulLogin") 
            {
                dialog.showErrorBox('Error', 'failure');
            }
            else if (data == "kicked") 
            {
                menu_win.browserWindow.show();
                lobby_win.browserWindow.close();
                dialog.showErrorBox('You left the lobby', 'You were kicked.');
            }
            else if (data == "joinDenied") 
            {
                dialog.showErrorBox('Error', 'Game password is incorrect.');
            }
            else if (data == "sendWinner") 
            {
                drawing_win.browserWindow.webContents.send("sendWinner")
            }
            else if (data == "tie") 
            {
                drawing_win.browserWindow.webContents.send("tie")
            }
            else 
            {
                /*
                    data = data.split('|')
                    signup_win.browserWindow.webContents.send("invalidFields", data)
                */
                data = data.split("&")
                if (data[0] == "errorsigningup") 
                {
                    signup_win.browserWindow.webContents.send("invalidFields", data)
                }
                else if (data[0] == "successfulLogin") 
                {
                    dialog.showMessageBox(login_win.browserWindow, {
                        message: 'Login Successful!',
                        buttons: ['OK'],
                        defaultId: 0, // bound to buttons array
                        type: "info",
                        title: "Scribble Something",
                    }, response => {
                        if (response === 0) { // bound to buttons array
                            menu_win.username = data[1]
                            menu_win.browserWindow.show();
                            menu_win.browserWindow.focus();
                            login_win.browserWindow.close();
                            global.username = data[1];
                        }
                    });
                    menu_win.browserWindow.webContents.send("username", data[1])
    
                }
    
                else if (data[0] == "new") 
                {
                    drawing_win.browserWindow.webContents.send("newMouseCoordinates", data[1]);
                }
                else if (data[0] == "dataparts")
                {
                    global.img.push(data[1]);
                    sendData("ack")
                }
                else if (data[0] == "move") 
                {
                    drawing_win.browserWindow.webContents.send("moveMouseCoordinates", data[1]);
                }
                else if (data[0] == "fill") 
                {
                    drawing_win.browserWindow.webContents.send("fill", data[1]);
                }
                else if(data[0] == "games") 
                {
                    let games = JSON.parse(data[1])
                    serverbrowser_win.browserWindow.webContents.send("games", games)
                }
                else if (data[0] == "removeGame") 
                {
                    serverbrowser_win.browserWindow.webContents.send("removeGame", data[1])
                }
                else if (data[0] == "newlyAddedGame") 
                {
                    gameData = JSON.parse(data[1])
                    serverbrowser_win.browserWindow.webContents.send("addGame", gameData)
                }
                else if (data[0] == "newLobbyData") 
                {
                    serverbrowser_win.browserWindow.webContents.send("updateLobbyInfo", data)
                }
                else if (data[0] == "newUser") 
                {
                    lobby_win.browserWindow.webContents.send("newUser", data[1])
                }
                else if (data[0] == "joinAccepted") 
                {  
                    console.log("join accepted man")
                    lobby_win = new Window(568, 650, "lobbyWindow.html");
                    lobby_win.browserWindow.on('ready-to-show', () => 
                    {
                        lobby_win.browserWindow.webContents.send("setInfo", false, data[3])
                        lobby_win.browserWindow.webContents.send("lobbyUsername", data[1])
                        console.log(data[2])
                        lobby_win.browserWindow.webContents.send("users", JSON.parse(data[2]))
                        lobby_win.browserWindow.show(); 
                        lobby_win.browserWindow.focus();
                        serverbrowser_win.browserWindow.close();
            
                    }
                    );
                }
                else if (data[0] == "youAreNewCreator") 
                {
                    lobby_win.browserWindow.webContents.send("youAreNewCreator", data[1])
                }
                else if (data[0] == "newCreator") 
                {
                    console.log("i got fucked here")
                    lobby_win.browserWindow.webContents.send("newCreator", data[1], data[2])
                }
                else if (data[0] == "userLeft") 
                {
                    lobby_win.browserWindow.webContents.send("userLeft", data[1])
                }
                else if (data[0] == "playerCountUpdate") 
                {
                    serverbrowser_win.browserWindow.webContents.send("playerCountUpdate", data[1], data[2])
                }
                else if (data[0] == "startGame") 
                {
                    console.log("got start game command")
                    drawing_win = new Window(1150, 870, "mainWindow.html");
                    drawing_win.browserWindow.on('ready-to-show', () => 
                    {
                        setTimeout(() => {drawing_win.browserWindow.webContents.send("setUsername", data[1])}, 50);
                        setTimeout(() => {drawing_win.browserWindow.webContents.send("addUsers", JSON.parse(data[2]))}, 150);
                        drawing_win.browserWindow.show();
                        lobby_win.browserWindow.close();
                    }
                    );
                    console.log("normal start game shit")
                }
                else if (data[0] == "chatmessage") 
                {
                    drawing_win.browserWindow.webContents.send("chatmessage", data[1])
                }
                else if (data[0] == "players") 
                {
                    console.log(data[1])
                    drawing_win.browserWindow.on("show", () => 
                    {
                        drawing_win.browserWindow.webContents.send("addUsersOwner", data[1] ,JSON.parse(data[2]), JSON.parse(data[3]));
                    }
                    );
                }
                else if (data[0] == "youDraw") 
                {
                    console.log("got youDraw");
                    drawing_win.browserWindow.webContents.send("youDraw", data[1], JSON.parse(data[2]));
                }
                else if (data[0] == "chosenWord") 
                {
                    drawing_win.browserWindow.webContents.send("chosenWord", data[1]);
                }
                else if (data[0] == "newRound") 
                {
                    drawing_win.browserWindow.webContents.send("newRound", data[1]);
                }
                else if (data[0] == "newDrawer") 
                {
                    console.log("bla bla bla bla:")
                    console.log(data)
                    drawing_win.browserWindow.webContents.send("newDrawer", data[1], data[2], data[3]);
                }
                else if (data[0] == "playerGuessedWord") 
                {
                    if (data[3] === void 0) // void 0 is undefined
                        drawing_win.browserWindow.webContents.send("playerGuessedWord", data[1], data[2]);
                    else drawing_win.browserWindow.webContents.send("playerGuessedWord", data[1], data[2], data[3]);
                }
                else if (data[0] == "win") 
                {
                    drawing_win.browserWindow.webContents.send("win", data[1], data[2])
                }
                else if (data[0] == "users") 
                {
                    lobby_win = new Window(568, 650, "lobbyWindow.html");
                    lobby_win.browserWindow.on('ready-to-show', () => 
                    {
                        if (data[4] == "true")
                        {
                            console.log("it is true that you are the owner.")
                            lobby_win.browserWindow.webContents.send("setInfo", true, data[3])
                        }
                        else
                            lobby_win.browserWindow.webContents.send("setInfo", false, data[3])
                        
                        lobby_win.browserWindow.webContents.send("lobbyUsername", data[2])
                        lobby_win.browserWindow.webContents.send("users", JSON.parse(data[1]))
                    }
                    );
                    
                    setTimeout(() => 
                    {
                        lobby_win.browserWindow.show(); 
                        lobby_win.browserWindow.focus();
                        drawing_win.browserWindow.close();
                    }
                    , 6000);
                    
                }
    
            }
       }
       );


   }
   );
}

function mainWindowListeners() 
{
    /**
        * Adds listeners to mainWindow, if any IPC messages are sent they will be handled here.
    */
    
   // TO BE USED
}
function signupWindowListeners() 
{
    /**
        * Adds listeners to signupWindow, if any IPC messages are sent they will be handled here.
    */
    ipcMain.on('backPressedSignup', () => 
    {
        //signup_win.browserWindow.webContents.send("clearFields")
        login_win = new Window(600, 600, "loginWindow.html");
        login_win.browserWindow.on('ready-to-show', () => 
        {
            login_win.browserWindow.show();
            signup_win.browserWindow.close();    
        }
        );
        //signup_win = new Window(800, 700, "signupWindow.html");
    }
    );
}
function loginWindowListeners()
{
    /**
        * Adds listeners to loginWindow, if any IPC messages are sent they will be handled here.
    */
    ipcMain.on('openSignup', () => 
    {
        signup_win = new Window(800, 700, "signupWindow.html");
        signup_win.browserWindow.on('ready-to-show', () => 
        {
            signup_win.browserWindow.show();
            login_win.browserWindow.close();    
        }
        );
        //login_win = new Window(600, 600, "loginWindow.html");
    }
    );

}
function menuWindowListeners() 
{
    /**
        * Adds listeners to menuWindow, if any IPC messages are sent they will be handled here.
    */
   ipcMain.on('openLobby', (event, username) => 
   {
        lobby_win = new Window(568, 650, "lobbyWindow.html");
        sendData("newGame&" + username + "'s Game")
        lobby_win.browserWindow.on('ready-to-show', () => 
        {
            lobby_win.browserWindow.webContents.send("setInfo", true, username)
            lobby_win.browserWindow.webContents.send("lobbyUsername", username)
            lobby_win.browserWindow.show(); 
            lobby_win.browserWindow.focus();
            menu_win.browserWindow.hide()

        }
        );


   }
   );
   ipcMain.on('openServerBrowser', (event, username) => 
   {
        serverbrowser_win = new Window(800, 800, "serverbrowserWindow.html");
        serverbrowser_win.browserWindow.on('ready-to-show', () => 
        {
            console.log("please give me games")
            sendData("getGames&" + username)
            serverbrowser_win.browserWindow.show(); 
            serverbrowser_win.browserWindow.focus();
            menu_win.browserWindow.hide()
        }
        );


   }
   );
}
function serverbrowserWindowListeners() 
{
    /**
        * Adds listeners to serverbrowserWindow, if any IPC messages are sent they will be handled here.
    */
   ipcMain.on('backPressedServerBrowser', () => 
   {
        menu_win.browserWindow.show();
        menu_win.browserWindow.focus();
        serverbrowser_win.browserWindow.close();
        sendData("serverbrowserClosed");
   }
   );
}
function lobbyWindowListeners() 
{
    /**
        * Adds listeners to lobbyWindow, if any IPC messages are sent they will be handled here.
    */
   ipcMain.on('updateLobbyData', (event, data) => 
   {
       sendData("updateLobbyData&" + data[0] + "&" + data[1] + "&" + data[2]);
   }
   );
   ipcMain.on('backPressedLobby', (event) => 
   {
       menu_win.browserWindow.show();
       lobby_win.browserWindow.close()
       sendData("exitLobby");
       console.log("exitLobby")
   }
   );
   ipcMain.on('kickPlayer', (event, player) => 
   {
       sendData("kickPlayer&" + player);
   }
   );
   ipcMain.on('startGameOwner', (event) => 
   {
        sendData("startGame");
        drawing_win = new Window(1150, 870, "mainWindow.html");
        drawing_win.browserWindow.on('ready-to-show', () => 
        {
            drawing_win.browserWindow.webContents.send("setUsername", global.username)
            drawing_win.browserWindow.show();
            lobby_win.browserWindow.close();
        }
        );

   }
   );
   lobby_win.browserWindow.on("close", () => 
   {
       console.log("closed")
       sendData("exitLobby");
   }
   );
}

let socket;
function Main() 
{
    /**
        * The main function.
    */
    process.env.NODE_ENV = "development";
    process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
    socket = new net.Socket();
    socket.connect(8820, '109.186.92.158', () =>
    {
        console.log('Connected');
        socket.setEncoding("utf8"); 
    }
    );
    appStart(template.getMenu(app));
}

if (require.main) // if __name__ == "__main__"
{
    Main();
}












