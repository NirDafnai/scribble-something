const electron = require('electron');
const {ipcRenderer, remote} = electron;
class serverbrowserWindow 
{
    constructor() 
    {
        this.backbutton = document.getElementById("backbutton")
        this.serversTable = document.getElementById("serverstable");
        this.nogameslabel = document.getElementById("nogameslabel")
        this.hasGames = false;
        this.rows = [];
        this.addListeners();
    }
    addListeners() 
    {
        /**
            * Hooks listeners to the window's elements and IPC communication. 
        */
       ipcRenderer.on('games', (event, games) => 
       {
            if (games.length == 0)
            {
                this.nogameslabel.style.display = "block";
                this.hasGames = false;
            }
            else 
            {
                games.forEach(game => 
                {
                    this.addServer(game);
                }
                );
            }            
       }
       );
       ipcRenderer.on('removeGame', (event, game_id) => 
       {
            this.removeServer(game_id);
       }
       );
       ipcRenderer.on('addGame', (event, game_data) => 
       {
            this.addServer(game_data);
       }
       );
       ipcRenderer.on('updateLobbyInfo', (event, lobby_data) => 
       {
            this.updateServer(lobby_data);
       }
       );
       ipcRenderer.on('playerCountUpdate', (event, game_id, playerCount) =>
       {
            this.rows.forEach((row) => 
            {
                if (row[1] == game_id) 
                {
                    row[0].cells.item(2).innerText = playerCount + "/8"
                }
                return;
            })
       }
       );
       this.backbutton.addEventListener("mousedown", () => 
       {
            ipcRenderer.send("backPressedServerBrowser");
       }
       );
    }
    addServer(serverDataArray) 
    {
        /**
            * Adds a server to the server browser.
            * @param {Array} serverDataArray Contains the data about the server (Server name, is it passworded, etc..) 
        */
       if (!this.hasGames)
        {
            this.nogameslabel.style.display = "none";
            var tr = document.createElement('tr')
            var th = document.createElement('th');
            th.innerHTML = '';
            tr.appendChild(th);
            var th = document.createElement('th');
            th.innerHTML = "Server Name";
            tr.appendChild(th);
            var th = document.createElement('th');
            th.innerHTML = "Players";
            tr.appendChild(th);
            var th = document.createElement('th');
            th.innerHTML = "Owner";
            tr.appendChild(th);
            var th = document.createElement('th');
            th.innerHTML = "";
            tr.appendChild(th);
            this.serversTable.appendChild(tr);
            this.hasGames = true;
        }
       var tr = document.createElement('tr')
       
       var password_td = document.createElement('td');
       if (serverDataArray[0] == "True") 
       {
            password_td.innerHTML = '<img src="img/locked.png" />'
       }
       else 
       {
            password_td.innerHTML = '<img src="img/locked.png" style="visibility: hidden;">';
       }
       tr.appendChild(password_td);
       var td = document.createElement('td');
       td.innerHTML = serverDataArray[1];
       tr.appendChild(td);
       var playercounttd = document.createElement('td');
       playercounttd.innerHTML = serverDataArray[2] + "/8";
       tr.appendChild(playercounttd);
       var td = document.createElement('td');
       td.innerHTML = serverDataArray[3];
       tr.appendChild(td);
       var td = document.createElement('td');
       td.innerHTML = "<button class='joinbutton'>Join</button>";
       td.getElementsByClassName("joinbutton")[0].addEventListener("mousedown", (event) => 
       {
            if (playercounttd.innerHTML == "8/8") 
            {
                ipcRenderer.send("openErrorMessage", "Lobby is full.")
            }
            else 
            {
                if (password_td.innerHTML == '<img src="img/locked.png">') 
                {
                    window.$ = window.jQuery = require('./js/libraries/jquery-3.4.0.js');
                    vex.defaultOptions.className = 'vex-theme-os'
                    vex.dialog.open({
                                    message: 'Enter game password:',
                                    input: [
                                        '<input name="password" type="password" placeholder="Password" required />'
                                    ].join(''),
                                    buttons: [
                                        $.extend({}, vex.dialog.buttons.YES, { text: 'Enter' }),
                                        $.extend({}, vex.dialog.buttons.NO, { text: 'Cancel' })
                                    ],
                                    callback: function (data) {
                                        if (!data) {
                                        } else {
                                            const game_id = serverDataArray[4];
                                            ipcRenderer.send("sendData", "joinGame&" + game_id + "&" + data.password)
                                        }
                                    }
                    })
                }
                else 
                {
                    const game_id = serverDataArray[4];
                    ipcRenderer.send("sendData", "joinGame&" + game_id)
                }
            }
            

       }
       );
       tr.appendChild(td);
       
       this.serversTable.appendChild(tr);
       this.rows.push([tr, serverDataArray[4]])

    }
    removeServer(game_id) 
    {
        /**
            * Removes a server from the server browser.
            * @param {String} game_id Contains the unique id of the game that will be removed.
        */
        this.rows.forEach((row, index) => 
        {
            if (row[1] == game_id) 
            {
                this.serversTable.deleteRow(index + 1);
                this.rows.splice(index, 1);
                if (this.rows.length == 0)
                {
                    this.serversTable.deleteRow(0);
                    this.nogameslabel.style.display = "block";
                    this.hasGames = false;
                } 
                return;
            }
        }
        );
    }
    updateServer(server_data) 
    {
        /**
            * Updates a server in the server browser.
            * @param {Array} server_data Contains the new data about the server and the game id.
        */
       this.rows.forEach(row => 
        {
            if (row[1] == server_data[1]) 
            {
                if (server_data[3] == "true") 
                {
                    row[0].cells[0].innerHTML='<img src="img/locked.png">';
                }
                else 
                {
                    row[0].cells[0].innerHTML= '<img src="img/locked.png" style="visibility: hidden;">';
                }
                row[0].cells[1].innerText=server_data[2]
                
                return;
            }
        }
        );
    }
}
module.exports = serverbrowserWindow;