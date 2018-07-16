exports.parseObjectOfArray = function (obj) {
	const keys = Object.keys(obj)
	var result = []

	for (let i = 0; i < obj[keys[0]].length; i++) {
		result[i] = {}
		console.log({result})
		for (let k of keys) {
			console.log({k})
			result[i][k] = obj[k][i]
		}
	}

	return result
}