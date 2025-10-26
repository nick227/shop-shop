import { PrismaClient } from './src/generated/client';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

interface CsvRow {
  'country code': string;
  'postal code': string;
  'place name': string;
  'admin name1': string;
  'admin code1': string;
  'admin name2': string;
  'admin code2': string;
  latitude: string;
  longitude: string;
}

const mapCsvRowToGeocodingCache = (row: CsvRow) => {
  const postalCode = (row['postal code'] || '').trim();
  const city = (row['place name'] || '').trim();
  const state = (row['admin code1'] || '').trim();
  const country = (row['country code'] || '').trim().replace(/^\uFEFF/, '');
  const lat = parseFloat(row.latitude || '0');
  const lon = parseFloat(row.longitude || '0');

  if (!postalCode || !city || isNaN(lat) || isNaN(lon)) {
    return null;
  }

  const formattedAddress = state 
    ? `${city}, ${state} ${postalCode}`
    : `${city} ${postalCode}`;

  return {
    queryType: 'zip',
    queryValue: postalCode,
    latitude: lat,
    longitude: lon,
    city,
    state: state || null,
    zip: postalCode,
    country: country || 'US',
    formattedAddress,
    confidence: 'high',
    source: 'uszip',
  };
};

const importUSZips = async () => {
  const csvPath = join(process.cwd(), '..', '..', 'USZipsWithLatLon_20231227.csv');
  
  console.log('Reading CSV file...');
  const fileContent = readFileSync(csvPath, 'utf-8');
  
  console.log('Parsing CSV...');
  const records: CsvRow[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Found ${records.length} ZIP codes to import`);

  const batchSize = 1000;
  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const data = batch
      .map(mapCsvRowToGeocodingCache)
      .filter((row): row is NonNullable<typeof row> => row !== null);

    try {
      const result = await prisma.geocodingCache.createMany({
        data,
        skipDuplicates: true,
      });

      imported += result.count;
      console.log(`Progress: ${i + batch.length}/${records.length} (${imported} imported, ${i + batch.length - imported} skipped)`);
    } catch (error) {
      console.error(`Error importing batch starting at row ${i}:`, error);
      skipped += batch.length;
    }
  }

  console.log('\nImport complete!');
  console.log(`Total records: ${records.length}`);
  console.log(`Successfully imported: ${imported}`);
  console.log(`Skipped (duplicates/errors): ${records.length - imported}`);
};

importUSZips()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

