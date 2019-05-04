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