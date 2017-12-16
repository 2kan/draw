var socket = io();

var context = undefined;
var paint = false;

var clickX = [];
var clickY = [];
var clickDrag = [];

var drawEvent = [];

const penEnum = {
	DEFAULT: "#df4b26",
	ERASER: "#ffffff"
};
const sizeEnum = {
	SMALL: 2,
	NORMAL: 5,
	BIG: 15
}
var penColor = penEnum.DEFAULT;
var penSize = sizeEnum.NORMAL;


$( document ).ready( function ()
{
	context = $( "#drawCanvas" )[ 0 ].getContext( "2d" );
	CreateCanvas( "#drawCanvas" );
} );

function GetMousePos ( a_mouseEvent )
{
	var offset = $( "#drawCanvas" ).offset();
	return {
		x: a_mouseEvent.pageX - offset.left,
		y: a_mouseEvent.pageY - offset.top
	};
}

function AddPoint ( a_mousePos, a_dragging )
{
	drawEvent.push(
		{
			x: a_mousePos.x,
			y: a_mousePos.y,
			dragging: a_dragging,
			color: penColor,
			size: penSize
		}
	);
}

function Redraw ()
{
	context.clearRect( 0, 0, context.canvas.width, context.canvas.height );

	context.lineJoin = "round";

	for ( var i = 0; i < drawEvent.length; ++i )
	{
		context.strokeStyle = drawEvent[ i ].color;
		context.lineWidth = drawEvent[ i ].size;
		context.beginPath();

		if ( drawEvent[ i ].dragging && i )
		{
			context.moveTo( drawEvent[ i - 1 ].x, drawEvent[ i - 1 ].y );
		}
		else
		{
			context.moveTo( drawEvent[ i ].x - 1, drawEvent[ i ].y );
		}

		context.lineTo( drawEvent[ i ].x, drawEvent[ i ].y );

		context.closePath();
		context.stroke();
	}
}

function CreateCanvas ( a_canvasId )
{
	$( a_canvasId ).on( "mousedown", function ( e )
	{
		paint = true;

		AddPoint( GetMousePos( e ) );
		Redraw();
	} );

	$( a_canvasId ).on( "mousemove", function ( e )
	{
		if ( paint )
		{
			AddPoint( GetMousePos( e ), true );
			Redraw();
		}
	} );

	$( a_canvasId ).on( "mouseup", function ( e )
	{
		paint = false;
	} );

	$( a_canvasId ).on( "mouseleave", function ( e )
	{
		paint = false;
	} );

	$( a_canvasId ).on( "click", function ()
	{
		penColor = penEnum.DEFAULT;
		penSize = sizeEnum.NORMAL;
	} );

	$( a_canvasId ).on( "click", function ()
	{
		penColor = penEnum.ERASER;
		penSize = sizeEnum.BIG;
	} );
}