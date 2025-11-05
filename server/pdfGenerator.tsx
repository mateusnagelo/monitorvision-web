import { JSDOM } from 'jsdom';
import JsBarcode from 'jsbarcode';
import { createCanvas } from 'canvas';

function parseXML(xmlContent: string) {
  const parser = new JSDOM(xmlContent, { contentType: 'application/xml' });
  const xmlDoc = parser.window.document;

  const get = (tag: string) => xmlDoc.querySelector(tag)?.textContent || '';

  const nfeProc = xmlDoc.querySelector('nfeProc');
  if (!nfeProc) {
    throw new Error('Estrutura XML inválida: nfeProc não encontrado.');
  }

  const ide = {
    chNFe: get('chNFe'),
    nNF: get('nNF'),
    dhEmi: get('dhEmi'),
    vNF: get('vNF'),
    serie: get('serie'),
    dhSaiEnt: get('dhSaiEnt'),
  };

  const emit = xmlDoc.querySelector('emit');
  const emitData = {
    xNome: emit?.querySelector('xNome')?.textContent || '',
    CNPJ: emit?.querySelector('CNPJ')?.textContent || '',
    enderEmit: {
      xLgr: emit?.querySelector('xLgr')?.textContent || '',
      nro: emit?.querySelector('nro')?.textContent || '',
      xBairro: emit?.querySelector('xBairro')?.textContent || '',
      xMun: emit?.querySelector('xMun')?.textContent || '',
      UF: emit?.querySelector('UF')?.textContent || '',
      CEP: emit?.querySelector('CEP')?.textContent || '',
      fone: emit?.querySelector('fone')?.textContent || '',
    },
  };

  const dest = xmlDoc.querySelector('dest');
  const destData = {
    xNome: dest?.querySelector('xNome')?.textContent || '',
    CNPJ: dest?.querySelector('CNPJ')?.textContent || '',
    enderDest: {
      xLgr: dest?.querySelector('xLgr')?.textContent || '',
      nro: dest?.querySelector('nro')?.textContent || '',
      xBairro: dest?.querySelector('xBairro')?.textContent || '',
      xMun: dest?.querySelector('xMun')?.textContent || '',
      UF: dest?.querySelector('UF')?.textContent || '',
      CEP: dest?.querySelector('CEP')?.textContent || '',
    },
  };

  const total = {
    ICMSTot: {
      vBC: get('vBC'),
      vICMS: get('vICMS'),
      vBCST: get('vBCST'),
      vST: get('vST'),
      vProd: get('vProd'),
      vFrete: get('vFrete'),
      vSeg: get('vSeg'),
      vDesc: get('vDesc'),
      vOutro: get('vOutro'),
      vNF: get('vNF'),
    },
  };

  const transp = {
    modFrete: get('modFrete'),
    transporta: {
      CNPJ: xmlDoc.querySelector('transporta CNPJ')?.textContent || '',
      xNome: xmlDoc.querySelector('transporta xNome')?.textContent || '',
      xEnder: xmlDoc.querySelector('transporta xEnder')?.textContent || '',
      xMun: xmlDoc.querySelector('transporta xMun')?.textContent || '',
      UF: xmlDoc.querySelector('transporta UF')?.textContent || '',
    },
    veicTransp: {
      placa: xmlDoc.querySelector('veicTransp placa')?.textContent || '',
      UF: xmlDoc.querySelector('veicTransp UF')?.textContent || '',
      RNTRC: xmlDoc.querySelector('veicTransp RNTRC')?.textContent || '',
    },
    vol: Array.from(xmlDoc.querySelectorAll('vol')).map((v) => ({
      qVol: v.querySelector('qVol')?.textContent || '',
      esp: v.querySelector('esp')?.textContent || '',
      marca: v.querySelector('marca')?.textContent || '',
      pesoL: v.querySelector('pesoL')?.textContent || '',
      pesoB: v.querySelector('pesoB')?.textContent || '',
    })),
  };

  const prods = Array.from(xmlDoc.querySelectorAll('det')).map((det) => {
    const prodNode = det.querySelector('prod');
    const impostoNode = det.querySelector('imposto');
    const icmsNode = impostoNode?.querySelector('ICMS')?.firstElementChild;

    return {
      prod: {
        cProd: prodNode?.querySelector('cProd')?.textContent || '',
        xProd: prodNode?.querySelector('xProd')?.textContent || '',
        NCM: prodNode?.querySelector('NCM')?.textContent || '',
        CFOP: prodNode?.querySelector('CFOP')?.textContent || '',
        uCom: prodNode?.querySelector('uCom')?.textContent || '',
        qCom: prodNode?.querySelector('qCom')?.textContent || '',
        vUnCom: prodNode?.querySelector('vUnCom')?.textContent || '',
        vProd: prodNode?.querySelector('vProd')?.textContent || '',
      },
      imposto: {
        ICMS: {
          vICMS: icmsNode?.querySelector('vICMS')?.textContent || '',
          pICMS: icmsNode?.querySelector('pICMS')?.textContent || '',
        },
      },
    };
  });

  const cobr = {
    dup: Array.from(xmlDoc.querySelectorAll('dup')).map((d) => ({
      nDup: d.querySelector('nDup')?.textContent || '',
      dVenc: d.querySelector('dVenc')?.textContent || '',
      vDup: d.querySelector('vDup')?.textContent || '',
    })),
  };

  const infAdic = {
    infCpl: get('infCpl'),
    infAdFisco: get('infAdFisco'),
  };

  const protNFe = {
    infProt: {
      chNFe: xmlDoc.querySelector('protNFe infProt chNFe')?.textContent || get('chNFe'),
    },
  };

  return {
    ide,
    emit: emitData,
    dest: destData,
    det: prods,
    total,
    transp,
    cobr,
    infAdic,
    protNFe,
  };
}

const generateNfeData = (xmlString: string) => {
  const nfeData = parseXML(xmlString);

  const canvas = createCanvas(200, 50);
  JsBarcode(canvas, nfeData.ide.chNFe, {
    format: 'CODE128',
    displayValue: false,
    width: 2,
    height: 50,
  });
  const barcodeImage = canvas.toDataURL('image/png');

  return { ...nfeData, barcodeImage };
}

module.exports = { generateNfeData };