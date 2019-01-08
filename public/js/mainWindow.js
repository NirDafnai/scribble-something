const electron = require('electron');
const {ipcRenderer} = electron;
class Canvas 
{
    constructor() 
    {
        this.canvas = document.getElementById('drawingCanvas');
        this.context = this.canvas.getContext("2d");
        this.drawing = false;
        this.strokeSize = 16;
        this.color = "black"
        this.userPos = {x: 0, y: 0};
        this.innerCircle = document.getElementById('innercircle');
        this.outerCircle = document.getElementById('outercircle');
        this.emptyButton = document.getElementById('trashcan');
        this.colorButtons = document.querySelectorAll('.colors')
        this.paintBucket = document.getElementById('paintbucket')
        this.strokeButtonPressed = false;
        this.rightClickPressed = false;
        this.paintBucketPressed = false;
        this.addListeners();
    }
    addListeners() 
    {
        const self = this;
        this.colorButtons.forEach(function(colorButton) {
            colorButton.addEventListener("mousedown", function(event) {
                self.handleColorClick(event, self, this)
            })
        })
        this.canvas.addEventListener("mousedown", function(event) {
            if (self.paintBucketPressed) {
                const {mouseX, mouseY} = self.getMouseCoordinates(event, self.canvas);
                self.fill(mouseX, mouseY, self.getPixelColor(mouseX, mouseY));
            }
            else {
                self.drawing = true;
                self.setPosition(event);
                self.draw(event);
            }

        });
        addEventListener("mousemove", function(event) {
            self.draw(event);
        });
        addEventListener("mouseup", function(event) {
            self.drawing = false;
            self.strokeButtonPressed = false;
            if (self.rightClickPressed) {
                self.canvas.style.cursor = `url('img/cursor.png'), crosshair`
                self.rightClickPressed = false;
            }

        })
        this.canvas.addEventListener("mouseup", function(event) {
        })
        this.emptyButton.addEventListener("mousedown", function(event) {
            self.context.clearRect(0, 0, self.canvas.width, self.canvas.height);
        })
        this.innerCircle.addEventListener("mousedown", function(event) {
            self.strokeButtonPressed = true;
        });
        this.outerCircle.addEventListener("mousedown", function(event) {
            self.strokeButtonPressed = true;
        });
        let previousPos = 0;
        addEventListener("mousemove", function(event) {
            const currentPos = event.pageX
            if (self.strokeButtonPressed) 
            {
                if(currentPos > previousPos) 
                {
                    if(self.strokeSize < 60)
                    {
                        self.strokeSize += 4;
                        self.innerCircle.style.height = `${self.innerCircle.clientHeight + 4}px`;
                        self.innerCircle.style.width = `${self.innerCircle.clientWidth + 4}px`;
                        self.innerCircle.style.top = `${self.outerCircle.clientHeight/2 - self.strokeSize/2}px`;
                        self.innerCircle.style.left = `${self.outerCircle.clientHeight/2 - self.strokeSize/2}px`;
                    }
                    previousPos = currentPos;
                }
                else if(currentPos < previousPos)
                {
                    if(self.strokeSize > 4) 
                    {
                        self.strokeSize -= 4;
                        self.innerCircle.style.height = `${self.innerCircle.clientHeight - 4}px`;
                        self.innerCircle.style.width = `${self.innerCircle.clientWidth - 4}px`;
                        self.innerCircle.style.top = `${self.outerCircle.clientHeight/2 - self.strokeSize/2}px`;
                        self.innerCircle.style.left = `${self.outerCircle.clientHeight/2 - self.strokeSize/2}px`;
                    }
                    previousPos = currentPos;

                }
            }
        });
        this.paintBucket.addEventListener("mousedown", function(event) {
            if(!self.paintBucketPressed) 
            {            
                self.paintBucket.style.border = "3px solid white"
                self.canvas.style.cursor = `url('img/paintbucketicon.png'), crosshair`
                self.paintBucketPressed = true;
            }
            else {
                self.paintBucket.style.border = "3px solid transparent"
                self.canvas.style.cursor = `url('img/cursor.png'), crosshair`
                self.paintBucketPressed = false;
            }

        });

    }
    getMouseCoordinates(event, canvas) {
        const mouseX = event.pageX - canvas.offsetLeft;
        const mouseY = event.pageY - canvas.offsetTop;
        return {mouseX, mouseY};
    }
    getPixelColor(x, y) {
        const rgb = this.context.getImageData(x, y, 1, 1).data;
        return [rgb[0], rgb[1], rgb[2]] // R G B
    }
    paintPixel(pixel) {
        pixel.data[0] = 200;
        pixel.data[1] = 200;
        pixel.data[2] = 200;
    }
    fill (mouseX, mouseY, startColor) {
        /*
        pixel.data[0] = 255;
        pixel.data[1] = 255;
        pixel.data[2] = 255;
        this.context.putImageData(pixel, mouseX, mouseY)
        */
       console.log(this.getPixelColor(mouseX, mouseY) == startColor)
        if(this.getPixelColor(mouseX, mouseY) === startColor) {
            const pixel = this.context.getImageData(mouseX, mouseY, this.canvas.width, this.canvas.height)
            this.paintPixel(pixel);
            this.context.putImageData(pixel, mouseX, mouseY)
            this.fill(mouseX+1, mouseY, startColor)
            this.fill(mouseX, mouseY+1, startColor)
            this.fill(mouseX, mouseY-1, startColor)
            this.fill(mouseX-1, mouseY, startColor)
        }
    }
    draw(event) {
        if (event.which === 3) {
            if (!this.drawing) return;
            this.canvas.style.cursor = `url('img/erasercursor.png'), crosshair`
            this.rightClickPressed = true;
            this.context.beginPath();
            this.context.lineWidth = this.strokeSize; // width of line
            this.context.strokeStyle = "white" // color of line
            this.context.lineCap = "round"; // rounded end cap
            this.context.moveTo(this.userPos.x, this.userPos.y);
            this.setPosition(event);
            this.context.lineTo(this.userPos.x, this.userPos.y);
            this.context.stroke();
        }
         if(event.which !== 1) return; // If anything other than left click is clicked then exit out of the function.
        if (!this.drawing) return;
        this.canvas.style.cursor = `url('img/cursor.png'), crosshair`
        this.context.beginPath();
        this.context.lineWidth = this.strokeSize; // width of line
        this.context.strokeStyle = this.color // color of line
        this.context.lineCap = "round"; // rounded end cap
        this.context.moveTo(this.userPos.x, this.userPos.y);
        this.setPosition(event);
        this.context.lineTo(this.userPos.x, this.userPos.y);
        this.context.stroke();
        /*
        // When the mouse clicks in the canvas
        const {mouseX, mouseY} = this.getMouseCoordinates(event, this.canvas);
        ipcRenderer.send('mouseCoordinates', mouseX, mouseY);
        this.paint = true;
        */
    }
    setPosition(event) {
        const {mouseX, mouseY} = this.getMouseCoordinates(event, this.canvas);
        this.userPos.x = mouseX;
        this.userPos.y = mouseY;
    }
    handleColorClick(event, self, colorButton) {
        self.colorButtons.forEach(function(color) {
             color.style.border = `3px solid ${getStyle(color, "background-color")}`
             color.style.cursor = "pointer";
        });
        if (getStyle(colorButton, 'background-color') === "rgb(255, 255, 255)") {
            colorButton.style.border = `3px solid black`;
        }
        else {
            colorButton.style.border = `3px solid #FFFF`;
        }
        colorButton.style.cursor = "default";
        self.color = getStyle(colorButton, "background-color")
    }
}
function getStyle(x, styleProp)
{
    if (x.currentStyle)
        var y = x.currentStyle[styleProp];
    else if (window.getComputedStyle)
        var y = document.defaultView.getComputedStyle(x,null).getPropertyValue(styleProp);
    return y;
}
function main() {
    new Canvas();

}
main();