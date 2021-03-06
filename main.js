const electron = require('electron');
const template = require('./menuTemplate')
const {app, Menu, ipcMain, dialog, BrowserWindow} = electron;
const net = require('net');
const Window = require('./Window.js')
const tempDirectory = require('temp-dir');
const fs = require('fs')
const prompt = require('electron-prompt');


let login_win;
let menu_win;
let lobby_win;
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
        
        //login_win = new Window(600, 620, "loginWindow.html");
        signup_win = new Window(800, 700, "signupWindow.html");
        //drawing_win = new Window(1150, 870, "mainWindow.html");
        //menu_win = new Window(400, 400, "menuWindow.html");
		//serverbrowser_win = new Window(800, 800, "serverbrowserWindow.html");
		//lobby_win = new Window(568, 650, "lobbyWindow.html");
		login_win = new Window(600, 620, "loginWindow.html");
		menu_win = new Window(400, 400, "menuWindow.html");
        lobby_win = new Window(568, 650, "lobbyWindow.html");
        global.ip = "185.241.7.221";
		if (fs.existsSync(tempDirectory + "\\ip.txt")) {
			global.ip = fs.readFileSync(tempDirectory + "\\ip.txt").toString();
		}
		global.connected = false;
		login_win.browserWindow.on('ready-to-show', () => 
        {
			login_win.browserWindow.show(); 
			login_win.browserWindow.focus();
            socket = new net.Socket();
			try_connect();
			process.setMaxListeners(100);
			process.on('uncaughtException', function (err) {
                global.connected = false;
                    if (!login_win.browserWindow.isVisible()) 
                    {
                        dialog.showErrorBox("Error", "Connection to server is no longer in session.")
                        BrowserWindow.getAllWindows().forEach(window => 
                            {
                                window.hide();
                            })
                        login_win.browserWindow.show();
                    }
                login_win.browserWindow.webContents.send("serverOffline");
			}); 
			signupWindowListeners();
			loginWindowListeners();
			menuWindowListeners();
			serverbrowserWindowListeners();
			lobbyWindowListeners();
			//dataHandler();
        }
        );





        ipcMain.on('sendData', (event, data) => 
        {
            sendData(data);
        }
        );
        
  
        
        ipcMain.on('openErrorMessage', (event, msg) => 
        {
            dialog.showErrorBox("Error", msg)
        }
        );


        global.img = [];

    }
    );
}
function try_connect() 
{
	/**
        * Tries to connect to the server.
        
    */
   socket = new net.Socket();
   socket.on('timeout', () => 
   {
       if(socket.connecting) {
            login_win.browserWindow.webContents.send("serverOffline");
            socket.end();
       }
       

   });
   socket.setTimeout(1500);
	socket.connect(8820, global.ip, () =>
	{
		global.connected = true;
		login_win.browserWindow.webContents.send("serverOnline");
        socket.setEncoding("utf8");
        dataHandler();
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
		data1.pop();
        data1.forEach(data => 
        {
			data = data.replace("\r", "");
            if (data == "send_canvas") 
            {
                drawing_win.browserWindow.webContents.send("send_canvas");
			}
			else if (data == "serverClosed") {
				global.connected = false;
				if (!login_win.browserWindow.isVisible()) 
				{
					dialog.showErrorBox("Error", "Connection to server is no longer in session.")
					BrowserWindow.getAllWindows().forEach(window => 
						{
							window.hide();
						})
					login_win.browserWindow.show();
				}
				login_win.browserWindow.webContents.send("serverOffline");
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
						login_win.browserWindow.show();
						login_win.browserWindow.focus();
						signup_win.browserWindow.hide();

                    }
                });
            }
            else if (data == "unsucessfulLogin") 
            {
                dialog.showErrorBox('Error', 'Username and/or password are incorrect.');
			}
			else if (data == "alreadyLoggedin") 
			{
                dialog.showErrorBox('Error', 'This user is already logged in.');
			}
			else if (data == "sendCode") 
			{
				prompt({
					height: 150,
					title: 'Reset Password',
					label: 'Code:',
					inputAttrs: {
						type: 'text'
					}
				})
				.then((r) => {
					if(r === null) 
					{
		
					}
					else if (r == "") 
					{
						dialog.showErrorBox("Error", "Must enter a code.")
					}
					else {
						prompt({
							height: 150,
							title: 'Reset Password',
							label: 'New Password:',
							inputAttrs: {
								type: 'password'
							}
						})
						.then((pass) => {
							if(pass === null) 
							{
				
							}
							else if (pass == "") 
							{
								dialog.showErrorBox("Error", "Must enter a new password.")
							}
							else {
								sendData("resetCode&" + r + "&" + pass);
							}
						})
						.catch(console.error);
					}
				})
				.catch(console.error);
			}
			else if (data == "invalidCode") 
			{
				dialog.showErrorBox('Error', 'Invalid code.')
			}
			else if (data == "doesntExist") 
			{
				dialog.showErrorBox('Error', 'Username does not exist.')
			}
			else if (data == "changedPassword") 
			{
				dialog.showMessageBox(login_win.browserWindow, {
					message: 'Password Changed Successfuly!',
					buttons: ['OK'],
					defaultId: 0, // bound to buttons array
					type: "info",
					title: "Scribble Something",
				}, response => {
					if (response === 0) { // bound to buttons array
					}
				});
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
                            login_win.browserWindow.hide();
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
					if (!lobby_win.browserWindow.isDestroyed())
						lobby_win.browserWindow.webContents.send("newUser", data[1])
					else
						drawing_win.browserWindow.webContents.send("newUser", data[1])
                }
                else if (data[0] == "joinAccepted") 
                {  
                    lobby_win = new Window(568, 650, "lobbyWindow.html");
                    lobby_win.browserWindow.on('ready-to-show', () => 
                    {
                        lobby_win.browserWindow.webContents.send("setInfo", false, data[3])
                        lobby_win.browserWindow.webContents.send("lobbyUsername", data[1])
                        lobby_win.browserWindow.webContents.send("users", JSON.parse(data[2]))
                        lobby_win.browserWindow.show(); 
                        lobby_win.browserWindow.focus();
                        serverbrowser_win.browserWindow.close();
            
                    }
                    );
				}
				else if (data[0] == "joinAcceptedGame") 
                {  
					drawing_win = new Window(1150, 870, "mainWindow.html");
                    drawing_win.browserWindow.on('ready-to-show', () => 
                    {
                        setTimeout(() => {drawing_win.browserWindow.webContents.send("setUsername", data[1])}, 50);
						setTimeout(() => {drawing_win.browserWindow.webContents.send("addUsers", JSON.parse(data[6]), true)}, 150);
						setTimeout(() => {drawing_win.browserWindow.webContents.send("midGameSettings", data[2], data[3], data[4], data[5])}, 250);
						drawing_win.browserWindow.show();
						drawing_win.browserWindow.focus();
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
                    drawing_win = new Window(1150, 870, "mainWindow.html");
                    drawing_win.browserWindow.on('ready-to-show', () => 
                    {
                        setTimeout(() => {drawing_win.browserWindow.webContents.send("setUsername", data[1])}, 50);
                        setTimeout(() => {drawing_win.browserWindow.webContents.send("addUsers", JSON.parse(data[2]))}, 150);
                        drawing_win.browserWindow.show();
                        lobby_win.browserWindow.close();
                    }
                    );
                }
                else if (data[0] == "chatmessage") 
                {
                    drawing_win.browserWindow.webContents.send("chatmessage", data[1])
                }
                else if (data[0] == "players") 
                {
                    drawing_win.browserWindow.on("show", () => 
                    {
                        drawing_win.browserWindow.webContents.send("addUsersOwner", data[1] ,JSON.parse(data[2]), JSON.parse(data[3]));
                    }
                    );
                }
                else if (data[0] == "youDraw") 
                {
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
							lobby_win.browserWindow.webContents.send("setInfo", true, data[3])
							lobby_win.browserWindow.webContents.send("revealStartGame")
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
				else if (data[0] == "backToLobby") 
				{
					lobby_win = new Window(568, 650, "lobbyWindow.html");
                    lobby_win.browserWindow.on('ready-to-show', () => 
                    {
						lobby_win.browserWindow.show();
						drawing_win.browserWindow.close();
						lobby_win.browserWindow.webContents.send("setInfo", true, data[1])
                        lobby_win.browserWindow.webContents.send("lobbyUsername", data[1])
                    }
                    );
				}
				else if (data[0] == "playerLeft") 
				{
					drawing_win.browserWindow.webContents.send("removeUser", data[1])
				}
    
            }
       }
       );


   }
   );
}

function signupWindowListeners() 
{
    /**
        * Adds listeners to signupWindow, if any IPC messages are sent they will be handled here.
    */
    ipcMain.on('backPressedSignup', () => 
    {
		login_win.browserWindow.show();
		signup_win.browserWindow.hide(); 
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
		if (!global.connected) 
		{
			dialog.showErrorBox("Error", "You are not connected to the server.")
		}
		else 
		{
			signup_win.browserWindow.show();
			login_win.browserWindow.hide();
		}
    }
	);
	ipcMain.on('changeServer', () => 
	{
 
		prompt({
			height: 150,
			title: 'Server IP:',
			label: 'Server IP:',
			value: global.ip.toString(),
			inputAttrs: {
				type: 'text'
			}
		})
		.then((r) => {
			if(r === null) {
			} else {
				global.ip = r;
				fs.writeFileSync(tempDirectory + "\\ip.txt", r)
			}
		})
		.catch(console.error);
	}
	);
	ipcMain.on('retryServer', () => 
	{
		try_connect();
	}
	);
	ipcMain.on('forgotPassword', () => 
	{
		prompt({
			height: 150,
			title: 'Reset Password',
			label: 'Username:',
			inputAttrs: {
				type: 'text'
			}
		})
		.then((r) => {
			if(r === null) 
			{

			}
			else if (r == "") 
			{
				dialog.showErrorBox("Error", "Must enter a username.")
			}
			else {
				global.changePasswordUsername = r;
				sendData("resetPassword&" + r)
			}
		})
		.catch(console.error);
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
   ipcMain.on('send_canvas_back', (event, canvas) => 
   {
		image_socket = new net.Socket();
		image_socket.connect(5000, global.ip, () =>
		{
			image_socket.setEncoding("utf8"); 
			image_socket.write(canvas + "\n")
			return;
		}
		);
   }
   );
   lobby_win.browserWindow.on("close", () => 
   {
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
    process.env.NODE_ENV = "production";
    process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
    appStart(template.getMenu(app));
}

if (require.main) // like if __name__ == "__main__"
{
    Main();
}












