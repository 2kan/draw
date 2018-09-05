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
			this.username = a_joinData.username;
			var joinSuccess = this._usrmgr.JoinRoom( this.id, this.username, a_joinData.roomId );

			if ( joinSuccess == false )
			{
				this._usrmgr.EmitToUser( this.id, "joinRoomResult", { ok: false, reason: "round in progress" } );
			}
			else
			{
				this.roomObj = joinSuccess;
				this._usrmgr.EmitToUser( this.id, "joinRoomResult", { ok: true, prompt: this.roomObj.room.prompt } );
			}
		} );

		this.sock.on( "updateRoomList", () =>
		{
			console.log( "Sending room list to id " + this.id );

			this._usrmgr.EmitToUser( this.id, "roomList", { roomList: this._usrmgr.GetRoomList() } );
		} );

		this.sock.on( "resetRound", ( a_msg ) =>
		{
			console.log( "Reset room called" );
			this.roomObj.room.ResetRound();
		} );

		this.sock.on( "vote", ( a_msg ) =>
		{
			console.log( "id " + this.id + " submitted vote: " + JSON.stringify( a_msg ) );
			this.roomObj.room.Vote( this.id, a_msg );
		} );

		this.sock.on( "finishedVoting", () =>
		{
			console.log( "id " + this.id + " is finished voting" );
			this.roomObj.room.UserFinishedVoting( this.id );
		} );
	}

	ReceivedImage( a_imageData )
	{
		//this._usrmgr.EmitImageToRoom( this.id, this.currentRoom, a_imageData );

		this.roomObj.room.SubmitImage( this.id, a_imageData );
	}
}