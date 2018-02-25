if ( ! Detector.webgl ) {
    Detector.addGetWebGLMessage();
    document.getElementById( 'container' ).innerHTML = "";
}

var isPlaying = false;

var container, stats;

var camera, controls, scene, renderer;

var mesh;

var score = 0;

var soundtrack;

var worldWidth = 256, worldDepth = 256,
worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;
// data = generateHeight( worldWidth, worldDepth );
document.getElementById("info").innerHTML="";

var clock = new THREE.Clock();

// player variables
var player_entity;
var player_projection_distance = 5;
var player_scaling_scalar = 2;
var player_entity_center_offset = -1;
var player_entity_vertial_sway = 3;
var player_entity_horizontal_sway = 9;

var camera_history_length = 15;
var camera_history = [];


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


init();
animate();

// UI Functions
function startGame() {
isPlaying = true;
    document.getElementById("info").innerHTML=score;
document.getElementById("menu").innerHTML="";
}

function promptRestart() {
isPlaying = false;
soundtrack.stop();
    document.getElementById("info").innerHTML="";
document.getElementById("menu").innerHTML='Forever Fast <br/> <button class="large-button" onClick="window.location.reload()">Restart Game?</button> ';
}

function muteToggle() {
if(soundtrack.isPlaying) {
soundtrack.pause();
} else {
soundtrack.play();
}
}

function init() {

    container = document.getElementById( 'container' );

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 20000 );
    camera.position.y = 800;

    controls = new THREE.FlyControls( camera );

    controls.movementSpeed = 500;
    controls.rollSpeed = 0.5;
    controls.lookVertical = true;
    controls.dragTolook = false;
    controls.autoForward = true;

for (let i = 0; i < camera_history_length; i++) {
camera_history[i] = camera.direction;
}

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x000000 );
    scene.fog = new THREE.FogExp2( 0x000000, 0.00015 );

// background music
var listener = new THREE.AudioListener(); 
camera.add( listener );

soundtrack = new THREE.Audio( listener ); 

var audioLoader = new THREE.AudioLoader();
audioLoader.load( 'audio/303-vs-909_by_canton.mp3', function( buffer ) {
soundtrack.setBuffer( buffer );
soundtrack.setLoop( true );
soundtrack.setVolume( 0.5 );
soundtrack.play();
//soundtrack.pause();
});

    // loader
    var loader = new THREE.ObjectLoader( );
    loader.load(
        'models/json/plane-threejs/plane.json',
        function( object )
        {
            player_entity = object;
            object.scale.set(player_scaling_scalar,player_scaling_scalar,player_scaling_scalar);
            //object.position.set(camera.position.x,camera.position.y,camera.position.z);
            scene.add( object );
        }
    );

    // sides

    var matrix = new THREE.Matrix4();

     //Merge some chunk into the global mesh at some chunk coordinate

     for (let i = -7; i < 8; i++) {
        for (let j = -7; j < 8; j++) {
            for (let k = -7; k < 8; k++) {
                chunkWorker.postMessage([i,j,k])
            }
        }
    }
    

    var ambientLight = new THREE.AmbientLight( 0xcccccc );
    scene.add( ambientLight );

    var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.1);
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
    score = 0;
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
    while (unmergedChunks.length != 0) {
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


function update_player_entity() {
    // test for location of player_entity update before or after controls update
    let camera_direction_vector = camera.getWorldDirection();
    let camera_normal_vector = camera.up.clone();

    //console.log(camera_normal_vector);
    //console.log(camera.up);
    camera_normal_vector.applyQuaternion(camera.quaternion);
    //let camera_normal_vector = camera_up.applyQuaternion(camera.quaternion);
    //console.log(camera_normal_vector.dot(camera_direction_vector));

let camera_lateral_vector = camera_normal_vector.clone();
camera_lateral_vector = camera_lateral_vector.cross(camera_direction_vector);

camera_history.push(camera.getWorldDirection());


// planar acceleration vectors
let normal_projecting_vector = camera_history.shift();
let lateral_projecting_vector = normal_projecting_vector.clone();

//console.log(normal_projecting_vector);

normal_projecting_vector.projectOnVector(camera_normal_vector);
lateral_projecting_vector.projectOnVector(camera_lateral_vector);

//console.log(lateral_projecting_vector);

    let new_location_vector =
new THREE.Vector3(
  camera.position.x 
  + camera_direction_vector.x * player_projection_distance 
  + camera_normal_vector.x * player_entity_center_offset 
  + normal_projecting_vector.x * player_entity_vertial_sway
  + lateral_projecting_vector.x * player_entity_horizontal_sway, 
              camera.position.y 
  + camera_direction_vector.y * player_projection_distance 
  + camera_normal_vector.y * player_entity_center_offset 
  + normal_projecting_vector.y * player_entity_vertial_sway
  + lateral_projecting_vector.y * player_entity_horizontal_sway, 
              camera.position.z 
  + camera_direction_vector.z * player_projection_distance 
  + camera_normal_vector.z * player_entity_center_offset 
  + normal_projecting_vector.z * player_entity_vertial_sway
  + lateral_projecting_vector.z * player_entity_horizontal_sway); 

    player_entity.position.set(new_location_vector.x, 
                               new_location_vector.y, 
                               new_location_vector.z);
    player_entity.rotation.set(camera.rotation.x, camera.rotation.y, camera.rotation.z);
}


function collision_detector(grace_period) {
  if(grace_period) return;
  let worldx = Math.floor(player_entity.position.x/100);
  let worldy = Math.floor(player_entity.position.y/100);
  let worldz = Math.floor(player_entity.position.z/100);

  let tcx = (worldx-mod(worldx, chunkWidth))/chunkWidth;
  let tcy = (worldy-mod(worldy, chunkWidth))/chunkWidth;
  let tcz = (worldz-mod(worldz, chunkWidth))/chunkWidth;


  tempChunk = chunks[[tcx, tcy, tcz]];
  console.log(tempChunk);
  if(tempChunk[ridx(mod((Math.floor(player_entity.position.x)), chunkWidth), mod(Math.floor(player_entity.position.y), chunkWidth), mod(Math.floor(player_entity.position.z) , chunkWidth))]) {
    promptRestart();
  }
}



function render() {
if(!isPlaying) return;

    controls.update( clock.getDelta() );
    
    update_player_entity();
    update();
    
    //update score
    score = score + 3;
    document.getElementById("info").innerHTML=score;
    
    renderer.render( scene, camera );

    //console.log(clock.elapsedTime);
    //if(clock.elapsedTime > 10) {
      //collision_detector();

    //}

    // speed up
    //controls.movementSpeed = controls.movementSpeed + 1;


}
