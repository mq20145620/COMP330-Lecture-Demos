"use strict";

// Shader implements smooth Phong shading

const vertexShaderSource = `
attribute vec4 a_position;
attribute vec4 a_normal;

uniform mat4 u_worldMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;

varying vec4 v_normal;
varying vec4 v_viewPosition;

void main() {
    // convert normal to world coordinates
    v_normal = u_worldMatrix * a_normal;

    // calculate view position for specular shading
    v_viewPosition = u_viewMatrix * u_worldMatrix * a_position;

    gl_Position = u_projectionMatrix * u_viewMatrix * u_worldMatrix * a_position;
}
`;

const fragmentShaderSource = `
precision mediump float;
uniform vec3 u_lightDirection;   
uniform vec3 u_lightIntensity;   
uniform vec3 u_ambientIntensity;   
uniform vec3 u_diffuseColour;   
uniform vec3 u_specularColour;   

varying vec4 v_normal;
varying vec4 v_viewPosition;

void main() {
    // normalise the vectors
    vec3 s = normalize(u_lightDirection);
    vec3 n = normalize(v_normal.xyz);
    vec3 v = -normalize(v_viewPosition.xyz);
    vec3 r = -s + 2.0 * dot(s,n) * n;

    vec3 ambient = u_ambientIntensity * u_diffuseColour;
    vec3 diffuse = u_lightIntensity * u_diffuseColour * max(0.0, dot(s, n));
    vec3 specular = u_lightIntensity * u_specularColour * dot(r, v);

    gl_FragColor = vec4(ambient + diffuse + specular, 1); 
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
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);

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

    // compute a spherical mesh

    let points = [];
    let vertexNormals = [];
    let faceNormals = [];

    const nSteps = 16;
    const angle = Math.PI * 2 / nSteps;

    const a = glMatrix.vec3.create();
    const b = glMatrix.vec3.create();
    const faceNormal = glMatrix.vec3.create();

    for (let i = 0; i < nSteps; i++) {
        let theta = i * angle;

        let z0 = Math.cos(theta);
        let z1 = Math.cos(theta + angle);

        for (let j = 0; j < nSteps/2; j++) {
            let phi = j * angle - Math.PI / 2;

            let x00 = Math.sin(theta) * Math.cos(phi);
            let y00 = Math.sin(theta) * Math.sin(phi);
            let x01 = Math.sin(theta) * Math.cos(phi+angle);
            let y01 = Math.sin(theta) * Math.sin(phi+angle);
            let x10 = Math.sin(theta+angle) * Math.cos(phi);
            let y10 = Math.sin(theta+angle) * Math.sin(phi);
            let x11 = Math.sin(theta+angle) * Math.cos(phi+angle);
            let y11 = Math.sin(theta+angle) * Math.sin(phi+angle);

            let p00 = [x00, y00, z0];
            let p01 = [x01, y01, z0];
            let p10 = [x10, y10, z1];
            let p11 = [x11, y11, z1];

            points.push(...p00);
            points.push(...p10);
            points.push(...p11);

            vertexNormals.push(...p00);
            vertexNormals.push(...p10);
            vertexNormals.push(...p11);

            // compute the face normal n = (p1 - p0) x (p2 - p0)
            glMatrix.vec3.sub(a, p10, p00);
            glMatrix.vec3.sub(b, p11, p00);
            glMatrix.vec3.cross(faceNormal, a, b);
    
            faceNormals.push(...faceNormal);    // same for all three vertices
            faceNormals.push(...faceNormal);
            faceNormals.push(...faceNormal);

            points.push(...p11);
            points.push(...p01);
            points.push(...p00);

            vertexNormals.push(...p11);
            vertexNormals.push(...p01);
            vertexNormals.push(...p00);

            // compute the face normal n = (p1 - p0) x (p2 - p0)
            glMatrix.vec3.sub(a, p01, p11);
            glMatrix.vec3.sub(b, p00, p11);
            glMatrix.vec3.cross(faceNormal, a, b);
    
            faceNormals.push(...faceNormal);    // same for all three vertices
            faceNormals.push(...faceNormal);
            faceNormals.push(...faceNormal);
            
        }
    }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

    const vertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);

    const faceNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, faceNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(faceNormals), gl.STATIC_DRAW);


    // === Per Frame operations ===

    const lightDirection = [0,1,1];
    let lightRotationSpeed = 2 * Math.PI / 30; // radians per second 

    // update objects in the scene
    let update = function(deltaTime) {
        check(isNumber(deltaTime));

        if (inputManager.leftPressed) {
            glMatrix.vec3.rotateY(lightDirection, lightDirection, [0,0,0], -lightRotationSpeed * deltaTime);
        }
        if (inputManager.rightPressed) {
            glMatrix.vec3.rotateY(lightDirection, lightDirection, [0,0,0], lightRotationSpeed * deltaTime);
        }
        if (inputManager.upPressed) {
            glMatrix.vec3.rotateX(lightDirection, lightDirection, [0,0,0], lightRotationSpeed * deltaTime);
        }
        if (inputManager.downPressed) {
            glMatrix.vec3.rotateX(lightDirection, lightDirection, [0,0,0], -lightRotationSpeed * deltaTime);
        }
    };

    // allocate matrices
    const projectionMatrix = glMatrix.mat4.create();
    const viewMatrix = glMatrix.mat4.create();
    const worldMatrix = glMatrix.mat4.create();

    // redraw the scene
    let render = function() {
        // clear the screen
        gl.viewport(0, 0, canvas.width, canvas.height);        
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        {
            const fovy = Math.PI / 2;
            const aspect = canvas.width / canvas.height;
            const near = 0.1;
            const far = 4;
            glMatrix.mat4.perspective(projectionMatrix, fovy, aspect, near, far);
            gl.uniformMatrix4fv(shader["u_projectionMatrix"], false, projectionMatrix);
        }

        {
            const offset = [0,0,-2];
            glMatrix.mat4.identity(viewMatrix);
            glMatrix.mat4.translate(viewMatrix, viewMatrix, offset);
            gl.uniformMatrix4fv(shader["u_viewMatrix"], false, viewMatrix);
        }

        {            
            glMatrix.mat4.identity(worldMatrix);
            gl.uniformMatrix4fv(shader["u_worldMatrix"], false, worldMatrix);
        }

        {
            const diffuseColour = new Float32Array([0.0, 0.0, 1.0]);
            gl.uniform3fv(shader["u_diffuseColour"], diffuseColour);

            const specularColour = new Float32Array([0.0, 0.0, 0.0]);
            gl.uniform3fv(shader["u_specularColour"], specularColour);            
        }

        {
            const lightIntensity = new Float32Array([1.0, 1.0, 1.0]);
            gl.uniform3fv(shader["u_lightIntensity"], lightIntensity);

            const ambientIntensity = new Float32Array([0.2, 0.2, 0.2]);
            gl.uniform3fv(shader["u_ambientIntensity"], ambientIntensity);

            gl.uniform3fv(shader["u_lightDirection"], lightDirection);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(shader["a_position"], 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, faceNormalBuffer);
        gl.vertexAttribPointer(shader["a_normal"], 3, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, points.length / 3);       

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

