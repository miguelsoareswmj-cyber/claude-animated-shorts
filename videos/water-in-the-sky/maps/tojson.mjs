import fs from 'fs'; import * as topo from 'topojson-client';
const t = JSON.parse(fs.readFileSync('node_modules/world-atlas/land-50m.json'));
const g = topo.feature(t, t.objects.land);
fs.writeFileSync('land.geojson', JSON.stringify(g));
