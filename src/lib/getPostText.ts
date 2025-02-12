import { parseStringPromise } from 'xml2js';

function cleanText(input: string): string {
  // Replace \r with \n
  input = input.replace(/\r/g, '\n');
  input = input.replace(/\n /g, '\n');

  // Replace double spaces with a single space
  input = input.replace(/  +/g, ' ');

  return input;
}

export default async function getPostText(): Promise<string> {
  // Fetch the XML file
  const response = await fetch("https://www.opm.gov/xml/operatingstatus.xml", {
    headers: {
      Accept: "application/xml", // Accept XML response
    },
  });

  // Get the XML text
  const xmlText = await response.text();

  try {
    // Parse the XML string using xml2js
    const parsedData = await parseStringPromise(xmlText);

    // Extract the "CurrentStatus" object
    const currentStatus = parsedData?.CurrentStatus;

    // Check if "CurrentStatus" exists
    if (currentStatus) {
      // Extract the first value from the AppliesTo and ShortStatusMessage arrays
      const appliesTo = currentStatus.AppliesTo?.[0]?.trim() || '';  // First element in AppliesTo array
      const longStatus = currentStatus.LongStatusMessage?.[0]?.trim() || '';  // First element in longStatusMessage array
      const longStatusMessage = cleanText(longStatus)
      const statusURL = currentStatus.Url?.[0]?.trim() || '';
      // Concatenate the extracted values into a single string with newline separator
      const fulltext = `${appliesTo}\n\n${longStatusMessage}\n\n${statusURL}`;
      let result = '';
      // Return the concatenated string
      if (fulltext.length > 300) {
        const shortSummary = currentStatus.StatusSummary?.[0]?.trim() || '';
        const result = `${appliesTo}\n\n${shortSummary}\n\n${statusURL}`;
      }
      else{const result = fulltext}
      return result;
    } else {
      console.error("CurrentStatus not found in XML.");
      return '';  // Return an empty string if CurrentStatus is not found
    }
  } catch (error) {
    console.error("Error parsing XML:", error);
    throw error;  // Optional: re-throw or handle error as appropriate
  }
}
