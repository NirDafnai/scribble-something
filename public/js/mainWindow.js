const electron = require('electron');
const {ipcRenderer} = electron;
class Canvas 
{
    constructor() 
    {
        this.canvas = document.getElementById('drawingCanvas');
        this.context = this.canvas.getContext("2d");
        this.paint;
        this.userPos = {x: 0, y: 0};
        this.addListeners();
    }
    addListeners() 
    {
        const self = this;
        this.canvas.addEventListener("mousedown", function(event) {
            self.setPosition(event);
        });
        this.canvas.addEventListener("mousemove", function(event) {
            self.draw(event);
        });
        this.canvas.addEventListener("mouseenter", function(event) {
            self.setPosition(event);
        });
    }
    getMouseCoordinates(event, canvas) {
        const mouseX = event.pageX - canvas.offsetLeft;
        const mouseY = event.pageY - canvas.offsetTop;
        return {mouseX, mouseY};
    }
    draw(event) {
        if(event.buttons !== 1) return; // If mouse is clicked then exit out of the function.
        this.context.beginPath();
        this.context.lineWidth = 5; // width of line
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