interface NFeData {
  ide: {
    cUF: string | null;
    cNF: string | null;
    natOp: string | null;
    mod: string | null;
    serie: string | null;
    nNF: string | null;
    dhEmi: string | null;
    dhSaiEnt: string | null;
    tpNF: string | null;
    idDest: string | null;
    cMunFG: string | null;
    tpImp: string | null;
    tpEmis: string | null;
    cDV: string | null;
    tpAmb: string | null;
    finNFe: string | null;
    indFinal: string | null;
    indPres: string | null;
    procEmi: string | null;
    verProc: string | null;
  };
  emit: {
    CNPJ: string | null;
    xNome: string | null;
    xFant: string | null;
    enderEmit: {
      xLgr: string | null;
      nro: string | null;
      xBairro: string | null;
      cMun: string | null;
      xMun: string | null;
      UF: string | null;
      CEP: string | null;
      cPais: string | null;
      xPais: string | null;
      fone: string | null;
    };
    IE: string | null;
    CRT: string | null;
  };
  dest: {
    CNPJ: string | null;
    xNome: string | null;
    enderDest: {
      xLgr: string | null;
      nro: string | null;
      xBairro: string | null;
      cMun: string | null;
      xMun: string | null;
      UF: string | null;
      CEP: string | null;
      cPais: string | null;
      xPais: string | null;
      fone: string | null;
    };
    indIEDest: string | null;
    IE: string | null;
  };
  cobr?: {
    fat?: {
      nFat: string | null;
      vOrig: string | null;
      vDesc: string | null;
      vLiq: string | null;
    };
    dup?: {
      nDup: string | null;
      dVenc: string | null;
      vDup: string | null;
    }[];
  };
  pag: {
    detPag: {
      tPag: string | null;
      vPag: string | null;
    }[];
    vTroco: string | null;
  };
  det: any[];
  total: {
    ICMSTot: {
      vBC: string | null;
      vICMS: string | null;
      vICMSDeson: string | null;
      vFCPUFDest: string | null;
      vICMSUFDest: string | null;
      vICMSUFRemet: string | null;
      vFCP: string | null;
      vBCST: string | null;
      vST: string | null;
      vFCPST: string | null;
      vFCPSTRet: string | null;
      vProd: string | null;
      vFrete: string | null;
      vSeg: string | null;
      vDesc: string | null;
      vII: string | null;
      vIPI: string | null;
      vIPIDevol: string | null;
      vPIS: string | null;
      vCOFINS: string | null;
      vOutro: string | null;
      vNF: string | null;
    };
  };
  transp: {
    modFrete: string | null;
    transporta: {
      CNPJ: string | null;
      xNome: string | null;
      IE: string | null;
      xEnder: string | null;
      xMun: string | null;
      UF: string | null;
    };
    veicTransp: {
      placa: string | null;
      UF: string | null;
      RNTC: string | null;
    };
    vol: {
      qVol: string | null;
      esp: string | null;
      marca: string | null;
      nVol: string | null;
      pesoL: string | null;
      pesoB: string | null;
    }[];
  };
  infAdic: {
    infCpl: string | null;
  };
  protNFe: {
    infProt: {
      tpAmb: string | null;
      verAplic: string | null;
      chNFe: string | null;
      dhRecbto: string | null;
      nProt: string | null;
      digVal: string | null;
      cStat: string | null;
      xMotivo: string | null;
    };
  };
  tipo: string;
}

const getValue = (element: Element | null, tagName: string): string | null => {
  if (!element) return null;
  const node = element.getElementsByTagName(tagName)[0];
  return node ? node.textContent : null;
};

const getElement = (element: Element | null, tagName: string): Element | null => {
  if (!element) return null;
  return element.getElementsByTagName(tagName)[0] || null;
};

const getAddress = (element: Element | null) => {
  return {
    xLgr: getValue(element, 'xLgr'),
    nro: getValue(element, 'nro'),
    xBairro: getValue(element, 'xBairro'),
    cMun: getValue(element, 'cMun'),
    xMun: getValue(element, 'xMun'),
    UF: getValue(element, 'UF'),
    CEP: getValue(element, 'CEP'),
    cPais: getValue(element, 'cPais'),
    xPais: getValue(element, 'xPais'),
    fone: getValue(element, 'fone'),
  };
};

export const parseNFe = (xmlDoc: XMLDocument): NFeData | null => {
  const nfe = getElement(xmlDoc, 'NFe');
  if (!nfe) return null;

  const infNFe = getElement(nfe, 'infNFe');
  if (!infNFe) return null;

  const ide = getElement(infNFe, 'ide');
  const emit = getElement(infNFe, 'emit');
  const dest = getElement(infNFe, 'dest');
  const total = getElement(infNFe, 'total');
  const transp = getElement(infNFe, 'transp');
  const pag = getElement(infNFe, 'pag');
  const cobr = getElement(infNFe, 'cobr');
  const infAdic = getElement(infNFe, 'infAdic');
  const protNFe = getElement(xmlDoc, 'protNFe');
  const infProt = getElement(protNFe, 'infProt');

  const det = Array.from(infNFe.getElementsByTagName('det')).map(d => {
    const prod = getElement(d, 'prod');
    const imposto = getElement(d, 'imposto');
    const icms = getElement(imposto, 'ICMS');
    const icmsChild = icms ? getElement(icms, (icms.firstElementChild?.tagName || 'ICMS00')) : null;
    const ipi = getElement(imposto, 'IPI');
    const ipiChild = ipi ? getElement(ipi, (ipi.firstElementChild?.tagName || 'IPITrib')) : null;
    const pis = getElement(imposto, 'PIS');
    const cofins = getElement(imposto, 'COFINS');

    return {
      nItem: d.getAttribute('nItem'),
      prod: {
        cProd: getValue(prod, 'cProd'),
        cEAN: getValue(prod, 'cEAN'),
        xProd: getValue(prod, 'xProd'),
        NCM: getValue(prod, 'NCM'),
        CFOP: getValue(prod, 'CFOP'),
        uCom: getValue(prod, 'uCom'),
        qCom: getValue(prod, 'qCom'),
        vUnCom: getValue(prod, 'vUnCom'),
        vProd: getValue(prod, 'vProd'),
        cEANTrib: getValue(prod, 'cEANTrib'),
        uTrib: getValue(prod, 'uTrib'),
        qTrib: getValue(prod, 'qTrib'),
        vUnTrib: getValue(prod, 'vUnTrib'),
        vDesc: getValue(prod, 'vDesc'),
        indTot: getValue(prod, 'indTot'),
        infAdProd: getValue(d, 'infAdProd'),
      },
      imposto: {
        vTotTrib: getValue(imposto, 'vTotTrib'),
        ICMS: {
          orig: getValue(icmsChild, 'orig'),
          CST: getValue(icmsChild, 'CST') || getValue(icmsChild, 'CSOSN'),
          modBC: getValue(icmsChild, 'modBC'),
          vBC: getValue(icmsChild, 'vBC'),
          pICMS: getValue(icmsChild, 'pICMS'),
          vICMS: getValue(icmsChild, 'vICMS'),
        },
        IPI: {
          CST: getValue(ipiChild, 'CST'),
          vBC: getValue(ipiChild, 'vBC'),
          pIPI: getValue(ipiChild, 'pIPI'),
          vIPI: getValue(ipiChild, 'vIPI'),
        },
        PIS: {
          CST: getValue(pis, 'CST'),
          vBC: getValue(pis, 'vBC'),
          pPIS: getValue(pis, 'pPIS'),
          vPIS: getValue(pis, 'vPIS'),
        },
        COFINS: {
          CST: getValue(cofins, 'CST'),
          vBC: getValue(cofins, 'vBC'),
          pCOFINS: getValue(cofins, 'pCOFINS'),
          vCOFINS: getValue(cofins, 'vCOFINS'),
        },
      },
    };
  });

  const transporta = getElement(transp, 'transporta');
  const veicTransp = getElement(transp, 'veicTransp');
  const vol = Array.from(transp?.getElementsByTagName('vol') || []).map(v => ({
    qVol: getValue(v, 'qVol'),
    esp: getValue(v, 'esp'),
    marca: getValue(v, 'marca'),
    nVol: getValue(v, 'nVol'),
    pesoL: getValue(v, 'pesoL'),
    pesoB: getValue(v, 'pesoB'),
  }));

  const fat = getElement(cobr, 'fat');
  const dup = Array.from(cobr?.getElementsByTagName('dup') || []).map(d => ({
    nDup: getValue(d, 'nDup'),
    dVenc: getValue(d, 'dVenc'),
    vDup: getValue(d, 'vDup'),
  }));

  const detPag = Array.from(pag?.getElementsByTagName('detPag') || []).map(p => ({
    tPag: getValue(p, 'tPag'),
    vPag: getValue(p, 'vPag'),
  }));

  const ICMSTot = getElement(total, 'ICMSTot');

  return {
    ide: {
      cUF: getValue(ide, 'cUF'),
      cNF: getValue(ide, 'cNF'),
      natOp: getValue(ide, 'natOp'),
      mod: getValue(ide, 'mod'),
      serie: getValue(ide, 'serie'),
      nNF: getValue(ide, 'nNF'),
      dhEmi: getValue(ide, 'dhEmi'),
      dhSaiEnt: getValue(ide, 'dhSaiEnt'),
      tpNF: getValue(ide, 'tpNF'),
      idDest: getValue(ide, 'idDest'),
      cMunFG: getValue(ide, 'cMunFG'),
      tpImp: getValue(ide, 'tpImp'),
      tpEmis: getValue(ide, 'tpEmis'),
      cDV: getValue(ide, 'cDV'),
      tpAmb: getValue(ide, 'tpAmb'),
      finNFe: getValue(ide, 'finNFe'),
      indFinal: getValue(ide, 'indFinal'),
      indPres: getValue(ide, 'indPres'),
      procEmi: getValue(ide, 'procEmi'),
      verProc: getValue(ide, 'verProc'),
    },
    emit: {
      CNPJ: getValue(emit, 'CNPJ'),
      xNome: getValue(emit, 'xNome'),
      xFant: getValue(emit, 'xFant'),
      enderEmit: getAddress(getElement(emit, 'enderEmit')),
      IE: getValue(emit, 'IE'),
      CRT: getValue(emit, 'CRT'),
    },
    dest: {
      CNPJ: getValue(dest, 'CNPJ') || getValue(dest, 'CPF'),
      xNome: getValue(dest, 'xNome'),
      enderDest: getAddress(getElement(dest, 'enderDest')),
      indIEDest: getValue(dest, 'indIEDest'),
      IE: getValue(dest, 'IE'),
    },
    cobr: {
      fat: {
        nFat: getValue(fat, 'nFat'),
        vOrig: getValue(fat, 'vOrig'),
        vDesc: getValue(fat, 'vDesc'),
        vLiq: getValue(fat, 'vLiq'),
      },
      dup,
    },
    pag: {
      detPag,
      vTroco: getValue(pag, 'vTroco'),
    },
    det,
    total: {
      ICMSTot: {
        vBC: getValue(ICMSTot, 'vBC'),
        vICMS: getValue(ICMSTot, 'vICMS'),
        vICMSDeson: getValue(ICMSTot, 'vICMSDeson'),
        vFCPUFDest: getValue(ICMSTot, 'vFCPUFDest'),
        vICMSUFDest: getValue(ICMSTot, 'vICMSUFDest'),
        vICMSUFRemet: getValue(ICMSTot, 'vICMSUFRemet'),
        vFCP: getValue(ICMSTot, 'vFCP'),
        vBCST: getValue(ICMSTot, 'vBCST'),
        vST: getValue(ICMSTot, 'vST'),
        vFCPST: getValue(ICMSTot, 'vFCPST'),
        vFCPSTRet: getValue(ICMSTot, 'vFCPSTRet'),
        vProd: getValue(ICMSTot, 'vProd'),
        vFrete: getValue(ICMSTot, 'vFrete'),
        vSeg: getValue(ICMSTot, 'vSeg'),
        vDesc: getValue(ICMSTot, 'vDesc'),
        vII: getValue(ICMSTot, 'vII'),
        vIPI: getValue(ICMSTot, 'vIPI'),
        vIPIDevol: getValue(ICMSTot, 'vIPIDevol'),
        vPIS: getValue(ICMSTot, 'vPIS'),
        vCOFINS: getValue(ICMSTot, 'vCOFINS'),
        vOutro: getValue(ICMSTot, 'vOutro'),
        vNF: getValue(ICMSTot, 'vNF'),
      },
    },
    transp: {
      modFrete: getValue(transp, 'modFrete'),
      transporta: {
        CNPJ: getValue(transporta, 'CNPJ'),
        xNome: getValue(transporta, 'xNome'),
        IE: getValue(transporta, 'IE'),
        xEnder: getValue(transporta, 'xEnder'),
        xMun: getValue(transporta, 'xMun'),
        UF: getValue(transporta, 'UF'),
      },
      veicTransp: {
        placa: getValue(veicTransp, 'placa'),
        UF: getValue(veicTransp, 'UF'),
        RNTC: getValue(veicTransp, 'RNTC'),
      },
      vol,
    },
    infAdic: {
      infCpl: getValue(infAdic, 'infCpl'),
    },
    protNFe: {
      infProt: {
        tpAmb: getValue(infProt, 'tpAmb'),
        verAplic: getValue(infProt, 'verAplic'),
        chNFe: getValue(infProt, 'chNFe'),
        dhRecbto: getValue(infProt, 'dhRecbto'),
        nProt: getValue(infProt, 'nProt'),
        digVal: getValue(infProt, 'digVal'),
        cStat: getValue(infProt, 'cStat'),
        xMotivo: getValue(infProt, 'xMotivo'),
      },
    },
    tipo: 'NFe',
  };
};

export const parseCTe = (xmlDoc: XMLDocument) => {
  const emit = getElement(xmlDoc, 'emit');
  const dest = getElement(xmlDoc, 'dest');
  const emitente = {
    nome: getValue(emit, "xNome"),
    cnpj: getValue(emit, "CNPJ"),
  };
  const destinatario = {
    nome: getValue(dest, "xNome"),
    cnpj: getValue(dest, "CNPJ"),
  };
  return { emitente, destinatario, tipo: "CTe" };
};


export const parseXML = (xmlString: string) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
    throw new Error("Erro de parsing no XML.");
  }

  if (xmlDoc.getElementsByTagName("infNFe").length > 0) {
    return parseNFe(xmlDoc);
  }

  if (xmlDoc.getElementsByTagName("infCte").length > 0) {
    return parseCTe(xmlDoc);
  }

  return null;
};