import { parseStringPromise } from 'xml2js';
import * as fs from 'fs';
import { error } from 'console';
const filePath: string = 'current_status.txt';

function readFile(filePath: string): string | null {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return data;
  } catch (error) {
    console.error(`Error reading file: ${error}`);
    return null;
  }
}

const fileContent = readFile(filePath);

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
  // Test URL: https://www.opm.gov/xml/operatingstatus.xml?date=05/10/2013&markup=on
  // Test URL (long message): https://www.opm.gov/xml/operatingstatus.xml?date=02/06/2025&markup=on
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
      const shortSummary = currentStatus.OperatingStatus?.[0]?.trim() || '';
      const statusURL = currentStatus.Url?.[0]?.trim() || '';
      // Concatenate the extracted values into a single string with newline separator
      const result = `${appliesTo}\n\n${longStatusMessage}\n\n${statusURL}`;
      const short_result = `${appliesTo}\n\n${shortSummary}\n\n${statusURL}`;
 
      if(result != fileContent){
        fs.writeFile(filePath, result, (err) => {
          if (err) {
            console.error("An error occurred while writing to the file:", err);
          } else {
            console.log("Text successfully written to", filePath);
          }
      })
      console.log("Text is different, successfully updated");
      if(result.length > 300){
        console.log(short_result);
        return short_result;
      }else{
      return result;}
    } else {
        console.error("Current status is identical to cached status");
        throw error;
      };
      // Return the concatenated string
      
    } else {
      console.error("CurrentStatus not found in XML.");
      throw error;  // Return an empty string if CurrentStatus is not found
    }
  } catch (error) {
    console.error("Error parsing XML:", error);
    throw error;  // Optional: re-throw or handle error as appropriate
  }
}
