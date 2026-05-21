/**
 * Phase 0 canonical contracts.
 *
 * These typedefs establish a stable cross-layer vocabulary while the codebase
 * remains JavaScript-first. They are intentionally runtime-free and can be
 * migrated to TypeScript interfaces in a later phase.
 */

/** @typedef {string} RegionId */
/** @typedef {string} ClusterId */
/** @typedef {string} CityId */
/** @typedef {string} ZoneId */

/**
 * @typedef {Object} StrategicRegion
 * @property {RegionId} id
 * @property {string} name
 * @property {string} continentId
 * @property {ClusterId[]} clusterIds
 */

/**
 * @typedef {Object} UrbanCluster
 * @property {ClusterId} id
 * @property {string} name
 * @property {RegionId} regionId
 * @property {CityId[]} cityIds
 * @property {string[]} corridorIds
 */

/**
 * @typedef {Object} CityNode
 * @property {CityId} id
 * @property {string} name
 * @property {string} countryCode
 * @property {number} lat
 * @property {number} lon
 * @property {ClusterId} clusterId
 * @property {ZoneId[]} zoneIds
 */

/**
 * @typedef {'city' | 'airport' | 'railHub' | 'healthHub' | 'cluster'} MobilityNodeType
 */

/**
 * @typedef {'railHighSpeed' | 'railRegional' | 'air' | 'road' | 'ferry'} MobilityEdgeMode
 */

/**
 * @typedef {Object} MobilityNode
 * @property {string} id
 * @property {MobilityNodeType} type
 * @property {CityId=} cityId
 * @property {number} lat
 * @property {number} lon
 * @property {number=} capacityIndex
 */

/**
 * @typedef {Object} MobilityEdge
 * @property {string} id
 * @property {string} fromNodeId
 * @property {string} toNodeId
 * @property {MobilityEdgeMode} mode
 * @property {number} travelMinutes
 * @property {number} reliabilityScore
 * @property {number} redundancyScore
 * @property {boolean} borderCrossing
 */

/**
 * @typedef {Object} AccessibilityProfile
 * @property {CityId} cityId
 * @property {number} populationReach3h
 * @property {number} gdpReach3h
 * @property {number} capitalsReach6h
 * @property {number} airportsReach3h
 * @property {number} transferComplexity
 */

/**
 * @typedef {Object} ResilienceProfile
 * @property {CityId} cityId
 * @property {number} alternateRouteScore
 * @property {number} disruptionSurvivability
 * @property {number} strikeExposure
 * @property {number} climateExposure
 */

/** @typedef {'sourceBacked' | 'composite' | 'inferential'} EvidenceClass */

/**
 * @typedef {Object} VerificationRecord
 * @property {string} metricKey
 * @property {CityId} cityId
 * @property {EvidenceClass} evidenceClass
 * @property {number} sourceCount
 * @property {number} sourceDiversityScore
 * @property {number} freshnessDays
 * @property {number} freshnessDecay
 * @property {number} confidence
 * @property {string} verifiedAt
 * @property {string[]} sourceRefs
 */

/**
 * @typedef {Object} ForecastPoint
 * @property {number} year
 * @property {number} value
 * @property {number} lower
 * @property {number} upper
 */

/** @typedef {'improving' | 'stable' | 'worsening'} TrendDirection */
/** @typedef {'low' | 'medium' | 'high'} VolatilityBand */

/**
 * @typedef {Object} IndicatorTimeline
 * @property {CityId} cityId
 * @property {string} indicatorKey
 * @property {number} current
 * @property {TrendDirection} trend
 * @property {VolatilityBand} volatility
 * @property {number} confidence
 * @property {ForecastPoint[]} forecast
 */

/**
 * @typedef {'inflationWave' | 'fuelShock' | 'railStrike' | 'drought' | 'heatwave' | 'recession' | 'airportClosure' | 'healthcareOverload'} ShockType
 */

/**
 * @typedef {'continent' | 'region' | 'cluster' | 'city'} ShockScope
 */

/**
 * @typedef {Object} SimulationShock
 * @property {string} id
 * @property {ShockType} type
 * @property {string} startDate
 * @property {number} durationDays
 * @property {number} severity
 * @property {ShockScope} targetScope
 * @property {string[]} targetIds
 */

/**
 * @typedef {Object} SimulationResult
 * @property {CityId} cityId
 * @property {number} resilienceDelta
 * @property {number} affordabilityDelta
 * @property {number} accessibilityDelta
 * @property {number} survivabilityScore
 * @property {number} recoveryDays
 */

/**
 * @typedef {Object} StrategicPositioning
 * @property {CityId} cityId
 * @property {string[]} strengths
 * @property {string[]} tradeoffs
 * @property {string[]} bestFor
 * @property {string[]} lessIdealFor
 */

/**
 * @typedef {Object} NarrativeInput
 * @property {StrategicPositioning} positioning
 * @property {VerificationRecord[]} verification
 * @property {IndicatorTimeline[]} forecast
 * @property {SimulationResult[]=} simulation
 */

/**
 * @typedef {Object} ClaimCitation
 * @property {string} claimId
 * @property {string[]} sourceRefs
 */

/**
 * @typedef {Object} NarrativeOutput
 * @property {CityId} cityId
 * @property {string} summary
 * @property {number} confidence
 * @property {ClaimCitation[]} citationMap
 */

// Runtime no-op export keeps this as an ES module while holding typedefs only.
export const CONTRACT_VERSION = 'phase0';
