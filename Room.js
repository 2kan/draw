"use strict"

module.exports = class Room
{
	constructor( a_userManager, a_roomId )
	{
		this._usrmgr = a_userManager;
		this.roomId = a_roomId;
		this.users = [];
		this.userCount = 0;
	}

	AddUser( a_userId )
	{
		console.log( "id " + a_userId + " joined room!" );
		//console.log( this.users );
		const id = this.userCount;
		++this.userCount;

		this.EmitToRoom( a_userId, "playerJoinedRoom", { id: a_userId, name: a_userId } );
		this._usrmgr.EmitToUser( a_userId, "playerList", this.users );

		this.users.push( { id: a_userId, name: a_userId } );
		//console.log( this.users );
		return id;
	}

	RemoveUser( a_userId )
	{
		this.EmitToRoom( a_userId, "playerLeftRoom", { id: a_userId } );

		for ( var i = 0; i < this.users.length; ++i )
			if ( this.users[ i ].id == a_userId )
				this.users.splice( i, 1 );
	}

	GetUsers()
	{
		return this.users;
	}

	EmitToRoom( a_senderId, a_messageName, a_value )
	{
		for ( var i = 0; i < this.users.length; ++i )
		{
			if ( this.users[ i ] == a_senderId )
				continue;
			this._usrmgr.EmitToUser( this.users[ i ].id, a_messageName, a_value );
		}
	}
}