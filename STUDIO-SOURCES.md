# Studio directory sources

Checked 2026-09-29.

## Urban-C Lashes - Cavite Main
- Contact, address, services and social links: https://urbanclashesbookings.setmore.com/
- Public map coordinates: https://gandaph.com/eyelash-studios/tanza/
- Address and Facebook cross-check: https://gandaph.com/eyelash-studios/tanza/urban-c-lashes
- Latitude 14.349933; longitude 120.805420.

Coordinates are from a third-party directory, not an on-site or owner verification. The UI identifies the map source and asks visitors to confirm the entrance. No ratings or studio photos were fabricated. The fallback cover is a decorative monogram.

Existing admin listings are preserved and are not marked as source checked. Source links disappear if an administrator changes the researched address, contacts or coordinates.

For a new installation, import database.sql, run migrate.php, then run php import-studio-listings.php. The import adds missing slugs and preserves existing records.

Run node tests/studio-directory-check.cjs from the project root to test the directory through local Apache. It creates and removes temporary test accounts and saves two screenshots under tests/.

## Additional studio listings (2026-09-29)

Five added listings have empty specialties and capabilities for the administrator to configure. Their public contact and map sources are in studio-sources.json. Hidden Beauty Luxe phone/address also match its official website. Other new records rely on a public directory; Facebook pages could not be independently fetched. Pins are published coordinates, not owner or on-site verification. Glam Looks has an incomplete published street address; confirm the entrance with the studio.

- Jem's Lashenails & Aesthetic: https://gandaph.com/eyelash-studios/tanza/jems-lashenails-aesthetic/ | Map: https://gandaph.com/eyelash-studios/tanza/
- Glam Looks - Beauty Studio: https://gandaph.com/beauty-salons/tanza/glam-looks-beauty-studio/ | Map: https://gandaph.com/eyelash-studios/tanza/
- Brow Fairy - Sanja Mayor: https://gandaph.com/beauty-salons/tanza/brow-fairy-eyebrow-threading-waxing-salon-sanja-mayor-tanza-cavite/ | Map: https://gandaph.com/eyelash-studios/tanza/
- Hidden Beauty Luxe: https://www.hiddenbeautyluxe.com/contact | Map: https://gandaph.com/eyelash-studios/imus/
- Khitel's Wax Eyelash Salon: https://gandaph.com/eyelash-studios/bacoor/khitels-wax-eyelash-salon/ | Map: https://gandaph.com/eyelash-studios/bacoor/

## Illustrated covers

The user approved illustrated covers. Six fictional salon illustrations were generated with the built-in image_gen tool, including a cover for Urban-C. These are not photos of the named studios. PNG originals and JPEG display copies are saved in assets/studios. Exact prompts are in assets/studios/cover-prompts.json. Visible Illustration badges were removed at the user's request; image provenance remains in metadata and descriptive alt text. Image fingerprints ensure replacement uploads are not automatically labeled as generated. ABG and existing capabilities are preserved. Re-running the importer only adds missing studios or fills empty images.
