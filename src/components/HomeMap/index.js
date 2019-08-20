import React, { Component } from "react";
import { Map as LeafletMap, TileLayer, Marker } from "react-leaflet";
import { withFirebase } from "../Firebase";

class LocatedTwo extends Component {
	constructor(props) {
		super(props);
		this.state = {
			antPosition: [],
			browserCoords: null,
			dbCoords: null,
			onlineUsersCoords: []
		};
	}

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

	updatePosition = position => {
		this.setState({
			browserCoords: {
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
			}
		});
		if (position.coords && this.state.dbCoords) {
			// Destructuring with renames
			const { latitude: lat1, longitude: lng1 } = position.coords;
			const { latitude: lat2, longitude: lng2 } = this.state.dbCoords;
			const dist = this.calculateDistance(lat1, lng1, lat2, lng2);
			if (dist > 1) {
				this.writeUserPositionToDB(position.coords);
			};
		};
	};

	getUserPositionFromDB = () => {
		this.props.firebase
			.user(this.props.userId)
			.child("position")
			.once("value", snapshot => {
				const userPosition = snapshot.val();
				this.setState({ dbCoords: userPosition });
			});
	};

	getOnlineUsers = () => {
		this.props.firebase.presencesRef()
			.on("value", snapshot => {
				let onlineUsers = snapshot.val();
				let userArray = Object.keys(onlineUsers);
				this.getUsersCoords(userArray);
			});
	};

	getUsersCoords = (userArray) => {
		let onlineUsersCoords = {};
		userArray.forEach(uid =>
			this.props.firebase.user(uid).once("value", snapshot => {
				if (uid === this.props.userId) {
					return
				};
				let data = snapshot.val();
				onlineUsersCoords[uid] = data.position;
				this.setState({ onlineUsersCoords: onlineUsersCoords })
				this.updateUsersCoords();
			})
		);
	};

	updateUsersCoords = () => {
		Object.keys(this.state.onlineUsersCoords).forEach(uid =>
			this.props.firebase.user(uid).on("value", snapshot => {
				if (uid in this.state.onlineUsersCoords) {
					let data = snapshot.val();
					const onlineUsersCoords = Object.assign(this.state.onlineUsersCoords, { [uid]: data.position });
					this.setState({ onlineUsersCoords: onlineUsersCoords });
				};
			}));
	};

	// When user moves >1m
	writeUserPositionToDB = position => {
		const { latitude, longitude } = position;

		this.props.firebase
			// User id - extremely important to get the right user
			.user(this.props.userId)
			// Position object
			.update({ position: { latitude: latitude, longitude: longitude } });
		//this.setState({ dbCoords: position });

		// to be sure the data is synced - might add error checking...
		this.getUserPositionFromDB();
	};

	// Should be activated as soon the user is logged in - almost as landing page...
	componentWillMount() {
		this.getOnlineUsers();
		this.getUserPositionFromDB();
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(e => {
				this.setState({
					browserCoords: {
						latitude: e.coords.latitude,
						longitude: e.coords.longitude
					}
				});
			});
		};

		this.watchId = navigator.geolocation.watchPosition(
			this.updatePosition,
			// might need to be in state
			error => {
				console.log("error" + error);
			},
			{
				// higher accuracy takes more time to get
				enableHighAccuracy: true,
				timeout: 20000,   // as long as we wait
				maximumAge: 0,    // always updated
				distanceFilter: 1   // stop updating until at least moved 1 meter
			}
		);
	}
	// To stop following the user
	componentWillUnmount() {
		navigator.geolocation.clearWatch(this.watchId);
		Object.keys(this.state.onlineUsersCoords).forEach(uid =>
			this.props.firebase.user(uid).off());
		this.props.firebase.presencesRef().off()
	}

	render() {
		const markers = [];
		markers.push({ ...this.state.browserCoords });
		Object.keys(this.state.onlineUsersCoords).forEach(uid => {
			markers.push({ ...this.state.onlineUsersCoords[uid] })
		});

		return (
			<div>
				{this.state.browserCoords ? (
					<MyMap
						markers={markers}
						position={Object.values(this.state.browserCoords)}
						zoom={16}
						onlineUsers={Object.keys(this.state.onlineUsersCoords)}
					/>
				) : null}
			</div>
		);
	}
}

const options = { color: "red", pulseColor: "#FFF", delay: 300 };

// send all data of several user as props here
const MyMap = props => (
	<LeafletMap
		center={props.position}
		zoom={props.zoom}
		zoomControl={false}
		dragging={false}
		doubleClickZoom={false}
		boxZoom={false}
		keyboard={false}
		scrollWheelZoom={false}
	>
		<TileLayer
			attribution='Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			url='https://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png'
		/>
		{props.markers.map((marker, index) => (
			<Marker key={index} position={Object.values(marker)}>

			</Marker>
		))}
	</LeafletMap>
);


export default withFirebase(LocatedTwo);