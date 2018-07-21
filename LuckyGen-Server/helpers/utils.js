exports.parseObjectOfArray = function (obj) {
	const keys = Object.keys(obj)
	var result = []

	for (let i = 0; i < obj[keys[0]].length; i++) {
		result[i] = {}
		for (let k of keys) {
		    result[i][k] = obj[k][i]
		}
	}

	return result
}