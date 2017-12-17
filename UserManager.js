"use strict"

module.exports = class UserManager
{
	constructor( a_io )
	{
		console.log( "new user man" );
		this.io = a_io;
		this.users = [];
		this.userCount = 0;

		const _Room = require( "./Room.js" );
		this.room = new _Room( 0 );

		this.io.on( "connection", ( a_sock ) => { this.CreateUser( a_sock ); } );
		console.log( "ready" );
	}

	CreateUser( a_sock )
	{
		const User = require( "./User.js" );

		const id = this.userCount;
		++this.userCount;

		var newUser = new User( this, id, a_sock );
		this.users[ id ] = newUser;

		return id;
	}

	JoinRoom( a_userId, a_roomId )
	{
		this.room.AddUser( a_userId );
	}

	GetIo()
	{
		return this.io;
	}

	EmitImageToRoom( a_senderId, a_roomId, a_imageData )
	{
		const users = this.room.GetUsers();
		for ( var i = 0; i < users.length; ++i )
		{
			// This won't work for multiple users, but I need to test this first
			if ( users[ i ] != a_senderId )
				this.users[ users[ i ] ].GetSocket().emit( "opponentImageData", {
					id: users[ i ],
					imageData: a_imageData
				} );
		}
	}
}