// The below is pretty sloppy. It's the result of hours spent trying to export a
// GIF of the canvas but not being satisfied with 30+ second processing times.
//
// The below technically works because a user can only have one opponent's drawing data
// played back at a time.
//
// I know it's horrible, but it's all I've got left. I'll revisit this once the rest of
// the features are complete.
//
// A good start would be refactoring most of the app to be nicely segregated into classes.
// Who said isolation was a bad thing? Hah, it's a play on words.

var _gifRec;
var _chunks;

function StartWebmRecording( a_canvas )
{
	_chunks = [];
	const stream = a_canvas.captureStream();
	_gifRec = new MediaRecorder( stream );

	_gifRec.ondataavailable = e => _chunks.push( e.data );

	_gifRec.start();
}

function StopWebmRecording()
{
	_gifRec.stop();
	//ExportVid(new Blob( _chunks, { type: "video/webm" } ));
}

function DownloadWebm(a_filename)
{
	const url = URL.createObjectURL( new Blob( _chunks, { type: "video/webm" } ) );
	const link = document.createElement( "a" );

	link.href = url
	link.download = a_filename;
	link.click();
	window.URL.revokeObjectURL( url );
}