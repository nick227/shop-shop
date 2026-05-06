-- Check if the store ID exists
SELECT id, name FROM Store WHERE id = 'd701e9e8-d350-467b-afa8-177a7fdec52f';

-- Check if store has items
SELECT id, title FROM Item WHERE storeId = 'd701e9e8-d350-467b-afa8-177a7fdec52f' LIMIT 5;
