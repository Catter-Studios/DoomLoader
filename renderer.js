import {profiles} from "./config.js";
import {compileToString} from "./utils.js";

const profileHtml = compileToString("profiles.pug", {profiles:profiles} );
const root = document.getElementById("app");

root.innerHTML = profileHtml;
