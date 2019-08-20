import React, { Component } from "react";
import { withFirebase } from "../Firebase";
import { compose } from "recompose";
import { Link, Redirect } from "react-router-dom";
import * as ROUTES from "../../constants/routes";

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
	transition: transform .3s;
	
	&:hover {
		cursor: pointer;
		transform: scale(1.1);
	}
`;

const ButtonWrapper = Styled.div`
	display: flex;
	position: absolute;
	z-index: 9999;
`;

class GameMenu extends Component {
	state = {
		redirect: true,
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
		this.setState({ Redirect: true });
	};

	createGame = event => {
		const currentTime = Math.round(new Date().getTime() / 1000);
		const key = this.props.firebase.db.ref("games").push().key;
		const uid = this.props.authUser.uid;

		const data = {
			name: this.state.name,
			password: this.state.password,
			game_area: parseInt(this.state.game_area),
			game_minutes: this.state.game_time,
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

		this.startTimer(this.state.game_time);

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
			game_area: "",
			game_time: "",
			Redirect: true
		});

		event.preventDefault();
	};

	startTimer(duration) {
		var timer = duration,
			minutes,
			seconds;
		setInterval(function () {
			minutes = parseInt(timer / 60, 10);
			seconds = parseInt(timer % 60, 10);

			minutes = minutes < 10 ? "0" + minutes : minutes;
			seconds = seconds < 10 ? "0" + seconds : seconds;

			console.log(minutes + ":" + seconds);
			if (--timer < 0) {
				timer = duration;
			}
		}, 1000);
	}

	onChange = event => {

	};

	MenuState = e => {
		let targetId = e.target.id;
		targetId === "join" ? this.setState({ menuState: "join" }) : this.setState({ menuState: "create" })
	};



	render() {
		if (this.state.Redirect) {
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
								
								join
							</React.Fragment>
							: null}

						{this.state.menuState === "create" ?
							<React.Fragment>
								create
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
