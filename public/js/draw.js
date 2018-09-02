var socket = io();
socket.emit( "joinRoom", "0" );

var _drawProgressively = true;
var opponents = [];
var _imageSubmitted = false;

socket.on( "playerJoinedRoom", function ( a_opponentData )
{
	console.log( "Opponent " + a_opponentData.id + " joined the room" );
	CreateOpponent( a_opponentData );
} );

socket.on( "playerList", function ( a_opponents )
{
	for ( var i = 0; i < a_opponents.length; ++i )
		CreateOpponent( a_opponents[ i ] );
} );

socket.on( "opponentImageData", function ( a_opponentImage )
{
	console.log( "Received image data for opponent " + a_opponentImage.id );
	console.log( a_opponentImage );

	// Get the opponent that submitted the image
	var opponent;
	for ( var i = 0; i < opponents.length; ++i )
		if ( opponents[ i ].id == a_opponentImage.id )
			opponent = opponents[ i ];

	opponent.imageSubmitted = true;
	opponent.imageData = a_opponentImage.imageData;
	$( "#userOutlet [data-opponent-id='" + a_opponentImage.id + "']" ).css( "font-weight", "bold" );

	// Check if everyone's submitted their turn
	if ( RoundIsReadyForReplay() )
	{
		DrawOpponentCanvasses();
	}
	//DrawOpponentCanvas( opponent.context, a_opponentImage.imageData );
} );

socket.on( "playerLeftRoom", function ( a_opponent )
{
	console.log( "Opponent " + a_opponent.id + " left the room" );
	$( "[data-opponent-id='" + a_opponent.id + "']" ).remove();

	for ( var i = 0; i < opponents.length; ++i )
	{
		if ( opponents[ i ].id == a_opponent.id )
			opponents.splice( i, 1 );
	}
} );

socket.on( "resetRound", function ( a_data )
{
	console.log( "Received round reset message" );
	ResetRound();
} );

$( document ).ready( function ()
{
	// bleh
	// will fix this later once my tests work
	//opponentCanvasses.push( $( ".opponentCanvas" )[ 0 ] );

	$( "#resetRoundButton" ).on( "click", function ()
	{
		socket.emit( "resetRound", { ok: true } );
	} );

	$( "#submit" ).on( "click", function ()
	{
		SendImage();
		$( "#submit" ).prop( "disabled", true );
	} );
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
		imageSubmitted: false,
		imageData: undefined,
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

// Returns true if the player and all opponents have submitted their turn
function RoundIsReadyForReplay()
{
	// Get number of opponents that have submitted their turn
	var opponentsReady = 0;
	for ( var i = 0; i < opponents.length; ++i )
	{
		if ( opponents[ i ].imageSubmitted )
			++opponentsReady;
	}

	console.log( opponentsReady == opponents.length && _imageSubmitted );
	console.log( ( opponentsReady == opponents.length ) && ( _imageSubmitted ) );
	return opponentsReady == opponents.length && _imageSubmitted;
}

function ResetRound()
{
	for ( var i = 0; i < opponents.length; ++i )
	{
		opponents[ i ].imageSubmitted = false;
		opponents[ i ].imageData = undefined;
		$( "#userOutlet [data-opponent-id='" + opponents[ i ].id + "']" ).css( "font-weight", "" );

		// Clear canvasses
		opponents[ i ].context.clearRect( 0, 0, opponents[ i ].context.canvas.width, opponents[ i ].context.canvas.height );
	}

	ResetCanvas();
	$( "#submit" ).prop( "disabled", false );
}


function DrawOpponentCanvasses()
{
	for ( var i = 0; i < opponents.length; ++i )
	{
		OpponentRedraw( opponents[ i ].context, opponents[ i ].imageData );
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
			await sleep( 20 );
	}
}

function sleep( a_millis )
{
	return new Promise( resolve => setTimeout( resolve, a_millis ) );
}