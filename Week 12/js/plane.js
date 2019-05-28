"use strict";

class Plane {
    constructor(gl) {
        this.worldMatrix = glMatrix.mat4.create();
        this.normalMatrix = glMatrix.mat3.create();

        this.position = [0,0,0];
        this.rotation = [0,0,0];
        this.scale = [1,1,1];

        this.colour = [0.5, 0.5, 0.5];

        this.points = [
            -1, 0, -1,
            1, 0,  1,
            -1, 0,  1,

            1, 0,  1,
            -1, 0, -1,
            1, 0,  -1,
        ];

        this.normals = [
            // top
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,

            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
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

        this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);

        this.uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvs), gl.STATIC_DRAW);
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

        if ("a_texcoords" in shader) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
            gl.vertexAttribPointer(shader["a_texcoords"], 2, gl.FLOAT, false, 0, 0);    
        }

        if ("u_diffuseMaterial" in shader) {
            gl.uniform3fv(shader["u_diffuseMaterial"], new Float32Array(this.colour));
        }

        if ("u_texture" in shader) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.uniform1i(shader["u_texture"], 0);    
        }
        
        gl.drawArrays(gl.TRIANGLES, 0, this.points.length / 3);           
    }

}