
var room;
var users = {};
var dataChannels = {};


onBistriConferenceReady = function () {

  
    if ( !BistriConference.isCompatible() ) {
    
        alert( "There is something wrong with your browser" );
     
        return;
    }

 
    BistriConference.signaling.addHandler( "onConnected", function () {
       
        showPanel( "pane_1" );
    } );


    BistriConference.signaling.addHandler( "onError", function () {
       
        alert( error.text + " (" + error.code + ")" );
    } );


    BistriConference.signaling.addHandler( "onJoinedRoom", function ( data ) {
       
        room = data.room;
      
        showPanel( "pane_2" );
       
        for ( var i=0, max=data.members.length; i<max; i++ ) {
           
            users[ data.members[ i ].id ] = data.members[ i ].name;
          
            BistriConference.openDataChannel( data.members[ i ].id, "chat", data.room );
        }
    } );
//diplay the value
   
    BistriConference.signaling.addHandler( "onJoinRoomError", function ( error ) {
        
        alert( error.text + " (" + error.code + ")" );
    } );

 
    BistriConference.signaling.addHandler( "onQuittedRoom", function( room ) {
       
        showPanel( "pane_1" );
        
        BistriConference.stopStream();
    } );

  
    BistriConference.signaling.addHandler( "onPeerJoinedRoom", function ( peer ) {
        
        users[ peer.pid ] = peer.name;
    } );

   
    BistriConference.signaling.addHandler( "onPeerQuittedRoom", function ( peer ) {
       
        delete users[ peer.pid ];
    } );

  //connect the room users
    BistriConference.channels.addHandler( "onDataChannelCreated", onDataChannel );

   
    BistriConference.channels.addHandler( "onDataChannelRequested", onDataChannel );

    
    q( "#nick" ).addEventListener( "click", setNickname );

    
    q( "#join" ).addEventListener( "click", joinChatRoom );

   
    q( "#quit" ).addEventListener( "click", quitChatRoom );

   
    q( "#send" ).addEventListener( "click", sendChatMessage );

}

//display the messages in the mai sectio0n of the page
function onDataChannel( dataChannel, remoteUserId ){

   
    dataChannel.onOpen = function(){
       
        dataChannels[ remoteUserId ] = this;
      
        isThereSomeone();
    };

  
    dataChannel.onClose = function(){
       
        delete dataChannels[ remoteUserId ];
       
        isThereSomeone();
    };

   
    dataChannel.onMessage = function( event ){
     
        displayMessage( users[ remoteUserId ], event.data );
    };

}


function setNickname(){
  
    var nickname = q( "#nick_field" ).value;
  
    if( nickname ){
        
        BistriConference.init( {
            appId: "7a5eebc7",
            appKey: "4465c0d6fb1f64b3d870e90e93080b57",
            userName: nickname,
            debug: true
        } );
       
        BistriConference.connect();
    }
    else{
     
        alert( "You Must Enter a first or last name otherwise Program Will Not Work" );
    }
}


function joinChatRoom(){
   
    var roomToJoin = q( "#room_field" ).value;
  
    if( roomToJoin ){
  
        BistriConference.joinRoom( roomToJoin );
    }
    else{
      
        alert( "You Must Enter a Room Name OR Program Will not Work" );
    }
}


function quitChatRoom(){
  
    for( var id in dataChannels ){
       
        dataChannels[ id ].close();
    }
   
    BistriConference.quitRoom( room );
}

function sendChatMessage(){
  
    var message = q( "#message_field" ).value;
    
    if( message ){
      
        for( var id in dataChannels ){
             // ... send a message
            dataChannels[ id ].send( message );
        }
        // display the sent message
        displayMessage( "me", message );
        // reset message field content
        q( "#message_field" ).value = "";
    }
}


function displayMessage( user, message ){
   
    var container = q( "#messages_container" );
    var textNode = document.createTextNode( user + ":> " + message );
    var node = document.createElement( "div" );
    node.className = "message";
    node.appendChild( textNode );
    container.appendChild( node );
    
    container.scrollTop = container.scrollHeight;
}


function isThereSomeone(){
   
    if( Object.keys( dataChannels ).length ){
       
        q( "#send" ).removeAttribute( "disabled" );
    }
    else{
       
        q( "#send" ).setAttribute( "disabled", "disabled" );
    }
}

function showPanel( id ){
    var panes = document.querySelectorAll( ".pane" );
   
    for( var i=0, max=panes.length; i<max; i++ ){
     
        panes[ i ].style.display = panes[ i ].id == id ? "block" : "none";
    }
}

function q( query ){
    
    return document.querySelector( query );
}





//diplay the other page by its value 
//chose first or last name
//room secret code
//title of the page
//user interface 
//returns the values of all messages in the page
//logout if the user using low web proccer
//center whole content by the ids
//number of b and lines 
//jquery selc=ecters 



var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");
var mask;

var pointCount = 700;
var str = "Chat Room.";
var fontStr = "bold 90pt Helvetica Neue, Helvetica, Arial, sans-serif";

ctx.font = fontStr;
ctx.textAlign = "center";
c.width = ctx.measureText(str).width;
c.height = 128; // Set to font size

var whitePixels = [];
var points = [];
var point = function(x,y,vx,vy){
  this.x = x;
  this.y = y;
  this.vx = vx || 1;
  this.vy = vy || 1;
}
point.prototype.update = function() {
  ctx.beginPath();
  ctx.fillStyle = "#fa3380";
  ctx.arc(this.x,this.y,1,0,2*Math.PI);
  ctx.fill();
  ctx.closePath();
  //right and left padding to the next page
  //animated 
  // Change direction if running into black pixel
  if (this.x+this.vx >= c.width || this.x+this.vx < 0 || mask.data[coordsToI(this.x+this.vx, this.y, mask.width)] != 255) {
    this.vx *= -1;
    this.x += this.vx*2;
  }
  if (this.y+this.vy >= c.height || this.y+this.vy < 0 || mask.data[coordsToI(this.x, this.y+this.vy, mask.width)] != 255) {
    this.vy *= -1;
    this.y += this.vy*2;
  }
  
  for (var k = 0, m = points.length; k<m; k++) {
    if (points[k]===this) continue;
    
    var d = Math.sqrt(Math.pow(this.x-points[k].x,2)+Math.pow(this.y-points[k].y,2));
    if (d < 5) {
      ctx.lineWidth = .2;
      ctx.beginPath();
      ctx.moveTo(this.x,this.y);
      ctx.lineTo(points[k].x,points[k].y);
      ctx.stroke();
    }
    if (d < 20) {
      ctx.lineWidth = .1;
      ctx.beginPath();
      ctx.moveTo(this.x,this.y);
      ctx.lineTo(points[k].x,points[k].y);
      ctx.stroke();
    }
  }
  
  this.x += this.vx;
  this.y += this.vy;
}

function loop() {
  ctx.clearRect(0,0,c.width,c.height);
  for (var k = 0, m = points.length; k < m; k++) {
    points[k].update();
  }
}

function init() {
  // Draw text
  ctx.beginPath();
  ctx.fillStyle = "#fa3380";
  ctx.rect(0,0,c.width,c.height);
  ctx.fill();
  ctx.font = fontStr;
  ctx.textAlign = "left";
  ctx.fillStyle = "#fff";
  ctx.fillText(str,0,c.height/2+(c.height / 2));
  ctx.closePath();
  
  // Save mask
  mask = ctx.getImageData(0,0,c.width,c.height);
  
  // Draw background
  ctx.clearRect(0,0,c.width,c.height);
  
  // Save all white pixels in an array
  for (var i = 0; i < mask.data.length; i += 4) {
    if (mask.data[i] == 255 && mask.data[i+1] == 255 && mask.data[i+2] == 255 && mask.data[i+3] == 255) {
      whitePixels.push([iToX(i,mask.width),iToY(i,mask.width)]);
    }
  }
  
  for (var k = 0; k < pointCount; k++) {
    addPoint();
  }
}

function addPoint() {
  var spawn = whitePixels[Math.floor(Math.random()*whitePixels.length)];
  
  var p = new point(spawn[0],spawn[1], Math.floor(Math.random()*2-1), Math.floor(Math.random()*2-1));
  points.push(p);
}

function iToX(i,w) {
  return ((i%(4*w))/4);
}
function iToY(i,w) {
  return (Math.floor(i/(4*w)));
}
function coordsToI(x,y,w) {
  return ((mask.width*y)+x)*4;

}

setInterval(loop,50);
init();




//Enter message
document.getElementById("message_field")
    .addEventListener("keyup", function(event) {
    event.preventDefault();
    if (event.keyCode === 13) {
        document.getElementById("send").click();
    }
});


//enter name
document.getElementById("nick_field")
    .addEventListener("keyup", function(event) {
    event.preventDefault();
    if (event.keyCode === 13) {
        document.getElementById("nick").click();
    }
});


//enter rooom
document.getElementById("room_field")
    .addEventListener("keyup", function(event) {
    event.preventDefault();
    if (event.keyCode === 13) {
        document.getElementById("join").click();
    }
});








