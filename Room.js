"use strict"

module.exports = class Room
{
	constructor ( a_userManager, a_roomId )
	{
		this._usrmgr = a_userManager;
		this.roomId = a_roomId;
		this.users = [];
		this.userCount = 0;
		this.votesCount = 0;

		this.STATES = {
			ROUND_START: 0,
			ROUND_IN_PROGRESS: 1,
			ROUND_END: 2
		};
		this.state = this.STATES.ROUND_START;
	}

	AddUser( a_userId, a_username )
	{
		if ( this.state == this.STATES.ROUND_START )
		{
			console.log( "id " + a_userId + " joined room " + this.roomId + " with username " + a_username );

			const id = this.userCount;
			++this.userCount;
			this.users.push( {
				id: a_userId,
				name: a_username,
				voted: 0,
				votesReceived: {
					funny: 0,
					upvotes: 0,
					downvotes: 0
				},
				votesSent: {
					funny: 0,
					upvotes: 0,
					downvotes: 0
				},
				votesReceivedThisRound:
				{
					funny: 0,
					upvotes: 0,
					downvotes: 0
				}
			} );

			this.EmitToRoom( a_userId, "playerJoinedRoom", { id: a_userId, name: a_username } );
			this._usrmgr.EmitToUser( a_userId, "playerList", this.users );

			//console.log( this.users );
			return id;
		}

		console.log( "id " + a_userId + " attempted to join the room but it is in state " + this.state );
		return false;
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
		this.votesCount = 0;

		for ( var i = 0; i < this.users.length; ++i )
		{
			this.users[ i ].votesReceivedThisRound.funny = 0;
			this.users[ i ].votesReceivedThisRound.upvotes = 0;
			this.users[ i ].votesReceivedThisRound.downvotes = 0;
		}

		this.EmitToRoom( -1, "resetRound", { reset: true } );
	}

	Vote( a_voterUserId, a_voteData )
	{
		const voter = this.GetUser( a_voterUserId );
		const user = this.GetUser( a_voteData.id );

		switch ( a_voteData.action )
		{
			case "upvote":
				++user.votesReceived.upvotes;
				++user.votesReceivedThisRound.upvotes;
				++voter.votesSent.upvotes;
				break;
			case "downvote":
				++user.votesReceived.downvotes;
				++user.votesReceivedThisRound.downvotes;
				++voter.votesSent.downvotes;
				break;
			case "funny":
				++user.votesReceived.funny;
				++user.votesReceivedThisRound.funny;
				; ++voter.votesSent.funny;
				break;
		}
	}

	UserFinishedVoting( a_userId )
	{
		this.GetUser( a_userId ).voted = true;
		++this.votesCount;

		if ( this.votesCount == this.userCount )
			this.CalculateAndEmitScores();
	}

	CalculateAndEmitScores()
	{
		// Create emit data structure
		const voteResults = {
			lastRound: {
				mostUpvotes: {
					count: 0,
					id: -1
				},
				mostDownvotes: {
					count: 0,
					id: -1
				},
				mostFunny: {
					count: 0,
					id: -1
				}
			},
			total: {
				mostUpvotes: {
					count: 0,
					id: -1
				},
				mostDownvotes: {
					count: 0,
					id: -1
				},
				mostFunny: {
					count: 0,
					id: -1
				}
			}
		};


		for ( var i = 0; i < this.users.length; ++i )
		{
			const user = this.users[ i ];

			// Surely there's a better way to do the below... ><

			// Check for most upvotes
			if ( user.votesReceivedThisRound.upvotes > voteResults.lastRound.mostUpvotes.count )
			{
				voteResults.lastRound.mostUpvotes.id = user.id;
				voteResults.lastRound.mostUpvotes.count = user.votesReceivedThisRound.upvotes;
			}
			if ( user.votesReceived.upvotes > voteResults.total.mostUpvotes.count )
			{
				voteResults.total.mostUpvotes.id = user.id;
				voteResults.total.mostUpvotes.count = user.votesReceived.upvotes;
			}

			// Check for most downvotes
			if ( user.votesReceivedThisRound.downvotes > voteResults.lastRound.mostDownvotes.count )
			{
				voteResults.lastRound.mostDownvotes.id = user.id;
				voteResults.lastRound.mostDownvotes.count = user.votesReceivedThisRound.downvotes;
			}
			if ( user.votesReceived.downvotes > voteResults.total.mostDownvotes.count )
			{
				voteResults.total.mostDownvotes.id = user.id;
				voteResults.total.mostDownvotes.count = user.votesReceived.downvotes;
			}

			// Check for most funny
			if ( user.votesReceivedThisRound.funny > voteResults.lastRound.mostFunny.count )
			{
				voteResults.lastRound.mostFunny.id = user.id;
				voteResults.lastRound.mostFunny.count = user.votesReceivedThisRound.funny;
			}
			if ( user.votesReceived.funny > voteResults.total.mostFunny.count )
			{
				voteResults.total.mostFunny.id = user.id;
				voteResults.total.mostFunny.count = user.votesReceived.funny;
			}

		}

		console.log( "Voting is complete. Scores:" );
		console.log( voteResults );
		this.EmitToRoom( -1, "scoreUpdate", voteResults );
		this.ResetRound();
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