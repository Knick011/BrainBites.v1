// src/utils/CSVReader.js
import RNFS from 'react-native-fs';
import Papa from 'papaparse';
import { Platform } from 'react-native';

class CSVReader {
  /**
   * Reads a CSV file from assets or file system
   * @param {string} fileName - The name of the CSV file 
   * @param {string} directory - Optional directory path for the file
   * @returns {Promise<Array>} - Promise resolving to parsed CSV data
   */
  static async readCSV(fileName, directory = '') {
    try {
      // First try to read from direct file path if a directory is provided
      if (directory) {
        const filePath = `${directory}/${fileName}`;
        if (await RNFS.exists(filePath)) {
          const fileContent = await RNFS.readFile(filePath, 'utf8');
          return this.parseCSV(fileContent);
        }
      }

      // If not found or no directory specified, try document directory
      const docDirPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      
      // Check if file exists in document directory
      const existsInDocDir = await RNFS.exists(docDirPath);
      
      if (existsInDocDir) {
        // Read from document directory
        const fileContent = await RNFS.readFile(docDirPath, 'utf8');
        return this.parseCSV(fileContent);
      }
      
      // If not in document directory, try to copy from assets
      if (Platform.OS === 'android') {
        await RNFS.copyFileAssets(fileName, docDirPath);
        const fileContent = await RNFS.readFile(docDirPath, 'utf8');
        return this.parseCSV(fileContent);
      } else if (Platform.OS === 'ios') {
        // For iOS, try to read from app bundle
        const mainBundlePath = `${RNFS.MainBundlePath}/${fileName}`;
        if (await RNFS.exists(mainBundlePath)) {
          const fileContent = await RNFS.readFile(mainBundlePath, 'utf8');
          return this.parseCSV(fileContent);
        }
      }
      
      // Finally try to read directly from the assets directory
      if (directory.includes('assets') || fileName.includes('assets')) {
        let path = fileName;
        if (!path.includes('assets')) {
          path = `assets/${fileName}`;
        }
        const fileContent = await RNFS.readFileAssets(path, 'utf8');
        return this.parseCSV(fileContent);
      }
      
      throw new Error(`Could not find CSV file: ${fileName}`);
    } catch (error) {
      console.error(`Error reading CSV file (${fileName}):`, error);
      throw error;
    }
  }
  
  /**
   * Parse CSV content to array of objects
   * @param {string} content - CSV content
   * @returns {Array} - Parsed data
   */
  static parseCSV(content) {
    return new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors && results.errors.length > 0) {
            console.warn('CSV parsing had errors:', results.errors);
          }
          resolve(results.data);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          reject(error);
        }
      });
    });
  }
}

export default CSVReader;