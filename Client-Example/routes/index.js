var express = require('express');
var router = express.Router();
var SDK = require('../../LuckyGen-Node-SDK')

const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InRva2VuX2lkIjoiNWI1NDE2ZGMyMGJlNDEwMTc2OGNjNTA5IiwidXNlcl9pZCI6IjViNTQwOTkxMWQ1MDNiMDE1NmI3MGQwZCJ9LCJpYXQiOjE1MzIyMzc1MzMsImV4cCI6MTU2Mzc5NTEzM30.v3Md38dPBYgyY2pUVajFK3mnjhCWT_2s7OjlmfARZWk'

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', { title: 'Client Demo' });
});

router.post('/api/add-player', function(req, res, next) {
	const client = new SDK(null , KEY)
	const randomUserName = 'User #' + Math.floor(Math.random()*10)
	const {game_id, player_id, player_address, player_name = randomUserName, turns = 20} = req.body

	client.addNewPlayer(game_id, player_id, player_name, player_address, turns).then(result => {
		return res.send('ok');		
	}).catch(e => {
		console.log({e})
		return res.status(500).send(e)
	})
});

module.exports = router;
