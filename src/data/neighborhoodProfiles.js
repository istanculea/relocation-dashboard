const neighborhoodProfiles = {
  bilbao: [
    { name: 'Deusto', rentLevel: 'Medium', safety: 'High', commute: 'Good', familyFit: 8.6, note: 'Balanced access to schools, parks, and metro.' },
    { name: 'Indautxu', rentLevel: 'High', safety: 'High', commute: 'Excellent', familyFit: 8.1, note: 'Central and convenient, but pricier rents.' },
    { name: 'Getxo', rentLevel: 'High', safety: 'High', commute: 'Medium', familyFit: 8.8, note: 'Family-oriented coastal district with more space.' },
    { name: 'Abando', rentLevel: 'High', safety: 'High', commute: 'Excellent', familyFit: 8.4, note: 'Prime central district with top services and metro links.' },
    { name: 'Santutxu', rentLevel: 'Low', safety: 'High', commute: 'Good', familyFit: 7.8, note: 'Affordable hillside neighbourhood with tight community feel.' },
  ],
  bucharest: [
    { name: 'Floreasca', rentLevel: 'High', safety: 'High', commute: 'Good', familyFit: 8.2, note: 'Modern services and strong private-school options.' },
    { name: 'Cotroceni', rentLevel: 'Medium', safety: 'High', commute: 'Good', familyFit: 8.0, note: 'Quiet and established residential atmosphere.' },
    { name: 'Titan', rentLevel: 'Low', safety: 'Medium', commute: 'Good', familyFit: 7.4, note: 'Good value with parks and metro coverage.' },
    { name: 'Dorobanți', rentLevel: 'High', safety: 'High', commute: 'Good', familyFit: 8.5, note: 'Upscale lakeside area with embassies, parks, and premium schools.' },
    { name: 'Drumul Taberei', rentLevel: 'Low', safety: 'Medium', commute: 'Good', familyFit: 7.6, note: 'Large suburban zone with metro access and family parks.' },
  ],
  bologna: [
    { name: 'Murri', rentLevel: 'Medium', safety: 'High', commute: 'Good', familyFit: 8.5, note: 'Residential and family-friendly with schools nearby.' },
    { name: 'Saragozza', rentLevel: 'Medium', safety: 'High', commute: 'Medium', familyFit: 8.1, note: 'Good neighborhood quality with mild elevation.' },
    { name: 'Navile', rentLevel: 'Low', safety: 'Medium', commute: 'Good', familyFit: 7.3, note: 'Affordable tradeoff with mixed housing quality.' },
    { name: 'Santo Stefano', rentLevel: 'Medium', safety: 'High', commute: 'Good', familyFit: 7.9, note: 'Historic southern quarter with strong community identity.' },
    { name: 'Savena', rentLevel: 'Low', safety: 'High', commute: 'Medium', familyFit: 7.6, note: 'Quiet eastern residential area with good school density.' },
  ],
  lugo: [
    { name: 'Centro', rentLevel: 'Low', safety: 'High', commute: 'Good', familyFit: 7.9, note: 'Walkable core with essential services nearby.' },
    { name: 'Paradai', rentLevel: 'Low', safety: 'Medium', commute: 'Medium', familyFit: 7.1, note: 'Value-oriented, quieter peripheral district.' },
    { name: 'Ronda das Fontinas', rentLevel: 'Low', safety: 'Medium', commute: 'Good', familyFit: 7.5, note: 'Practical family area with easy city access.' },
    { name: 'Fingoi', rentLevel: 'Low', safety: 'High', commute: 'Good', familyFit: 7.7, note: 'Established residential zone with parks and family amenities.' },
    { name: 'As Gándaras', rentLevel: 'Low', safety: 'Medium', commute: 'Medium', familyFit: 7.0, note: 'Growth-phase suburb offering new housing at low cost.' },
  ],
  milan: [
    { name: 'Lambrate', rentLevel: 'Medium', safety: 'Medium', commute: 'Excellent', familyFit: 7.7, note: 'Transit-rich and improving family infrastructure.' },
    { name: 'Bicocca', rentLevel: 'Medium', safety: 'High', commute: 'Good', familyFit: 8.0, note: 'Modern layout with schools and green spaces.' },
    { name: 'NoLo', rentLevel: 'Medium', safety: 'Medium', commute: 'Excellent', familyFit: 7.2, note: 'Strong transport and services, mixed street feel.' },
    { name: 'Porta Romana', rentLevel: 'High', safety: 'High', commute: 'Excellent', familyFit: 8.2, note: 'Established central-south quarter with good schools and tram links.' },
    { name: 'Bovisa', rentLevel: 'Low', safety: 'Medium', commute: 'Good', familyFit: 7.1, note: 'Affordable post-industrial area near Politecnico campus.' },
  ],
  reggioEmilia: [
    { name: 'Rosta Nuova', rentLevel: 'Low', safety: 'High', commute: 'Good', familyFit: 8.4, note: 'Calm, family-oriented residential district.' },
    { name: 'Canalina', rentLevel: 'Low', safety: 'High', commute: 'Good', familyFit: 8.1, note: 'Stable neighborhood with strong local amenities.' },
    { name: 'Centro Storico', rentLevel: 'Medium', safety: 'Medium', commute: 'Good', familyFit: 7.3, note: 'Convenient but less spacious for families.' },
    { name: 'Pieve Modolena', rentLevel: 'Low', safety: 'High', commute: 'Medium', familyFit: 8.0, note: 'Quiet outlying village merged into city with strong family density.' },
    { name: 'Santa Croce', rentLevel: 'Low', safety: 'High', commute: 'Good', familyFit: 7.8, note: 'Compact residential district adjacent to city centre services.' },
  ],
  cologne: [
    { name: 'Lindenthal', rentLevel: 'High', safety: 'High', commute: 'Good', familyFit: 8.7, note: 'Top family profile with schools and parks.' },
    { name: 'Nippes', rentLevel: 'Medium', safety: 'High', commute: 'Good', familyFit: 8.2, note: 'Balanced costs and strong neighborhood vibe.' },
    { name: 'Ehrenfeld', rentLevel: 'Medium', safety: 'Medium', commute: 'Excellent', familyFit: 7.6, note: 'Dynamic district with mixed family comfort.' },
    { name: 'Sülz', rentLevel: 'Medium', safety: 'High', commute: 'Good', familyFit: 8.5, note: 'Sought-after family district with leafy streets and good schools.' },
    { name: 'Rodenkirchen', rentLevel: 'High', safety: 'High', commute: 'Medium', familyFit: 8.3, note: 'Southern Rhine suburb with green space and premium housing stock.' },
  ],
  valencia: [
    { name: 'Campanar', rentLevel: 'Medium', safety: 'High', commute: 'Good', familyFit: 8.6, note: 'Strong hospital and school access for families.' },
    { name: 'Benimaclet', rentLevel: 'Medium', safety: 'Medium', commute: 'Good', familyFit: 7.8, note: 'Good services with a student-heavy blend.' },
    { name: 'El Carmen', rentLevel: 'Medium', safety: 'Medium', commute: 'Medium', familyFit: 7.0, note: 'Historic core with charm but more noise.' },
    { name: 'Patraix', rentLevel: 'Low', safety: 'High', commute: 'Good', familyFit: 7.9, note: 'Affordable western district with solid metro and school coverage.' },
    { name: "L'Eixample", rentLevel: 'Medium', safety: 'High', commute: 'Excellent', familyFit: 8.1, note: 'Modern grid district with wide avenues, parks, and metro stops.' },
  ],
  vienna: [
    { name: 'Leopoldstadt', rentLevel: 'Medium', safety: 'High', commute: 'Excellent', familyFit: 8.8, note: 'Excellent public transport and family amenities.' },
    { name: 'Hietzing', rentLevel: 'High', safety: 'High', commute: 'Good', familyFit: 8.9, note: 'Premium family district with green access.' },
    { name: 'Favoriten', rentLevel: 'Low', safety: 'Medium', commute: 'Good', familyFit: 7.2, note: 'Budget-friendly with variable street quality.' },
    { name: 'Döbling', rentLevel: 'High', safety: 'High', commute: 'Good', familyFit: 8.7, note: 'Prestigious northern district with vineyards, schools, and low density.' },
    { name: 'Floridsdorf', rentLevel: 'Low', safety: 'High', commute: 'Good', familyFit: 7.9, note: 'Spacious trans-Danube suburb with good U-Bahn links and family parks.' },
  ],
};

export const getNeighborhoodProfiles = (cityKey) => {
  const rows = neighborhoodProfiles[cityKey] ?? [];
  return [...rows].sort((left, right) => right.familyFit - left.familyFit);
};
