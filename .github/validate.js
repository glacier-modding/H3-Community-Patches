const { validateModFolder } = require("./validate-mod-folder")

/** @type any */
const validation = validateModFolder(process.cwd())

if (!validation[0]) {
	throw new Error(validation[1])
} else {
	console.log("Validation passed")
}
