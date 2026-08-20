#!/usr/bin/env node
/* Metadaten eines GeoTIFF-DTMs ausgeben (CRS, Ausdehnung, Grösse, NoData). */
import { fromFile } from 'geotiff'

const path = process.argv[2]
const tiff = await fromFile(path)
const img = await tiff.getImage()
console.log('Grösse:', img.getWidth(), 'x', img.getHeight(), '·', img.getSamplesPerPixel(), 'Band(s)')
console.log('BBox [minX,minY,maxX,maxY]:', img.getBoundingBox())
console.log('Auflösung:', img.getResolution())
console.log('Origin:', img.getOrigin())
console.log('NoData:', img.getGDALNoData())
console.log('SampleFormat/BitsPerSample:', img.getSampleFormat?.(), img.getBitsPerSample?.())
const gk = img.getGeoKeys?.() ?? img.geoKeys
console.log('GeoKeys:', JSON.stringify(gk))
