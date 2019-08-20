import React from 'react';
import {
    BrowserRouter as Router,
    Route,
} from 'react-router-dom';
import SignUpPage from '../SignUp';
import SignInPage from '../SignIn';
import HomePage from '../Home';
import GamePage from '../Game';
import GameMenu from '../GameMenu';
import * as ROUTES from '../../constants/routes';
import { withAuthentication } from '../Session';

// TESTING !
import GameResults from '../GameResults';

/*** END STYLED COMPONENTS ***/


const App = () => (
    <Router>
        <div>
            <Route exact path={ROUTES.SIGN_IN} component={SignInPage} />
            <Route path={ROUTES.SIGN_UP} component={SignUpPage} />
            <Route path={ROUTES.HOME} component={HomePage} />
            <Route path={ROUTES.GAMEMENU} component={GameMenu} />
            <Route path={ROUTES.GAME} component={GamePage} />                    
            <Route path={ROUTES.GAMERESULTS} component={GameResults} />
        </div>
    </Router>
);

export default withAuthentication(App);
