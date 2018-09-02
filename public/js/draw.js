var socket = io();

var _drawProgressively = true;
var opponents = [];
var _imageSubmitted = false;
var _username = "some idiot";
var _id = -1;

socket.on( "welcome", function ( a_welcomeData )
{
	_id = a_welcomeData.id;
} );

socket.on( "joinRoomResult", function ( a_result )
{
	if ( !a_result.ok )
		alert( "Could not join room! Reason: " + a_result.reason );
} );

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
		DrawNextOpponentCanvas();
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
	$( "#resetRoundButton" ).on( "click", function ()
	{
		socket.emit( "resetRound", { ok: true } );
	} );

	$( "#submit" ).on( "click", function ()
	{
		$( "#userOutlet [data-opponent-id='" + _id + "']" ).css( "font-weight", "bold" );
		$( "#submit" ).prop( "disabled", true );
		SendImage();
	} );

	$( "#submitUsername" ).on( "click", function ()
	{
		const user = $( "#username" ).val();

		if ( UsernameIsValid( user ) )
		{
			_username = user;
			socket.emit( "joinRoom", { roomId: 0, username: _username } );
			ToggleUsernameModal( false );
		}
		else
		{
			$( "#username" ).addClass( "is-danger" );
			$( "#username" ).val( "" );
		}
	} );


	$( "#votingButtons" ).on( "click", function ()
	{
		socket.emit( "vote", {
			id: $( this ).data( "id" ),
			action: $( this ).attr( "data-action" )
		} );

		if ( !DrawNextOpponentCanvas() )
		{
			ToggleDrawingModal( false );
			// round is over
		}
	} );

	ToggleUsernameModal( true );
} );


function ToggleUsernameModal( a_show )
{
	$( "#usernameSelectModal" ).css( "display", a_show ? "inherit" : "none" );
}

function ToggleDrawingModal( a_show )
{
	$( "#imageDrawingModal" ).css( "display", a_show ? "inherit" : "none" );
}

function UsernameIsValid( a_username )
{
	// Disallow spaces for usernames with minimum length of 1 character
	return a_username.match( /^\S+$/ ) != undefined;
}

function CreateOpponent( a_opponentData )
{
	if ( a_opponentData.id != _id )
	{
		/*$( "#canvasOutlet" ).append(
			"<br data-opponent-id='" + a_opponentData.id + "' />" + // lol
			"<canvas class='canvas opponentCanvas' width=500 height=500 " +
			"data-opponent-id='" + a_opponentData.id + "' />"
		);*/

		var thisOpponent = {
			id: a_opponentData.id,
			name: a_opponentData.name,
			imageSubmitted: false,
			imageData: undefined,
			drawnCanvas: false
			//context: $( "canvas[data-opponent-id='" + a_opponentData.id + "']" )[ 0 ]
			//	.getContext( "2d" )
		};

		opponents.push( thisOpponent );
	}

	$( "#userOutlet" ).append(
		"<div class='panel-block' data-opponent-id='" + a_opponentData.id + "'>" +
		"	<span class='panel-icon'><i class='fa fa-user'></i></span>" +
		a_opponentData.name +
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

	return opponentsReady == opponents.length && _imageSubmitted;
}

function ResetRound()
{
	for ( var i = 0; i < opponents.length; ++i )
	{
		opponents[ i ].imageSubmitted = false;
		opponents[ i ].imageData = undefined;
		opponents[ i ].drawnCanvas = false;
		$( "#userOutlet [data-opponent-id='" + opponents[ i ].id + "']" ).css( "font-weight", "normal" );
	}

	_imageSubmitted = false;
	ResetCanvas();

	$( "#submit" ).prop( "disabled", false );
	$( "#userOutlet [data-opponent-id='" + _id + "']" ).css( "font-weight", "normal" );
}


function DrawNextOpponentCanvas()
{
	/*for ( var i = 0; i < opponents.length; ++i )
	{
		OpponentRedraw( opponents[ i ].context, opponents[ i ].imageData );
	}*/

	ToggleDrawingModal( true );

	var drawnCanvases = 0;
	for ( var i = 0; i < opponents.length; ++i )
	{
		if ( !opponents[ i ].drawnCanvas )
		{
			$( "#imageDrawingModal .modal-card-title" ).text( "Watching: " + opponents[ i ].name );
			SetVoteButtons( opponents[ i ].id );
			OpponentRedraw( $( "#imagePlaybackCanvas" )[ 0 ].getContext( "2d" ), opponents[ i ].imageData );
			
			opponents[ i ].drawnCanvas = true;
			break;
		}
		++drawnCanvases;
	}

	return drawnCanvases < opponents.length;
}

function SetVoteButtons( a_opponentId )
{
	$( "#votingButtons" ).each( ( a_index, a_element ) =>
	{
		$( a_element ).data( "id", a_opponentId );
	} );
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