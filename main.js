if ( ! Detector.webgl ) {

    Detector.addGetWebGLMessage();
    document.getElementById( 'container' ).innerHTML = "";

}

var container, stats;

var camera, controls, scene, renderer;

var mesh;

var worldWidth = 128, worldDepth = 128,
worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;
// data = generateHeight( worldWidth, worldDepth );

var clock = new THREE.Clock();

data = init();
animate();

function init() {

    container = document.getElementById( 'container' );

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 20000 );
    camera.position.x = 0;
    camera.position.z = 0;
    camera.position.y = 0;

    controls = new THREE.FirstPersonControls( camera );

    controls.movementSpeed = 1000;
    controls.lookSpeed = 0.125;
    controls.lookVertical = true;

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xbfd1e5 );

    // sides

    var matrix = new THREE.Matrix4();

    var pxGeometry = new THREE.PlaneBufferGeometry( 100, 100 );
    pxGeometry.attributes.uv.array[ 1 ] = 0.5;
    pxGeometry.attributes.uv.array[ 3 ] = 0.5;
    pxGeometry.rotateY( Math.PI / 2 );
    pxGeometry.translate( 50, 0, 0 );

    var nxGeometry = new THREE.PlaneBufferGeometry( 100, 100 );
    nxGeometry.attributes.uv.array[ 1 ] = 0.5;
    nxGeometry.attributes.uv.array[ 3 ] = 0.5;
    nxGeometry.rotateY( - Math.PI / 2 );
    nxGeometry.translate( - 50, 0, 0 );

    var pyGeometry = new THREE.PlaneBufferGeometry( 100, 100 );
    pyGeometry.attributes.uv.array[ 5 ] = 0.5;
    pyGeometry.attributes.uv.array[ 7 ] = 0.5;
    pyGeometry.rotateX( - Math.PI / 2 );
    pyGeometry.translate( 0, 50, 0 );
    
    var nyGeometry = new THREE.PlaneBufferGeometry( 100, 100);
    nyGeometry.attributes.uv.array[ 5 ] = 0.5;
    nyGeometry.attributes.uv.array[ 7 ] = 0.5;
    nyGeometry.rotateX( + Math.PI / 2 );
    nyGeometry.translate( 0, -50, 0 );

    var pzGeometry = new THREE.PlaneBufferGeometry( 100, 100 );
    pzGeometry.attributes.uv.array[ 1 ] = 0.5;
    pzGeometry.attributes.uv.array[ 3 ] = 0.5;
    pzGeometry.translate( 0, 0, 50 );

    var nzGeometry = new THREE.PlaneBufferGeometry( 100, 100 );
    nzGeometry.attributes.uv.array[ 1 ] = 0.5;
    nzGeometry.attributes.uv.array[ 3 ] = 0.5;
    nzGeometry.rotateY( Math.PI );
    nzGeometry.translate( 0, 0, -50 );

    //

    // BufferGeometry cannot be merged yet.
    var tmpGeometry = new THREE.Geometry();
    var pxTmpGeometry = new THREE.Geometry().fromBufferGeometry( pxGeometry );
    var nxTmpGeometry = new THREE.Geometry().fromBufferGeometry( nxGeometry );
    var pyTmpGeometry = new THREE.Geometry().fromBufferGeometry( pyGeometry );
    var nyTmpGeometry = new THREE.Geometry().fromBufferGeometry( nyGeometry );
    var pzTmpGeometry = new THREE.Geometry().fromBufferGeometry( pzGeometry );
    var nzTmpGeometry = new THREE.Geometry().fromBufferGeometry( nzGeometry );

    function noise(x, y, z) {
        var n = tooloud.Worley.Euclidean(x, y, z);
        return Math.floor(255 * (n[2]*n[0]));
    }                

    const chunkWidth = 64;
    //ex: Chunk coordinate (1,1,1) -> Absolute coordinates of (64, 64, 64).   
    //For some (x,y,z) relative to a chunk, calculate the index of the coordinate.
    function ridx(x, y, z) {
        return z+y*chunkWidth+x*chunkWidth**2;
    }
    
    //Generate a chunk at some chunk coordinate
    const chunkArraySize = 4*64**3;
    function generateChunk(cx, cy, cz) {
        cx *= 64;
        cy *= 64;
        cz *= 64;
        let buffer = new ArrayBuffer(chunkArraySize);
        let float32View = new Float32Array(buffer);
        for (let i = 0; i < chunkWidth; i++) {
            for (let j = 0; j < chunkWidth; j++) {
                for (let k = 0; k < chunkWidth; k++) {
                    let v = 0;
                    if (noise((i+cx)*.05,(j+cy)*.05,(k+cz)*.05) > 40) {
                        v = 1
                    }
                    float32View[ridx(i,j,k)] = v;
                }
            }
        }
        return float32View;
    }

    //Merge some chunk into the global mesh at some chunk coordinate
    function mergeChunk(cx, cy, cz, data) {
        cx *= 64;
        cy *= 64;
        cz *= 64;
        for (let i = 0; i < chunkWidth; i++) {
            for (let j = 0; j < chunkWidth; j++) {
                for (let k = 0; k < chunkWidth; k++) {
                    if (data[ridx(i,j,k)] == 1) {
                        matrix.makeTranslation((i+cx)*100, (j+cy)*100, (k+cz)*100);  
                        if (k-1 < 0 || data[ridx(i,j,k-1)] == 0) {
                            tmpGeometry.merge( nzTmpGeometry, matrix );     
                        }
                        if (k+1 >= chunkWidth || data[ridx(i,j,k+1)] == 0) {
                            tmpGeometry.merge( pzTmpGeometry, matrix );
                        }
                        if (j-1 < 0 || data[ridx(i,j-1,k)] == 0) {
                            tmpGeometry.merge( nyTmpGeometry, matrix );
                        }
                        if (j+1 >= chunkWidth || data[ridx(i,j+1,k)] == 0) {
                            tmpGeometry.merge( pyTmpGeometry, matrix );
                        }
                        if (i-1 < 0 || data[ridx(i-1,j,k)] == 0) {
                            tmpGeometry.merge( nxTmpGeometry, matrix );
                        }
                        if (i+1 >= chunkWidth || data[ridx(i+1,j,k)] == 0) {
                            tmpGeometry.merge( pxTmpGeometry, matrix );
                        }
                    }
                }
            }
        }
    }

    mergeChunk(0,0,0, generateChunk(0,0,0));
    mergeChunk(1,0,0, generateChunk(1,0,0));
    mergeChunk(-1,0,0, generateChunk(1,0,0));
    mergeChunk(0,0,1, generateChunk(1,0,0));
    mergeChunk(0,0,-1, generateChunk(1,0,0));
    
    

    // let startx = worldHalfWidth;
    // let startz = worldHalfDepth;
    // let starty= getY( worldHalfWidth, worldHalfDepth ) * 100 + 1000;
    
    // var testMatrix = new THREE.Matrix4();
    // testMatrix.makeTranslation(200,0,100)

    // tmpGeometry.merge( pyTmpGeometry, testMatrix ); //top
    // tmpGeometry.merge( nyTmpGeometry, testMatrix ); //bottom
    // tmpGeometry.merge( pxTmpGeometry, testMatrix );
    // tmpGeometry.merge( nxTmpGeometry, testMatrix );
    // tmpGeometry.merge( pzTmpGeometry, testMatrix );
    // tmpGeometry.merge( nzTmpGeometry, testMatrix );


    var geometry = new THREE.BufferGeometry().fromGeometry( tmpGeometry );
    geometry.computeBoundingSphere();

    var texture = new THREE.TextureLoader().load( 'textures/minecraft/atlas.png' );
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.LinearMipMapLinearFilter;

    var mesh = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { map: texture } ) );
    scene.add( mesh );

    var ambientLight = new THREE.AmbientLight( 0xcccccc );
    scene.add( ambientLight );

    var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
    directionalLight.position.set( 1, 1, 0.5 ).normalize();
    scene.add( directionalLight );

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    container.innerHTML = "";

    container.appendChild( renderer.domElement );

    stats = new Stats();
    container.appendChild( stats.dom );

    //

    window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    controls.handleResize();

}

function generateHeight( width, height ) {

    var data = [], perlin = new ImprovedNoise(),
    size = width * height, quality = 2, z = Math.random() * 100;

    for ( var j = 0; j < 4; j ++ ) {

        if ( j === 0 ) for ( var i = 0; i < size; i ++ ) data[ i ] = 0;

        for ( var i = 0; i < size; i ++ ) {

            var x = i % width, y = ( i / width ) | 0;
            data[ i ] += perlin.noise( x / quality, y / quality, z ) * quality;


        }

        quality *= 4;

    }

    return data;

}

function getY( x, z ) {

    return ( data[ x + z * worldWidth ] * 0.2 ) | 0;

}

//

function animate() {

    requestAnimationFrame( animate );

    render();
    stats.update();

}

function render() {
    controls.update( clock.getDelta() );
    renderer.render( scene, camera );
}   