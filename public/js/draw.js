var socket = io();

var _drawProgressively = true;
var opponents = [];
var _imageSubmitted = false;
var _username = "some idiot";
var _id = -1;
var _prompt = "client is fucked";

var userInRoom = false;

var roundHistory = [];
var _watchingReplay = false;

const APP_NAME = "draw";

socket.on( "welcome", function ( a_welcomeData )
{
	_id = a_welcomeData.id;
} );

socket.on( "joinRoomResult", function ( a_result )
{
	if ( !a_result.ok )
		alert( "Could not join room! Reason: " + a_result.reason );
	else
	{
		_prompt = a_result.prompt;
		$( "#prompt" ).text( _prompt );

		userInRoom = true;
	}
} );

socket.on( "playerJoinedRoom", function ( a_opponentData )
{
	console.log( "Opponent " + a_opponentData.id + " joined the room" );
	CreateOpponent( a_opponentData );
} );

socket.on( "playerList", function ( a_opponents )
{
	$( "#userOutlet" ).empty();
	for ( var i = 0; i < a_opponents.length; ++i )
		CreateOpponent( a_opponents[ i ] );
} );

socket.on( "roomList", function ( a_rooms )
{
	const template = "<div class='level' data-id='$id'><div class='level-left'><div class='level-item'><p>$name</p></div></div><div class='level-right'><div class='level-item'><p>$playerCount</p></div></div></div>";
	var html = "";
	for ( var i = 0; i < a_rooms.roomList.length; ++i )
	{
		html += template
			.replace( "$id", a_rooms.roomList[ i ].id )
			.replace( "$name", a_rooms.roomList[ i ].name )
			.replace( "$playerCount", a_rooms.roomList[ i ].playerCount + " players" );
	}

	const rooms = $( html );

	rooms.on( "click", function ()
	{
		const roomId = $( this ).attr( "data-id" );
		socket.emit( "joinRoom", { roomId: roomId, username: _username } );
		opponents = [];
		ToggleRoomSelectionModal( false );
	} );

	$( "#roomList" ).empty();
	$( "#roomList" ).append( rooms );
} );

socket.on( "createRoomResult", function ( a_result )
{
	if ( a_result.ok )
	{
		opponents = [];
		socket.emit( "joinRoom", { roomId: a_result.id, username: _username } );
	}
	else
	{
		alert( "Could not create room. Check server." );
	}
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
		AddRoundToHistory();
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

socket.on( "newRound", function ( a_roundData )
{
	console.log( "Recevied new round data: " + JSON.stringify( a_roundData ) );
	_prompt = a_roundData.prompt;
	$( "#prompt" ).text( _prompt );
} );



$( document ).ready( function ()
{
	$( "#resetRoundButton" ).on( "click", function ()
	{
		RequestResetRound();
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
			//socket.emit( "joinRoom", { roomId: 0, username: _username } );
			ToggleUsernameModal( false );

			if ( !userInRoom )
				ToggleRoomSelectionModal( true );
		}
		else
		{
			$( "#username" ).addClass( "is-danger" );
			$( "#username" ).val( "" );
		}
	} );


	$( "#votingButtons button[data-action]" ).on( "click", function ()
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
		// Generate the filename. Man this is a lot of code for something that should be simple
		const targetId = $( this ).data( "id" );
		const filename = GenerateWebmFilename( targetId );

		DownloadWebm( filename );

		if ( _watchingReplay )
		{
			_watchingReplay = false;
			ToggleDrawingModal( false );
		}
	} );

	$( "#refreshRoomList" ).on( "click", function ()
	{
		RequestRoomList();
	} );

	$( "#newRoomButton" ).on( "click", function ()
	{
		ToggleNewRoomModal( true );
	} );

	$( "#submitRoomName" ).on( "click", function ()
	{
		const name = $( "#roomNameInput" ).val();

		if ( RoomNameIsValid( name ) )
		{
			socket.emit( "createRoom", { name: name } );
			ToggleNewRoomModal( false );
			ToggleRoomSelectionModal( false );
		}
		else
		{
			$( "#roomNameInput" ).addClass( "is-danger" );
			$( "#roomNameInput" ).val( "" );
		}
	} );

	$( "#leaveRoomButton" ).on( "click", () => ToggleRoomSelectionModal( true ) );

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

function ToggleRoomSelectionModal( a_show )
{
	$( "#roomSelectionModal" ).css( "display", a_show ? "inherit" : "none" );

	if ( a_show )
		RequestRoomList();
}

function ToggleNewRoomModal( a_show )
{
	$( "#createRoomModal" ).css( "display", a_show ? "inherit" : "none" );

	if ( !a_show )
		$( "#roomNameInput" ).val( "" );
}

function RequestRoomList()
{
	socket.emit( "updateRoomList" );
}

function UsernameIsValid( a_username )
{
	// Disallow spaces for usernames with minimum length of 1 character
	return a_username.match( /^\S+$/ ) != undefined;
}

function RoomNameIsValid( a_roomName )
{
	// Disallow spaces for usernames with minimum length of 1 character
	return a_roomName.match( /^\S.*$/ ) != undefined;
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

function RequestResetRound()
{
	socket.emit( "resetRound", { ok: true } );
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

			OpponentRedraw( canvas.getContext( "2d" ), opponents[ i ],
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

					AddRecordingToRoundHistory();
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
	if ( _watchingReplay )
		$( "#exportToGif" ).prop( "disabled", false );
	else
		$( "#votingButtons button" ).each( ( a_index, a_element ) =>
		{
			$( a_element ).prop( "disabled", false );
		} );
}

//
// Here's where I copy and paste the normal canvas code to work for one opponent
// todo: make this not shit
//
async function OpponentRedraw( a_context, a_opponent, a_startCallback, a_doneCallback )
{
	const yOffset = 50;
	const drawEvents = a_opponent.imageData;

	a_context.clearRect( 0, 0, a_context.canvas.width, a_context.canvas.height );

	// Draw white background
	a_context.fillStyle = "#ffffff";
	a_context.fillRect( 0, 0, a_context.canvas.width, a_context.canvas.height );

	a_context.fillStyle = "#e6d08e";
	a_context.fillRect( 0, 0, a_context.canvas.width, yOffset );
	a_context.fillRect( 0, a_context.canvas.height - yOffset, a_context.canvas.width, 50 );

	// Insert watermarks on canvas
	a_context.fillStyle = "#000000"
	a_context.font = "20px sans-serif";
	const titleMetrics = a_context.measureText( _prompt );

	const usernameWatermark = "Drawn by " + a_opponent.name
	const usernameMetrics = a_context.measureText( usernameWatermark );

	a_context.fillText( _prompt, ( a_context.canvas.width - titleMetrics.width ) / 2, 30 );
	a_context.fillText( usernameWatermark, ( a_context.canvas.width - usernameMetrics.width ) / 2, a_context.canvas.height - 16 );

	a_context.lineJoin = "round";

	if ( a_startCallback )
		a_startCallback();

	for ( var i = 0; i < drawEvents.length; ++i )
	{
		a_context.strokeStyle = drawEvents[ i ].color;
		a_context.lineWidth = drawEvents[ i ].size;

		a_context.beginPath();

		if ( drawEvents[ i ].dragging && i )
		{
			a_context.moveTo( drawEvents[ i - 1 ].x, drawEvents[ i - 1 ].y + yOffset );
		}
		else
		{
			a_context.moveTo( drawEvents[ i ].x - 1, drawEvents[ i ].y + yOffset );
		}

		a_context.lineTo( drawEvents[ i ].x, drawEvents[ i ].y + yOffset );

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

function AddRoundToHistory()
{
	const promptTemplate = "<a class='panel-block promptHeading'>$prompt</a>";
	const drawingTemplate = "<a class='panel-block drawingListing' data-round-id='$roundId' data-id='$id'><span class='panel-icon'><i class='fas fa-pencil-alt'></i></span>$playerName</a>";

	while ( roundHistory.length >= 3 )
	{
		for ( var i = 0; i < roundHistory[ 0 ].opponents.length; ++i )
			window.URL.revokeObjectURL( roundHistory[ 0 ].opponents[ i ].webmUrl );

		roundHistory = roundHistory.slice( 0, 1 );
	}

	roundHistory.push( { prompt: _prompt, opponents: [] } );
	for ( var i = 0; i < opponents.length; ++i )
	{
		roundHistory[ roundHistory.length - 1 ].opponents.push( {
			id: opponents[ i ].id,
			name: opponents[ i ].name,
			imageData: opponents[ i ].imageData
		} );
	}

	var newElements = [];
	for ( var i = 0; i < roundHistory.length; ++i )
	{
		newElements.push( $( promptTemplate.replace( "$prompt", _prompt ) ) );

		for ( var k = 0; k < roundHistory[ i ].opponents.length; ++k )
		{
			var listing = $( drawingTemplate
				.replace( "$roundId", i )
				.replace( "$id", roundHistory[ i ].opponents[ k ].id )
				.replace( "$playerName", roundHistory[ i ].opponents[ k ].name )
			);

			listing.on( "click", function ()
			{
				const id = $( this ).attr( "data-id" );
				const roundId = $( this ).attr( "data-round-id" );

				_watchingReplay = true;
				//ToggleDrawingModal( true );

				for ( var i = 0; i < roundHistory[ roundId ].opponents.length; ++i )
					if ( roundHistory[ roundId ].opponents[ i ].id == id )
						DownloadWebm(
							GenerateWebmFilename( roundHistory[ roundId ].opponents[ i ].id ),
							roundHistory[ roundId ].opponents[ i ].webmUrl
						);
			} );

			newElements.push( listing );
		}
	}

	//const obj = $( html );
	//obj.find( ".drawingListing" ).

	$( "#roundHistoryOutlet" ).empty();
	$( "#roundHistoryOutlet" ).append( newElements );

}

function AddRecordingToRoundHistory( a_opponentId )
{
	const roundIndex = roundHistory.length - 1;
	for ( var i = 0; i < roundHistory[ roundIndex ].opponents.length; ++i )
	{
		if ( roundHistory[ roundIndex ].opponents[ i ].id == a_opponentId )
			roundHistory[ roundIndex ].opponents[ i ].webmUrl = GetWebmDownloadLink();
	}
}


function GenerateWebmFilename( a_opponentId )
{
	var filename = "blep";
	for ( var i = 0; i < opponents.length; ++i )
	{
		if ( opponents[ i ].id == a_opponentId )
		{
			const timestamp = ( new Date() ).toISOString().replace( "T", " " ).substring( 0, 19 );
			filename = `${ APP_NAME } ${ opponents[ i ].name } ${ timestamp }`;
			break;
		}
	}

	return filename;
}



function sleep( a_millis )
{
	return new Promise( resolve => setTimeout( resolve, a_millis ) );
}