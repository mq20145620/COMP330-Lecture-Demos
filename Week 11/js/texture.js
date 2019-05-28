"use strict";

class Texture {

    constructor(gl, urls, generateMipmap) {
        check(isContext(gl));
        this.texture = this.loadTexture(gl, urls, generateMipmap);
    }

    loadTexture(gl, urls, generateMipmap) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        for (let level = 0; level < urls.length; level++) {
            const image = new Image();
            const internalFormat = gl.RGBA;
            const width = 1;
            const height = 1;
            const border = 0;
            const srcFormat = gl.RGBA;
            const srcType = gl.UNSIGNED_BYTE;
            const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                            width, height, border, srcFormat, srcType,
                            pixel);          
    

            image.onload = function(mipLevel) {                
                console.log("mipLevel = " + mipLevel);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, mipLevel, internalFormat,
                              srcFormat, srcType, image);  
                if (generateMipmap) {
                    gl.generateMipmap(gl.TEXTURE_2D);
                } 
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);         
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
            }.bind(this, level);
    
            image.src = urls[level];      
    
        }


        return texture;
    }

}