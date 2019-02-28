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
        signup_win = new Window(800, 700, "signupWindow.html");
        drawing_win = new Window(1150, 860, "mainWindow.html");
        menu_win = new Window(400, 400, "menuWindow.html");
        signupWindowListeners();
        loginWindowListeners();
        mainWindowListeners();
        dataHandler();

        ipcMain.on('sendData', (event, data) => 
        {
            sendData(data);
        }
        );


        login_win.browserWindow.on('ready-to-show', () => 
        { 
            login_win.browserWindow.show(); 
            login_win.browserWindow.focus();        
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
   socket.on('data', (data) => 
   {
       data = data.replace(/\n|\r/g, "");
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
           dialog.showMessageBox(null);
       }
       else if (data == "successfulLogin") 
       {
           dialog.showErrorBox('Error', 'success');
           menu_win.browserWindow.show();
           menu_win.browserWindow.focus();
           login_win.browserWindow.close();
       }
       else if (data == "unsucessfulLogin") 
       {
           dialog.showErrorBox('Error', 'failure');
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
       }

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
    ipcMain.on('backPressed', () => 
    {
        signup_win.browserWindow.webContents.send("clearFields")
        login_win.browserWindow.show();
        signup_win.browserWindow.close();
        signup_win = new Window(800, 700, "signupWindow.html");
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
        login_win.browserWindow.webContents.send("clearFields")
        signup_win.browserWindow.show();
        login_win.browserWindow.close();
        login_win = new Window(600, 600, "loginWindow.html");
    }
    );

}
function menuWindowListeners() 
{
    /**
        * Adds listeners to menuWindow, if any IPC messages are sent they will be handled here.
    */
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
    socket.connect(8820, '127.0.0.1', () =>
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












