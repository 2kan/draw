var socket = io();

$( document ).ready( function ()
{
	
} );

function SendImage()
{
	socket.emit( "imageSubmission", drawEvent );
}