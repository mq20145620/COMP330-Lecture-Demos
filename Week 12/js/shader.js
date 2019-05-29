"use strict";

class Shader {

    constructor(gl, vertexShaderSource, fragmentShaderSource) {
        // create GLSL shaders, upload the GLSL source, compile the shaders
        const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.program =  this.createProgram(gl, vertexShader, fragmentShader);
        gl.useProgram(this.program);

        // Initialise the shader attributes & uniforms
        const nAttributes = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < nAttributes; i++) {
            const name = gl.getActiveAttrib(this.program, i).name;
            this[name] = gl.getAttribLocation(this.program, name);
        }

        const nUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < nUniforms; i++) {
            const name = gl.getActiveUniform(this.program, i).name;
            this[name] = gl.getUniformLocation(this.program, name);
        }
    }

    createShader(gl, type, source) {
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
    
    createProgram(gl, vertexShader, fragmentShader) {
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
    
    enable(gl) {
        gl.useProgram(this.program);
        const nAttributes = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < nAttributes; i++) {
            const name = gl.getActiveAttrib(this.program, i).name;
            gl.enableVertexAttribArray(this[name]);
        }       
    }

    disable(gl) {
        const nAttributes = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < nAttributes; i++) {
            const name = gl.getActiveAttrib(this.program, i).name;
            gl.disableVertexAttribArray(this[name]);
        }       
    }

}