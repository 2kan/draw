var socket = io();

var _drawProgressively = true;
var opponents = [];
var _imageSubmitted = false;
var _username = "some idiot";
var _id = -1;

const APP_NAME = "draw";

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

socket.on( "scoreUpdate", function ( a_scoreData )
{
	console.log( a_scoreData );
	UpdatePlayerListWithScores( a_scoreData );
} );

socket.on( "resetRound", function ( a_data )
{
	console.log( "Received round reset message" );
	ResetRound();
} );

socket.on( "gifData", function ( a_data )
{
	console.log( a_data );
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


	$( "#votingButtons button[data-action]" ).on( "click", () =>
	{
		socket.emit( "vote", {
			id: $( this ).data( "id" ),
			action: $( this ).attr( "data-action" )
		} );

		if ( !DrawNextOpponentCanvas() )
		{
			ToggleDrawingModal( false );
			socket.emit( "finishedVoting" );
			// round is over
		}
	} );

	$( "#exportToGif" ).on( "click", function ()
	{
		console.log( "old" );

		// Generate the filename. Man this is a lot of code for something that should be simple
		const targetId = $( this ).data( "id" );
		var filename = "blep";
		for ( var i = 0; i < opponents.length; ++i )
		{
			if ( opponents[ i ].id == targetId )
			{
				const timestamp = ( new Date() ).toISOString().replace( "T", " " ).substring( 0, 19 );
				filename = `${ APP_NAME } ${ opponents[ i ].name } ${ timestamp }`;
				break;
			}
		}

		DownloadWebm( filename );
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
		var thisOpponent = {
			id: a_opponentData.id,
			name: a_opponentData.name,
			imageSubmitted: false,
			imageData: undefined,
			drawnCanvas: false
		};

		opponents.push( thisOpponent );
	}

	const thisPlayerClass = a_opponentData.id == _id ? "player" : "";
	$( "#userOutlet" ).append(
		"<div class='panel-block " + thisPlayerClass + "' data-opponent-id='" + a_opponentData.id + "'>" +
		"	<span class='panel-icon'><i class='fas fa-meh-blank'></i></span>" +
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
	ToggleDrawingModal( true );

	var drawnCanvases = 0;
	for ( var i = 0; i < opponents.length; ++i )
	{
		if ( !opponents[ i ].drawnCanvas )
		{
			$( "#imageDrawingModal .modal-card-title" ).text( "Watching: " + opponents[ i ].name );
			InitVoteButtons( opponents[ i ].id );

			const canvas = $( "#imagePlaybackCanvas" )[ 0 ];

			OpponentRedraw( canvas.getContext( "2d" ), opponents[ i ].imageData,
				// onStart
				function ()
				{
					// Start recording canvas
					StartWebmRecording( canvas );
				},
				// onEnd
				function ()
				{
					EnableVotingButtons();

					// Stop recording and finalize link
					StopWebmRecording();
				}
			);

			opponents[ i ].drawnCanvas = true;
			break;
		}
		++drawnCanvases;
	}

	return drawnCanvases < opponents.length;
}

function InitVoteButtons( a_opponentId )
{
	$( "#votingButtons button" ).each( ( a_index, a_element ) =>
	{
		$( a_element ).data( "id", a_opponentId );
		$( a_element ).prop( "disabled", true );
	} );
}

function EnableVotingButtons()
{
	$( "#votingButtons button" ).each( ( a_index, a_element ) =>
	{
		$( a_element ).prop( "disabled", false );
	} );
}

//
// Here's where I copy and paste the normal canvas code to work for one opponent
// todo: make this not shit
//
async function OpponentRedraw( a_context, a_drawEvent, a_startCallback, a_doneCallback )
{
	a_context.clearRect( 0, 0, a_context.canvas.width, a_context.canvas.height );

	// Draw white background
	a_context.fillStyle = "#ffffff";
	a_context.fillRect( 0, 0, a_context.canvas.width, a_context.canvas.height );

	a_context.lineJoin = "round";

	if ( a_startCallback )
		a_startCallback();

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

	if ( a_doneCallback )
		a_doneCallback();
}

function UpdatePlayerListWithScores( a_scores )
{
	const upvoteLeader = a_scores.total.mostUpvotes.id;
	const downvoteLeader = a_scores.total.mostDownvotes.id;
	const funnyLeader = a_scores.total.mostFunny.id;

	const roundWinner = a_scores.lastRound.mostUpvotes.id;

	const playerList = $( "#userOutlet .panel-block" );
	for ( var i = 0; i < playerList.length; ++i )
	{
		var thisId = $( playerList[ i ] ).data( "opponent-id" );

		if ( funnyLeader == thisId || upvoteLeader == thisId || downvoteLeader == thisId )
		{
			// Funny
			if ( thisId == funnyLeader )
				$( playerList[ i ] ).find( "i" ).removeClass().addClass( "fas fa-grin-squint-tears" );

			// Downvote
			if ( thisId == downvoteLeader )
				$( playerList[ i ] ).find( "i" ).removeClass().addClass( "fas fa-frown-open" );

			// Upvote
			if ( thisId == upvoteLeader )
				$( playerList[ i ] ).find( "i" ).removeClass().addClass( "fas fa-crown" );


			// Round winner
			if ( thisId == roundWinner )
				$( playerList[ i ] ).addClass( "roundWinner" );
			else
				$( playerList[ i ] ).removeClass( "roundWinner" );
		}
		else
			// Not a leader, so return their icon to a meh face
			$( playerList[ i ] ).find( "i" ).removeClass().addClass( "fas fa-meh-blank" );
	}
}

function sleep( a_millis )
{
	return new Promise( resolve => setTimeout( resolve, a_millis ) );
}