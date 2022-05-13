const fs = require("fs");
const pug = require("pug");
const path = require("path");
const exec = require('child_process').exec;
const root = document.querySelector("div#app");
const contexts = {};
const oslib = require("os");
let dataFile = "../data/data.json";
const selectedComputerTitle = "Selected Computer: ";
let data;
let selectedComputer;
let contextInput;

//refreshData();

const platforms = {
	WINDOWS: 'Windows',
	MAC: 'MacOS',
	LINUX: 'Linux'
};

const platformsNames = {
	win32: platforms.WINDOWS,
	darwin: platforms.MAC,
	linux: platforms.LINUX
};

const os = platformsNames[oslib.platform()];

function isMac()
{
	return os === platforms.MAC;
}

function isWindows()
{
	return os === platforms.WINDOWS;
}

function isLinux()
{
	return os === platforms.LINUX;
}

function isUnix()
{
	return isMac() || isLinux();
}

if(__dirname.match(/webstormprojects/igm))
{
	const path = "/Dropbox/SaveGames/doom/data/data.json";

	if( isUnix() )
	{
		dataFile = process.env.HOME + path;
	}

	if( isWindows() )
	{
		dataFile = process.env.UserProfile + path;
	}
}

if(!fs.existsSync(dataFile))
{
	alert("Cannot find data file in " + (__dirname + "/" + dataFile));
}

//console.log("FILE: " + dataFile);

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

function changeContext(context, input = null)
{
	currentContext = context;
	contextInput = input;
	const func = context.func;
	const pugFunc = context.pugFunc;

	if(!input)
	{
		refreshData();
		input = data;
	}

	if(!input)
	{
		//console.log("Data refresh failed");
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
			//console.log("Cannot find " + val.template);
			continue;
		}

		//console.log("Compiling " + val.template);
		const pugFunc = pug.compileFile(val.template);

		if(!pugFunc)
		{
			throw "Error during pugFunc creation.";
		}

		val.pugFunc = pugFunc;
	}
}

function prettyPrint(label, obj)
{
	console.log(label + ": " + JSON.stringify(obj,null,"\t"));
}

function editComputer(computer)
{
	const computerObj = JSON.parse(computer);
	changeContext(contexts.computer, {
		data    : data,
		computer: computerObj
	});
	//console.log("Editing computer> " + JSON.stringify(computer));
}

function computerForm(form)
{
	/*let computer = {};
	const find = getComputer(form.name.value);

	if( find )
	{
		computer = find;
	}

	computer.os = form.os.options[form.os.selectedIndex].value;
	computer.dir = form.dir.value;
	computer.name = form.name.value;

	for( const sourceport in data.sourceports )
	{
		if( !computer.option)

		computer.options[sourceport] = form["options"+sourceport].value;
	}

	writeData();
	changeContext(contexts.computers);*/

	const name = form["name"].value;
	const dir = form["dir"].value;
	const os = form.os.options[form.os.selectedIndex].value;
	const options = {};

	for( const sourceport in data.sourceports )
	{
		options[sourceport] = form["options"+sourceport].value;
	}

	let computer = getComputer(name);

	if(!computer)
	{
		computer = {};
		data.computers.push(computer);
	}

	computer.name = name;
	computer.dir = dir;
	computer.os = os;
	computer.options = options;

	writeData();
	changeContext(contexts.computers);
}

function addComputer()
{
	editComputer("{}");
	const form = document.getElementById("computerForm");
	form["name"].removeAttribute("disabled");
}

function deleteComputer(computer)
{
	const computerObj = JSON.parse(computer);
	prettyPrint("computer object",computerObj);
	prettyPrint("Computers before",data.computers);
	const index = data.computers.findIndex((item)=>{return item.name === computerObj.name});
	prettyPrint("index",data.computers.findIndex((item)=>{return item.name === computerObj.name}));
	data.computers.splice(index,1);
	prettyPrint("Computers after", data.computers);
	writeData();
	refresh();
}

function autoloadProfileForm(form)
{

}

function addAutoloadProfile()
{

}

function deleteAutoloadProfile(autoloadProfile)
{

}

function sourceportForm(form)
{

}

function addSourceport()
{

}

function deleteSourceport(sourceport)
{

}

function iwadForm(form)
{

}

function addIwad()
{

}

function deleteIwad(iwad)
{

}

function editProfile(profile)
{
	changeContext(contexts.profile, {
		data   : data,
		profile: JSON.parse(profile)
	});
	//console.log("Editing profile> " + JSON.stringify(profile));
}

function profileForm(form)
{
	const name = form["name"].value;
	const sourceport = form["sourceport"].value;
	const iwad = form["iwad"].value;
	const autoloadProfile = form["autoloadProfile"].value;
	let profile = getProfile(name);

	if(!profile)
	{
		profile = {};
		data.profiles.push(profile);
	}

	profile.name = name;
	profile.sourceport = sourceport;
	profile.iwad = iwad;
	profile.autoloadProfile = autoloadProfile;

	if(form["options"])
	{
		profile.options = form["options"].value;
	}

	const wadElements = document.querySelectorAll("form#profileForm input.wad");
	const wads = [];

	for( let i = 0; i < wadElements.length; i++ )
	{
		const wadElement = wadElements[i];
		wads.push(wadElement.value);
	}

	profile.wads = wads;

	writeData();
	changeContext(contexts.profiles);
}

function addProfile()
{
	editProfile("{\"wads\":[]}");
	//const form = document.getElementById("profileForm");
	//form["name"].removeAttribute("disabled");
}

function deleteProfile(profile)
{
	profile = JSON.parse(profile);
	const index = data.profiles.findIndex((item)=>{return item.name===profile.name});

	if( index >= 0 )
	{
		data.profiles.splice(index,1);
		writeData();
		refresh();
	}
}

function wadToTop( profile, wad )
{
	const table = document.querySelector("table");

	for( const i in table.rows )
	{
		const row = table.rows[i];
		const wadName = row.querySelector(".wad").value;

		if( wadName === wad )
		{
			table.prepend(row);
			return;
		}
	}
}

function writeData()
{
	fs.writeFileSync(dataFile, JSON.stringify(data, null, "\t"));
}

function sanitiseObject(obj)
{
	//console.log("-----=====Before=====-----\n" + JSON.stringify(obj, null, "\t"));
	if(!obj)
	{
		return obj;
	}

	const keys = Object.keys(obj);

	for(const x in keys)
	{
		const key = keys[x];
		//console.log("Trying " + key);
		switch(typeof obj[key])
		{
			case "object":
				//console.log("OBJECT");
				obj[key] = sanitiseObject(obj[key]);
				break;
			case "string":
				//console.log("STRING");
				obj[key] = sanitise(obj[key]);
				break;
			default:
				//Leave alone
				//console.log("OTHER");
				break;
		}
	}
	//console.log("-----=====After=====-----\n" + JSON.stringify(obj, null, "\t"));
	return obj;
}

function refresh(input = contextInput)
{
	changeContext(currentContext, contextInput);
	window.scrollTo(0, 0);
}

function getProfile(name)
{
	return data.profiles.find((item)=>{return item.name===name;});
}

function getComputer(name)
{
	return data.computers.find((item)=>{return item.name===name;});
}

function checkWads(wads, dir)
{
	for(const i in wads)
	{
		const wad = wads[i];

		if(!fs.existsSync(dir + "/" + wad))
		{
			alert("Cannot find " + wad);
			throw "Cannot find " + wad;
			return;
		}
	}
}

function arrayToWadList(wads)
{
	wads=wads.map(wad=>`"${sanitise(wad)}"`);
	return wads.join(" ");
}

function doom(profileName)
{
	refreshData();
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

	//console.log("-----=====DOOM=====-----");
	//console.log("Profile: " + JSON.stringify(profile));
	//console.log("Computer: " + JSON.stringify(selectedComputer));

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
	const options = sanitise(computer.options[profile.sourceport]);
	const wads = profile.wads;
	checkWads(wads, dir);
	//const pwads = sanitise(wads.join(" "));
	//const pwads = sanitise(profile.wads);
	const pwads = arrayToWadList(profile.wads);
	const profileOptions = sanitise(profile.options);
	const sourceportOptions = sanitise(sourceport.options);

	if(sourceportOptions)
	{
		command += " " + sourceportOptions;
	}

	command += " -iwad " + iwad;

	let files = pwads;

	if(profile.autoloadProfile)
	{
		const autoloadProfile = data.autoloadProfiles[profile.autoloadProfile];

		if(autoloadProfile.before)
		{
			checkWads(autoloadProfile.before, dir);
			files = arrayToWadList(autoloadProfile.before) + " " + files;
		}

		if(autoloadProfile.after)
		{
			checkWads(autoloadProfile.after, dir);
			files = files + " " + arrayToWadList(autoloadProfile.after);
		}
	}
	else
	{
		files = pwads;
	}

	command += " -file " + files;

	if(options)
	{
		command += " " + options;
	}

	if(profileOptions)
	{
		command += " " + profileOptions;
	}

	//console.log(command);
	//console.log("BEFORE: " + JSON.stringify(data.profiles));

	data.profiles = data.profiles.filter(function(ele)
	                                     {
		                                     return ele != profile;
	                                     });

	data.profiles.unshift(profile);

	//console.log("AFTER: " + JSON.stringify(data.profiles));
	writeData();
	refresh();

	console.log("DOOM COMMAND: " + command);

	exec(command, {
		cwd: dir
	}, () =>
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

	//console.log("Before str: " + str);
	str = str.replaceAll(/'/ig, "\\\'");
	str = str.replaceAll(/"/ig, "\\\"");
	//console.log("After str: " + str);
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
	//console.log("Searching " + searchTerm);
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
			//console.log(rowName + " MATCH");
			row.style.display = "none";
		}
		else
		{
			//console.log(rowName);
			row.style.display = "";
		}
	}
}

function addWad(profileName, files)
{
	//const profile = getProfile(profileName);
	//const profileIndex = data.profiles.findIndex((item) => item.name === profileName);
	const table = document.getElementsByTagName("table")[0];
	const dir = path.resolve(selectedComputer.dir);
	const fileInput = document.getElementById("newWad");

	for(let i = 0; i < files.length; i++)
	{
		const file = files[i];
		let path = file.path;
		path = path.replace(dir + "/", "");
		//data.profiles[profileIndex].wads.push(path);

		// Create an empty <tr> element and add it to the 1st position of the table:
		var row = table.insertRow(-1);
		row.id = ("wad" + path);
		/*
		 tr(class="wadRow" id="wad"+wad)
		 td
		 button(name="deleteWad" formaction="javascript:deleteWad(\""+profile.name+"\",\""+wad+"\")") Delete
		 td
		 span
		 =wad
		 */
		var cell1 = row.insertCell(0);
		var cell2 = row.insertCell(1);
		var cell3 = row.insertCell(2);

		// Add some text to the new cells:
		cell1.innerHTML =
			"<button name='deleteWad' formaction='javascript:deleteWad(\"" + profileName + "\",\"" + path +
			"\")'>Delete</button>";
		cell2.innerHTML = "<input type='text' class='wad' size=40 disabled=true name='wads[]' value='"+path+"'>";
		//button(name="wadToTop" formaction="javascript:wadToTop(\""+profile.name+"\",\""+wad+"\")") To Top
		cell3.innerHTML = `<button name="wadToTop" formaction="javascript:wadToTop('${profileName}','${path}')">To Top</button>`;
	}

	fileInput.value = null;
}

function deleteWad(profileName, wadName)
{
	const profileIndex = data.profiles.findIndex((item) => item.name === profileName);
	data.profiles[profileIndex].wads.splice(data.profiles[profileIndex].wads.indexOf(wadName));
	const table = document.getElementsByTagName("table")[0];
	const rows = table.rows;
	const item = rows.namedItem("wad" + wadName);
	const rowIndex = item.rowIndex;
	table.deleteRow(rowIndex);
}
