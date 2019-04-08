"use strict";

// Shader code

const vertexShaderSource = `
attribute vec4 a_position;
uniform mat3 u_viewMatrix;

void main() {
    vec3 position = u_viewMatrix * vec3(a_position.xy, 1);
    gl_Position = vec4(position.xy,0,1);
}
`;

const fragmentShaderSource = `
precision mediump float;
uniform vec4 u_colour;

void main() {
  gl_FragColor = u_colour; 
}
`;

function createShader(gl, type, source) {
    check(isContext(gl), isString(source));

    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    check(isContext(gl), isShader(vertexShader, fragmentShader));

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

function main() {

    // === Initialisation ===

    // turn off antialiasing
    const contextParameters =  { antialias: true };

    // get the canvas element & gl rendering 
    const canvas = document.getElementById("c");
    const gl = canvas.getContext("webgl", contextParameters);
    if (gl === null) {
        window.alert("WebGL not supported!");
        return;
    }

    // create GLSL shaders, upload the GLSL source, compile the shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program =  createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    // Initialise the shader attributes & uniforms
    const positionAttribute = gl.getAttribLocation(program, "a_position");
    const viewMatrixUniform = gl.getUniformLocation(program, "u_viewMatrix");
    const colourUniform = gl.getUniformLocation(program, "u_colour");

    // Initialise the array buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionAttribute);
    gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);

    // Construct an equilateratal triangle
    let points = [];
    for (let i = 0; i < 3; i++) {
        const theta = i * Math.PI * 2 / 3;
        const x = 0.5 * Math.cos(theta);
        const y = 0.5 * Math.sin(theta);
        points.push(x);
        points.push(y);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

    // === Per Frame operations ===

    let cameraRotation = 0; // radians
    let cameraRotationSpeed = 2 * Math.PI / 30; // radians per second 

    // update objects in the scene
    let update = function(deltaTime) {
        check(isNumber(deltaTime));

        cameraRotation += cameraRotationSpeed * deltaTime;
    };

    // redraw the scene
    let render = function() {
        // clear the screen
        gl.viewport(0, 0, canvas.width, canvas.height);        
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const viewMatrix = Matrix.rotation(cameraRotation);
        gl.uniformMatrix3fv(viewMatrixUniform, false, viewMatrix);

        const colour = new Float32Array([1,1,1,1]);
        gl.uniform4fv(colourUniform, colour);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, 3);   
    };

    // animation loop
    let oldTime = 0;
    let animate = function(time) {
        check(isNumber(time));
        
        time = time / 1000;
        let deltaTime = time - oldTime;
        oldTime = time;

        update(deltaTime);
        render();

        requestAnimationFrame(animate);
    }

    // start it going
    animate(0);
}    

