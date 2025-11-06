export interface Nfe {
  chave: string;
  versao: string;
  ide: {
    cUF: string;
    cNF: string;
    natOp: string;
    mod: string;
    serie: string;
    nNF: string;
    dhEmi: string;
    dhSaiEnt: string;
    tpNF: string;
    idDest: string;
    cMunFG: string;
    tpImp: string;
    tpEmis: string;
    cDV: string;
    tpAmb: string;
    finNFe: string;
    indFinal: string;
    indPres: string;
    procEmi: string;
    verProc: string;
  };
  emit: {
    CNPJ: string;
    xNome: string;
    xFant: string;
    enderEmit: {
      xLgr: string;
      nro: string;
      xBairro: string;
      cMun: string;
      xMun: string;
      UF: string;
      CEP: string;
      cPais: string;
      xPais: string;
    };
    IE: string;
    CRT: string;
  };
  dest: {
    CNPJ: string;
    xNome: string;
    enderDest: {
      xLgr: string;
      nro: string;
      xBairro: string;
      cMun: string;
      xMun: string;
      UF: string;
      CEP: string;
      cPais: string;
      xPais: string;
    };
    indIEDest: string;
    IE: string;
  };
  total: {
    ICMSTot: {
      vBC: number;
      vICMS: number;
      vICMSDeson: number;
      vFCP: number;
      vBCST: number;
      vST: number;
      vFCPST: number;
      vFCPSTRet: number;
      vProd: number;
      vFrete: number;
      vSeg: number;
      vDesc: number;
      vII: number;
      vIPI: number;
      vIPIDevol: number;
      vPIS: number;
      vCOFINS: number;
      vOutro: number;
      vNF: number;
    };
  };
  produtos: {
    prod: {
      cProd: string;
      cEAN: string;
      xProd: string;
      NCM: string;
      CFOP: string;
      uCom: string;
      qCom: number;
      vUnCom: number;
      vProd: number;
      cEANTrib: string;
      uTrib: string;
      qTrib: number;
      vUnTrib: number;
      indTot: string;
    };
    imposto: any;
  }[];
}