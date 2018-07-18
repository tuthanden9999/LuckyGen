var express = require('express');
var router = express.Router();
var SDK = require('../../LuckyGen-Node-SDK')

const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InRva2VuX2lkIjoiNWI0ZjQ1MGMyY2RiMmYwMDExMmU5OWNjIiwidXNlcl9pZCI6IjViNGY0NDk0MmNkYjJmMDAxMTJlOTljYiJ9LCJpYXQiOjE1MzE5MjE2NzYsImV4cCI6MTU2MzQ3OTI3Nn0.f726qmBh2b8DV-HeKeba4SC90IlBWFASUNE3dmLmvfY'

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', { title: 'Client Demo' });
});

router.post('/', function(req, res, next) {
	const client = new SDK(null , KEY)
	const {game_id, player_id, turns} = req.body

	client.addNewPlayer(game_id, player_id, turns).then(result => {
		res.send('ok');		
	}).catch(e => {
		res.send('error')
		console.log({e})
	})
});

module.exports = router;
