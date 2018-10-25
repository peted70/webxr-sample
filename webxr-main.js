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

                xrDevice.supportsSession({immersive: true}).then(() => {
                    vue.status += ' Immersive session supported';
                    xrDevice.requestSession({immersive: true}).then(xrSession => {
                        vue.xrSession = xrSession;
                        onSession();
                    })
                    .catch(err => {
                        vue.status += ' Immersive session error ' + err;
                    });
                })
                .catch(err => {
                    vue.status += ' Immersive session error ' + err;
                });
                xrDevice.supportsSession({
                    immersive: false, 
                    outputContext: ctx
                }).then(() => {
                    vue.status += ' Non-Immersive session supported';
                    xrDevice.requestSession({
                        immersive: false, 
                        outputContext: ctx
                    }).then(xrSession => {
                        vue.xrSession = xrSession;
                        onSession();
                    })
                    .catch(err => {
                        vue.status += ' Immersive session error ' + err;
                    });
                })
                .catch(err => {
                    vue.status += ' Immersive session error ' + err;
                });
            })
            .catch(err => {
                if (err.name === 'NotFoundError') {
                    vue.status = 'No XR devices available:' + err;
                } else {
                    // An error occurred while requesting an XRDevice.
                    vue.status = 'Requesting XR device failed:' + err;
                }
            })
    } else {
        vue.status = 'This browser does not support the WebXR API.';
    }
}

function OnSession() {
    var session = vue.xrSession;
    console.log('On Session Called');

    // poll for a device pose...
    
}

window.document.addEventListener('DOMContentLoaded', function(ev) {
    vue = new Vue({
        el: '#app',
        data: {
          status: '------'
        },
        xrSession: null
    }) 
       
    CheckXR(OnSession);
});
