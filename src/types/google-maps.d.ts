declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: HTMLElement | null, opts?: MapOptions);
      setCenter(latlng: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
      addListener(eventName: string, handler: Function): MapsEventListener;
      controls: { [key: number]: ControlPositionArray };
    }

    class Marker {
      constructor(opts?: MarkerOptions);
      setPosition(latlng: LatLng | LatLngLiteral | null): void;
      getPosition(): LatLng | null;
      addListener(eventName: string, handler: Function): MapsEventListener;
    }

    class Geocoder {
      geocode(request: GeocoderRequest, callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void): void;
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map | null;
      draggable?: boolean;
    }

    interface LatLng {
      lat(): number;
      lng(): number;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface MapMouseEvent {
      latLng: LatLng | null;
    }

    interface MapsEventListener {
      remove(): void;
    }

    interface ControlPositionArray {
      push(element: HTMLElement): void;
    }

    const ControlPosition: {
      readonly TOP_LEFT: number;
      readonly TOP_CENTER: number;
      readonly TOP_RIGHT: number;
      readonly LEFT_CENTER: number;
      readonly RIGHT_CENTER: number;
      readonly BOTTOM_LEFT: number;
      readonly BOTTOM_CENTER: number;
      readonly BOTTOM_RIGHT: number;
      readonly LEFT_TOP: number;
      readonly RIGHT_TOP: number;
      readonly LEFT_BOTTOM: number;
      readonly RIGHT_BOTTOM: number;
    };

    namespace places {
      class SearchBox {
        constructor(inputField: HTMLInputElement);
        addListener(eventName: string, handler: Function): MapsEventListener;
        getPlaces(): PlaceResult[];
      }

      interface PlaceResult {
        geometry?: {
          location: LatLng;
        };
        formatted_address?: string;
      }
    }

    interface GeocoderRequest {
      location?: LatLng | LatLngLiteral;
    }

    interface GeocoderResult {
      formatted_address?: string;
    }

    type GeocoderStatus = 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';
  }
}

