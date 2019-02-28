const electron = require('electron');
const {ipcRenderer, remote} = electron;

class signupWindow
{
    constructor() 
    {
        this.usernameField = document.getElementById("usernameinput");
        this.emailField = document.getElementById("emailinput") 
        this.passwordField = document.getElementById("passwordinput") 
        this.confirmPasswordField = document.getElementById("confirmpasswordinput")
        this.addListeners();
    }
    addListeners() 
    {
        /**
            * Hooks listeners to the window's elements and IPC communication. 
        */
        let invalid_characters = "'%\\_/";
        invalid_characters +='"';
        let fields = [this.usernameField, this.emailField, this.passwordField]
        fields.forEach(field => 
        {
            field.addEventListener("keypress", (event) => 
            {
                if (!event.ctrlKey) 
                {
                    if (invalid_characters.includes(event.key)) 
                    {
                        event.preventDefault();
                        ipcRenderer.send("openErrorMessage", "Invalid characters, you can't use % ' \\ _ / " + '"');
                    }
                }

            }
            );
            field.addEventListener("paste", (event) => 
            {
                let data = event.clipboardData.getData('text/plain')
                data = data.split('');
                for (let i=0; i<data.length; i++) 
                {
                    if (invalid_characters.includes(data[i]))
                    {
                        event.preventDefault();
                        ipcRenderer.send("openErrorMessage", "Invalid characters, you can't use % ' \\ _ / " + '"');
                        break;
                    }
                }
    
            }
            );
        });

        ipcRenderer.on('clearFields', () => 
        {
            this.cleanUp(true);
        }
        );
        ipcRenderer.on("invalidFields", (event, data) => 
        {
            console.log(data)
            if (data.includes("invalid_email")) 
            {
                const errortext = document.getElementById("2");
                errortext.style.visibility = "visible";
                errortext.innerText = "Invalid email.";
                document.getElementById("img2").style.visibility = "visible";
            }
            if (data.includes("used_username")) 
            {
                const errortext = document.getElementById("1");
                errortext.style.visibility = "visible";
                errortext.innerText = "Username in use.";
                document.getElementById("img1").style.visibility = "visible";
            }
            if (data.includes("used_email")) 
            {
                const errortext = document.getElementById("2");
                errortext.style.visibility = "visible";
                errortext.innerText = "Email in use.";
                document.getElementById("img2").style.visibility = "visible";
            }
        }
        );
        const signupButton = document.getElementById("sign-up");
        console.log(signupButton)
        signupButton.addEventListener("mousedown", () => 
        {
            let valid = true;
            this.cleanUp(false);
            if (this.usernameField.value == "") 
            {
                const errortext = document.getElementById("1");
                errortext.style.visibility = "visible";
                errortext.innerText = "Username empty.";
                document.getElementById("img1").style.visibility = "visible";
                valid = false;
            }
            if (this.emailField.value == "") 
            {
                const errortext = document.getElementById("2");
                errortext.style.visibility = "visible";
                errortext.innerText = "Email empty.";
                document.getElementById("img2").style.visibility = "visible";
                valid = false;
            }
            if (this.passwordField.value == "") 
            {
                const errortext = document.getElementById("3");
                errortext.style.visibility = "visible";
                errortext.innerText = "Password empty.";
                document.getElementById("img3").style.visibility = "visible";
                valid = false;
            }
            if (this.passwordField.value == "") 
            {
                const errortext = document.getElementById("3");
                errortext.style.visibility = "visible";
                errortext.innerText = "Password empty.";
                document.getElementById("img3").style.visibility = "visible";
                valid = false;
            }
            if (this.confirmPasswordField.value == "") 
            {
                const errortext = document.getElementById("4");
                errortext.style.visibility = "visible";
                errortext.innerText = "Password empty.";
                document.getElementById("img4").style.visibility = "visible";
                valid = false;
            }
            else if (this.confirmPasswordField.value != this.passwordField.value) 
            {
                let errortext = document.getElementById("3");
                errortext.style.visibility = "visible";
                errortext.innerText = "Passwords do not match.";
                document.getElementById("img3").style.visibility = "visible";
                errortext = document.getElementById("4");
                errortext.style.visibility = "visible";
                errortext.innerText = "Passwords do not match.";
                document.getElementById("img4").style.visibility = "visible";
                valid = false;
            }
            
            if (valid)
            {
                ipcRenderer.send("sendData","signup&" + this.usernameField.value + "&" + this.emailField.value + "&" + this.passwordField.value)
            }

        });
        const backButton = document.getElementById("backb");
        backButton.addEventListener("mousedown", () => 
        {
            ipcRenderer.send('backPressed');
        }
        );
    }
    cleanUp (clearFields) 
    {
        /**
         * Hides error messages and clears input fields if first parameter is true.
         * 
         * @param {Boolean} clearFields If true then clear the input fields
        */
        if (clearFields) 
        {
            document.querySelectorAll('input')
            .forEach((field) => 
            {
                field.value = "";
            }
            );
        }
        document.querySelectorAll('.errors')
        .forEach((field) => 
        {
            field.style.visibility = "hidden";
            field.innerText = "PLACEHOLDER TEXT";
        }
        );
        document.querySelectorAll('.images')
        .forEach((field) => 
        {
            field.style.visibility = "hidden";
        }
        );
    }
}
module.exports = signupWindow;