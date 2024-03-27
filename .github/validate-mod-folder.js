"use strict"
var __spreadArray =
	(this && this.__spreadArray) ||
	function (to, from, pack) {
		if (pack || arguments.length === 2)
			for (var i = 0, l = from.length, ar; i < l; i++) {
				if (ar || !(i in from)) {
					if (!ar) ar = Array.prototype.slice.call(from, 0, i)
					ar[i] = from[i]
				}
			}
		return to.concat(ar || Array.prototype.slice.call(from))
	}
exports.__esModule = true
exports.validateModFolder = void 0
var contractSchema = require("./contract-schema.json")
var entityPatchSchema = require("./entity-patch-schema.json")
var entitySchema = require("./entity-schema.json")
var fs = require("fs-extra")
var json5 = require("json5")
var jsonPatchSchema = require("./json-patch-schema.json")
var klawSync = require("klaw-sync")
var manifestSchema = require("./manifest-schema.json")
var path = require("path")
var repositorySchema = require("./repository-schema.json")
var unlockablesSchema = require("./unlockables-schema.json")
var ajv_1 = require("ajv")
var validateManifest = new ajv_1["default"]({ strict: false }).compile(manifestSchema)
var validateEntity = new ajv_1["default"]({ strict: false }).compile(entitySchema)
var validateEntityPatch = new ajv_1["default"]({ strict: false }).compile(entityPatchSchema)
var validateRepository = new ajv_1["default"]({ strict: false }).compile(repositorySchema)
var validateUnlockables = new ajv_1["default"]({ strict: false }).compile(unlockablesSchema)
var validateContract = new ajv_1["default"]({ strict: false }).compile(contractSchema)
var validateJSONPatch = new ajv_1["default"]({ strict: false }).compile(jsonPatchSchema)
function validateModFolder(modFolder) {
	var _a
	var _b
	if (!fs.existsSync(path.join(modFolder, "manifest.json"))) {
		return [false, "No manifest"]
	}
	try {
		json5.parse(fs.readFileSync(path.join(modFolder, "manifest.json"), "utf8"))
	} catch (_c) {
		return [false, "Invalid manifest due to invalid JSON"]
	}
	if (!validateManifest(json5.parse(fs.readFileSync(path.join(modFolder, "manifest.json"), "utf8")))) {
		return [
			false,
			"Invalid manifest due to non-matching schema: ".concat(
				new ajv_1["default"]({ strict: false }).errorsText(validateManifest.errors)
			)
		]
	}
	var manifest = json5.parse(fs.readFileSync(path.join(modFolder, "manifest.json"), "utf8"))
	// ------
	if (manifest.frameworkVersion.startsWith("1")) {
		return [false, "Designed for earlier framework version"]
	}
	// ------
	for (
		var _i = 0,
			_d = __spreadArray(
				__spreadArray([], manifest.contentFolders || [], true),
				(manifest.options || []).flatMap(function (a) {
					return a.contentFolders || []
				}),
				true
			);
		_i < _d.length;
		_i++
	) {
		var contentFolder = _d[_i]
		if (!fs.existsSync(path.resolve(modFolder, contentFolder))) {
			return [false, 'Invalid content folder "'.concat(contentFolder, '" due to nonexistent path')]
		}
		var chunkFolders = fs.readdirSync(path.resolve(modFolder, contentFolder))
		if (chunkFolders.length === 0) {
			return [false, 'Empty content folder "'.concat(contentFolder, '"')]
		}
		for (var _e = 0, chunkFolders_1 = chunkFolders; _e < chunkFolders_1.length; _e++) {
			var chunkFolder = chunkFolders_1[_e]
			if (!chunkFolder.match(/chunk([0-9]*)/)) {
				return [false, 'Invalid chunk folder "'.concat(chunkFolder, '" in "').concat(contentFolder, '"')]
			}
		}
	}
	for (
		var _f = 0,
			_g = __spreadArray(
				__spreadArray([], manifest.blobsFolders || [], true),
				(manifest.options || []).flatMap(function (a) {
					return a.blobsFolders || []
				}),
				true
			);
		_f < _g.length;
		_f++
	) {
		var blobsFolder = _g[_f]
		if (!fs.existsSync(path.resolve(modFolder, blobsFolder))) {
			return [false, 'Invalid blobs folder "'.concat(blobsFolder, '" due to nonexistent path')]
		}
		if (fs.readdirSync(path.resolve(modFolder, blobsFolder)).length === 0) {
			return [false, 'Empty blobs folder "'.concat(blobsFolder, '"')]
		}
	}
	var groups = {}
	for (var _h = 0, _j = manifest.options || []; _h < _j.length; _h++) {
		var option = _j[_h]
		if (option.type === "select") {
			;(_a = groups[(_b = option.group)]) !== null && _a !== void 0 ? _a : (groups[_b] = [0, 0])
			groups[option.group][0] = groups[option.group][0] + 1
			if (option.enabledByDefault) {
				groups[option.group][1] = groups[option.group][1] + 1
			}
		}
	}
	for (var _k = 0, _l = Object.entries(groups); _k < _l.length; _k++) {
		var _m = _l[_k],
			group = _m[0],
			_o = _m[1],
			members = _o[0],
			enabledByDefault = _o[1]
		if (members === 1) {
			return [false, 'Option group "'.concat(group, '" has only one member')]
		}
		if (enabledByDefault > 1) {
			return [false, 'Option group "'.concat(group, '" has more than one member enabled by default')]
		}
	}
	for (
		var _p = 0,
			_q = klawSync(modFolder, { nodir: true }).map(function (a) {
				return a.path
			});
		_p < _q.length;
		_p++
	) {
		var file = _q[_p]
		if (
			file.endsWith("entity.json") ||
			file.endsWith("entity.patch.json") ||
			file.endsWith("repository.json") ||
			file.endsWith("unlockables.json") ||
			file.endsWith("JSON.patch.json") ||
			file.endsWith("contract.json")
		) {
			try {
				var fileContents = fs.readJSONSync(file)
				switch (file.split(".").slice(1).join(".")) {
					case "entity.json":
						if (fileContents.quickEntityVersion === 3.1 && !validateEntity(fileContents))
							return [
								false,
								"Invalid file "
									.concat(file, " due to non-matching schema: ")
									.concat(new ajv_1["default"]({ strict: false }).errorsText(validateEntity.errors))
							]
						break
					case "entity.patch.json":
						if (fileContents.patchVersion === 6 && !validateEntityPatch(fileContents))
							return [
								false,
								"Invalid file "
									.concat(file, " due to non-matching schema: ")
									.concat(new ajv_1["default"]({ strict: false }).errorsText(validateEntityPatch.errors))
							]
						break
					case "repository.json":
						if (!validateRepository(fileContents))
							return [
								false,
								"Invalid file "
									.concat(file, " due to non-matching schema: ")
									.concat(new ajv_1["default"]({ strict: false }).errorsText(validateRepository.errors))
							]
						break
					case "unlockables.json":
						if (!validateUnlockables(fileContents))
							return [
								false,
								"Invalid file "
									.concat(file, " due to non-matching schema: ")
									.concat(new ajv_1["default"]({ strict: false }).errorsText(validateUnlockables.errors))
							]
						break
					case "contract.json":
						if (!validateContract(fileContents))
							return [
								false,
								"Invalid file "
									.concat(file, " due to non-matching schema: ")
									.concat(new ajv_1["default"]({ strict: false }).errorsText(validateContract.errors))
							]
						break
					case "JSON.patch.json":
						if (!validateJSONPatch(fileContents))
							return [
								false,
								"Invalid file "
									.concat(file, " due to non-matching schema: ")
									.concat(new ajv_1["default"]({ strict: false }).errorsText(validateJSONPatch.errors))
							]
						break
				}
			} catch (_r) {
				return [false, "Invalid file ".concat(file, " due to invalid JSON")]
			}
		}
	}
	return [true, ""]
}
exports.validateModFolder = validateModFolder
