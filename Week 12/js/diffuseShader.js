"use strict";

class DiffuseShader extends Shader {

    constructor(gl) {
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

        super(gl, vertexShaderSource, fragmentShaderSource);
    }
 
}