function noise(x, y, z) {
    var n = tooloud.Worley.Euclidean(x, y, z);
    return Math.floor(255 * (n[2]*n[0]));
}   

function generateNoise(width) {
    let buffer = new ArrayBuffer(4*width**3);
    let float32View = new Float32Array(buffer);
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < width; j++) {
            for (let k = 0; k < width; k++) {
                let v = 0;
                if (noise(i*.05,j*.05,k*.05) > 40) {
                    v = 1
                }
                float32View[ridx(i,j,k,width)] = v;
            }
        }
    }
    return float32View;
}

self.addEventListener("message", function (width) {
    let buffer = new ArrayBuffer(4*width**3);
    let float32View = new Float32Array(buffer);
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < width; j++) {
            for (let k = 0; k < width; k++) {
                let v = 0;
                if (noise(i*.05,j*.05,k*.05) > 40) {
                    v = 1
                }
                float32View[ridx(i,j,k,width)] = v;
            }
        }
    }
    return float32View;
}, false);

