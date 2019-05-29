"use strict";

class Quad {
    constructor(gl) {
        this.points = [
            -1, -1, 0,
            1, 1, 0,
            -1, 1, 0,

            1, 1, 0,
            -1, -1, 0,
            1, -1, 0,
        ];

        this.uvs = [
            0,1,
            1,0,
            0,0,
        
            1,0,
            0,1,
            1,1,
        ];

        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.points), gl.STATIC_DRAW);

        this.uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvs), gl.STATIC_DRAW);
    }

    render(gl, shader) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(shader["a_position"], 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.vertexAttribPointer(shader["a_texcoords"], 2, gl.FLOAT, false, 0, 0);    
        
        gl.drawArrays(gl.TRIANGLES, 0, this.points.length / 3);           
    }

}