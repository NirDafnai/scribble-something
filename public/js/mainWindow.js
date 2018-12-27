const electron = require('electron');
const {ipcRenderer} = electron;
class Canvas 
{
    constructor() 
    {
        this.canvas = document.getElementById('drawingCanvas');
        this.context = this.canvas.getContext("2d");
        this.drawing = false;
        this.strokeSize = 3;
        this.userPos = {x: 0, y: 0};
        this.strokeButton = document.getElementById('circle1');
        this.strokeButtonPressed = false;
        this.addListeners();
    }
    addListeners() 
    {
        const self = this;
        this.canvas.addEventListener("mousedown", function(event) {
            self.drawing = true;
            console.log(self.drawing)
            self.setPosition(event);
        });
        addEventListener("mousemove", function(event) {
            self.draw(event);
        });
        addEventListener("mouseup", function(event) {
            self.drawing = false;
            self.strokeButtonPressed = false;
        })

        let pos1 = 0;

        this.strokeButton.addEventListener("mousedown", function(event) {
            self.strokeButtonPressed = true;
        });
        addEventListener("mousemove",function(event) {
            if (self.strokeButtonPressed) 
            {
                if(event.pageX > pos1) 
                {
                    if(self.strokeSize < 50)
                    {
                        self.strokeSize += 2.5
                        self.strokeButton.style.height = `${self.strokeButton.clientHeight + 5}px`;
                        self.strokeButton.style.width = `${self.strokeButton.clientWidth + 5}px`;
                        console.log(self.strokeSize)
                    }
                    pos1 = event.pageX;
                }
                else if(event.pageX < pos1)
                {
                    if(self.strokeSize > 3) 
                    {
                        self.strokeSize -= 2.5
                        self.strokeButton.style.height = `${self.strokeButton.clientHeight - 5}px`;
                        self.strokeButton.style.width = `${self.strokeButton.clientWidth - 5}px`;
                        console.log(self.strokeSize)
                    }
                    pos1 = event.pageX;

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