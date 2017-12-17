"use strict"

module.exports = class User
{
	constructor( a_userManager, a_id, a_socket )
	{
		this._usrmgr = a_userManager;
		this.id = a_id;
		this.sock = a_socket;
		this.SetupUser();

		this.currentRoom = -1;
	}

	GetSocket()
	{
		return this.sock;
	}

	SetupUser()
	{
		console.log( "user connected - id: " + this.id );

		this.sock.on( "disconnect", () =>
		{
			console.log( "user disconnected - id: " + this.id );
		} );

		this.sock.on( "imageSubmission", ( a_msg ) =>
		{
			console.log( a_msg );
			this.ReceivedImage( a_msg );
		} );

		this.sock.on( "joinRoom", ( a_roomId ) =>
		{
			this.currentRoom = a_roomId;
			this._usrmgr.JoinRoom( this.id, a_roomId );
		} );
	}

	ReceivedImage( a_imageData )
	{
		this._usrmgr.EmitImageToRoom( this.id, this.currentRoom, a_imageData );
	}
}