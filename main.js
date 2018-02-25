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
worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2,
data = generateHeight( worldWidth, worldDepth );
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
document.getElementById("menu").innerHTML='Forever Fast <br/> <button class="large-button" onClick="startGame()">Restart Game?</button> ';
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
    camera.position.y = getY( worldHalfWidth, worldHalfDepth ) * 100 + 100;

    controls = new THREE.FlyControls( camera );

    controls.movementSpeed = 1000;
    controls.rollSpeed = 0.5;
    controls.lookVertical = true;
    controls.dragTolook = false;
    controls.autoForward = true;

for (let i = 0; i < camera_history_length; i++) {
camera_history[i] = camera.direction;
}

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );
    scene.fog = new THREE.FogExp2( 0xffffff, 0.00015 );

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
soundtrack.pause();
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
    var pzTmpGeometry = new THREE.Geometry().fromBufferGeometry( pzGeometry );
    var nzTmpGeometry = new THREE.Geometry().fromBufferGeometry( nzGeometry );

    for ( var z = 0; z < worldDepth; z ++ ) {

        for ( var x = 0; x < worldWidth; x ++ ) {

            var h = getY( x, z );

            matrix.makeTranslation(
                x * 100 - worldHalfWidth * 100,
                h * 100,
                z * 100 - worldHalfDepth * 100
            );

            var px = getY( x + 1, z );
            var nx = getY( x - 1, z );
            var pz = getY( x, z + 1 );
            var nz = getY( x, z - 1 );

            tmpGeometry.merge( pyTmpGeometry, matrix );

            if ( ( px !== h && px !== h + 1 ) || x === 0 ) {

                tmpGeometry.merge( pxTmpGeometry, matrix );

            }

            if ( ( nx !== h && nx !== h + 1 ) || x === worldWidth - 1 ) {

                tmpGeometry.merge( nxTmpGeometry, matrix );

            }

            if ( ( pz !== h && pz !== h + 1 ) || z === worldDepth - 1 ) {

                tmpGeometry.merge( pzTmpGeometry, matrix );

            }

            if ( ( nz !== h && nz !== h + 1 ) || z === 0 ) {

                tmpGeometry.merge( nzTmpGeometry, matrix );

            }

        }

    }

    var geometry = new THREE.BufferGeometry().fromGeometry( tmpGeometry );
    geometry.computeBoundingSphere();

    var texture = new THREE.TextureLoader().load( 'textures/minecraft/atlas.png' );
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.LinearMipMapLinearFilter;

    var mesh = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { map: texture } ) );
    scene.add( mesh );

    var ambientLight = new THREE.AmbientLight( 0xcccccc );
    scene.add( ambientLight );

    var directionalLight = new THREE.DirectionalLight( 0xffffff, 2 );
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

    score = 0;
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




function render() {
if(!isPlaying) return;

    controls.update( clock.getDelta() );
    
    update_player_entity();

    
    //update score
    score = score + 3;
    document.getElementById("info").innerHTML=score;
    
    renderer.render( scene, camera );

// speed up
controls.movementSpeed = controls.movementSpeed + 1;


}
