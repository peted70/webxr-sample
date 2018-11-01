// 1. Request an XR device.
// 2. If it's available, request an XR session. If you want the user to put their phone in a headset, 
// it's called an immersive session and requires a user gesture to enter.
// 3. Use the session to run a render loop which provides 60 image frames per second. Draw appropriate content to the screen in each frame.
// 4. Run the render loop until the user decides to exit.
// 5. End the XR session.

const cubeVertices = [
    // Front face
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,
    
    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,
    
    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,
    
    // Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,
    
    // Right face
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,
    
    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0,
];

const cubeIndices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
];

function CheckXR(onSession) {
    if (navigator.xr) {
        navigator.xr.requestDevice()
            .then(xrDevice => {
                let ctx = document.getElementById('non-immersive-canvas').getContext('xrpresent');

                // Advertise the AR/VR functionality to get a user gesture.
                vue.status = 'XR device found:' + xrDevice;
                vue.xrDevice = xrDevice;

                xrDevice.supportsSession({ immersive: true }).then(() => {
                    console.log('Immersive session supported');
                    vue.immersiveSupported = true;
                })
                    .catch(err => {
                        console.log('Immersive session error ' + err);
                    });
                xrDevice.supportsSession({
                    immersive: false,
                    outputContext: ctx
                }).then(() => {
                    console.log('Non-Immersive session supported');
                    vue.nonImmersiveSupported = true;
                })
                    .catch(err => {
                        console.log(' Immersive session error ' + err);
                    });
            })
            .catch(err => {
                if (err.name === 'NotFoundError') {
                    console.log('No XR devices available:' + err);
                } else {
                    // An error occurred while requesting an XRDevice.
                    console.log('Requesting XR device failed:' + err);
                }
            })
    } else {
        vue.status = 'This browser does not support the WebXR API.';
    }
}

function onDrawFrame(timestamp, xrFrame) {
    console.log("onDrawFrame called");

    // Do we have an active session?
    if (xrFrame.session) {
        // Request the next animation callback
        xrFrame.session.requestAnimationFrame(onDrawFrame);

        let pose = xrFrame.getDevicePose(xrFOfRef);
        if (pose) {
            glContext.bindFramebuffer(glContext.FRAMEBUFFER, xrFrame.session.baseLayer.framebuffer);

            for (let view of xrFrame.views) {
                let viewport = xrFrame.session.baseLayer.getViewport(view);
                glContext.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
                drawScene(view, pose);
            }
        }
    } else {
        // No session available, so render a default mono view.
        glContext.viewport(0, 0, glCanvas.width, glCanvas.height);
        drawScene();

        // Request the next window callback
        window.requestAnimationFrame(onDrawFrame);
    }
}

function createShaders(gl, vShaderSrc, fShaderSrc) {
    let vs = gl.createShader(gl.VERTEX_SHADER);
    let fs = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vs, vShaderSrc);
    gl.shaderSource(fs, fShaderSrc);

    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        console.log('ERROR Compiling vertex shader ' + gl.getShaderInfoLog(vs));
        return null;
    }
    gl.compileShader(fs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        console.log('ERROR Compiling vertex shader ' + gl.getShaderInfoLog(vs));
        return null;
    }

    let program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);

    if (gl.linkProgram(program) == 0) {
        console.log('linkedin shader program failed');
        return null;
    }
    return program;
}

function drawScene(view, pose) {
    let time = Date.now();
    glContext.clearColor(Math.cos(time / 2000), Math.cos(time / 4000), Math.cos(time / 6000), 1.0);

    // Clear the framebuffer
    glContext.clear(glContext.COLOR_BUFFER_BIT | glContext.DEPTH_BUFFER_BIT);

    let viewMatrix = null;
    let projectionMatrix = null;
    if (view) {
        viewMatrix = pose.getViewMatrix(view);
        projectionMatrix = view.projectionMatrix;
    } else {
        viewMatrix = defaultViewMatrix;
        projectionMatrix = defaultProjectionMatrix;
    }

    // Set up uniforms and draw buffers...

}

function initialiseBuffers(gl) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertices), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);

    return {
        positions: positionBuffer,
        indices: indexBuffer
    };
}

let glContext = null;
let glCanvas = null;
let xrFOfRef = null;

function OnSession() {
    console.log('On Session Called');

    if (!glContext) {
        glCanvas = document.createElement('canvas');
        glContext = glCanvas.getContext('webgl', { compatibleXRDevice: vue.xrDevice });

        var layer = new XRWebGLLayer(vue.xrSession, glContext);
        console.log(layer);
        vue.xrSession.baseLayer = layer;

        // Load the src code for the shaders
        let vs = document.getElementById('vertex-shader');
        let fs = document.getElementById('fragment-shader');

        // Create and use the resulting shader program
        let shaderProgram = createShaders(glContext, vs, fs);
        glContext.useProgram(shaderProgram);

        vue.buffers = initialiseBuffers(glContext);

        vue.xrSession.requestFrameOfReference('eye-level').then((frameOfRef) => {
            // Since we're dealing with multple sessions now we need to track
            // which XRFrameOfReference is associated with which XRSession.
            xrFOfRef = frameOfRef;
            // if (vue.xrSession.immersive) {
            //   xrImmersiveFrameOfRef = frameOfRef;
            // } else {
            //   xrNonImmersiveFrameOfRef = frameOfRef;
            // }
            vue.xrSession.requestAnimationFrame(onDrawFrame);
        });
    }
}

function startImmersiveSession() {
    vue.xrDevice.requestSession({ immersive: true }).then(xrSession => {
        vue.xrSession = xrSession;
        OnSession();
    })
    .catch(err => {
        console.log('Immersive session error ' + err);
    });
}

function startNonImmersiveSession() {
    vue.xrDevice.requestSession({
        immersive: false,
        outputContext: document.getElementById('non-immersive-canvas').getContext('xrpresent')
    }).then(xrSession => {
        vue.xrSession = xrSession;
        OnSession();
    })
    .catch(err => {
        console.log('Immersive session error ' + err);
    });
}

window.document.addEventListener('DOMContentLoaded', function (ev) {

    vue = new Vue({
        el: '#app',
        data: {
            status: '------',
            nonImmersiveSupported: false,
            immersiveSupported: false
        },
        methods: {
            startImmersiveSession: function (event) {
                startImmersiveSession();
            },
            startNonImmersiveSession: function (event) {
                startNonImmersiveSession();
            }
        },
        xrSession: null,
        xrDevice: null,
        buffers: null
    })

    CheckXR(OnSession);
});
