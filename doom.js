const fs = require("fs");
const path = require("path");
const exec = require('child_process').exec;

const profiles = JSON.parse(fs.readFileSync("data/profiles.json"));
const sourceports = JSON.parse(fs.readFileSync("data/sourceports.json"));
const computers = JSON.parse(fs.readFileSync("data/computers.json"));
const iwads = JSON.parse(fs.readFileSync("data/iwads.json"));
const autoloadProfiles = JSON.parse(fs.readFileSync("data/autoloadProfiles.json"));

function doom(profileName)
{
	let profile;

	for(const i in profiles)
	{
		const currentProfile = profiles[i];
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

	const computer = computers[2];


	const dir = path.resolve(computer.dir);

	if(!path.isAbsolute(dir))
	{
		throw "Error: Base directory 'dir' must be absolute.";
	}

	const sourceport = sourceports[profile.sourceport];
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

	const iwad = sanitise(iwads[profile.iwad]);
	const extraOptions = sanitise(computer.extraOptions[profile.sourceport]);
	const pwads = sanitise(profile.wads);
	const profileOptions = sanitise(profile.options);
	const sourceportOptions = sanitise(sourceport.options);

	if(sourceportOptions)
	{
		command += " " + sourceportOptions;
	}

	command += " -iwad " + iwad;

	let files = "";

	if(profile.autoloadProfile)
	{
		const autoloadProfile = autoloadProfiles[profile.autoloadProfile];
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

exports.profiles = profiles;
exports.sourceports = sourceports;
exports.computers = computers;
exports.iwads = iwads;
exports.autoloadProfiles = autoloadProfiles;
exports.doom = doom;
