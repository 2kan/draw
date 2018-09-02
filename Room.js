"use strict"

module.exports = class Room
{
	constructor ( a_userManager, a_roomId )
	{
		this._usrmgr = a_userManager;
		this.roomId = a_roomId;
		this.users = [];
		this.userCount = 0;

		this.STATES = {
			ROUND_START: 0,
			ROUND_IN_PROGRESS: 1,
			ROUND_END: 2
		};
		this.state = this.STATES.ROUND_START;
	}

	AddUser( a_userId, a_username )
	{
		console.log( "id " + a_userId + " joined room!" );
		//console.log( this.users );
		const id = this.userCount;
		++this.userCount;
		this.users.push( { id: a_userId, name: a_username } );

		this.EmitToRoom( a_userId, "playerJoinedRoom", { id: a_userId, name: a_username } );
		this._usrmgr.EmitToUser( a_userId, "playerList", this.users );

		//console.log( this.users );
		return id;
	}

	RemoveUser( a_userId )
	{
		if ( !this.GetUser( a_userId ) )
			return;

		this.EmitToRoom( a_userId, "playerLeftRoom", { id: a_userId } );

		for ( var i = 0; i < this.users.length; ++i )
			if ( this.users[ i ].id == a_userId )
				this.users.splice( i, 1 );
	}

	GetUsers()
	{
		return this.users;
	}

	GetUser( a_userId )
	{
		for ( var i = 0; i < this.users.length; ++i )
		{
			if ( this.users[ i ].id == a_userId )
				return this.users[ i ];
		}
	}

	ResetRound()
	{
		this.state = this.STATES.ROUND_START;
		this.EmitToRoom( -1, "resetRound", { reset: true } );
	}

	EmitToRoom( a_senderId, a_messageName, a_value )
	{
		for ( var i = 0; i < this.users.length; ++i )
		{
			if ( this.users[ i ].id == a_senderId )
				continue;
			this._usrmgr.EmitToUser( this.users[ i ].id, a_messageName, a_value );
		}
	}

	SubmitImage( a_senderId, a_imageData )
	{
		this.EmitToRoom( a_senderId, "opponentImageData", {
			id: a_senderId,
			imageData: a_imageData
		} );
	}
}