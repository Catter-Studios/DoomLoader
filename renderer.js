const fs = require("fs");
const pug = require("pug");
const path = require("path");
const exec = require('child_process').exec;
const root = document.querySelector("div#app");
const contexts = {};
const dataFile = "data.json";
let data;
//refreshData();

contexts.profiles = {
	template: "profiles.pug"
};

contexts.profile = {
	template: "profile.pug"
};

contexts.addProfile = {
	template: "profile.pug",
	func    : addProfile
};

contexts.computers = {
	template: "computers.pug"
};

contexts.computer = {
	template: "computer.pug"
};

contexts.iwads = {
	template: "iwads.pug"
};

contexts.iwad = {
	template: "iwad.pug"
};

contexts.autoloadProfiles = {
	template: "autoloadProfiles.pug"
};

contexts.autoloadProfile = {
	template: "autoloadProfile.pug"
};

contexts.sourceports = {
	template: "sourceports.pug"
};

contexts.sourceport = {
	template: "sourceport.pug"
};

let currentContext = contexts.profiles;

function addProfile()
{
	editProfile("{}");
	const form = document.getElementById("profileForm");
	form["name"].removeAttribute("disabled");
}

function deleteProfile(profile)
{
	data.profiles.splice(data.profiles.indexOf(profile));
	writeData();
	refresh();
}

function changeContext(context, input = null)
{
	currentContext = context;
	const func = context.func;
	const pugFunc = context.pugFunc;

	if(!input)
	{
		refreshData();
		input = data;
	}

	if(!input)
	{
		console.log("Data refresh failed");
		return;
	}

	const html = pugFunc(input);
	root.innerHTML = html;

	if(func)
	{
		func();
	}
}

function loadFromFile(varName, fileName)
{
	let str = fs.readFileSync(fileName).toString() + " " + varName;
	str = str.replaceAll(/export/ig, "");
	const ret = eval(str);
	return ret;
}

function refreshData()
{
	data = JSON.parse(fs.readFileSync(dataFile).toString());
}

compileAll();
changeContext(contexts.profiles);

function compileAll()
{
	for(const [key, val] of Object.entries(contexts))
	{
		if(val.pugFunc)
		{
			continue;
		}

		if(!fs.existsSync(val.template))
		{
			console.log("Cannot find " + val.template);
			continue;
		}

		console.log("Compiling " + val.template);
		const pugFunc = pug.compileFile(val.template);

		if(!pugFunc)
		{
			throw "Error during pugFunc creation.";
		}

		val.pugFunc = pugFunc;
	}
}

function editProfile(profile)
{
	changeContext(contexts.profile, {
		data   : data,
		profile: JSON.parse(profile)
	});
	console.log("Editing profile> " + JSON.stringify(profile));
}

function editComputer(computer)
{
	changeContext(contexts.computer, {
		data    : data,
		computer: JSON.parse(computer)
	});
	console.log("Editing computer> " + JSON.stringify(computer));
}

function profileForm(form)
{
	const name = form["name"].value;
	const sourceport = form["sourceport"].value;
	const iwad = form["iwad"].value;
	const autoloadProfile = form["autoloadProfile"].value;
	let profile;

	for(const i in data.profiles)
	{
		const ele = data.profiles[i];

		if(ele.name === name)
		{
			profile = ele;
			break;
		}
	}

	let newProfile = false;

	if(!profile)
	{
		profile = {};
		data.profiles.push(profile);
		newProfile = true;
	}

	profile.name = name;
	profile.sourceport = sourceport;
	profile.iwad = iwad;
	profile.autoloadProfile = autoloadProfile;

	if(form["options"])
	{
		profile.options = contract(form["options"].value);
	}

	if(form["wads"])
	{
		profile.wads = contract(form["wads"].value);
	}

	console.log(JSON.stringify(profile, null, "\t"));
	writeData();

	if(!newProfile)
	{
		alert("Profile Updated!");
	}
	else
	{
		alert("Profile Added!");
	}

	changeContext(contexts.profiles);
}

function writeData()
{
	fs.writeFileSync(dataFile, JSON.stringify(data));
}

function sanitiseObject(obj)
{
	console.log("-----=====Before=====-----\n"+JSON.stringify(obj,null,"\t"));
	if( !obj )
	{
		return obj;
	}

	const keys = Object.keys(obj);

	for( const x in keys )
	{
		const key = keys[x];
		console.log( "Trying " + key );
		switch( typeof obj[key] )
		{
			case "object":
				console.log("OBJECT");
				obj[key] = sanitiseObject( obj[key] );
				break;
			case "string":
				console.log("STRING");
				obj[key] = sanitise( obj[key] );
				break;
			default:
				//Leave alone
				console.log("OTHER");
				break;
		}
	}
	console.log("-----=====After=====-----\n"+JSON.stringify(obj,null,"\t"));
	return obj;
}

function refresh()
{
	changeContext(currentContext);
}

function doom(profileName)
{
	let profile;

	for(const i in data.profiles)
	{
		const currentProfile = data.profiles[i];
		const name = currentProfile.name;

		if(name === profileName)
		{
			profile = currentProfile;
			break;
		}
	}

	if(!profile)
	{
		return;
	}

	const computer = data.computers[2];
	const dir = path.resolve(computer.dir);

	if(!path.isAbsolute(dir))
	{
		throw "Error: Base directory 'dir' must be absolute.";
	}

	const sourceport = data.sourceports[profile.sourceport];
	let sourceportPath = sanitisePath(sourceport.paths[computer.os]);

	if(!path.isAbsolute(sourceportPath))
	{
		sourceportPath = path.join(dir, sourceportPath);
	}

	if(!fs.existsSync(sourceportPath))
	{
		throw "Cannot find sourceport at '" + sourceportPath + "'";
	}

	let command = sourceportPath;

	const iwad = sanitise(data.iwads[profile.iwad]);
	const extraOptions = sanitise(computer.extraOptions);
	const pwads = sanitise(profile.wads);
	const profileOptions = sanitise(profile.options);
	const sourceportOptions = sanitise(sourceport.options);

	if(sourceportOptions)
	{
		command += " " + sourceportOptions;
	}

	command += " -iwad " + iwad;

	let files;

	if(profile.autoloadProfile)
	{
		const autoloadProfile = data.autoloadProfiles[profile.autoloadProfile];
		const before = sanitise(autoloadProfile.before);
		const after = sanitise(autoloadProfile.after);

		files = before + " " + pwads + " " + after;
	}
	else
	{
		files = pwads;
	}

	command += " -file " + files;

	if(extraOptions)
	{
		command += " " + extraOptions;
	}

	if(profileOptions)
	{
		command += " " + profileOptions;
	}

	console.log(command);

	exec(command, {cwd: dir}, () =>
	{
		//process.exit(0);
	});
}

function escape(htmlStr) {
	return htmlStr.replace(/&/g, "&amp;")
	              .replace(/</g, "&lt;")
	              .replace(/>/g, "&gt;")
	              .replace(/"/g, "&quot;")
	              .replace(/'/g, "&#39;");

}

function unEscape(htmlStr) {
	htmlStr = htmlStr.replace(/&lt;/g , "<");
	htmlStr = htmlStr.replace(/&gt;/g , ">");
	htmlStr = htmlStr.replace(/&quot;/g , "\"");
	htmlStr = htmlStr.replace(/&#39;/g , "\'");
	htmlStr = htmlStr.replace(/&amp;/g , "&");
	return htmlStr;
}

function sanitise(str)
{
	if( !str || typeof str !== "string" )
	{
		return str;
	}

	console.log("Before str: " + str );
	str = str.replaceAll(/'/ig,"\\\'");
	str = str.replaceAll(/"/ig,"\\\"");
	console.log("After str: " + str );
	return str;
}

function sanitisePath(str)
{
	if(!str)
	{
		return str;
	}

	if( path )
	{
		str = str.replaceAll("/", path.sep);
		str = str.replaceAll("\\", path.sep);
	}

	return str;
}

function expand(str = "")
{
	return str.replaceAll(/(?<!\\|[\+-]\w+) /g, "\n");
}

function countLines(str = "")
{
	str = str.trim();

	if(str.match(/^\s*$/g))
	{
		return 0;
	}
	else
	{
		if(str.match(/\n/g))
		{
			return str.match(/\n/g).length;
		}
		else
		{
			return 1;
		}
	}
}

function contract(str = "")
{
	return str.replaceAll(/\n/g, " ");
}
