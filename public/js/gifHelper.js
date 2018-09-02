function ExportToGif( a_filename, a_drawEvents, a_doneCallback )
{
	const startTime = new Date() - 0;

	$( "body" ).append( "<canvas id='gifCanvas' class='canvas opponentCanvas' width=500 height=500 style='display: none' />" );
	const canvas = $( "#gifCanvas" );
	const context = canvas[ 0 ].getContext( "2d" )

	context.clearRect( 0, 0, context.canvas.width, context.canvas.height );
	context.fillStyle = "white";
	context.fillRect( 0, 0, context.canvas.width, context.canvas.height );

	context.lineJoin = "round";

	var gifWorker = new Worker( "/js/gifWorker.js" );
	gifWorker.postMessage( {drawEvents: a_drawEvents } );

	gifWorker.onmessage = function ( a_event )
	{
		if ( a_event.done )
		{
			console.log( `GIF generated in ${ ( new Date() - startTime ) / 1000 } seconds` );

			$( "#gifCanvas" ).remove();

			if ( a_doneCallback )
				a_doneCallback();
		}

	}

	/*var gif = new GIF( {
		workers: 10,
		quality: 1,
		width: 500,
		height: 500,
		workerScript: "/js/gif.worker.js"
	} );

	for ( var i = 0; i < a_drawEvents.length; ++i )
	{
		context.strokeStyle = a_drawEvents[ i ].color;
		context.lineWidth = a_drawEvents[ i ].size;

		context.beginPath();

		if ( a_drawEvents[ i ].dragging && i )
		{
			context.moveTo( a_drawEvents[ i - 1 ].x, a_drawEvents[ i - 1 ].y );
		}
		else
		{
			context.moveTo( a_drawEvents[ i ].x - 1, a_drawEvents[ i ].y );
		}

		context.lineTo( a_drawEvents[ i ].x, a_drawEvents[ i ].y );

		context.closePath();
		context.stroke();

		const delay = i == a_drawEvents.length - 1 ? 2000 : 20;
		gif.addFrame( context, { copy: true, delay: delay } );
	}

	// Create handler for when the gif has finished rendering
	gif.on( "finished", function ( blob )
	{
		console.log( `GIF generated in ${ ( new Date() - startTime ) / 1000 } seconds` );

		const url = URL.createObjectURL( blob );
		console.log( url );
		window.open( url, "_blank" );

		$( "#gifCanvas" ).remove();

		if ( a_doneCallback )
			a_doneCallback();
	} );

	gif.render();*/
}