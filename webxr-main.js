// 1. Request an XR device.
// 2. If it's available, request an XR session. If you want the user to put their phone in a headset, 
// it's called an immersive session and requires a user gesture to enter.
// 3. Use the session to run a render loop which provides 60 image frames per second. Draw appropriate content to the screen in each frame.
// 4. Run the render loop until the user decides to exit.
// 5. End the XR session.

function CheckXR() {
    if (navigator.xr) {
        navigator.xr.requestDevice()
            .then(xrDevice => {
                // Advertise the AR/VR functionality to get a user gesture.
            })
            .catch(err => {
                if (err.name === 'NotFoundError') {
                    // No XRDevices available.
                    console.error('No XR devices available:', err);
                } else {
                    // An error occurred while requesting an XRDevice.
                    console.error('Requesting XR device failed:', err);
                }
            })
    } else {
        console.log("This browser does not support the WebXR API.");
    }
}

window.document.addEventListener('DOMContentLoaded', function(ev) {
    CheckXR();
});
