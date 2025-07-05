"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Store, Home, Package, Truck } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { useTranslations } from "next-intl";

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

interface TrackingHistory {
  status: string;
  location: string;
  timestamp: Date;
  description: string;
  coordinates?: { lat: number; lng: number };
}

interface TrackingMapProps {
  trackingHistory: TrackingHistory[];
  vendorLocation?: {
    lat: number;
    lng: number;
    name: string;
  };
  deliveryLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
}

// Create custom icons
function createCustomIcon(IconComponent: any, color: string) {
  const iconHtml = renderToStaticMarkup(
    <div
      className={`w-8 h-8 ${color} rounded-full flex items-center justify-center shadow-lg border-2 border-white`}
    >
      <IconComponent className="w-4 h-4 text-white" />
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: "custom-div-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

const vendorIcon = createCustomIcon(Store, "bg-blue-500");
const homeIcon = createCustomIcon(Home, "bg-green-500");
const packageIcon = createCustomIcon(Package, "bg-purple-500");
const truckIcon = createCustomIcon(Truck, "bg-orange-500");

export default function TrackingMap({
  trackingHistory,
  vendorLocation,
  deliveryLocation,
}: TrackingMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const t = useTranslations("Orders.mapLabels");

  // Get all coordinates
  const trackingCoordinates = trackingHistory
    .filter((h) => h.coordinates)
    .map((h) => [h.coordinates!.lat, h.coordinates!.lng] as [number, number]);

  // Calculate center and bounds
  const allCoordinates: [number, number][] = [...trackingCoordinates];
  if (vendorLocation) {
    allCoordinates.push([vendorLocation.lat, vendorLocation.lng]);
  }
  if (deliveryLocation) {
    allCoordinates.push([deliveryLocation.lat, deliveryLocation.lng]);
  }

  // Default center (Mexico City)
  const defaultCenter: [number, number] = [19.4326, -99.1332];
  const center = allCoordinates.length > 0 ? allCoordinates[0] : defaultCenter;

  useEffect(() => {
    if (mapRef.current && allCoordinates.length > 1) {
      const bounds = L.latLngBounds(allCoordinates);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [trackingHistory, vendorLocation, deliveryLocation]);

  // Get icon for tracking status
  function getTrackingIcon(status: string) {
    if (status.includes("Transit") || status.includes("Delivery")) {
      return truckIcon;
    }
    return packageIcon;
  }

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border">
      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full"
        ref={mapRef}
        style={{ background: "#f8fafc" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="grayscale-[30%]"
        />

        {/* Vendor Location */}
        {vendorLocation && (
          <Marker
            position={[vendorLocation.lat, vendorLocation.lng]}
            icon={vendorIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{vendorLocation.name}</p>
                <p className="text-muted-foreground">{t("vendorLocation")}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Delivery Location */}
        {deliveryLocation && (
          <Marker
            position={[deliveryLocation.lat, deliveryLocation.lng]}
            icon={homeIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{t("deliveryAddress")}</p>
                <p className="text-muted-foreground">{deliveryLocation.address}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Tracking Points */}
        {trackingHistory.map((event, index) => {
          if (!event.coordinates) return null;
          return (
            <Marker
              key={index}
              position={[event.coordinates.lat, event.coordinates.lng]}
              icon={getTrackingIcon(event.status)}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{event.status}</p>
                  <p className="text-muted-foreground">{event.location}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Route Line */}
        {trackingCoordinates.length > 1 && (
          <Polyline
            positions={trackingCoordinates}
            color="#6366f1"
            weight={3}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}
      </MapContainer>
    </div>
  );
}