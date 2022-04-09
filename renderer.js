const fs = require("fs");
const pug = require("pug");
const path = require("path");
const exec = require('child_process').exec;
const root = document.querySelector("div#app");
let currentContext;
const contexts = {};
const dataFile = "data.json";
let data;
refreshData();

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
}

contexts.computer = {
	template: "computer.pug"
}

contexts.iwads = {
	template: "iwads.pug"
}

contexts.iwad = {
	template: "iwad.pug"
}

contexts.autoloadProfiles = {
	template: "autoloadProfiles.pug"
}

contexts.autoloadProfile = {
	template: "autoloadProfile.pug"
}

contexts.sourceports = {
	template: "sourceports.pug"
}

contexts.sourceport = {
	template: "sourceport.pug"
}

function addProfile()
{
	editProfile("{}");
	const form = document.getElementById("profileForm");
	console.log(name);
	form["name"].removeAttribute("disabled");
}

function deleteProfile(profile)
{
	data.profiles.splice(data.profiles.indexOf(profile));
	writeData();
	refresh();
}

function changeContext(context, input=null)
{
	const func = context.func;
	const pugFunc = context.pugFunc;

	if( !input )
	{
		refreshData();
		input = data;
	}

	const html = pugFunc(input);
	root.innerHTML = html;
	currentContext = context;

	if(func)
	{
		func();
	}
}

function refreshData()
{
	data = JSON.parse(fs.readFileSync(dataFile));
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

		if( !fs.existsSync(val.template))
		{
			console.log( "Cannot find " + val.template );
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
	changeContext( contexts.computer, {
		data: data,
		computer: JSON.parse(computer)
	});
	console.log( "Editing computer> " + JSON.stringify(computer));
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
	let sourceportPath = sanitise(sourceport.paths[computer.os]);

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

function sanitise(str)
{
	if(!str)
	{
		return str;
	}

	str = str.replaceAll("/", path.sep);
	str = str.replaceAll("\\", path.sep);

	return str;
}

function expand(str="")
{
	return str.replaceAll(/(?<!\\|[\+-]\w+) /g,"\n");
}

function countLines(str="")
{
	str = str.trim();

	if( str.match( /\s+/g ) )
	{
		return 0;
	}
	else
	{
		return str.match(/\n/g ).length;
	}
}

function contract(str="")
{
	return str.replaceAll(/\n/g," ");
}
