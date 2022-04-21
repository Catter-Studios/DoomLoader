#!/usr/bin/env node
const fs = require("fs");

const src = process.argv[2];
const dest = process.argv[3];

function loadVar(varName)
{
	let str = fs.readFileSync(src).toString() + " " + varName;
	str = str.replaceAll(/export/ig, "");
	const ret = eval(str);

	if(!ret)
	{
		throw "Could not load variable " + varName;
		process.exit(1);
	}

	return ret;
}

let data = {};
data.profiles = loadVar("profiles");
data.computers = loadVar("computers");
data.autoloadProfiles = loadVar("autoloadProfiles");
data.iwads = loadVar("iwads");
data.sourceports = loadVar("sourceports");

if(!data || !data.profiles || !data.computers || !data.autoloadProfiles || !data.iwads || !data.sourceports)
{
	throw "Could not load data";
	process.exit(1);
}

fs.writeFileSync(dest, JSON.stringify(data));
console.log("Data written");
process.exit(0);
