"use strict"

module.exports = class User
{
	constructor ( a_userManager, a_id, a_socket )
	{
		this._usrmgr = a_userManager;
		this.id = a_id;
		this.username = "some idiot";
		this.sock = a_socket;
		this.SetupUser();

		this.roomObj;
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
			this._usrmgr.DeleteUser( this.id );
		} );

		this.sock.on( "imageSubmission", ( a_msg ) =>
		{
			console.log( "received image from id " + this.id );
			this.ReceivedImage( a_msg );
		} );

		this.sock.on( "joinRoom", ( a_joinData ) =>
		{
			console.log( "Joined room " + a_joinData.roomId + " with username " + a_joinData.username );
			this.username = a_joinData.username;
			this.roomObj = this._usrmgr.JoinRoom( this.id, this.username, a_joinData.roomId );
		} );

		this.sock.on( "resetRound", ( a_msg ) =>
		{
			console.log( "Reset room called" );
			this.roomObj.room.ResetRound();
		} );
	}

	ReceivedImage( a_imageData )
	{
		//this._usrmgr.EmitImageToRoom( this.id, this.currentRoom, a_imageData );

		this.roomObj.room.SubmitImage( this.id, a_imageData );
	}
}