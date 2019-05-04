const electron = require('electron');
const {ipcRenderer, remote} = electron;

class menuWindow 
{
    constructor() 
    {
        this.username = "";
        this.addListeners();
    }
    addListeners() 
    {
        /**
            * Hooks listeners to the window's elements and IPC communication. 
        */
       ipcRenderer.on('username', (event, data) => 
       {
            this.username = data;
            document.getElementById("title").innerText = this.username;
       }
       );
       document.getElementById("creategamebutton").addEventListener("mousedown", () => 
       {
           ipcRenderer.send("openLobby", this.username)
       }
       );
       document.getElementById("joingamebutton").addEventListener("mousedown", () => 
       {
           ipcRenderer.send("openServerBrowser", this.username)
       }
       );
    }
}
module.exports = menuWindow;