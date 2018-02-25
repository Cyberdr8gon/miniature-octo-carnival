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

const chunkWidth = 16;
//ex: Chunk coordinate (1,1,1) -> Absolute coordinates of (64, 64, 64).   
//For some (x,y,z) relative to a chunk, calculate the index of the coordinate.
function ridx(x, y, z) {
    return z+y*chunkWidth+x*chunkWidth**2;
}

//models
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

var pxTmpGeometry = new THREE.Geometry().fromBufferGeometry( pxGeometry );
var nxTmpGeometry = new THREE.Geometry().fromBufferGeometry( nxGeometry );
var pyTmpGeometry = new THREE.Geometry().fromBufferGeometry( pyGeometry );
var nyTmpGeometry = new THREE.Geometry().fromBufferGeometry( nyGeometry );
var pzTmpGeometry = new THREE.Geometry().fromBufferGeometry( pzGeometry );
var nzTmpGeometry = new THREE.Geometry().fromBufferGeometry( nzGeometry );

var stoneTexture = new THREE.TextureLoader().load( 'textures/minecraft/stone.png' );
stoneTexture.magFilter = THREE.NearestFilter;
stoneTexture.minFilter = THREE.LinearMipMapLinearFilter;

var unmergedChunks = [];
var chunks = {};

var playercx = 0, playercy = 0, playercz = 0;

var chunkWorker = new Worker("generateChunk.js");
    chunkWorker.addEventListener('message', function(e) {
        unmergedChunks.push(e.data);
        console.log("Chunk generated")
      }, false);

data = init();
animate();

function init() {

    container = document.getElementById( 'container' );

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 20000 );
    camera.position.x = 0;
    camera.position.z = 800;
    camera.position.y = 800;

    controls = new THREE.FirstPersonControls( camera );

    controls.movementSpeed = 1000;
    controls.lookSpeed = 0.125;
    controls.lookVertical = true;

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xbfd1e5 );

    // sides

    // BufferGeometry cannot be merged yet.
    // var tmpGeometry = new THREE.Geometry();          

    //Merge some chunk into the global mesh at some chunk coordinate

    for (let i = -2; i < 3; i++) {
        for (let j = -2; j < 3; j++) {
            for (let k = -2; k < 3; k++) {
                chunkWorker.postMessage([i,j,k])
            }
        }
    }
    
    // chunkWorker.postMessage([1,0,0]);
    // chunkWorker.postMessage([1,1,-1]);
    // chunkWorker.postMessage([1,2,-2]);
    // chunkWorker.postMessage([0,1,-2]);
    // chunkWorker.postMessage([-1,0,-2]);
    // chunkWorker.postMessage([-1,1,-3]);
    
    // mergeChunk(0,0,0, generateChunk(0,0,0));
    // mergeChunk(1,0,0, generateChunk(1,0,0));
    // mergeChunk(-1,0,0, generateChunk(1,0,0));
    // mergeChunk(0,0,1, generateChunk(1,0,0));
    // mergeChunk(0,0,-1, generateChunk(1,0,0));
    
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

    window.addEventListener( 'resize', onWindowResize, false );
}

function addChunkToScence(cx, cy, cz, data) {
    var matrix = new THREE.Matrix4(); 
    var tmpGeometry = new THREE.Geometry();
    
    cx *= chunkWidth;
    cy *= chunkWidth;
    cz *= chunkWidth;
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
    console.log("added chunk")

    var geometry = new THREE.BufferGeometry().fromGeometry( tmpGeometry );
    // geometry.computeBoundingSphere();
    var mesh = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { map: stoneTexture } ) );
    scene.add( mesh );
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    controls.handleResize();

}
//

function animate() {

    requestAnimationFrame( animate );
    render();
    stats.update();

}

const pi = new THREE.Vector3(1, 0, 0);
const pj = new THREE.Vector3(0, 1, 0);
const pk = new THREE.Vector3(0, 0, 1);
const ni = new THREE.Vector3(-1, 0, 0);
const nj = new THREE.Vector3(0, -1, 0);
const nk = new THREE.Vector3(0, 0, -1);
const units = [pi,pj,pk,ni,nj,nk];


function getClosestUnit(a) {
    let minA=a.angleTo(pi), minAIndex = 0;
    for (let i = 1; i < units.length; i++) {
        let ca = a.angleTo(units[i]);
        if (ca < minA) {
            minA = ca;
            minAIndex = i;
        }
    }
    return units[minAIndex];
}

function getAdjacentUnits(a) {
    if (a.equals(pi) || a.equals(ni)) {
        return [pj, pk, nj, nk]
    }
    if (a.equals(pj) || a.equals(nj)) {
        return [pi, pk, ni, nk]
    }
    if (a.equals(pk) || a.equals(nk)) {
        return [pj, pi, nj, ni]
    }
}

function mod(x, n) {
    return ((x%n)+n)%n;
}

function update() {
    const updateDirection = 5;
    if (unmergedChunks.length != 0) {
        let data = unmergedChunks.pop()
        let cxyz = data[0]
        let chunk = data[1]
        addChunkToScence(cxyz[0],cxyz[1], cxyz[2], chunk);
        chunks[cxyz] = chunk
   }

   let updated = false
   let worldx = Math.floor(camera.position.x/100);
   let tcx = (worldx-mod(worldx,chunkWidth))/chunkWidth;
   if (playercx != tcx) {
       updated = true
       playercx = tcx
   }
   
   let worldy = Math.floor(camera.position.y/100);
   let tcy = (worldy-mod(worldy,chunkWidth))/chunkWidth;
   if (playercy != tcy) {
       updated = true
       playercy = tcy
   }

   let worldz = Math.floor(camera.position.z/100);
   let tcz = (worldz-mod(worldz,chunkWidth))/chunkWidth;
   if (playercz != tcz) {
       updated = true
       playercz = tcz
   }

   if (updated) {
        let u = getClosestUnit(camera.getWorldDirection());
        let playercVector = new THREE.Vector3(playercx, playercy, playercz);
        for (let i = 0; i < updateDirection; i++) {
            let ui = u.clone().multiplyScalar(i+1);
            let temp = playercVector.clone().add(ui);
            temp = [temp.x,temp.y,temp.z]
            if (!(temp in chunks)) {
                chunkWorker.postMessage(temp)
            }
            let adj = getAdjacentUnits(u);
            for (let j = 0; j < adj.length; j++) {
                let temp = playercVector.clone().add(ui).add(adj[j])
                temp = [temp.x,temp.y,temp.z]
                if (!(temp in chunks)) {
                    chunkWorker.postMessage(temp)
                }
            }
        }
    }
}

function render() {
    controls.update( clock.getDelta() );
    update()
    renderer.render( scene, camera );
}   