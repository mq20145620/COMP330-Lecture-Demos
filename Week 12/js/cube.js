"use strict";

class Cube {
    constructor(gl) {
        this.worldMatrix = glMatrix.mat4.create();
        this.normalMatrix = glMatrix.mat3.create();

        this.position = [0,0,0];
        this.rotation = [0,0,0];
        this.scale = [1,1,1];

        this.colour = [1,1,1];

        this.points = [
            // front
            -1, -1, 1,
            1,  1, 1,
            1, -1, 1,

            1,  1, 1,
            -1, -1, 1,
            -1,  1, 1,

            // back 
            1,  1, -1,
            -1, -1, -1,
            1, -1, -1,

            -1, -1, -1,
            1,  1, -1,
            -1,  1, -1,

            // left
            -1,  1,  1,
            -1, -1, -1, 
            -1,  1, -1,

            -1, -1, -1, 
            -1,  1,  1,
            -1,  -1, 1,

            // right
             1, -1, -1, 
             1,  1,  1,
             1,  1, -1,

             1,  1,  1,
             1, -1, -1, 
             1,  -1, 1,

            // top
            -1, 1, -1,
            1, 1,  1,
            -1, 1,  1,

            1, 1,  1,
            -1, 1, -1,
            1, 1,  -1,

            // bottom
            1, -1,  1,
            -1, -1, -1,
            -1, -1,  1,

            -1, -1, -1,
            1, -1,  1,
            1, -1,  -1,

        ];

        this.normals = [
            // front
            0,  0, 1,
            0,  0, 1,
            0,  0, 1,

            0,  0, 1,
            0,  0, 1,
            0,  0, 1,

            // back 
            0,  0, -1,
            0,  0, -1,
            0,  0, -1,

            0,  0, -1,
            0,  0, -1,
            0,  0, -1,

            // left
            -1,  0, 0,
            -1,  0, 0,
            -1,  0, 0,

            -1,  0, 0,
            -1,  0, 0,
            -1,  0, 0,

            // right
            1,  0, 0,
            1,  0, 0,
            1,  0, 0,

            1,  0, 0,
            1,  0, 0,
            1,  0, 0,

            // top
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,

            0, 1, 0,
            0, 1, 0,
            0, 1, 0,

            // bottom
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,

            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
        ];

        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.points), gl.STATIC_DRAW);

        this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);

    }

    render(gl, shader) {
        glMatrix.mat4.identity(this.worldMatrix);
        glMatrix.mat4.translate(this.worldMatrix, this.worldMatrix, this.position);
        glMatrix.mat4.rotateZ(this.worldMatrix, this.worldMatrix, this.rotation[2]);
        glMatrix.mat4.rotateX(this.worldMatrix, this.worldMatrix, this.rotation[0]);
        glMatrix.mat4.rotateY(this.worldMatrix, this.worldMatrix, this.rotation[1]);
        glMatrix.mat4.scale(this.worldMatrix, this.worldMatrix, this.scale);
        gl.uniformMatrix4fv(shader["u_worldMatrix"], false, this.worldMatrix);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(shader["a_position"], 3, gl.FLOAT, false, 0, 0);

        if ("u_normalMatrix" in shader) {
            glMatrix.mat3.normalFromMat4(this.normalMatrix, this.worldMatrix);
            gl.uniformMatrix3fv(shader["u_normalMatrix"], false, this.normalMatrix);    
        }
        
        if ("a_normal" in shader) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
            gl.vertexAttribPointer(shader["a_normal"], 3, gl.FLOAT, false, 0, 0);    
        }

        if ("u_diffuseMaterial" in shader) {
            gl.uniform3fv(shader["u_diffuseMaterial"], new Float32Array(this.colour));
        }

        gl.drawArrays(gl.TRIANGLES, 0, this.points.length / 3);           
    }

}