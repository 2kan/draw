var socket = io();
socket.emit( "joinRoom", "0" );

socket.on( "opponentImageData", function ( a_opponentImage )
{
	console.log( a_opponentImage );

	// see notes in jquery ready function
	DrawOpponentCanvas( $( ".opponentCanvas" )[ 0 ].getContext( "2d" ), a_opponentImage.imageData );
} );


var opponentCanvasses = [];

$( document ).ready( function ()
{
	// bleh
	// will fix this later once my tests work
	opponentCanvasses.push( $( ".opponentCanvas" )[ 0 ] );
} );

function SendImage()
{
	socket.emit( "imageSubmission", drawEvent );
}


function DrawOpponentCanvas( a_canvas, a_drawEvents )
{
	for ( var i = 0; i < a_drawEvents.length; ++i )
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

		await sleep( 30 );
	}
}

function sleep( a_millis )
{
	return new Promise( resolve => setTimeout( resolve, a_millis ) );
}