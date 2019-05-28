"use strict";

class TextureShader extends Shader {

    constructor(gl) {
        const vertexShaderSource = `
            attribute vec4 a_position;
            attribute vec2 a_texcoords;

            uniform mat4 u_worldMatrix;
            uniform mat4 u_viewMatrix;
            uniform mat4 u_projectionMatrix;

            varying vec2 v_texcoords;

            void main() {
                v_texcoords = a_texcoords;
                gl_Position = u_projectionMatrix * u_viewMatrix * u_worldMatrix * a_position;
            }
        `;

        const fragmentShaderSource = `
            precision mediump float;

            uniform sampler2D u_texture;

            varying vec2 v_texcoords;

            void main() {
                gl_FragColor = texture2D(u_texture, v_texcoords); 
            }
        `;

        super(gl, vertexShaderSource, fragmentShaderSource);
    }
 
}