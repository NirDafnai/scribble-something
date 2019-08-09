const electron = require('electron');
const {ipcRenderer, remote} = electron;

class loginWindow 
{
    constructor() 
    {
        this.usernameField = document.getElementById("usernameinput");
        this.passwordField = document.getElementById("passwordinput"); 
        this.login_button = document.getElementById("login");
        this.signup_button = document.getElementById("sign-up");
        this.addListeners();
    }
    addListeners() 
    {
        /**
            * Hooks listeners to the window's elements and IPC communication. 
        */
        let invalid_characters = "'%\\_/&";
        invalid_characters +='"';
        let fields = [this.usernameField, this.passwordField]
        fields.forEach(field => 
            {
                field.addEventListener("keypress", (event) => 
                {
                    if (!event.ctrlKey) 
                    {
                        if (invalid_characters.includes(event.key)) 
                        {
                            event.preventDefault();
                            ipcRenderer.send("openErrorMessage", "Invalid characters, you can't use % ' \\ _ / & " + '"');
                        }
                    }
    
                }
                );
                field.addEventListener("paste", (event) => 
                {
                    let data = event.clipboardData.getData('text/plain')
                    data = data.split('');
                    for (let i = 0; i < data.length; i++) 
                    {
                        if (invalid_characters.includes(data[i]))
                        {
                            event.preventDefault();
                            ipcRenderer.send("openErrorMessage", "Invalid characters, you can't use % ' \\ _ / & " + '"');
                            break;
                        }
                    }
        
                }
                );
            });
        ipcRenderer.on('clearFields', () => {
            document.querySelectorAll('input')
            .forEach((field) => 
            {
                field.value = "";
            }
            );
        }
		);
		ipcRenderer.on('serverOffline', () => 
		{
			let status = document.getElementById("status")
			status.innerText = "Offline";
			status.style.color = "red";
			document.getElementById("statusImage").setAttribute("src", "img/loginWindow/offline.png")
		}
		);
		ipcRenderer.on('serverOnline', () => 
		{
			console.log("hi")
			let status = document.getElementById("status")
			status.innerText = "Online";
			status.style.color = "green";
			document.getElementById("statusImage").setAttribute("src", "img/loginWindow/online.png")
		}
		);
        this.login_button.addEventListener("mousedown", () => 
        {
            this.sendLoginInfo();
        }
        );
        this.signup_button.addEventListener("mousedown", () => 
        {
            ipcRenderer.send('openSignup');
        }
		);
		document.getElementById("changeServer").addEventListener("mousedown", () => 
		{
			let status = document.getElementById("status")
			if (status.innerText == "Offline") 
			{
				ipcRenderer.send("changeServer");
			}
			else 
			{
				ipcRenderer.send("openErrorMessage", "You are already connected to a server.");
			}
		}
		);
		document.getElementById("retryServer").addEventListener("mousedown", () => 
		{
			let status = document.getElementById("status")
			if (status.innerText == "Offline") 
			{
				status.innerText = "Retrying...";
				ipcRenderer.send("retryServer");
			}
			else 
			{
				ipcRenderer.send("openErrorMessage", "You are already connected to a server.");
			}

		}
		);
		document.getElementById("forgot-password").addEventListener("mousedown", () => 
		{
			let status = document.getElementById("status")
			if (status.innerText == "Online") 
			{
				ipcRenderer.send("forgotPassword");
			}
			else 
			{
				ipcRenderer.send("openErrorMessage", "You must be connected to a server.");
			}
		}
		);
        addEventListener("keypress", (event) => 
        {
            if(event.key == "Enter") 
            {
                this.sendLoginInfo();
            }
        }
        )
    }
    sendLoginInfo() 
    {
        /**
            * Sends login info to renderer. 
        */
       if (this.usernameField.value == "" && this.passwordField.value == "") 
       {
           ipcRenderer.send("openErrorMessage", "Username and password fields are empty.")
       }
       else if (this.usernameField.value == "") 
       {
           ipcRenderer.send("openErrorMessage", "Username field is empty.")
       }
       else if (this.passwordField.value == "") 
       {
           ipcRenderer.send("openErrorMessage", "Password field is empty.")
       }
       else
       {
           ipcRenderer.send("sendData", "login&" + this.usernameField.value + "&" + this.passwordField.value)
       }
    }
}
module.exports = loginWindow;