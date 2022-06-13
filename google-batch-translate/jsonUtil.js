module.exports.concatJson = (json1, json2, outputJson) => {
	var fs = require('fs');
	const jsonObj1 = JSON.parse(fs.readFileSync(json1, 'utf8'))
	const jsonObj2 = JSON.parse(fs.readFileSync(json2, 'utf8'))
	const jsonObjCombined = {...jsonObj1, ...jsonObj2}
	const jsonObjCombinedJson = JSON.stringify(jsonObjCombined, null, 2);
	fs.writeFile(outputJson, jsonObjCombinedJson, 'utf8', function (err) {
		if (err) {
			return console.error(err)
		}
		console.log("File saved successfully")
	})
}
module.exports.concatJsonFromList = (jsonArray, outputJson) => {
	var fs = require('fs');
	let jsonObjCombined = {}
	jsonArray.forEach(json => {
		let jsonObj = JSON.parse(fs.readFileSync(json, 'utf8'))
		jsonObjCombined = {...jsonObjCombined, ...jsonObj}
	})
	let jsonObjCombinedJson = JSON.stringify(jsonObjCombined, null, 2);
	fs.writeFile(outputJson, jsonObjCombinedJson, 'utf8', function (err) {
		if (err) {
			return console.error(err)
		}
		console.log("File saved successfully")
	})
}
