require( "pretty-error" ).start(); // yaaay
const path = require( "path" );

const express = require( "express" );
const app = express();
const http = require( "http" ).Server( app );
const io = require( "socket.io" )( http );

const PUBLIC_HTML = "public";

app.use( express.static( "public" ) );
/*app.get( "/", function ( a_req, a_res )
{
	a_res.sendFile( path.join( __dirname, PUBLIC_HTML, "index.html" ) );

} );*/

io.on( "connection", function ( a_sock )
{
	var id = Math.floor( Math.random() * 100 );
	console.log( "user connected - id: " + id );

	a_sock.on( "disconnect", function ()
	{
		console.log( "user disconnected - id: " + id );
	} );

	a_sock.on( "blep", function ( a_msg )
	{
		console.log( "qq: " );
		console.log( a_msg );
	} );
} );



http.listen( 3000, function ()
{
	console.log( "Listening on 3000" );
} );