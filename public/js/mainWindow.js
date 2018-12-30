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
        this.userPos = {x: 0, y: 0};
        this.innerCircle = document.getElementById('innercircle');
        this.outerCircle = document.getElementById('outercircle');
        this.strokeButtonPressed = false;
        this.addListeners();
    }
    addListeners() 
    {
        const self = this;
        this.canvas.addEventListener("mousedown", function(event) {
            self.drawing = true;
            self.setPosition(event);
            self.draw(event);
        });
        addEventListener("mousemove", function(event) {
            self.draw(event);
        });
        addEventListener("mouseup", function(event) {
            self.drawing = false;
            self.strokeButtonPressed = false;
        })
        this.innerCircle.addEventListener("mousedown", function(event) {
            self.strokeButtonPressed = true;
        });
        this.outerCircle.addEventListener("mousedown", function(event) {
            self.strokeButtonPressed = true;
        });
        let previousPos = 0;
        addEventListener("mousemove",function(event) {
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

    }
    getMouseCoordinates(event, canvas) {
        const mouseX = event.pageX - canvas.offsetLeft;
        const mouseY = event.pageY - canvas.offsetTop;
        return {mouseX, mouseY};
    }
    draw(event) {
        if(event.buttons !== 1) return; // If mouse is clicked then exit out of the function.
        if (!this.drawing) return;
        this.context.beginPath();
        this.context.lineWidth = this.strokeSize; // width of line
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
}
function main() {
    new Canvas();

}
main();