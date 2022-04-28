const fs = require("fs");
const pug = require("pug");
const path = require("path");
const exec = require('child_process').exec;
const root = document.querySelector("div#app");
const contexts = {};
let dataFile = "../data.json";
const selectedComputerTitle = "Selected Computer: ";
let data;
let selectedComputer;
//refreshData();

if(!fs.existsSync(dataFile))
{
	console.log("Data file not found");
	const candidates = ["/Users/candice/Dropbox/SaveGames/doom/data.json", "c:/users/kixs_/dropbox/savegames/doom/data.json",
	                    "c:/users/candice/dropbox/savegames/doom/data.json"];

	for(const x in candidates)
	{
		const candidate = candidates[x];
		console.log("Trying " + candidate);

		try
		{
			if(fs.existsSync(candidate))
			{
				console.log("FOUND");
				dataFile = candidate;
				break;
			}
		}
		catch(e)
		{

		}
	}
}

console.log("FILE: " + dataFile);

contexts.profiles = {
	template: "profiles.pug",
	func    : searchFunc
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

let currentContext;

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
changeContext(contexts.computers);
updateSelectedComputer();

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
	let profile = getProfile(name);
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

	/*if(!newProfile)
	{
		alert("Profile Updated!");
	}
	else
	{
		alert("Profile Added!");
	}*/

	changeContext(contexts.profiles);
}

function writeData()
{
	fs.writeFileSync(dataFile, JSON.stringify(data));
}

function sanitiseObject(obj)
{
	console.log("-----=====Before=====-----\n" + JSON.stringify(obj, null, "\t"));
	if(!obj)
	{
		return obj;
	}

	const keys = Object.keys(obj);

	for(const x in keys)
	{
		const key = keys[x];
		console.log("Trying " + key);
		switch(typeof obj[key])
		{
			case "object":
				console.log("OBJECT");
				obj[key] = sanitiseObject(obj[key]);
				break;
			case "string":
				console.log("STRING");
				obj[key] = sanitise(obj[key]);
				break;
			default:
				//Leave alone
				console.log("OTHER");
				break;
		}
	}
	console.log("-----=====After=====-----\n" + JSON.stringify(obj, null, "\t"));
	return obj;
}

function refresh()
{
	changeContext(currentContext);
	window.scrollTo(0, 0);
}

function getProfile(name)
{
	console.log(`Finding profile ${name}`);
	let selected;
	const arr = data.profiles;
	const keys = Object.keys(arr);

	for(const x in keys)
	{
		const key = keys[x];
		const val = arr[key];

		if(val.name === name)
		{
			selected = val;
			break;
		}
	}

	console.log("Result: " + JSON.stringify(selected));

	return selected;
}

function doom(profileName)
{
	const profile = getProfile(profileName);

	if(!profile)
	{
		return;
	}

	if(!selectedComputer)
	{
		alert("You have not selected a computer yet.");
		return;
	}

	const computer = selectedComputer;

	console.log("-----=====DOOM=====-----");
	console.log("Profile: " + JSON.stringify(profile));
	console.log("Computer: " + JSON.stringify(selectedComputer));

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
	console.log("BEFORE: " + JSON.stringify(data.profiles));

	data.profiles = data.profiles.filter(function(ele)
	                                     {
		                                     return ele != profile;
	                                     });

	data.profiles.unshift(profile);

	console.log("AFTER: " + JSON.stringify(data.profiles));
	writeData();
	refresh();

	exec(command, {cwd: dir}, () =>
	{
		//Do nothing
	});
}

function escape(htmlStr)
{
	return htmlStr.replace(/&/g, "&amp;")
	              .replace(/</g, "&lt;")
	              .replace(/>/g, "&gt;")
	              .replace(/"/g, "&quot;")
	              .replace(/'/g, "&#39;");

}

function unEscape(htmlStr)
{
	htmlStr = htmlStr.replace(/&lt;/g, "<");
	htmlStr = htmlStr.replace(/&gt;/g, ">");
	htmlStr = htmlStr.replace(/&quot;/g, "\"");
	htmlStr = htmlStr.replace(/&#39;/g, "\'");
	htmlStr = htmlStr.replace(/&amp;/g, "&");
	return htmlStr;
}

function sanitise(str)
{
	if(!str || typeof str !== "string")
	{
		return str;
	}

	console.log("Before str: " + str);
	str = str.replaceAll(/'/ig, "\\\'");
	str = str.replaceAll(/"/ig, "\\\"");
	console.log("After str: " + str);
	return str;
}

function sanitisePath(str)
{
	if(!str)
	{
		return str;
	}

	if(path)
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

function getComputer(computerName)
{
	const computers = data.computers;
	let computer;

	for(const x in Object.keys(computers))
	{
		const name = Object.keys(computers)[x];
		const obj = computers.name;

		if(name === computerName)
		{
			computer = obj;
			break;
		}
	}

	return computer;
}

function selectComputer(computer)
{
	if(!computer)
	{
		return;
	}

	selectedComputer = JSON.parse(computer);
	updateSelectedComputer();
	changeContext(contexts.profiles);
}

function updateSelectedComputer()
{
	let text = selectedComputerTitle;

	if(selectedComputer && selectedComputer.name)
	{
		text += selectedComputer.name;
	}
	else
	{
		text += "None";
	}

	document.querySelector("#selectedComputer").innerText = text;
}

function searchFunc()
{
	const search = document.querySelector("#search");
	search.addEventListener("input", updateSearch);
}

function updateSearch()
{
	const searchTerm = document.querySelector("#search").value;
	const rows = document.querySelectorAll(".profileRow");
	console.log("Searching " + searchTerm);
	const regex = new RegExp(searchTerm || ".*", "ig");

	rows.forEach(function()
	             {

	             });

	for(const x in rows)
	{
		const row = rows[x];

		if(!row || typeof row !== "object" || !row instanceof Element)
		{
			continue;
		}

		const rowName = row.querySelector(".profileName").innerText;

		if(!rowName.match(regex))
		{
			console.log(rowName + " MATCH");
			row.style.display = "none";
		}
		else
		{
			console.log(rowName);
			row.style.display = "";
		}
	}
}
