import React, { Component } from "react";
import { Map, TileLayer, Marker, Popup } from "react-leaflet";

import AntPath from "react-leaflet-ant-path";

const styles = {
	height: "100vh"
}

const GameMap = props => {
	const userMarkers = [];
	const userTrails = [];
	const userUids = Object.keys(props.users);
	userUids.forEach(uid => {
		userMarkers.push(props.users[uid].path[props.users[uid].path.length - 1]);
		userTrails.push(props.users[uid].path)
	});

	const options = { color: "red", pulseColor: "#FFF", delay: 300 };

	return (
		<Map
			style={styles}
			center={props.userPosition}
			zoom={18}
			zoomControl={false}
			dragging={false}
			doubleClickZoom={false}
			boxZoom={false}
			keyboard={false}
			scrollWheelZoom={false}
		>


			{/* Loop through all ingame users - Display their marker and path */}
			{userTrails.map((positions, index) => (
				<AntPath key={index} positions={positions} options={options} />
			))}

			{userMarkers.map((position, index) => (
				<Marker
					key={index} position={position}
				>
				</Marker>
			))}

			{props.collision ?
				<Marker position={props.collision}> </Marker> : null
			}

			<TileLayer
				attribution='Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url='https://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png'
			/>
		</Map>
	);
};

export default GameMap;