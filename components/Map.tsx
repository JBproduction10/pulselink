'use client';

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Peer } from "../lib/p2p";
import type { Contact } from "../lib/contact";

// Fix for default marker icons in React Leaflet
const createCustomIcon = (color: string, isUser = false) => {
    const svgIcon = `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 26 16 26s16-15 16-26c0-8.837-7.163-16-16-16z" fill="${color}"/>
      <circle cx="16" cy="16" r="${isUser ? '8' : '6'}" fill="white"/>
      ${isUser ? '<circle cx="16" cy="16" r="4" fill="' + color + '"/>' : ''}
    </svg>`

    return L.divIcon({
        html: svgIcon,
        className: 'custom-marker',
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -42],
    });
};

const userIcon = createCustomIcon('#dc2626', true);
const safeIcon = createCustomIcon('#16a34a');
const helpIcon = createCustomIcon('#eab308');
const emergencyIcon = createCustomIcon('#dc2626');
const unknownIcon = createCustomIcon('#6b7280');
const offlineIcon = createCustomIcon('#9ca3af');

// Component to recenter map when user location changes
function RecenterMap({center}: {
    center: [number, number]
}) {
    const map = useMap();

    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);

    return null
}

interface MapViewProps {
    userLocation: {lat: number; lng: number} | null;
    userName: string;
    peers: Peer[];
    contacts: Contact[];
    userStatus: 'safe' | 'help' | 'emergency';
}

export default function MapView({
    userLocation, userName, peers, contacts, userStatus
}: MapViewProps){
    // Default to a central location if no user location
    const center: [number, number] = 
        userLocation 
        ?
        [userLocation.lat, userLocation.lng]
        :
        [37.7749, -122.4194]; // San Francisco

        const getStatusIcon = (status: string) => {
            switch (status){
                case 'safe': return safeIcon;
                case 'help': return helpIcon;
                case 'emergency': return emergencyIcon;
                case 'offline': return offlineIcon;
                default: return unknownIcon;
            }
        };

        const getStatusColor = (status: string) => {
            switch (status){
                case 'safe': return '#16a34a';
                case 'help': return '#eab308';
                case 'emergency': return '#dc2626';
                case 'offline': return '#9ca3af';
                default: return '#6b7280';
            }
        };

        return (
            <div className="h-[600px] w-full rounded-lg overflow-hidden border-2 border-gray-300 relative">
                <MapContainer
                    center={center}
                    zoom={13}
                    className="h-full w-full"
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <RecenterMap center={center}/>

                    {/* User location marker */}
                    {userLocation && (
                        <>
                            <Marker position={
                                [userLocation.lat, userLocation.lng]}
                                icon={userIcon}
                            >
                                <Popup>
                                    <div className="text-center">
                                        <p className="font-bold text-red-900">📍 You ({userName})</p>
                                        <p className="text-sm text-gray-600">Status: {userStatus}</p>
                                        
                                    </div>
                                </Popup>
                            </Marker>
                        </>
                    )}
                </MapContainer>
            </div>
        )
}

