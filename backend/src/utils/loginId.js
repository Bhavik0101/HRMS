const supabase = require('../config/supabase');

/**
 * Generates a Login ID in the format described in the wireframes:
 *   [First 2 letters of Company Name][First 2 letters of First+Last name][Year of Joining][Serial number]
 * Example: OCJODO20250001
 *   OC   -> Company name "Oceanic Co"
 *   JODO -> John Doe (Jo + Do)
 *   2025 -> Year of joining
 *   0001 -> Serial number of joining for that year
 */
async function generateLoginId({ companyName, firstName, lastName, joiningYear }) {
  const companyPrefix = (companyName || 'CO').replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase().padEnd(2, 'X');
  const namePrefix = (
    (firstName || 'AA').slice(0, 2) + (lastName || 'AA').slice(0, 2)
  )
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .padEnd(4, 'X')
    .slice(0, 4);
  const year = joiningYear || new Date().getFullYear();

  // Find how many employees already joined in this year to compute the serial number
  const { count, error } = await supabase
    .from('employees')
    .select('id', { count: 'exact', head: true })
    .gte('date_of_joining', `${year}-01-01`)
    .lte('date_of_joining', `${year}-12-31`);

  if (error) throw error;

  const serial = String((count || 0) + 1).padStart(4, '0');
  return `${companyPrefix}${namePrefix}${year}${serial}`;
}

module.exports = { generateLoginId };
