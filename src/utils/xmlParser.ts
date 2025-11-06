import { XMLParser } from 'fast-xml-parser';

export const parseXML = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target) {
        const xmlString = event.target.result as string;
        const parser = new XMLParser();
        const jsonObj = parser.parse(xmlString);
        resolve(jsonObj);
      } else {
        reject(new Error("Não foi possível ler o arquivo."));
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsText(file, 'ISO-8859-1');
  });
};