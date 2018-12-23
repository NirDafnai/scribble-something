const electron = require('electron');
const {ipcRenderer} = electron;
class Canvas 
{
    constructor() 
    {
        this.canvas = document.getElementById('drawingCanvas');
        this.context = this.canvas.getContext("2d");
        this.paint;
        this.addListeners();
    }
    addListeners() 
    {
        this.canvas.addEventListener("mousedown", event => {
            this.mouseDown(event);
        });
    }
    getMouseCoordinates(event, canvas) {
        const mouseX = event.pageX - canvas.offsetLeft;
        const mouseY = event.pageY - canvas.offsetTop;
        return {mouseX, mouseY};
    }
    mouseDown(event) {
        const {mouseX, mouseY} = this.getMouseCoordinates(event, this.canvas);
        ipcRenderer.send('mouseCoordinates', mouseX, mouseY);
        this.paint = true;
    }
}
function main() {
    new Canvas();
}
main();