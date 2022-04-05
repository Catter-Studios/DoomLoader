const fs = require("fs");
const pug = require("pug");

const COMPILE_TO_FILE = 1;
const COMPILE_TO_FUNC = 2;
const COMPILE_TO_STRING = 3;

exports.compileToFile = function(src, options=null)
{
	const dest = src.replace( ".pug", ".html" );
	compile( {
		outputType:COMPILE_TO_FILE,
		src:src,
		dest:dest,
		options:options
	         } );
}

exports.compileToString= function (src, options=null)
{
	return compile( {
		         outputType:COMPILE_TO_STRING,
		         src:src,
		         options:options
	         } );
}

exports.compileToFunc = function (src, options=null)
{
	return compile( {
		                outputType:COMPILE_TO_FUNC,
		                src:src,
		                options:options
	                } );
}

function compile(settings)
{
	const compileOptions = settings.compileOptions;
	const options = settings.options;
	const outputType = settings.outputType;
	const src = settings.src;
	const dest = settings.dest;

	let func;

	if(compileOptions)
	{
		func = pug.compileFile(src, compileOptions);
	}
	else
	{
		func = pug.compileFile(src);
	}

	if( outputType === COMPILE_TO_FUNC )
	{
		return func;
	}

	let html;

	if(options)
	{
		html = func(options);
	}
	else
	{
		html = func();
	}

	if( outputType === COMPILE_TO_STRING )
	{
		return html;
	}

	if( outputType === COMPILE_TO_FILE )
	{
		fs.writeFileSync(dest, html);
	}
}
