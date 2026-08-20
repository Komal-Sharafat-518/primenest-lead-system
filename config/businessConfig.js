// Business-specific configuration
// Isko future clients ke liye replace kiya ja sakta hai — core logic ko touch kiye baghair

module.exports = {
  business: {
    name: "PrimeNest Realty",
    type: "Real Estate Agency",
    location: "Houston, Texas",
    market: "United States",
  },

  leadScoring: {
    coldMax: 39,      // 0-39 = COLD
    warmMax: 69,       // 40-69 = WARM
    hotMin: 70,         // 70-100 = HOT
  },

  followUp: {
    maxFollowUps: 3,           // kitni baar follow-up hoga
    followUpIntervalDays: 2,   // har follow-up ke darmiyan kitne din ka gap
  },
};