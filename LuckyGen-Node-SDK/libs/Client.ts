import axios from 'axios'

const defaultBaseURL = 'http://localhost:8080/api'

class Client {
	httpClient: axios.Axios

	constructor(baseURL: string, token: string) {
		if (!token) throw new Error('Missing token in the constructor!')

		this.httpClient = axios.create({
		  baseURL: baseURL || defaultBaseURL,
		  headers: {
		  	'Content-type': 'application/json',
		  	'Accept': 'application/json',
		  	'Authorization': `Bearer ${token}`
		  }
		});
	}

	/**
	 * @param {number} Game's ID
	 * @param {string} Player's ID
	 * @param {string} Player's Nebulas address
	 * @param {number = 1} Turns
	 *
	 * @return {number} Player turn left
	 */
	addNewPlayer(gameID: number, playerID: string, playerAddr: string, turns: number = 1) {
		return this.httpClient.post(`games/${gameID}/players`, {
			player_addr: playerAddr,
			player_id: playerID,
			turns: 1
		}).then(data => data.data)
	}

/**
	 * @param {number} Game's ID
	 * @param {string} Player's ID
	 * @param {number = 1} Turns
	 *
	 * @return {number} Player turn left
	 */
	async addTurn(gameID: number, playerID: string, turns: number = 1) {
		const result = await this.httpClient.post(`games/${gameID}/add-turn`, {
			player_id: playerID,
			turns: 1
		})

		return result
	}
}

module.exports = Client