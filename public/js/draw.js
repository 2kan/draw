var socket = io();
socket.emit( "joinRoom", "0" );

var _drawProgressively = true;
var opponents = [];

socket.on( "playerJoinedRoom", function ( a_opponentData )
{
	CreateOpponent( a_opponentData );
} );

socket.on( "playerList", function ( a_opponents )
{
	for ( var i = 0; i < a_opponents.length; ++i )
		CreateOpponent( a_opponents[ i ] );
} );

socket.on( "opponentImageData", function ( a_opponentImage )
{
	console.log( a_opponentImage );

	var opponent;
	for ( var i = 0; i < opponents.length; ++i )
		if ( opponents[ i ].id == a_opponentImage.id )
			opponent = opponents[ i ];

	// see notes in jquery ready function
	DrawOpponentCanvas( opponent.context, a_opponentImage.imageData );
} );

socket.on( "playerLeftRoom", function ( a_opponent )
{
	$( "[data-opponent-id='" + a_opponent.id + "']" ).remove();
} );

$( document ).ready( function ()
{
	// bleh
	// will fix this later once my tests work
	//opponentCanvasses.push( $( ".opponentCanvas" )[ 0 ] );
} );



function CreateOpponent( a_opponentData )
{
	$( "#canvasOutlet" ).append(
		"<br data-opponent-id='" + a_opponentData.id + "' />" + // lol
		"<canvas class='canvas opponentCanvas' width=500 height=500 " +
		"data-opponent-id='" + a_opponentData.id + "' />"
	);

	var thisOpponent = {
		id: a_opponentData.id,
		name: a_opponentData.name,
		context: $( "canvas[data-opponent-id='" + a_opponentData.id + "']" )[ 0 ]
			.getContext( "2d" )
	};

	opponents.push( thisOpponent );

	$( "#userOutlet" ).append(
		"<div class='panel-block' data-opponent-id='" + thisOpponent.id + "'>" +
		"	<span class='panel-icon'><i class='fa fa-user'></i></span>" +
		thisOpponent.name +
		"</div>"
	);
}


function DrawOpponentCanvas( a_canvas, a_drawEvents )
{
	//for ( var i = 0; i < a_drawEvents.length; ++i )
	{
		OpponentRedraw( a_canvas, a_drawEvents );
	}
}

//
// Here's where I copy and paste the normal canvas code to work for one opponent
// todo: make this not shit
//
async function OpponentRedraw( a_context, a_drawEvent )
{
	a_context.clearRect( 0, 0, a_context.canvas.width, a_context.canvas.height );

	a_context.lineJoin = "round";

	for ( var i = 0; i < a_drawEvent.length; ++i )
	{
		a_context.strokeStyle = a_drawEvent[ i ].color;
		a_context.lineWidth = a_drawEvent[ i ].size;

		a_context.beginPath();

		if ( a_drawEvent[ i ].dragging && i )
		{
			a_context.moveTo( a_drawEvent[ i - 1 ].x, a_drawEvent[ i - 1 ].y );
		}
		else
		{
			a_context.moveTo( a_drawEvent[ i ].x - 1, a_drawEvent[ i ].y );
		}

		a_context.lineTo( a_drawEvent[ i ].x, a_drawEvent[ i ].y );

		a_context.closePath();
		a_context.stroke();

		if ( _drawProgressively )
			await sleep( 10 );
	}
}

function sleep( a_millis )
{
	return new Promise( resolve => setTimeout( resolve, a_millis ) );
}