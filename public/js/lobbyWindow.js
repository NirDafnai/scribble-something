const electron = require("electron");
const {ipcRenderer, remote} = electron;

class lobbyWindow 
{
	constructor() 
	{
		this.lobbyOwner = false;
		this.ownUsername = "";
		this.back_button = document.getElementById("backbutton");
		this.lobbyname_field = document.getElementById("lobby_name");
		this.password_checkbox = document.getElementById("password_checkbox");
		this.password_field = document.getElementById("password-text");
		this.player_list = document.getElementById("playerlist");
		this.player_counter = document.getElementById("playercounter");
		this.save_button = document.getElementById("savebutton");
		this.checkmark = document.getElementById("checkmark");
		this.startgame_button = document.getElementById("startgamebutton");
		this.addListeners();
	}
	addListeners() 
	{
		/**
            * Hooks listeners to the window's elements and IPC communication. 
        */

		this.password_checkbox.addEventListener("change", (event) => 
		{
			this.checkmark.style.visibility = "hidden";
			if (this.password_checkbox.checked)  
			{
				this.password_field.disabled = false;
			}
			else 
			{
				this.password_field.disabled = true;
				this.password_field.value = "";
			}
		}
		);
		this.password_field.addEventListener("input", (event) => 
		{
			this.checkmark.style.visibility = "hidden";
		}
		);
		this.lobbyname_field.addEventListener("input", (event) => 
		{
			this.checkmark.style.visibility = "hidden";
		}
		);
		ipcRenderer.on("lobbyUsername", (event, username) => 
		{
			this.lobbyname_field.value = username + "'s Game";
			this.addUser(username, true);
			const players_count = document.getElementsByClassName("player").length;
			this.player_counter.innerText = players_count + "/8";
		}
		);
		ipcRenderer.on("setInfo", (event, isOwner, username) => 
		{

			this.lobbyOwner = isOwner;
			this.ownUsername = username;
			if (!this.lobbyOwner) 
			{
				document.getElementById("options").style.visibility = "hidden";
				document.getElementById("ownerSettingsLabel").style.visibility = "visible";
			}
		}
		);
		ipcRenderer.on("newUser", (event, username) => 
		{
			this.addUser(username, false);
			const players_count = document.getElementsByClassName("player").length;
			this.player_counter.innerText = players_count + "/8";
			if (players_count < 2) {
				this.startgame_button.style = "visibility: hidden";
			}
			else if (this.lobbyOwner) {
				this.startgame_button.style = "visibility: visible";
			}
		}
		);
		ipcRenderer.on("youAreNewCreator", (event, oldCreator) => 
		{
			this.lobbyOwner = true;
			this.removeUser(oldCreator);
			const players_count = document.getElementsByClassName("player").length;
			this.player_counter.innerText = players_count + "/8";
			document.getElementById("ownerSettingsLabel").style.visibility = "hidden";
			document.getElementById("options").style.visibility = "visible";
			if (players_count > 1) this.startgame_button.style.visibility = "visible";
			let players = document.getElementsByClassName("player");
			Array.from(players).forEach((element, index) => 
			{
				if (element.getElementsByClassName("playername")[0].innerText == this.ownUsername) 
				{
					element.getElementsByClassName("owner")[0].style = "visibility: visible";
				}
				else 
				{
					element.getElementsByClassName("playerkickimage")[0].style = "visibility: visible";
				}
			}
			);
		}
		);
		ipcRenderer.on("newCreator", (event, newCreator, oldCreator) => 
		{
			this.removeUser(oldCreator);
			const players_count = document.getElementsByClassName("player").length;
			this.player_counter.innerText = players_count + "/8";
			let players = document.getElementsByClassName("player");
			Array.from(players).forEach((element) => 
			{
				if (element.getElementsByClassName("playername")[0].innerText == newCreator) 
				{
					element.getElementsByClassName("owner")[0].style = "visibility: visible";
				}
			}
			);
		}
		);
		ipcRenderer.on("userLeft", (event, username) => 
		{
			this.removeUser(username);
			const players_count = document.getElementsByClassName("player").length;
			this.player_counter.innerText = players_count + "/8";
			if (players_count < 2) {
				this.startgame_button.style = "visibility: hidden";
			}
		}
		);
		ipcRenderer.on("users", (event, users) => 
		{
			users.forEach(user => 
			{
				this.addUser(user, false);
			}
			);
			const players_count = document.getElementsByClassName("player").length;
			this.player_counter.innerText = players_count + "/8";
		}
		);
		ipcRenderer.on("revealStartGame", (event) => 
		{
			this.startgame_button.style = "visibility: visible";
		}
		);

		this.save_button.addEventListener("mousedown", () => 
		{
			this.checkmark.style.visibility = "hidden";
			if ( (this.password_checkbox.checked && this.password_field.value == "")  || this.lobbyname_field.value == "") 
			{
				ipcRenderer.send("openErrorMessage", "Fields can't be empty");
			}
			else
			{
				ipcRenderer.send("updateLobbyData", [this.lobbyname_field.value, this.password_checkbox.checked, this.password_field.value]);
				this.checkmark.style.visibility = "visible";
			}
		}
		);
		this.back_button.addEventListener("mousedown", () => 
		{
			ipcRenderer.send("backPressedLobby");
		}
		);
		this.startgame_button.addEventListener("mousedown", () => 
		{
			ipcRenderer.send("startGameOwner");
		}
		);
	}
	addUser(username, isOwner)
	{
		/**
        * Adds a user to the player list.
        
        @param {String} username The username of the player that would be added.
        @param {Boolean} isOwner Is the user the owner of the lobby or is he a regular player.
        */
		var div = document.createElement("div");
		div.className = "player";
		var img = document.createElement("img");
		img.className = "playerimage";
		img.src = "img/default-user-pic.png";
		img.style.height = "50px";
		img.style.width = "50px";
		div.appendChild(img);
		var img = document.createElement("img");
		img.className = "owner";
		img.src = "img/owner.png";
		if (!isOwner)
			img.style = "visibility: hidden";
		div.appendChild(img);
		var h3 = document.createElement("h3");
		h3.className = "playername";
		h3.innerText = username;
		div.appendChild(h3);
		var img = document.createElement("img");
		img.addEventListener("mousedown", (event) => 
		{
			ipcRenderer.send("kickPlayer",  username);
		}
		);
		img.className = "playerkickimage";
		img.src = "img/kick_user.png";
		if (!this.lobbyOwner || this.ownUsername == username)
			img.style = "visibility: hidden";
		div.appendChild(img);
		this.player_list.appendChild(div);
	}
	removeUser(username) 
	{
		/**
        * Removes a user from the player list.
        
        @param {String} username The username of the player that would be removed.
        */
		let players = document.getElementsByClassName("player");
		Array.from(players).forEach((element) => 
		{
			if(element.getElementsByClassName("playername")[0].innerText == username) 
			{
				element.remove();
			}
		}
		);
       
	}
}
module.exports = lobbyWindow;