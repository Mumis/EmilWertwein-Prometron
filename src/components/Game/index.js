import React, { Component } from 'react';
import Styled from 'styled-components';
import GameMap from '../GameMap';
import { withFirebase } from '../Firebase';
import Countdown from 'react-countdown-now';
import GameResults from '../GameResults';
import { compose } from "recompose";
import { Link } from 'react-router-dom';
import * as ROUTES from '../../constants/routes';

import {
    AuthUserContext,
    withAuthorization,
} from "../Session";

const Wrapper = Styled.div`
    position: relative;
    height: 100vh;   
    font-family: 'Ubuntu', sans-serif;
`;

const Overlay = Styled.div`
    font-size: 22px;
    color: white;
    z-index: 9999;
    position: absolute;
    display: flex;
    width: 100%;
    justify-content: center;
    margin: 10px 0;
    
    button {
        position: absolute;
        left: 10px;
        font-family: 'Ubuntu', sans-serif;
        background-color: #333;
        border: none;
        color: white;
        padding: 8px 20px;
        font-size: 14px;
        border-radius: 5px;

        a {
            color: white;
            text-decoration: none;
        }
    }
`;

const MapContainer = Styled.div`
    position: absolute;
    width: 100%;
`;

const StyledLeaveLink = Styled.div`
    position: absolute;
    left: 1%;
    bottom: 1%;
    z-index: 999;    
    & a {
        background: rgb(77,77,77);
        color: rgb(242,242,242);
        padding: 6px;
        &:hover {
            background: rgb(17,17,17);
            color: rgb(255,255,255);        
        }
    }
`;
/*** END ***/

class Game extends Component {
    state = {
        gameId: null,
        gameData: {
            users: null
        },
        userPath: [],
        userPoints: 0,
        parts: {
            scoreBoard: true,
            chatBoard: false,
            gameResults: false
        },
    };

    calculateDistance = (lat1, lon1, lat2, lon2) => {
        var R = 6371; // km (change this constant to get miles)
        var dLat = ((lat2 - lat1) * Math.PI) / 180;
        var dLon = ((lon2 - lon1) * Math.PI) / 180;
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;

        return Math.round(d * 1000);
    };

    initializeGame = () => {
        const { authUser } = this.props;

        if (authUser && navigator.geolocation) {
            this.setState({ uid: authUser.uid });
            this.props.firebase.user(authUser.uid).once('value', snapshot => {
                this.data = snapshot.val();
                this.gameKey = Object.keys(this.data.games)[0];
                this.setState({ gameId: this.gameKey });
                this.fetchGameData();
            }).then(() => {
                this.seeGameStatus();
                this.watchUserPosition();
            });
        };
    };

    watchUserPosition = () => {
        this.watchId = navigator.geolocation.watchPosition(
            this.updatePosition,
            error => {
                console.log("error" + error);
            },
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0,
                distanceFilter: 1
            }
        );
    };

    // Appends user path in DB
    updatePosition = position => {
        this.seeGameStatus();

        const newPosition = [position.coords.latitude, position.coords.longitude];

        const oldPosition = this.state.userPath[this.state.userPath.length - 1]

        if (this.calculateDistance(newPosition[0], newPosition[1], oldPosition[0], oldPosition[1]) > 1) {
            const userPath = this.state.userPath.slice();
            userPath.push(newPosition);
            this.setState(prevState => ({ userPoints: prevState.gameData.users[this.props.authUser.uid].points + 1, userPath: userPath }));
            this.updateToDB();
            this.newFindNearestCoordinates(position)
        };
    };

    fetchGameData = () => {
        this.props.firebase.game(this.state.gameId).once("value", snapshot => {
            const data = snapshot.val();
            this.setState({ gameData: data });
        }).then(() => {
            this.seeGameStatus();
        });
        this.props.firebase.game(this.state.gameId).on("value", snapshot => {
            const data = snapshot.val();
            this.setState({ gameData: data });
        });
    };

    updateToDB = () => {
        this.props.firebase.game(this.state.gameId + '/users/' + this.state.uid).update({
            path: this.state.userPath,
            points: this.state.userPoints
        });
    };

    seeGameStatus = () => {
        const currentTime = Math.round((new Date()).getTime() / 1000);
        currentTime > this.state.gameData.game_time ? this.setState({ status: "gameover" }) : this.setState({ status: "gameinprogress" })
    };

    detectIntersect = (x1, y1, x2, y2) => {
        const currentPosition = this.state.userPath[this.state.userPath.length - 1];
        const lastPosition = this.state.userPath[this.state.userPath.length - 2];

        const x3 = currentPosition[0];
        const y3 = currentPosition[1];
        const x4 = lastPosition[0];
        const y4 = lastPosition[1];

        // Check if none of the lines are of length 0
        if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
            return false
        };

        const denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))

        // Lines are parallel
        if (denominator === 0) {
            return false
        };

        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator

        // is the intersection along the segments
        if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
            return false
        };

        // Return a object with the x and y coordinates of the intersection
        let x = x1 + ua * (x2 - x1)
        let y = y1 + ua * (y2 - y1)

        this.collision = [x, y]

        this.props.firebase.game(this.state.gameId).child("/users/" + this.props.authUser.uid + "/points").set(
            this.state.userPoints - 500
        );
    };

    newFindNearestCoordinates = (position) => {
        const { users } = this.state.gameData;
        let pathDist = [], distUsers;
        if (users) {
            Object.keys(users).forEach(user => {
                if (user !== this.props.authUser.uid) {
                    distUsers = users[user].path.map((point) => ({
                        lat: point[0], lng: point[1], dist: this.calculateDistance(point[0], point[1], position.coords.latitude, position.coords.longitude), name: users[user].username
                    }));
                    distUsers.sort((a, b) => a.dist - b.dist);
                    if (distUsers.length > 1) {
                        const nearestCoordinates = distUsers.slice(0, 2)
                        pathDist.push(nearestCoordinates)
                    };
                };
                pathDist.forEach(path => {
                    this.detectIntersect(path[0].lat, path[0].lng, path[1].lat, path[1].lng)
                });
            });
        };
    };

    componentWillMount() {
        navigator.geolocation.getCurrentPosition(position => {
            this.setState({ userPath: [[position.coords.latitude, position.coords.longitude]] });
        });
        this.initializeGame();
    };

    componentWillUnmount() {
        navigator.geolocation.clearWatch(this.watchId);
        this.props.firebase.game(this.state.gameId).off();
    };

    calculatePosition = () => {
        if (this.state.status === "gameinprogress") {
            return 0
        };

        const users = Object.keys(this.state.gameData.users);
        const positions = {};
        users.forEach(user => {
            positions[user] = this.state.gameData.users[user].points
        });

        const positionsSorted = Object.keys(positions).sort((a, b) => (positions[b] - positions[a]));

        if (positionsSorted[0] === this.props.authUser.uid) {
            return 1
        };
        return 0
    };

    updateStatistics = (points, distance, playedGames) => {
        const winOrLose = this.calculatePosition()

        this.props.firebase.user(this.props.authUser.uid).child("statistics").once("value", snapshot => {
            this.statistics = snapshot.val()
            this.statistics.points += points;
            this.statistics.walkeddistance += distance / 100;
            this.statistics.playedgames += playedGames;
            this.statistics.wongames += winOrLose;
        }).then(() =>
            this.props.firebase.user(this.props.authUser.uid).child("statistics").update(this.statistics)
        );
    };

    leaveGame = () => {
        this.updateStatistics(this.state.userPoints, this.state.userPoints, 1);
        this.props.firebase.game(this.state.gameId + "/presence").once("value", snapshot => {
            let presence = snapshot.val()
            this.props.firebase.game(this.state.gameId + "/presence/" + this.props.authUser.uid).remove();
            this.props.firebase.user(this.props.authUser.uid).child("games").remove();
            if (Object.keys(presence).length === 1) {
                this.props.firebase.game(this.state.gameId).remove();
            };
        });
    };

    render() {
        return (
            <AuthUserContext.Consumer>
                {authUser => (
                    <Wrapper>
                        <Overlay>
                            <button onClick={this.leaveGame}>
                                <Link to={ROUTES.HOME}>Leave</Link>
                            </button>
                            <Countdown
                                date={parseInt(this.state.gameData.game_time)} 
                                daysInHours={true}
                            />
                        </Overlay>
                                {this.state.status === "gameover" ? (
                                    <React.Fragment>
                                    <GameResults
                                        authUser={authUser}
                                        data={this.state.gameData}
                                        id={this.state.gameId}
                                    />
                                    <StyledLeaveLink onClick={this.leaveGame}>
                                    </StyledLeaveLink>
                                </React.Fragment>
                            ) :
                            this.state.gameData.users ?
                                <React.Fragment>

                                    <MapContainer>
                                        <GameMap
                                            userPosition={this.state.userPath[this.state.userPath.length - 1]}
                                            users={this.state.gameData.users}
                                            collision={this.collision}
                                        />

                                    </MapContainer>
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
)(Game);

