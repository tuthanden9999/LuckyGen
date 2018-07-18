var express = require('express');
var router = express.Router();
var SDK = require('../../LuckyGen-Node-SDK')

const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InRva2VuX2lkIjoiNWI0ZjAzNGRjNjZjM2EwMTQ4ZDg3Y2ZkIiwidXNlcl9pZCI6IjViNGM2ODUwYzQxNGZiMDFmMjUwZTU0ZCJ9LCJpYXQiOjE1MzE5MDQ4NDUsImV4cCI6MTU2MzQ2MjQ0NX0.pHXytsIkRbknxwkvL0dH3kzZzF_I0kvjiGGcrxrkwJw'

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
