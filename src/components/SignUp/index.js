import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';

import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';

import { Map as LeafletMap, TileLayer } from "react-leaflet";

import Styled from 'styled-components';

const Wrapper = Styled.div`
	height: 100vh;
	background-image: linear-gradient( rgba(206,176,213,1) 0%, rgba(132,120,181,1) 90% );
	display: flex;
	justify-content: center;
	align-items: center;

	h1 {
		font-size: 22px;
		text-align: center;
		color: #555;
		font-weight: normal;
	}

	p {
		font-size: 14px;
		color: #555;
		margin: 2px 0;
	}

	a {
		color: #bcbcbc;
		font-size: 12px;
	}
`;

const Background = Styled.div`
	z-index: 9999;
	max-width: 300px;
	background-color: white;
	border-radius: 8px;
	padding: 30px;
	box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
`;

const StyledInput = Styled.input`
	box-sizing:border-box;
	width: 100%;
	font-family: 'Ubuntu', sans-serif;
	border-width: 1px;
	border-style: solid;
	border-color: #d3d3d3;
	border-radius: 5px;
	font-size: 18px;
	background-color: #f7f7f7;
	margin-bottom: 10px;

`;
const StyledSubmit = Styled.button`
	font-family: 'Ubuntu', sans-serif;
	width: 100%;
	background-color: #333;
	border: none;
	color: white;
	padding: 8px 0;
	font-size: 14px;
	border-radius: 5px;
	margin: 5px 0;
`;


const SignUpPage = () => (
	<Wrapper>
		<LeafletMap
            center={{lat: 59.334591, lng: 18.063240}}
            zoom={14}
            zoomControl={false}
            animate={true}
            style={{height: "100%", position: "absolute", width: "100%", opacity: "0.2", pointerEvents: "none"}}>
            <TileLayer
                attribution='Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url='https://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png'
            />
        </LeafletMap>
		<Background>
			<h1>Let's create your account!</h1>
			<SignUpForm />
		</Background>
	</Wrapper>
);




const INITIAL_STATE = {
	username: '',
	email: '',
	passwordOne: '',
	passwordTwo: '',
	error: null,
};

const ERROR_CODE_ACCOUNT_EXISTS = 'auth/email-already-in-use';

const ERROR_MSG_ACCOUNT_EXISTS = `
  An account with this E-Mail address already exists.
  Try to login with this account instead. If you think the
  account is already used from one of the social logins, try
  to sign in with one of them. Afterward, associate your accounts
  on your personal account page.
`;

class SignUpFormBase extends Component {
	constructor(props) {
		super(props);

		this.state = { ...INITIAL_STATE };
	}

	onSubmit = event => {
		const { username, email, passwordOne } = this.state;

		this.props.firebase
			.doCreateUserWithEmailAndPassword(email, passwordOne)
			.then(authUser => {
				// Create a user in your Firebase realtime database
				return this.props.firebase.user(authUser.user.uid).set({
					username,
					email,
					statistics: { playedgames: 0, wongames: 0, walkeddistance: 0, points: 0 },
					position: { latitude: "0", longitude: "0" }
				});
			})
			.then(() => {
				this.setState({ ...INITIAL_STATE });
				this.props.history.push(ROUTES.HOME);
			})
			.catch(error => {
				if (error.code === ERROR_CODE_ACCOUNT_EXISTS) {
					error.message = ERROR_MSG_ACCOUNT_EXISTS;
				}

				this.setState({ error });
			});

		event.preventDefault();
	};

	onChange = event => {
		this.setState({ [event.target.name]: event.target.value });
	};

	onChangeCheckbox = event => {
		this.setState({ [event.target.name]: event.target.checked });
	};

	render() {
		const {
			username,
			email,
			passwordOne,
			passwordTwo,
			error,
		} = this.state;

		const isInvalid =
			passwordOne !== passwordTwo ||
			passwordOne === '' ||
			email === '' ||
			username === '';

		return (
			<form onSubmit={this.onSubmit}>
				<StyledInput
					name="username"
					minLength="3"
					maxLength="15"
					value={username}
					onChange={this.onChange}
					type="text"
					placeholder="Username"
				/>
				<StyledInput
					name="email"
					value={email}
					onChange={this.onChange}
					type="text"
					placeholder="Email Address"
				/>
				<StyledInput
					name="passwordOne"
					value={passwordOne}
					onChange={this.onChange}
					type="password"
					placeholder="Password"
				/>
				<StyledInput
					name="passwordTwo"
					value={passwordTwo}
					onChange={this.onChange}
					type="password"
					placeholder="Confirm Password"
				/>
				<StyledSubmit disabled={isInvalid} type="submit">
					Sign Up
        			</StyledSubmit>
				{error && <p>{error.message}</p>}
			</form>
		);
	}
}

const SignUpLink = () => (
	<p>
		Don't have an account? <Link to={ROUTES.SIGN_UP}>Sign Up</Link>
	</p>
);
const SignUpForm = withRouter(withFirebase(SignUpFormBase));
export default SignUpPage;
export { SignUpForm, SignUpLink };