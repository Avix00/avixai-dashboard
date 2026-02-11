'use client';

import { useEffect, useState, memo } from 'react';
import {
    ComposableMap,
    Geographies,
    Geography,
    ZoomableGroup,
} from 'react-simple-maps';
import { supabase } from '@/lib/supabase/client';
import { LocationCount } from '@/lib/supabase/types';

// World map TopoJSON
const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Country name to ISO code mapping for coloring
const countryNameToCode: Record<string, string> = {
    'Italy': 'ITA',
    'USA': 'USA',
    'United States': 'USA',
    'Germany': 'DEU',
    'France': 'FRA',
    'Spain': 'ESP',
    'UK': 'GBR',
    'United Kingdom': 'GBR',
    'Switzerland': 'CHE',
    'Austria': 'AUT',
    'Netherlands': 'NLD',
    'Belgium': 'BEL',
    'Portugal': 'PRT',
    'Poland': 'POL',
    'Sweden': 'SWE',
    'Norway': 'NOR',
    'Denmark': 'DNK',
    'Finland': 'FIN',
    'Greece': 'GRC',
    'Czech Republic': 'CZE',
    'Hungary': 'HUN',
    'Romania': 'ROU',
    'Russia': 'RUS',
    'China': 'CHN',
    'Japan': 'JPN',
    'South Korea': 'KOR',
    'India': 'IND',
    'Australia': 'AUS',
    'Brazil': 'BRA',
    'Mexico': 'MEX',
    'Argentina': 'ARG',
};

function GeoHeatmapInner() {
    const [locationData, setLocationData] = useState<LocationCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [hoveredGeo, setHoveredGeo] = useState<string | null>(null);
    const [maxCount, setMaxCount] = useState(1);

    useEffect(() => {
        async function fetchData() {
            try {
                const { data, error } = await supabase
                    .from('calls')
                    .select('location')
                    .not('location', 'is', null);

                if (error) throw error;

                // Count by location
                const locationCounts: Record<string, number> = {};
                data?.forEach((call) => {
                    if (call.location) {
                        locationCounts[call.location] = (locationCounts[call.location] || 0) + 1;
                    }
                });

                const chartData = Object.entries(locationCounts)
                    .map(([location, count]) => ({ location, count }))
                    .sort((a, b) => b.count - a.count);

                setLocationData(chartData);
                if (chartData.length > 0) {
                    setMaxCount(chartData[0].count);
                }
            } catch (err) {
                console.error('Error fetching location data:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    function getCountryColor(geoName: string): string {
        // Find matching location data
        const match = locationData.find((loc) => {
            const code = countryNameToCode[loc.location];
            return code === geoName || loc.location === geoName;
        });

        if (match) {
            // Calculate intensity based on count
            const intensity = Math.min(match.count / maxCount, 1);
            // Gradient from dark purple to bright cyan
            if (intensity > 0.7) {
                return '#22d3ee'; // cyan-400
            } else if (intensity > 0.4) {
                return '#8b5cf6'; // violet-500
            } else {
                return '#6366f1'; // indigo-500
            }
        }
        return 'rgba(255, 255, 255, 0.03)'; // Default - very subtle
    }

    function getCountryCallCount(geoName: string): number {
        const match = locationData.find((loc) => {
            const code = countryNameToCode[loc.location];
            return code === geoName || loc.location === geoName;
        });
        return match?.count || 0;
    }

    if (loading) {
        return (
            <div className="glass-card p-6 h-[450px] flex items-center justify-center">
                <div className="skeleton w-full h-full" />
            </div>
        );
    }

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                    Mappa Geografica Chiamate
                </h3>
                {hoveredGeo && (
                    <div className="px-3 py-1.5 rounded-lg bg-white/10 text-sm">
                        <span className="text-white/70">{hoveredGeo}: </span>
                        <span className="text-cyan-400 font-semibold">
                            {getCountryCallCount(hoveredGeo)} chiamate
                        </span>
                    </div>
                )}
            </div>

            {locationData.length === 0 ? (
                <div className="h-[380px] flex items-center justify-center">
                    <p className="text-white/50">Nessun dato geografico disponibile</p>
                </div>
            ) : (
                <div className="h-[380px] rounded-xl overflow-hidden bg-slate-900/50">
                    <ComposableMap
                        projection="geoMercator"
                        projectionConfig={{
                            scale: 120,
                            center: [10, 45], // Center on Europe
                        }}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <ZoomableGroup>
                            <Geographies geography={geoUrl}>
                                {({ geographies }) =>
                                    geographies.map((geo) => {
                                        const geoName = geo.properties.name;
                                        const isoCode = geo.id;
                                        const callCount = getCountryCallCount(isoCode);
                                        const hasData = callCount > 0;

                                        return (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                onMouseEnter={() => {
                                                    if (hasData) setHoveredGeo(isoCode);
                                                }}
                                                onMouseLeave={() => setHoveredGeo(null)}
                                                style={{
                                                    default: {
                                                        fill: getCountryColor(isoCode),
                                                        stroke: 'rgba(255, 255, 255, 0.1)',
                                                        strokeWidth: 0.5,
                                                        outline: 'none',
                                                        transition: 'all 0.3s ease',
                                                    },
                                                    hover: {
                                                        fill: hasData ? '#22d3ee' : 'rgba(255, 255, 255, 0.08)',
                                                        stroke: hasData ? '#22d3ee' : 'rgba(255, 255, 255, 0.2)',
                                                        strokeWidth: hasData ? 1.5 : 0.5,
                                                        outline: 'none',
                                                        cursor: hasData ? 'pointer' : 'default',
                                                    },
                                                    pressed: {
                                                        fill: '#8b5cf6',
                                                        outline: 'none',
                                                    },
                                                }}
                                            />
                                        );
                                    })
                                }
                            </Geographies>
                        </ZoomableGroup>
                    </ComposableMap>
                </div>
            )}

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-cyan-400" />
                    <span className="text-white/60">Alto volume</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-violet-500" />
                    <span className="text-white/60">Medio volume</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-indigo-500" />
                    <span className="text-white/60">Basso volume</span>
                </div>
            </div>
        </div>
    );
}

export const GeoHeatmap = memo(GeoHeatmapInner);
