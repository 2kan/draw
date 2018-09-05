"use strict"

module.exports = class UserManager
{
	constructor ( a_io )
	{
		console.log( "new user man" );
		this.io = a_io;
		this.users = [];
		this.userCount = 0;

		this._Room = require( "./Room.js" );
		this.rooms = [];

		// Create a starting room
		this.rooms.push( { id: 0, room: new this._Room( this, 0, "fun with strangers" ) } );

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

		this.EmitToUser( id, "welcome", { id: id, roomList: this.GetRoomList() } );

		return id;
	}

	CreateRoom( a_roomName )
	{
		const id = this.rooms.length;
		this.rooms.push( { id: id, room: new this._Room( this, id, a_roomName ) } );

		return id;
	}

	JoinRoom( a_userId, a_username, a_roomId )
	{
		var roomObj = this.GetRoom( a_roomId );
		if ( !roomObj )
			return false;

		this.LeaveAllRooms( a_userId );
		roomObj.room.AddUser( a_userId, a_username );
		return roomObj;
	}

	LeaveAllRooms( a_userId )
	{
		for ( var i = 0; i < this.rooms.length; ++i )
		{
			this.rooms[ i ].room.RemoveUser( a_userId );
		}
	}

	DeleteUser( a_userId )
	{
		for ( var i = 0; i < this.rooms.length; ++i )
		{
			this.rooms[ i ].room.RemoveUser( a_userId );
		}

		this.users[ a_userId ] = null;
	}

	GetRoom( a_roomId )
	{
		for ( var i = 0; i < this.rooms.length; ++i )
		{
			if ( this.rooms[ i ].id == a_roomId )
				return this.rooms[ i ];
		}

		return false;

	}

	GetRoomList()
	{
		var rooms = [];
		for ( var i = 0; i < this.rooms.length; ++i )
		{
			rooms.push( this.rooms[ i ].room.GetRoomInfo() );
		}

		return rooms;
	}

	GetIo()
	{
		return this.io;
	}

	EmitToUser( a_userId, a_messageName, a_value )
	{
		//console.log( this.users );
		//console.log( a_userId, a_messageName, a_value );
		this.users[ a_userId ].GetSocket().emit( a_messageName, a_value );
	}
}