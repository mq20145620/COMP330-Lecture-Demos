"use strict";

class BlitShader extends Shader {

    constructor(gl) {
        const vertexShaderSource = `
            attribute vec4 a_position;
            attribute vec2 a_texcoords;

            varying vec2 v_texcoords;

            void main() {
                v_texcoords = a_texcoords;
                gl_Position = a_position;
            }
        `;

        const fragmentShaderSource = `
            precision mediump float;

            uniform sampler2D u_texture;

            varying vec2 v_texcoords;

            void main() {
                float d = (texture2D(u_texture, v_texcoords).r + 1.0) / 2.0;
                gl_FragColor = vec4(d,d,d,1); 
            }
        `;

        super(gl, vertexShaderSource, fragmentShaderSource);
    }
 
}