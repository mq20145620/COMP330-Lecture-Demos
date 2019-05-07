"use strict";

class Input {
    constructor() {
        this.leftPressed = false;
        this.rightPressed = false;
        this.upPressed = false;
        this.downPress = false;

        this.mouseClicked = false;
        this.mouseClickedPos = null;
        this.wheelDelta = 0;

        document.addEventListener("keydown", this.onKeyDown.bind(this));
        document.addEventListener("keyup", this.onKeyUp.bind(this));
        document.addEventListener("mousedown", this.onMouseDown.bind(this))
        document.addEventListener("wheel", this.onWheel.bind(this))
    }

    clear() {
        this.mouseClicked = false;
        this.wheelDelta = 0;
    }

    onKeyDown(event) {
        switch (event.code) {
            case "KeyA": 
            case "ArrowLeft": 
                this.leftPressed = true;
                break;

            case "KeyD": 
            case "ArrowRight": 
                this.rightPressed = true;
                break;

            case "KeyS":
            case "ArrowDown":
                this.downPressed = true;
                break;

            case "KeyW":
            case "ArrowUp":
                this.upPressed = true;
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case "KeyA":
            case "ArrowLeft": 
                this.leftPressed = false;
                break;

            case "KeyD":
            case "ArrowRight": 
                this.rightPressed = false;
                break;

            case "KeyS":
            case "ArrowDown":
                this.downPressed = false;
                break;

            case "KeyW":
            case "ArrowUp":
                this.upPressed = false;
                break;
        }
    }

    onMouseDown(event) {
        this.mouseClicked = true;
        this.mouseClickedPos = new Float32Array([event.clientX, event.clientY]);
    }

    onWheel(event) {
        this.wheelDelta = Math.sign(event.deltaY);
    }
}

const inputManager = new Input();