// Load the Sentinel-1 ImageCollection.
var sentinel1 = ee.ImageCollection('COPERNICUS/S1_GRD');

// Filter VH, IW
var vh = sentinel1
  // Filter to get images with VV and VH dual polarization.
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
  // Filter to get images collected in interferometric wide swath mode.
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  // reduce to VH polarization
  .select('VH')
  // filter 10m resolution
  .filter(ee.Filter.eq('resolution_meters', 10))
  // Filter to orbitdirection Descending
  .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))
  // Filter time 2015
  .filterDate(ee.Date('2018-01-01'), ee.Date('2018-12-31'))
  .filterBounds(roi);


var size = vh.toList(500).length();
print('Number of images: ', size);

var p90 = vh.reduce(ee.Reducer.percentile([90]));
var p10 = vh.reduce(ee.Reducer.percentile([10]));

var mean = vh.mean();
var min = vh.min();
var max = vh.max();
var std = vh.reduce(ee.Reducer.stdDev());
var range = max.subtract(min);
var diff = p90.subtract(p10);

var SMOOTHING_RADIUS = 85;
var DIFF_UPPER_THRESHOLD = -3; 

var std_filter = std.focal_median(SMOOTHING_RADIUS, 'circle', 'meters')

Map.addLayer(diff.clip(roi), {min: [2], max: [17]}, 'p90-p10', 0);
Map.addLayer(mean.clip(roi), {min: [-25], max: [0]}, 'mean', 0);
Map.addLayer(std.clip(roi), {min: [0], max: [2]}, 'std', 0);
Map.addLayer(std_filter.clip(roi), {min: [0], max: [3.5]}, 'std_filter', 1);


var mask = std_filter.gt(2.75).clip(roi);
var mask = mask.updateMask(mask);
Map.addLayer(mask, {palette: 'FF0000'}, 'mask', 1);

Map.centerObject(roi, 11);

Export.image.toDrive({
  image: mask,
  description: 'mask_2018',
  scale: 10,
  folder: "S1_Chad",
  region: roi
});
