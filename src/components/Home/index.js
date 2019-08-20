import React from "react";
import { compose } from "recompose";
import { withFirebase } from "../Firebase";
import { Link } from 'react-router-dom';
import * as ROUTES from '../../constants/routes';
import {
	AuthUserContext,
	withAuthorization,
} from "../Session";

import Styled from "styled-components";
import HomeMap from "../HomeMap";

const Wrapper = Styled.div`
	position: relative;
	height: 100vh;

	div {
		height: 100%;
	}
`;

const EnterButton = Styled.p`
	display: flex;
	font-family: 'Ubuntu', sans-serif;
	width: 100%;
	position: absolute;
	justify-content: center;
	z-index: 9999;
	bottom: 20px;
	
	a {
		text-align: center;
		width: 200px;
		background-color: #333;
		padding: 8px 0;
		border-radius: 5px;
		font-size: 14px;
		text-decoration: none;
		color: white;
		transition: 0.3s;
		
		&:hover {
			cursor: pointer;
			transform: scale(1.05);
		}
	}
`;

const HomePage = props => (
	<AuthUserContext.Consumer>
		{authUser => (
			<React.Fragment>
				<Wrapper>
					<HomeMap userId={authUser.uid}>
					</ HomeMap>
					<EnterButton>
						<Link to={ROUTES.GAMEMENU}>Enter Game</Link>
					</EnterButton>
				</Wrapper>
			</React.Fragment>
		)}
	</AuthUserContext.Consumer>
);

const condition = authUser => !!authUser;

export default compose(
	withFirebase,
	withAuthorization(condition)
)(HomePage);

