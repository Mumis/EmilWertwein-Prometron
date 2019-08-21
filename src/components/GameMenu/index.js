import React, { Component } from "react";
import { withFirebase } from "../Firebase";
import { compose } from "recompose";
import { Redirect } from "react-router-dom";

import HomeMap from "../HomeMap";

import {
	AuthUserContext,
	withAuthorization,
} from "../Session";

import Styled from "styled-components";

const Wrapper = Styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	position: relative;
	height: 100vh;
	background-image: linear-gradient( rgba(206,176,213,1) 0%, rgba(132,120,181,1) 90% );
	
`;

const MapWrapper = Styled.div`
	position: absolute;
	height: 100%;
	width: 100%;
	opacity: 0.3;
	div {
		height: 100%;
		width: 100%;
	}
`;

const StyledButton = Styled.button`
    font-family: 'Ubuntu', sans-serif;
    background-color: #333;
    border: none;
    color: white;
    padding: 8px 20px;
    font-size: 14px;
    border-radius: 5px;
	margin: 5px 20px;
	
	&:hover {
		cursor: pointer;
	}
`;

const ButtonWrapper = Styled.div`
	display: flex;
	position: absolute;
	z-index: 9999;
`;

const JoinWrapper = Styled.div`
	position: absolute;
	z-index: 9999;
	text-align: center;

	ul {
		padding: 0;
	}
`;

const CreateWrapper = Styled.div`
	position: absolute;
	z-index: 9999;
	width: 90%;

	form {
		display: flex;
		flex-direction: column;
		align-items: center;

		* {
			width: 100%;
		}

		button {
			font-family: 'Ubuntu', sans-serif;
			background-color: #333;
			border: none;
			color: white;
			padding: 8px 20px;
			font-size: 14px;
			border-radius: 5px;
			transition: transform .3s;
			margin 10px 0;
			
			&:hover {
				cursor: pointer;
				transform: scale(1.1);
			}
		}

		input {
			box-sizing:border-box;
			width: 100%;
			font-family: 'Ubuntu', sans-serif;
			border-width: 1px;
			border-style: solid;
			border-color: #d3d3d3;
			border-radius: 5px;
			font-size: 18px;
			background-color: #f7f7f7;
			margin-bottom: 5px;
		}

		select {
			box-sizing:border-box;
			width: 100%;
			font-family: 'Ubuntu', sans-serif;
			border-width: 1px;
			border-style: solid;
			border-color: #d3d3d3;
			border-radius: 5px;
			font-size: 18px;
			background-color: #f7f7f7;
			margin-bottom: 5px;
		}
	}
	
	h3 {
		text-align: center;
	}
`;
class GameMenu extends Component {
	state = {
		redirect: false,
		game_time: "3600000",
	};

	componentDidMount() {
		this.props.firebase
			.user(this.props.authUser.uid)
			.child("games")
			.once("value", snapshot => {
				this.isInGame = snapshot.val();
			}).then(
				!this.isInGame && this.setState({ redirect: false })
			);

		this.getGames();
	}

	getGames = () => {
		this.props.firebase
			.games()
			.once("value", snapshot => {
				this.data = snapshot.val();
			})
			.then(() => {
				this.setState({ currentGames: this.data });
			});
	};

	joinGame = event => {
		const key = event.target.id;
		const uid = this.props.authUser.uid;
		const data = {
			username: this.props.authUser.username,
			path: [[0, 0]],
			points: 0
		};

		let updates = {};

		updates["/games/" + key + "/users/" + uid] = data;
		updates["/games/" + key + "/presence/" + uid] = true;
		updates["/users/" + uid + "/games/" + key] = true;

		this.props.firebase
			.user(uid)
			.child("games")
			.remove();
		this.props.firebase.db.ref().update(updates);
		this.setState({ redirect: true });
	};

	createGame = event => {
		const currentTime = Math.round(new Date());
		const key = this.props.firebase.db.ref("games").push().key;
		const uid = this.props.authUser.uid;

		const data = {
			name: this.state.name,
			password: this.state.password,
			game_milli: this.state.game_time,
			game_time: currentTime + parseInt(this.state.game_time),
			presence: {
				[uid]: true
			},
			users: {
				[uid]: {
					username: this.props.authUser.username,
					path: [[0, 0]],
					points: 0
				}
			}
		};

		let updates = {};

		updates["/games/" + key] = data;
		updates["/users/" + uid + "/games/" + key] = true;

		this.props.firebase
			.user(uid)
			.child("games")
			.remove();
		this.props.firebase.db.ref().update(updates);

		this.setState({
			name: "",
			password: "",
			game_time: "",
			redirect: true
		});

		event.preventDefault();
	};

	onChange = event => {
		this.setState({
			[event.target.name]: event.target.value
		});
	};

	MenuState = e => {
		let targetId = e.target.id;
		targetId === "join" ? this.setState({ menuState: "join" }) : this.setState({ menuState: "create" })
	};



	render() {
		if (this.state.redirect) {
			return <Redirect push to="/game" />;
		}

		return (
			<AuthUserContext.Consumer>
				{authUser => (
					<Wrapper>
						<MapWrapper>
							<HomeMap userId={authUser.uid} >
							</ HomeMap>
						</MapWrapper>

						{this.state.menuState == null ?
							<React.Fragment>
								<ButtonWrapper>
									<StyledButton onClick={this.MenuState} id="join">JOIN GAME</StyledButton>
									<StyledButton onClick={this.MenuState} id="create">CREATE GAME</StyledButton>
								</ButtonWrapper>
							</React.Fragment>
							: null}

						{this.state.menuState === "join" ?
							<React.Fragment>
								<JoinWrapper>
									<h3>Searching for games...</h3>
									<ul>
										{this.state.currentGames != null
											? Object.keys(this.state.currentGames).map(gameId => (
												<li id={gameId} onClick={this.joinGame}>
													{this.state.currentGames[gameId].name}
												</li>
											))
											: <p>No games available :(</p>}
									</ul>
								</JoinWrapper>
							</React.Fragment>
							: null}

						{this.state.menuState === "create" ?
							<React.Fragment>
								<CreateWrapper>
									<h3>Creating game..</h3>

									<form onSubmit={this.createGame}>
										<label>Server name</label>
										<input
											type="text"
											onChange={this.onChange}
											value={this.state.name}
											name="name"
											minLength="3"
											maxLength="15"
										/>
										<label>Server password</label>
										<input
											type="text"
											onChange={this.onChange}
											value={this.state.password}
											name="password"
										/>
										Length of game
										<select
											name="game_time"
											onChange={this.onChange}
											value={this.state.game_time}
										>
											<option value="3600000"> 1 Hour</option>
											<option value="7200000"> 2 Hour</option>
											<option value="10800000"> 3 Hour</option>
											<option value="14400000"> 4 Hour</option>
											<option value="18000000"> 5 Hour</option>
										</select>

										<button onClick={this.createGame}>
											Create Game
										</button>
									</form>
								</CreateWrapper>
							</React.Fragment>
							: null}
					</Wrapper>
				)}
			</AuthUserContext.Consumer>
		);
	}
}

const condition = authUser => !!authUser;

export default compose(
	withFirebase,
	withAuthorization(condition)
)(GameMenu);
