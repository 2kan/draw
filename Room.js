"use strict"

module.exports = class Room
{
	constructor( a_roomId )
	{
		this.roomId = a_roomId;
		this.users = [];
		this.userCount = 0;
	}

	AddUser( a_userId )
	{
		console.log( "joined room!" );
		const id = this.userCount;
		++this.userCount;

		this.users.push( a_userId );
		return id;
	}

	RemoveUser( a_id )
	{
		this.users.splice( this.users.indexOf( a_id ), 1 );
	}

	GetUsers()
	{
		return this.users;
	}
}