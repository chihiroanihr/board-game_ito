import { getDB } from '../dbConnect';
import { logQueryEvent } from '../../log';

import type { AvailableThemeLanguageData } from '@bgi/shared';

export const getAvailableThemeLanguages = async (): Promise<AvailableThemeLanguageData[]> => {
  logQueryEvent('Fetching all the available languages for theme.');

  // Use the aggregation pipeline to group by the 'language' field and count the occurrences of each language.
  const result = await getDB()
    .themes.aggregate([
      {
        $group: {
          _id: '$language', // Group by the 'language' field.
          count: { $sum: 1 }, // Count the number of occurrences for each unique language.
        },
      },
      {
        $project: {
          _id: 0, // Exclude the '_id' field from the output.
          language: '$_id', // Include the 'language' (renaming '_id' to 'language').
          count: 1, // Include the 'count' field in the output.
        },
      },
    ])
    .toArray(); // Convert the aggregation result to an array.

  return result as AvailableThemeLanguageData[];
};

/*
OUTPUT:
------------------------
[
  {
    language: "Japanese",
    count: 7
  },
  {
    language: "English",
    count: 3
  },
  {
    language: "French",
    count: 5
  }
  // ...other languages
]
*/
