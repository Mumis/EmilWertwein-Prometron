import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { compose } from 'recompose';
import { SignUpLink } from '../SignUp';
import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';
import { Map as LeafletMap, TileLayer } from "react-leaflet";


import Styled from 'styled-components';

const Wrapper = Styled.div`
    position: relative;
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
    max-width: 90vw;
    background-color: white;
    border-radius: 8px;
    padding: 30px;
    box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
`

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
    margin-bottom: 5px;

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

const SocialLogin = Styled.div`
    display: flex;
    justify-content: space-between;
    margin 40px 0 20px 0;

    form {
        width: 48%;
    }

    button {
        font-family: 'Ubuntu', sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 45px;
        border-radius: 5px;
        border: none;
        font-size: 14px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);

        &:hover {
            cursor: pointer;
        }
    }

    i {
        font-size: 24px;
        padding-right: 10px;
    }
`;

const FacebookButton = Styled.button`
    width: 100%;
    color: white;
    background-color: #3C5A99;

`;

const GoogleButton = Styled.button`
    width: 100%;
    color: #2d2d2d;
    background-color: white;


    i {
        color: #4885ed;
    }
`;

const SignInPage = () => (
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
            <h1>Sign in with</h1>
            {/* <SocialLogin>
                <SignInFacebook />
                <SignInGoogle />
            </SocialLogin > */}
            <div>
                <SignInForm />
                <SignUpLink />
            </div>
        </Background>
    </Wrapper>
);


const ERROR_CODE_ACCOUNT_EXISTS =
    'auth/account-exists-with-different-credential';
const ERROR_MSG_ACCOUNT_EXISTS =
    `An account with an E-Mail address to
    this social account already exists. Try to login from
    this account instead and associate your social accounts on
    your personal account page.`;

const INITIAL_STATE = {
    email: '',
    password: '',
    error: null,
};

class SignInFormBase extends Component {
    constructor(props) {
        super(props);
        this.state = { ...INITIAL_STATE };
    }

    onSubmit = event => {

        const { email, password } = this.state;
        this.props.firebase
            .doSignInWithEmailAndPassword(email, password)
            .then(() => {
                this.setState({ ...INITIAL_STATE });
                this.props.history.push(ROUTES.HOME);
            })

            .catch(error => {
                this.setState({ error });
            });
        event.preventDefault();
    };

    onChange = event => {
        this.setState({ [event.target.name]: event.target.value });
    };

    render() {
        const { email, password, error } = this.state;
        const isInvalid = password === '' || email === '';

        return (
            <form onSubmit={this.onSubmit}>
                <p>Email</p>
                <StyledInput
                    name="email"
                    value={email}
                    onChange={this.onChange}
                    type="text"
                /><br />
                <p>Password 
                     {/* <Link to={ROUTES.PASSWORD_FORGET}>Forgot?</Link> */}
                </p>
                <StyledInput
                    name="password"
                    value={password}
                    onChange={this.onChange}
                    type="password"
                /><br />
                <StyledSubmit disabled={isInvalid} type="submit">
                    Sign In
                </StyledSubmit>
                {error && <p>{error.message}</p>}
            </form>
        );
    }
}

class SignInGoogleBase extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }
    onSubmit = event => {
        this.props.firebase
            .doSignInWithGoogle()
            .then(socialAuthUser => {
                // Create a user in your Firebase Realtime Database too
                return this.props.firebase
                    .user(socialAuthUser.user.uid)
                    .set({
                        username: socialAuthUser.user.displayName,
                        email: socialAuthUser.user.email,
                        statistics: {playedgames: 0, wongames: 0, walkeddistance: 0, points: 0},
                        position: { latitude: "0", longitude: "0" }
                    });
            })
            .then(() => {
                this.setState({ error: null });
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
    render() {
        const { error } = this.state;
        return (
            <form onSubmit={this.onSubmit}>
                <GoogleButton type="submit"><i class="fab fa-google"></i>Google</GoogleButton>
            </form>
        );
    }
}

class SignInFacebookBase extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }
    onSubmit = event => {
        this.props.firebase
            .doSignInWithFacebook()
            .then(socialAuthUser => {
                // Create a user in your Firebase Realtime Database too
                return this.props.firebase
                    .user(socialAuthUser.user.uid)
                    .set({
                        username: socialAuthUser.additionalUserInfo.profile.name,
                        email: socialAuthUser.additionalUserInfo.profile.email,
                        statistics: {playedgames: 0, wongames: 0, walkeddistance: 0, points: 0},
                        position: { latitude: "0", longitude: "0" }
                    });
            })
            .then(socialAuthUser => {
                this.setState({ error: null });
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
    render() {
        const { error } = this.state;
        return (
            <form onSubmit={this.onSubmit}>
                <FacebookButton type="submit"><i class="fab fa-facebook-square"></i>Facebook</FacebookButton>
            </form>
        );
    }
}

const SignInForm = compose(
    withRouter,
    withFirebase,
)(SignInFormBase);

const SignInGoogle = compose(
    withRouter,
    withFirebase,
)(SignInGoogleBase);

const SignInFacebook = compose(
    withRouter,
    withFirebase,
)(SignInFacebookBase);

export default SignInPage;
export { SignInForm, SignInGoogle, SignInFacebook };