"use strict";

Math.TAU = 2 * Math.PI;

function createFrameBuffer(gl, width, height) {
  
    // Step 1: Create a frame buffer object
    const frameBuffer = gl.createFramebuffer();
  
    // Step 2: Create and initialize a texture buffer to hold the colors.
    const colourBuffer = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, colourBuffer);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0,
                                    gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
    // Step 3: Create and initialize a texture buffer to hold the depth values.
    // Note: the WEBGL_depth_texture extension is required for this to work
    //       and for the gl.DEPTH_COMPONENT texture format to be supported.
    const depthBuffer = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, depthBuffer);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, width, height, 0,
                                    gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
    // Step 4: Attach the specific buffers to the frame buffer.
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colourBuffer, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,  gl.TEXTURE_2D, depthBuffer, 0);
  
    // Step 5: Verify that the frame buffer is valid.
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.error("The created frame buffer is invalid: " + status.toString());
    }
  
    // Unbind these new objects, which makes the default frame buffer the
    // target for rendering.
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  
    return {
        frameBuffer: frameBuffer,
        colourBuffer: colourBuffer,
        depthBuffer: depthBuffer  
    };
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

    // get the extension to implement saving depth buffer to texture
    var ext = gl.getExtension('WEBGL_depth_texture');

    // enable depth testing & backface culling
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.SCISSOR_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    let sceneShader = new DiffuseShader(gl);
    let depthShader = new DepthShader(gl);
    let blitShader = new BlitShader(gl);

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

    const depthScreen = new Quad(gl);

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


    // initialise the shadow buffer
    const shadowDepthTextureSize = 1024;
    var shadowBuffer = createFrameBuffer(gl, shadowDepthTextureSize, shadowDepthTextureSize);

    // redraw the scene
    let render = function() {
        renderToShadowBuffer();
        renderShadowBufferToScreen();
        renderMainPass();
    };

    function renderToShadowBuffer() {
      
        gl.bindFramebuffer(gl.FRAMEBUFFER, shadowBuffer.frameBuffer);

        gl.viewport(0, 0, shadowDepthTextureSize, shadowDepthTextureSize);        
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(depthShader.program);

        {
            const left = -4;
            const right = 4;
            const bottom = -4;
            const top = 4;
            const near = 0.1;
            const far = 100;
            glMatrix.mat4.ortho(projectionMatrix, left, right, bottom, top, near, far) 
            gl.uniformMatrix4fv(depthShader["u_projectionMatrix"], false, projectionMatrix);
        }

        // set up view matrix 
        {
            glMatrix.mat4.identity(viewMatrix);
            glMatrix.mat4.translate(viewMatrix, viewMatrix, -lightDirection[0], -lightDirection[1], -lightDirection[2]);
            gl.uniformMatrix4fv(depthShader["u_viewMatrix"], false, viewMatrix);
        }

        // render the objects in the scene
        plane.render(gl, depthShader);
        cube1.render(gl, depthShader);
        cube2.render(gl, depthShader);
        cube3.render(gl, depthShader);
        cube4.render(gl, depthShader);
        
        // render to the canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    }

    function renderShadowBufferToScreen() {
        gl.scissor(canvas.width/2, 0, canvas.width/2, canvas.height);        
        gl.viewport(canvas.width/2, 0, canvas.width/2, canvas.height);        
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(blitShader.program);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, shadowBuffer.colourBuffer);
        gl.uniform1i(blitShader["u_texture"], 0);    

        depthScreen.render(gl, blitShader);        
    }

    function renderMainPass() {
        gl.scissor(0, 0, canvas.width/2, canvas.height);        

        // clear the screen
        gl.viewport(0, 0, canvas.width/2, canvas.height);        
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(sceneShader.program);

        {
            const fovy = Math.PI / 2;
            const aspect = canvas.width/2 / canvas.height;
            const near = 0.1;
            const far = 100;
            glMatrix.mat4.perspective(projectionMatrix, fovy, aspect, near, far);
            gl.uniformMatrix4fv(sceneShader["u_projectionMatrix"], false, projectionMatrix);
        }

        // set up view matrix and camera position
        {
            glMatrix.vec3.set(cameraPosition, 0, 0, cameraDistance);
            glMatrix.vec3.rotateZ(cameraPosition, cameraPosition, [0,0,0], cameraRotation[2]);
            glMatrix.vec3.rotateX(cameraPosition, cameraPosition, [0,0,0], cameraRotation[0]);
            glMatrix.vec3.rotateY(cameraPosition, cameraPosition, [0,0,0], cameraRotation[1]);
            gl.uniform3fv(sceneShader["u_cameraPosition"], cameraPosition);

            const target = [0,0,0];
            const up = [0,1,0];
            glMatrix.mat4.lookAt(viewMatrix, cameraPosition, target, up);
            gl.uniformMatrix4fv(sceneShader["u_viewMatrix"], false, viewMatrix);
        }

        // set up lights
        {
            gl.uniform3fv(sceneShader["u_lightDirection"], new Float32Array(lightDirection));
        }

        // render the objects in the scene
        plane.render(gl, sceneShader);
        cube1.render(gl, sceneShader);
        cube2.render(gl, sceneShader);
        cube3.render(gl, sceneShader);
        cube4.render(gl, sceneShader);        
    }

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

