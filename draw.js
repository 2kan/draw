require( "pretty-error" ).start(); // yaaay
const path = require( "path" );

const express = require( "express" );
const app = express();
const http = require( "http" ).Server( app );
const io = require( "socket.io" )( http, { wsEngine: "ws" } );

const PUBLIC_HTML = "public";

app.use( express.static( PUBLIC_HTML ) );
/*app.get( "/", function ( a_req, a_res )
{
	a_res.sendFile( path.join( __dirname, PUBLIC_HTML, "index.html" ) );

} );*/

//const UserManager = new ( require( "./UserManager.js" ) )( io );
const UserManager = require( "./UserManager.js" );

const _UserManager = new UserManager( io );


const port = 5500;
http.listen( port, function ()
{
	console.log( "Listening on " + port );
} );