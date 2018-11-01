// 1. Request an XR device.
// 2. If it's available, request an XR session. If you want the user to put their phone in a headset, 
// it's called an immersive session and requires a user gesture to enter.
// 3. Use the session to run a render loop which provides 60 image frames per second. Draw appropriate content to the screen in each frame.
// 4. Run the render loop until the user decides to exit.
// 5. End the XR session.

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
        xrDevice: null
    })

    CheckXR(OnSession);
});
