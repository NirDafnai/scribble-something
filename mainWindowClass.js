const electron = require('electron');
class mainWindow 
{
    constructor(client) 
    {
        this.client = client;
        this.Window = new BrowserWindow(
            {
            width:1150, 
            height:860,
            backgroundColor: '#3e474e',
            show: false,
            webPreferences: 
            {
                nodeIntegration: true,
                contextIsolation: false
            }
        }
        );

    }
    applySettingsAndListeners() 
    {
        this.Window.setMinimumSize(1150, 900);

        mainWindow.on('ready-to-show', () => 
        { 
          mainWindow.show(); 
          mainWindow.focus(); 
        }
        );
        // Load html into window
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'public/mainWindow.html'),
            protocol: 'file:',
            slashes: true
        }));
        
        // Quit app when closed
        mainWindow.on('closed', () =>
        {
            app.quit();
        }
        );

        
        ipcMain.on('newMouseCoordinates', (event, data) => 
        {
            client.write("new&" + data + "\n");
        }
        );
        ipcMain.on('moveMouseCoordinates', (event, data) => 
        {
            client.write("move&" + data + "\n");
        }
        );
        ipcMain.on('fill', (event, data) => 
        {
            client.write("fill&" + data + "\n");
        }
        );
        ipcMain.on('board', (event, data) => 
        {
            client.write(data + "\n");
        }
        );
        ipcMain.on('clearCanvas', () => 
        {
            client.write("clearCanvas" + "\n");
        }
        );


        client.setEncoding('utf8');
        
        let img = [];
        client.on('data', (data) => 
        {
            data = data.replace(/\n|\r/g, "");

            if (data == "send_board") 
            {
                mainWindow.webContents.send("send_board");
            }
            else if (data == "clearCanvas") 
            {
                mainWindow.webContents.send("clearCanvas");
            }

            else if (data == "end")
            {
                    global.myObject = img.join('');
                    ipcMain.on("readytoget", () => 
                    {
                        mainWindow.webContents.send("board");
                        setTimeout(() => 
                        {
                            img = [];
                        }
                        , 500);
                    }
                    );

            }

            else 
            {
                data = data.split("&")
                if (data[0] == "new")
                    mainWindow.webContents.send("newMouseCoordinates", data[1]);
                else if (data[0] == "dataparts")
                {
                    img.push(data[1]);
                    client.write("ack\n");
                }
                else if (data[0] == "move")
                    mainWindow.webContents.send("moveMouseCoordinates", data[1]);
                else if (data[0] == "fill") 
                {
                    mainWindow.webContents.send("fill", data[1]);
                }
            }

        }
        );
    }

}

module.exports = mainWindow;