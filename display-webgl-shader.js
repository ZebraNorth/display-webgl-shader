'use strict';

/**
 * Display WebGL Shader WordPress Block.
 *
 * https://mrzebra.co.uk/
 *
 * Copyright (c) Zebra North, 2021
 */

/**
 * Create a <canvas> element and display a shader in it.
 *
 * @param {String} fragmentShaderSource The source code for the fragment shader.
 */
function webglShader(fragmentShaderSource)
{
    // This is used to assign each shader on the page a unique ID.
    let id = 1;

    /**
     * Create a WebGL2 rendering context on the given canvas.
     *
     * @param {DOMElement} canvas The <canvas> element.
     *
     * @returns {WebGL2RenderingContext} Returns the rendering context.
     *
     * @throws {Error} Thrown if the canvas element does not exist or WebGL2 is not supported.
     */
    const createContext = function (canvas)
    {
        if (!canvas)
            throw new Error('Could not find canvas element');

        const context = canvas.getContext('webgl2');

        if (!context)
            throw new Error('Failed to get webgl context, webgl is not supported by the browser');

        return context;
    };

    /**
     * Build a compiled shader from source code.
     *
     * @param {WebGL2RenderingContext} gl   The WebGL context.
     * @param {Number}                 type The type of shader, either gl.VERTEX_SHADER or gl.FRAGMENT_SHADER.
     * @param {String}                 id   The ID attribute of the <script> element containing the shader's source code.
     *
     * @returns {WebGLShader} Returns the shader.
     *
     * @throws {Error} Thrown if compilation fails, eg due to a syntax error in the source code.
     */
    const createShader = function (gl, type, source)
    {
        const shader = gl.createShader(type);

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        {
            const msg = 'Failed to compile shader ' + id + ': ' + gl.getShaderInfoLog(shader);

            gl.deleteShader(shader);

            throw new Error(msg);
        }

        return shader;
    };

    /**
     * Get the source code for the vertex shader.
     * This multiplies the UVs by iResolution for compatibility
     * with Shadertoy.
     *
     * @returns {String} Returns shader source.
     */
    const getVertexShaderSource = function ()
    {
        return `#version 300 es
			precision mediump float;
            in vec4 vertex;
            in vec2 uv;

            uniform mat4 modelView;
            uniform mat4 projection;
			uniform vec2 iResolution;

            out vec2 vUv;
            out vec4 vSurface;

            void main()
            {
                gl_Position = projection * modelView * vertex;
                gl_PointSize = 2.0;
                vUv = uv * iResolution;
                vSurface = vertex;
            }`;
    }

    /**
     * Get the source code for the fragment shader.
     * This takes the source code from the input block and adds
     * the necessary boilerplate around it.
     *
     * @param {String} source The source code from the input block.
     *
     * @returns {String} Returns shader source.
     */
    const getFragmentShaderSource = function (source)
    {
        return `#version 300 es
            precision mediump float;

            in vec2 vUv;
            out vec4 fragColor;

            uniform float iTime;
            uniform vec2 iResolution;

            ` + source + `

            void main()
			{
                vec4 colour = vec4(1.0, 0.0, 0.0, 1.0);
				mainImage(colour, vUv);
                fragColor = colour;
			}`;
    }

    /**
     * Link shaders together into a program.
     *
     * @param {WebGL2RenderingContext} gl      The WebGL context.
     * @param {Array}                  shaders An array of WebGLShader.
     *
     * @returns {WebGLProgram} Returns a set of linked shaders.
     *
     * @throws {Error} Thrown if linking fails.
     */
    const createProgram = function (gl, shaders)
    {
        const program = gl.createProgram();

        for (const shader of shaders)
            gl.attachShader(program, shader);

        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        {
            const msg = 'Failed to create GL program: ' + gl.getProgramInfoLog(program);

            gl.deleteProgram(program);

            throw new Error(msg);
        }

        return program;
    };

    /**
     * Render the scene for a single frame.
     *
     * @param {WebGL2RenderingContext} gl     The WebGL2 render context.
     * @param {Canvas}                 canvas The <canvas> DOM element to which the scene is rendered.
     * @param {Scene}                  scene  The scene to draw.
     */
    const draw = function (gl, canvas, scene)
    {
        // Clear the screen.
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.disable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Set up an orthographic camera.
        const projectionMatrix = glMatrix.mat4.create();
        glMatrix.mat4.ortho(projectionMatrix, 0, 1, 0, 1, 0.01, 200.0);

        let modelView = glMatrix.mat4.create();
        glMatrix.mat4.translate(modelView, modelView, [1, 0, 0]);
        let target = glMatrix.vec3.create();
        let up = glMatrix.vec3.create();
        up[1] = 1;
        glMatrix.mat4.lookAt(modelView, [0, 0, -1], target, up);

        gl.useProgram(scene.shader.program);

        // Set the shader program uniforms: the projection matrix, modelview matrix, time, and resolution.
        gl.uniformMatrix4fv(scene.shader.uniforms.projection, false, projectionMatrix);
        gl.uniformMatrix4fv(scene.shader.uniforms.modelView, false, modelView);
        gl.uniform1f(scene.shader.uniforms.time, (Date.now() % 100000) / 1000);
        gl.uniform2f(scene.shader.uniforms.resolution, canvas.clientWidth, canvas.clientHeight);

        // Load the quad.
        gl.enableVertexAttribArray(scene.shader.attributes.vertex);
        gl.bindBuffer(gl.ARRAY_BUFFER, scene.buffers.vertex);
        gl.vertexAttribPointer(scene.shader.attributes.vertex, 3, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(scene.shader.attributes.uv);
        gl.bindBuffer(gl.ARRAY_BUFFER, scene.buffers.uv);
        gl.vertexAttribPointer(scene.shader.attributes.uv, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, scene.buffers.index);

        // Draw the quad.
        gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_SHORT, 0);
    };

    /**
     * Run the shader.
     *
     * @param {String} canvasId             The ID attribute of the <canvas> tag that will display the shader.
     * @param {String} vertexShaderSource   The source code for the vertex shader.
     * @param {String} fragmentShaderSource The source code for the fragment shader.
     */
    function main(canvasId, vertexShaderSource, fragmentShaderSource)
    {
        const glCanvas = document.getElementById(canvasId);
        const gl = createContext(glCanvas);

        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

        const program = createProgram(gl, [vertexShader, fragmentShader]);

        const scene = {
            shader: {
                program: program,
                uniforms: {
                    projection: gl.getUniformLocation(program, 'projection'),
                    modelView: gl.getUniformLocation(program, 'modelView'),
                    time: gl.getUniformLocation(program, 'iTime'),
                    resolution: gl.getUniformLocation(program, 'iResolution'),
                },
                attributes: {
                    vertex: gl.getAttribLocation(program, 'vertex'),
                    uv: gl.getAttribLocation(program, 'uv'),
                },
            },
            buffers: {
                vertex: gl.createBuffer(),
                uv: gl.createBuffer(),
                index: gl.createBuffer(),
            },
            geometry: {
                vertices: [],
                uvs: [],
                indices: [],
            }
        }

        // Create a mesh containing a single quad in the XY plane.
        scene.geometry.vertices.push(0, 0, 1);
        scene.geometry.vertices.push(0, 1, 1);
        scene.geometry.vertices.push(-1, 0, 1);
        scene.geometry.vertices.push(-1, 1, 1);

        scene.geometry.uvs.push(0, 0);
        scene.geometry.uvs.push(0, 1);
        scene.geometry.uvs.push(1, 0);
        scene.geometry.uvs.push(1, 1);

        scene.geometry.indices.push(0);
        scene.geometry.indices.push(1);
        scene.geometry.indices.push(2);
        scene.geometry.indices.push(3);

        // Load the geometry into the WebGL buffers.
        gl.bindBuffer(gl.ARRAY_BUFFER, scene.buffers.vertex);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(scene.geometry.vertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, scene.buffers.uv);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(scene.geometry.uvs), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, scene.buffers.index);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(scene.geometry.indices), gl.STATIC_DRAW);

        // Draw the frame.
        window.setInterval(() => draw(gl, glCanvas, scene), 16.66);
    }

    // Create a <canvas> element on which to draw the shader.
    const canvasId = 'display-webgl-shader-' + id++;
    document.write('<canvas id="' + canvasId + '" class="zebra-north-display-webgl-shader" width="640" height="360"></canvas>')

    // Initialise the shader when the page has finished loading.
    window.addEventListener('DOMContentLoaded', () => main(canvasId, getVertexShaderSource(), getFragmentShaderSource(fragmentShaderSource)));
}
