const electron = require('electron');
const {ipcRenderer, remote} = electron;

class Canvas
{
    constructor() 
    {
        this.canvas = document.getElementById('drawingCanvas'); // HTML5 canvas element.
        this.context = this.canvas.getContext("2d"); // 2D rendering context, used for drawing.
        this.drawing = false;
        this.pixels; // Canvas's pixel information array.
        this.strokeSize = 16;
        this.color = "rgba(0,0,0)";
        this.canvasMousePos = {x: 0, y: 0};
        this.strokeButtonPressed = false;
        this.paintBucketPressed = false;
        this.username = "";
        this.timerStartEvent = new Event('timerStart');
        this.timeEnded = false;
        this.isDrawer = false;
        this.addListeners();
        this.clearCanvas();
        this.loadPixels();
    }
    addListeners()
    {

        /**
         * Hooks listeners to the canvas's objects. 
         */
        ipcRenderer.on("setUsername", (event, name) => 
        {
            this.username = name;
        }
        );
        ipcRenderer.on("addUsers", (event, users) => 
        {
            let playerlist = document.getElementById("playerList");
            users.forEach((user, index) => 
            {
                let playerdiv = document.createElement("div");
                playerdiv.setAttribute("id", "player");
                let playertext = document.createElement("h3");
                playertext.setAttribute("id", "playername");
                playertext.innerText = user;
                let img = document.createElement("img");
                img.setAttribute("id", "pencil");
                img.setAttribute("src", "img/pencil.gif");
                if (index == 0) 
                {
                    img.style.visibility = "visible";
                    document.getElementById("word").innerText = user + " is choosing a word...";
                }
                let score = document.createElement("h3");
                score.setAttribute("class", "score");
                score.innerText = "0";
                if (user == this.username)
                    playerdiv.style.backgroundColor = "rgb(240, 196, 0)"
                playerdiv.appendChild(img);
                playerdiv.appendChild(playertext);
                playerdiv.appendChild(score);
                playerlist.appendChild(playerdiv);
                
            }
            );
            
        }
        ); 
        ipcRenderer.on("addUsersOwner", (event, username, users, words) => 
        {
            this.username = username;
            let playerlist = document.getElementById("playerList");
            users.forEach((user, index) => 
            {
                let playerdiv = document.createElement("div");
                playerdiv.setAttribute("id", "player");
                let playertext = document.createElement("h3");
                playertext.setAttribute("id", "playername");
                playertext.innerText = user;
                let img = document.createElement("img");
                img.setAttribute("id", "pencil");
                img.setAttribute("src", "img/pencil.gif");
                if (index == 0) 
                {
                    img.style.visibility = "visible";
                    document.getElementById("word").innerText = user + " is choosing a word...";
                }
                let score = document.createElement("h3");
                score.setAttribute("class", "score");
                score.innerText = "0";
                if (user == this.username)
                    playerdiv.style.backgroundColor = "rgb(240, 196, 0)"
                playerdiv.appendChild(img);
                playerdiv.appendChild(playertext);
                playerdiv.appendChild(score)
                playerlist.appendChild(playerdiv);
            }
            );
            this.isDrawer = true;
            document.getElementById("toolBox").style.visibility = "visible";
            document.getElementById("overlay").style.visibility = "visible";
            document.getElementById("wordbuttons").style.visibility = "visible";
            document.getElementById("wordlabel").style.visibility = "visible";
            document.querySelectorAll(".wordbuttons").forEach((button, index) => 
            {
                button.innerText = words[index];
                button.style.visibility = "visible";
            }
            );
            
        }
        );
        let timerLabel = document.getElementById("timer");
        document.querySelectorAll(".wordbuttons").forEach((button) => 
        {
            button.addEventListener("mousedown", (event) => 
            {
                document.getElementById("overlay").style.visibility = "hidden";
                document.getElementById("wordbuttons").style.visibility = "hidden";
                document.getElementById("wordlabel").style.visibility = "hidden";
                document.querySelectorAll(".wordbuttons").forEach((button1) => 
                {
                    button1.style.visibility = "hidden";
                }
                );
                var wordDisplay = document.getElementById("word");
                let undercases = "";
                for (var i = 0; i < button.textContent.length; i++) 
                {
                    undercases += "_ "
                }
                  wordDisplay.innerText = button.textContent;
                  document.querySelectorAll("#player").forEach((player) => 
                  {
                      if (player.querySelector("#playername").textContent != this.username)
                          player.style.backgroundColor = "#4169e1"
                  }
                  );
                  ipcRenderer.send("sendData", "choseWord&" + undercases + "&" + button.textContent);
                  timerLabel.dispatchEvent(this.timerStartEvent);

            }
            );
        }
        );
        timerLabel.addEventListener("timerStart", () => 
        {
            const self = this;
            var timer = 90;
            this.timerfunction = setInterval(function () {
                let minutes = parseInt(timer / 60, 10)
                let seconds = parseInt(timer % 60, 10);
        
                minutes = minutes < 10 ? "0" + minutes : minutes;
                seconds = seconds < 10 ? "0" + seconds : seconds;
        
                timerLabel.textContent = minutes + ":" + seconds;
        
                if (--timer < 0) {
                    self.timeEnded = true;
                    self.isDrawer = false;
                    document.getElementById("toolBox").style.visibility = "hidden";
                    document.getElementById("timer").innerText = "Waiting..."
                    clearInterval(this.timerfunction);
                }
            }, 1000);
        }
        );
        let colorButtons = document.querySelectorAll('.colors');
        colorButtons.forEach((colorButton) => 
        {
            colorButton.addEventListener("mousedown", () => 
            {
                this.handleColorClick(colorButtons, colorButton);
            }
            );
        }
        );

        this.canvas.addEventListener("mousedown", (event) =>
        {
            if (this.isDrawer) 
            {
                if (this.paintBucketPressed) 
                {
                    this.loadPixels();
                    const {mouseX, mouseY} = this.getMouseCoordinates(event);
                    const data = {
                        x: mouseX,
                        y: mouseY,
                        color: this.color
                    };
                    ipcRenderer.send('sendData', 'fill&' + JSON.stringify(data));
                    this.fill(mouseX, mouseY, this.color, this.getPixelColor(mouseX, mouseY));
                }
                else 
                {
                    if (event.which == 1) 
                    {
                        this.drawing = true;
                        const {mouseX, mouseY} = this.getMouseCoordinates(event);
                        this.setPosition(mouseX, mouseY);
                        this.draw(mouseX, mouseY, this.color);
                        const data = {
                            x: mouseX,
                            y: mouseY,
                            color: this.color,
                            stroke: this.strokeSize
                        };
                        ipcRenderer.send('sendData', "new&" + JSON.stringify(data));
                    }
                }
            }


        }
        );

        window.previousPos = 0;
        addEventListener("mousemove", (event) =>
        {
            if (this.isDrawer) 
            {
                if (this.strokeButtonPressed) 
                {
                    this.handleStrokeButton(event, outerCircle, innerCircle);
                }
                else if (this.drawing) 
                {
                    if (event.which == 1) 
                    {
                        const {mouseX, mouseY} = this.getMouseCoordinates(event);
                        this.draw(mouseX, mouseY, this.color);
                        const data = {
                            x: mouseX,
                            y: mouseY,
                            color: this.color,
                            stroke: this.strokeSize
                        };
                        ipcRenderer.send('sendData', "move&" + JSON.stringify(data));
                    }
                }
            }
        }
        );

        addEventListener("mouseup", () => 
        {
            if (this.isDrawer) 
            {
                if(this.drawing) this.drawing = false;

                if (this.strokeButtonPressed) this.strokeButtonPressed = false;
                
            }
        }
        );

        let emptyButton = document.getElementById('trashcan');
        emptyButton.addEventListener("mousedown", () =>
        {
            this.clearCanvas();
            ipcRenderer.send('sendData', 'clearCanvas');
        }
        );

        let innerCircle = document.getElementById('innercircle');
        let outerCircle = document.getElementById('outercircle');
        innerCircle.addEventListener("mousedown", () => 
        {
            this.strokeButtonPressed = true;
        }
        );

        outerCircle.addEventListener("mousedown", () =>
        {
            this.strokeButtonPressed = true;
        }
        );

        let paintBucket = document.getElementById('paintbucket');
        paintBucket.addEventListener("mousedown", () => 
        {
            if(!this.paintBucketPressed) 
            {            
                paintBucket.style.border = "3px solid white";
                this.canvas.style.cursor = `url('img/paintbucketicon.png'), crosshair`;
                this.paintBucketPressed = true;
            }
            else {
                paintBucket.style.border = "3px solid transparent";
                this.canvas.style.cursor = `url('img/cursor.png'), crosshair`;
                this.paintBucketPressed = false;
            }

        }
        );

        const a = new jscolor(document.getElementById("edit"))
        document.getElementById('edit').style.backgroundColor = "#b83ef1"
        a.onFineChange = () => 
        {
            document.getElementById('custom_color').style.backgroundColor = a.toHEXString()
            this.color = a.toRGBString()
            if (a.toRGBString() == "rgb(255,255,255)") 
                document.getElementById('custom_color').style.borderColor = "black";
            else 
                document.getElementById('custom_color').style.borderColor = "white";
            
        }
        let chatbox = document.getElementById("actualchat")
        let inputbox = document.getElementById("inputBox")
        inputbox.addEventListener("keyup", (event) => 
        {
            if (event.key == "Enter") 
            {
                if (inputbox.value != "" && !this.timeEnded && !this.isDrawer) 
                {
                    ipcRenderer.send("sendData", "chatmessage&" + this.username + "&" + inputbox.value)
                    inputbox.value = "";
                    chatbox.scrollTop = chatbox.scrollHeight - chatbox.clientHeight;
                }
            }
        }
        );
        inputbox.addEventListener("keypress", (event) => 
        {
            if (!event.ctrlKey) 
            {
                if ("&".includes(event.key))
                {
                    event.preventDefault();
                }
            }

        }
        );
        inputbox.addEventListener("paste", (event) => 
        {
            let data = event.clipboardData.getData('text/plain')
            data = data.split('');
            for (let i=0; i<data.length; i++) 
            {
                if ("&".includes(data[i]))
                {
                    event.preventDefault();
                    break;
                }
            }

        }
        );


        ipcRenderer.on('newMouseCoordinates', (event, data) => 
        {
            data = JSON.parse(data);
            this.strokeSize = data.stroke;
            this.setPosition(data.x, data.y);
            this.draw(data.x, data.y, data.color);
        }
        );
        ipcRenderer.on('moveMouseCoordinates', (event, data) => 
        {
            data = JSON.parse(data);
            this.strokeSize = data.stroke;
            this.draw(data.x, data.y, data.color);
        }
        );
        ipcRenderer.on('fill', (event, data) => 
        {
            data = JSON.parse(data);
            this.loadPixels();
            this.fill(data.x, data.y, data.color, this.getPixelColor(data.x, data.y));
        }
        );
        ipcRenderer.on('send_canvas', (event) => 
        {
            ipcRenderer.send('sendData', 'canvas&' + this.canvas.toDataURL());
        }
        );
        ipcRenderer.send("readytoget")
        ipcRenderer.on('canvas', (event) => 
        {
            let data = remote.getGlobal('myObject');
            var img = new Image();
            img.src = data;
            img.onload = () => {
                this.context.drawImage(img, 0, 0);
              };       
        }
        );
        ipcRenderer.on('clearCanvas', () => 
        {
            this.clearCanvas();
        }
        );
        ipcRenderer.on("chatmessage", (event, message) => 
        {
            let a = document.createElement("h3");
            a.setAttribute("id", "chattext");
            a.innerText = message;
            chatbox.appendChild(a);
        }
        );
        ipcRenderer.on("youDraw", (event, drawerScore, words) => 
        {
            clearInterval(this.timerfunction);
            this.handleColorClick(colorButtons, colorButtons.item(1));
            this.strokeSize = 16;
            var innerCircle = document.getElementById("innercircle")
            innerCircle.style.height = 16;
            innerCircle.style.width = 16;
            innerCircle.style.top = 770;
            innerCircle.style.left = 1116;
            this.color = "rgba(0,0,0)";
            this.canvasMousePos = {x: 0, y: 0};
            this.strokeButtonPressed = false;
            this.paintBucketPressed = false;
            this.drawing = false;
            this.isDrawer = true;
            document.getElementById("toolBox").style.visibility = "visible";
            document.getElementById("overlay").style.visibility = "visible";
            document.getElementById("wordbuttons").style.visibility = "visible";
            document.getElementById("wordlabel").style.visibility = "visible";
            document.querySelectorAll(".wordbuttons").forEach((button, index) => 
            {
                button.innerText = words[index];
                button.style.visibility = "visible";
            }
            );
            document.querySelectorAll("#player").forEach((player) => 
            {
                if (player.querySelector("#pencil").style.visibility == "visible") 
                {
                    let currentScore = parseInt(player.querySelector(".score").textContent)
                    player.querySelector(".score").innerText = currentScore + parseInt(drawerScore);
                }
                if (player.querySelector("#playername").textContent != this.username)
                    player.querySelector("#pencil").style.visibility = "hidden";
                else player.querySelector("#pencil").style.visibility = "visible";
            }
            );
            document.getElementById("word").innerText = this.username + " is choosing a word...";
            this.clearCanvas();
            
        }
        );
        ipcRenderer.on("chosenWord", (event, word) =>
        {
            var wordDisplay = document.getElementById("word");
            wordDisplay.innerText = word;
            this.timeEnded = false;
            timerLabel.dispatchEvent(this.timerStartEvent)
            document.querySelectorAll("#player").forEach((player) => 
            {
                if (player.querySelector("#playername").textContent != this.username)
                    player.style.backgroundColor = "#4169e1"
            }
            );
        }
        );
        ipcRenderer.on("newRound", (event, round) =>
        {
            document.getElementById("rounds").textContent = "Round " + round + "/3";
        }
        );
        ipcRenderer.on("newDrawer", (event, drawerScore ,drawerUsername, word) =>
        {
            let a = document.createElement("h3");
            a.setAttribute("id", "chattext");
            a.style.color = "#00bd1f";
            a.innerText = "The word was: '" + word + "'";
            chatbox.appendChild(a);
            this.isDrawer = false;
            document.getElementById("toolBox").style.visibility = "hidden";
            clearInterval(this.timerfunction);
            this.handleColorClick(colorButtons, colorButtons.item(1));
            this.strokeSize = 16;
            var innerCircle = document.getElementById("innercircle")
            innerCircle.style.height = 16;
            innerCircle.style.width = 16;
            innerCircle.style.top = 770;
            innerCircle.style.left = 1116;
            this.color = "rgba(0,0,0)";
            this.canvasMousePos = {x: 0, y: 0};
            this.strokeButtonPressed = false;
            this.paintBucketPressed = false;
            this.drawing = false;
            document.querySelectorAll("#player").forEach((player) => 
            {
                if (player.querySelector("#pencil").style.visibility == "visible") 
                {
                    let currentScore = parseInt(player.querySelector(".score").textContent)
                    player.querySelector(".score").innerText = currentScore + parseInt(drawerScore);
                }
                if (player.querySelector("#playername").textContent != drawerUsername)
                    player.querySelector("#pencil").style.visibility = "hidden";
                else player.querySelector("#pencil").style.visibility = "visible";
            }
            );
            document.getElementById('word').innerText = drawerUsername + " is choosing a word...";
            this.clearCanvas();
        }
        );
        ipcRenderer.on("playerGuessedWord", (event, player, score, word) => 
        {
            let a = document.createElement("h3");
            a.setAttribute("id", "chattext");
            a.style.color = "#00bd1f";
            if (player == this.username)
            {
                a.innerText = "You have guessed the word!";
                document.getElementById("word").innerText = word;
                this.timeEnded = true;
                document.querySelectorAll("#player").forEach((user) => 
                {
                    if (user.querySelector("#playername").textContent == player) 
                    {
                        let currentScore = parseInt(user.querySelector(".score").textContent)
                        user.querySelector(".score").innerText = currentScore + parseInt(score);

                    }
                }
                );
            }
            else 
            {
                a.innerText = player + " has guessed the word!";
                document.querySelectorAll("#player").forEach((user) => 
                {
                    if (user.querySelector("#playername").textContent == player)
                    {
                        user.style.backgroundColor = "#00f829";
                        let currentScore = parseInt(user.querySelector(".score").textContent)
                        user.querySelector(".score").innerText = currentScore + parseInt(score);
                    }
                }
                );
            }
            chatbox.appendChild(a);
        }
        );
        ipcRenderer.on("sendWinner", (event) => 
        {
            let highestScore = ["username", 0];
            document.querySelectorAll("#player").forEach((player) => 
            {
                if ((parseInt(player.querySelector(".score").textContent) > highestScore[1])) 
                {
                    highestScore[0] = player.querySelector("#playername").textContent;
                    highestScore[1] = parseInt(player.querySelector(".score").textContent);
                }
            }
            );
            let hasHighScore = 0;
            document.querySelectorAll("#player").forEach((player) => 
            {

                if (parseInt(player.querySelector(".score").textContent) == highestScore[1])
                {
                    hasHighScore++;
                }
            }
            );
            if (hasHighScore > 1) ipcRenderer.send("sendData", "tie");
            else ipcRenderer.send("sendData", "winner&" + highestScore[0] + "&" + highestScore[1].toString());
        }
        );
        ipcRenderer.on("tie", (event) => 
        {
            clearInterval(this.timerfunction);
            this.isDrawer = false;
            document.getElementById("toolBox").style.visibility = "hidden";
            vex.dialog.alert('The game has ended in a draw.');
        }
        );
        ipcRenderer.on("win", (event, winner, score) => 
        {
            clearInterval(this.timerfunction);
            this.isDrawer = false;
            document.getElementById("toolBox").style.visibility = "hidden";
            vex.dialog.alert('The game has ended. ' + winner + ' has won with a score of: ' + score);
        }
        );

    }

    clearCanvas() 
    {
        /**
         * Clears the canvas.
        */

        this.context.fillStyle = "rgb(255,255,255)";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.fillStyle = this.color;
    }


    getMouseCoordinates(event) 
    {
        /**
         * Gets the mouse coordinates of the app and calculates them in relation to the canvas.
            * @param {MouseEvent} event Holds the mouse coordinates.
            * 
            * @returns {Object} containing the new mouseX and mouseY.
        */

        const mouseX = event.pageX - this.canvas.offsetLeft;
        const mouseY = event.pageY - this.canvas.offsetTop;
        return {mouseX, mouseY};
    }


    loadPixels() 
    {
        /**
         * Updates the pixel data array.
        */

        this.pixels = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }


    getPixelColor(x, y) 
    {
        /**
         * Gets the RGBA color value of a given pixel (x,y) from the one dimensional pixel array.
            * @param {number} x X coordinate of the pixel.
            * @param {number} y y coordinate of the pixel.
            * 
            * @returns {Array} containing the RGBA values.
            * or
            * @returns {undefined} if the pixel is outside of the canvas's borders.
        */

        if (x >= 0 && x <= 600 && y >= 0 && y <= 600) 
        {
            var index = (x + y * this.canvas.width) * 4;
            return [this.pixels.data[index+0], this.pixels.data[index+1], this.pixels.data[index+2], this.pixels.data[index+3]];
        }
    }


    setPixelColor(x, y, color) 
    {
        /**
         * Sets the RGBA color value of a given pixel (x,y) in the one dimensional pixel array.
            * @param {number} x X coordinate of the pixel.
            * @param {number} y y coordinate of the pixel.
            * @param {Array} color containing the RGBA values.
        */

        var index = (x + y * this.canvas.width) * 4;
        this.pixels.data[index] = color[0];
        this.pixels.data[index+1] = color[1];
        this.pixels.data[index+2] = color[2];
        this.pixels.data[index+3] = color[3];
    }


    fill(mouseX, mouseY, selectedColor, startColor) 
    {
        /**
         * Fills the canvas within the bounds of strokes. uses flood-fill recursive algorithm.
            * @param {number} mouseX X coordinate of the location of the mouse press.
            * @param {number} mouseY Y coordinate of the location of the mouse press.
            * @param {Array} selectedColor User chosen color to fill with, containing the RGBA values.
            * @param {Array} startColor The color of the pixel on mouse press coords.
        */
        this.loadPixels();
        let pixelsToCheck = [[mouseX, mouseY]];
        let x;
        let y;
        let a;
        let currentColor = this.getPixelColor(mouseX, mouseY);
        let color = stringRGBtoArray(selectedColor);
        if(!equalColors(color, currentColor))
        {
            while (pixelsToCheck.length > 0)
            {
                a = pixelsToCheck.pop();
                x = a[0];
                y = a[1];
                currentColor = this.getPixelColor(x, y);
                if (currentColor != undefined) 
                {
                    if (equalColors(currentColor, startColor))
                    {
                        this.setPixelColor(x, y, color);
                        pixelsToCheck.push([x-1,y]);
                        pixelsToCheck.push([x+1,y]);
                        pixelsToCheck.push([x,y+1]);
                        pixelsToCheck.push([x,y-1]);
                    }
                }
    
            }
            this.context.putImageData(this.pixels, 0, 0);
        }


    }


    draw(mouseX, mouseY, color) 
    {
        /**
         * Draws a line on the canvas on mouse press and hold.
            * @param {number} mouseX Holds the X mouse coordinates.
            * @param {number} mouseY Holds the Y mouse coordinates.
        */
        this.canvas.style.cursor = `url('img/cursor.png'), crosshair`;
        this.context.strokeStyle = color; // color of stroke
        
        this.context.beginPath();
        this.context.lineWidth = this.strokeSize; // width of stroke
        this.context.lineCap = "round"; // rounded end cap
        this.context.moveTo(this.canvasMousePos.x, this.canvasMousePos.y);
        this.setPosition(mouseX, mouseY);
        this.context.lineTo(this.canvasMousePos.x, this.canvasMousePos.y);
        this.context.stroke();                
    }


    setPosition(mouseX, mouseY) 
    {
        /**
         * Updates the canvas mouse position property.
            * @param {number} mouseX Holds the X mouse coordinates.
            * @param {number} mouseY Holds the Y mouse coordinates.
        */
       
        this.canvasMousePos.x = mouseX;
        this.canvasMousePos.y = mouseY;
    }


    handleColorClick(colorButtons, colorButton) 
    {
        /**
         * Updates the color and the HTML elements if one of the color buttons is pressed.
            * @param {NodeList} colorButtons Contains the HTML elements of the color buttons.
            * @param {HTMLElement} colorButton The color button that was clicked on.
        */

        colorButtons.forEach((color) => 
        {
             color.style.border = `3px solid ${getStyle(color, "background-color")}`;
             color.style.cursor = "pointer";
        }
        );

        if (getStyle(colorButton, 'background-color') === "rgb(255, 255, 255)") 
        {
            colorButton.style.border = `3px solid black`;
        }
        
        else 
        {
            colorButton.style.border = `3px solid #FFFF`;
        }
        colorButton.style.cursor = "default";
        this.color = getStyle(colorButton, "background-color");
    }


    handleStrokeButton(event, outerCircle, innerCircle) 
    {
        /**
         * Changes the stroke size based on the size of the circle element.
            * @param {MouseEvent} event Holds the mouse coordinates.
            * @param {HTMLElement} outerCircle The outer circle of the stroke button.
            * @param {HTMLElement} innerCircle The inner circle of the stroke button.
        */

        const currentPos = event.pageX;
        if(currentPos > previousPos) 
        {
            if(this.strokeSize < 60)
            {
                this.strokeSize += 4;
                innerCircle.style.height = `${innerCircle.clientHeight + 4}px`;
                innerCircle.style.width = `${innerCircle.clientWidth + 4}px`;
                innerCircle.style.top = `${outerCircle.clientHeight/2 - this.strokeSize/2}px`;
                innerCircle.style.left = `${outerCircle.clientHeight/2 - this.strokeSize/2}px`;
            }
            previousPos = currentPos;
        }
        else if(currentPos < previousPos)
        {
            if(this.strokeSize > 4) 
            {
                this.strokeSize -= 4;
                innerCircle.style.height = `${innerCircle.clientHeight - 4}px`;
                innerCircle.style.width = `${innerCircle.clientWidth - 4}px`;
                innerCircle.style.top = `${outerCircle.clientHeight/2 - this.strokeSize/2}px`;
                innerCircle.style.left = `${outerCircle.clientHeight/2 - this.strokeSize/2}px`;
            }
            previousPos = currentPos;
        }
    }


}


function getStyle(element, styleProp)
{
    /**
     * Returns the style of an element from CSS.
        * @param {HTMLElement} element HTML Element.
        * @param {styleProp} styleProp The CSS property.
        * 
        * @returns {string} style.
    */

    if (window.getComputedStyle)
    {
        return document.defaultView.getComputedStyle(element).getPropertyValue(styleProp);;
    }

}

function stringRGBtoArray(rgb) 
{
    /**
     * Converts an rgb string to a rgba array.
        * @param {String} rgb string of rgb, i.e. 'rgb(210, 142, 53)'.
        * 
        * @returns {Array} containing the RGBA values.
    */
    if (rgb instanceof Array) return rgb
    else if (rgb == "white")
    {
        return [255, 255, 255, 255]
    }
    else if (rgb == "black") 
    {
        return [0, 0, 0, 255]
    }
    else
    {
        rgb = rgb.substring(rgb.indexOf("(") + 1, rgb.indexOf(")")).split(',');
        rgb[0] = parseInt(rgb[0]);
        rgb[1] = parseInt(rgb[1]);
        rgb[2] = parseInt(rgb[2]);
        rgb[3] = 255;
        return rgb;
    }

}

function equalColors(color1, color2)
{
    /**
     * Checks if two colors are equal to each other.
        * @param {Array} color1 First color. RGBA values.
        * @param {Array} color2 Second color. RGBA values.
        * 
        * @returns {Boolean} True if they are equal, otherwise, false.
    */

    return (
    parseInt(color1[0] ) == parseInt(color2[0]) &&
    parseInt(color1[1] ) == parseInt(color2[1]) &&
    parseInt(color1[2]) == parseInt(color2[2]) &&
    parseInt(color1[3]) == parseInt(color2[3])
    );
}

function main() 
{
    new Canvas();

}
main();