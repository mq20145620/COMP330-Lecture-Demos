"use strict";

Math.TAU = 2 * Math.PI;

const vertexShaderSource = `
attribute vec4 a_position;
attribute vec3 a_normal;

uniform mat4 u_worldMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat3 u_normalMatrix;

varying vec3 v_normal;

void main() {
    v_normal = a_normal; 
    gl_Position = u_projectionMatrix * u_viewMatrix * u_worldMatrix * a_position;
}
`;

const fragmentShaderSource = `
precision mediump float;

uniform vec3 u_lightDirection;
varying vec3 v_normal;

uniform vec3 u_diffuseMaterial;

void main() {
    vec3 n = normalize(v_normal);
    vec3 s = normalize(u_lightDirection);

    // Quick & dirty diffuse lighting
    vec3 intensity = u_diffuseMaterial * (0.1 + max(0.0, dot(n, s)));
    vec3 brightness = pow(intensity, vec3(0.45));

    gl_FragColor = vec4(brightness, 1); 
    //gl_FragColor = vec4(s, 1); 
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

    // turn on antialiasing
    const contextParameters =  { antialias: true };

    // get the canvas element & gl rendering 
    const canvas = document.getElementById("c");
    const gl = canvas.getContext("webgl", contextParameters);
    if (gl === null) {
        window.alert("WebGL not supported!");
        return;
    }

    // enable depth testing & backface culling
    gl.enable(gl.DEPTH_TEST);
    // gl.enable(gl.CULL_FACE);
    // gl.cullFace(gl.BACK);

    // create GLSL shaders, upload the GLSL source, compile the shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program =  createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    // Initialise the shader attributes & uniforms
    let shader = {};
    const nAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < nAttributes; i++) {
        const name = gl.getActiveAttrib(program, i).name;
        shader[name] = gl.getAttribLocation(program, name);
        gl.enableVertexAttribArray(shader[name]);
    }

    const nUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < nUniforms; i++) {
        const name = gl.getActiveUniform(program, i).name;
        shader[name] = gl.getUniformLocation(program, name);
    }

    // objects in scene

    const plane = new Plane(gl);
    plane.position = [0,0,0];
    plane.scale = [10,10,10];

    const cube1 = new Cube(gl);
    cube1.position = [-2, 1, -2];
    const cube2 = new Cube(gl);
    cube2.position = [2, 1, -2];
    const cube3 = new Cube(gl);
    cube3.position = [-2, 1, 2];
    const cube4 = new Cube(gl);
    cube4.position = [2, 1, 2];


    // === Per Frame operations ===

    const cameraRotation = [-Math.TAU/12, Math. TAU/8, 0];
    const cameraRotationSpeed = Math.TAU / 10; // radians per second 
    let cameraDistance = 6;
    const cameraZoomSpeed = 1; // distance per second 

    const lightDirection = [0.1, 1, 0.5];
    const lightRotationSpeed = Math.TAU / 10; // radians per second 

    // update objects in the scene
    let update = function(deltaTime) {
        check(isNumber(deltaTime));

        if (inputManager.keyPressed["ArrowLeft"]) {
            cameraRotation[1] += cameraRotationSpeed * deltaTime;
        }
        if (inputManager.keyPressed["ArrowRight"]) {
            cameraRotation[1] -= cameraRotationSpeed * deltaTime;
        }
        if (inputManager.keyPressed["ArrowUp"]) {
            cameraRotation[0] -= cameraRotationSpeed * deltaTime;
        }
        if (inputManager.keyPressed["ArrowDown"]) {
            cameraRotation[0] += cameraRotationSpeed * deltaTime;
        }
        if (inputManager.keyPressed["PageUp"]) {
            cameraDistance -= cameraZoomSpeed * deltaTime;
        }        
        if (inputManager.keyPressed["PageDown"]) {
            cameraDistance += cameraZoomSpeed * deltaTime;
        }

        const origin = [0,0,0];
        if (inputManager.keyPressed["KeyA"]) {
            glMatrix.vec3.rotateY(lightDirection, lightDirection, origin, -lightRotationSpeed * deltaTime);
        }
        if (inputManager.keyPressed["KeyD"]) {
            glMatrix.vec3.rotateY(lightDirection, lightDirection, origin, lightRotationSpeed * deltaTime);
        }
        if (inputManager.keyPressed["KeyW"]) {
            glMatrix.vec3.rotateX(lightDirection, lightDirection, origin, lightRotationSpeed * deltaTime);
        }
        if (inputManager.keyPressed["KeyS"]) {
            glMatrix.vec3.rotateX(lightDirection, lightDirection, origin, -lightRotationSpeed * deltaTime);
        }


    };

    // allocate matrices
    const projectionMatrix = glMatrix.mat4.create();
    const viewMatrix = glMatrix.mat4.create();
    const cameraPosition = glMatrix.vec3.create();

    // redraw the scene
    let render = function() {
        // SHADOW PASS



        // MAIN PASS

        // clear the screen
        gl.viewport(0, 0, canvas.width, canvas.height);        
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        {
            const fovy = Math.PI / 2;
            const aspect = canvas.width / canvas.height;
            const near = 0.1;
            const far = 100;
            glMatrix.mat4.perspective(projectionMatrix, fovy, aspect, near, far);
            gl.uniformMatrix4fv(shader["u_projectionMatrix"], false, projectionMatrix);
        }

        // set up view matrix and camera position
        {
            glMatrix.vec3.set(cameraPosition, 0, 0, cameraDistance);
            glMatrix.vec3.rotateZ(cameraPosition, cameraPosition, [0,0,0], cameraRotation[2]);
            glMatrix.vec3.rotateX(cameraPosition, cameraPosition, [0,0,0], cameraRotation[0]);
            glMatrix.vec3.rotateY(cameraPosition, cameraPosition, [0,0,0], cameraRotation[1]);
            gl.uniform3fv(shader["u_cameraPosition"], cameraPosition);

            const target = [0,0,0];
            const up = [0,1,0];
            glMatrix.mat4.lookAt(viewMatrix, cameraPosition, target, up);
            gl.uniformMatrix4fv(shader["u_viewMatrix"], false, viewMatrix);
        }

        // set up lights
        {
            gl.uniform3fv(shader["u_lightDirection"], new Float32Array(lightDirection));
        }

        // render the objects in the scene
        plane.render(gl, shader);
        cube1.render(gl, shader);
        cube2.render(gl, shader);
        cube3.render(gl, shader);
        cube4.render(gl, shader);

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

