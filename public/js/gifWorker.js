onmessage = function ( a_data )
{
	importScripts( "/js/LZWEncoder.js", "/js/NeuQuant.js", "/js/GIFEncoder.js" );

	const rootCanvas = document.createElement( "canvas" );
	rootCanvas.setAttribute( "width", "500" );
	rootCanvas.setAttribute( "height", "500" );
	rootCanvas.setAttribute( "style", "display: none" );

	const body = document.getElementsByTagName( "body" )[ 0 ];
	body.appendChild( rootCanvas );

	const context = rootCanvas[ 0 ].getContext( "2d" );
	const drawEvents = a_data.data.drawEvents;

	var encoder = new GIFEncoder();
	encoder.setRepeat( 0 );
	encoder.setDelay( 20 );

	encoder.start();

	for ( var i = 0; i < drawEvents.length; ++i )
	{
		context.strokeStyle = drawEvents[ i ].color;
		context.lineWidth = drawEvents[ i ].size;

		context.beginPath();

		if ( drawEvents[ i ].dragging && i )
		{
			context.moveTo( drawEvents[ i - 1 ].x, drawEvents[ i - 1 ].y );
		}
		else
		{
			context.moveTo( drawEvents[ i ].x - 1, drawEvents[ i ].y );
		}

		context.lineTo( drawEvents[ i ].x, drawEvents[ i ].y );

		context.closePath();
		context.stroke();

		encoder.addFrame( context );
	}

	encoder.finish();

	encoder.download( a_filename );
}