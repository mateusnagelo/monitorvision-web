import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';

// --- Mapeamentos e Funções Utilitárias ---
const tPagMap: { [key: string]: string } = { '01': 'Dinheiro', '02': 'Cheque', '03': 'Cartão de Crédito', '04': 'Cartão de Débito', '05': 'Crédito Loja', '15': 'Boleto Bancário', '99': 'Outros' };
const modFreteMap: { [key: string]: string } = { '0': '0-Emitente', '1': '1-Dest/Remet', '2': '2-Terceiros', '3': '3-Próprio Rem', '4': '4-Próprio Dest', '9': '9-Sem Frete' };
const formatField = (value: any) => (value ? String(value) : '');
const formatDate = (date: string) => (date ? new Date(date).toLocaleDateString() : '');
const formatNumber = (num: any, decimals = 2) => (typeof num === 'number' ? num.toFixed(decimals) : formatField(num));

// --- Estilos ---
const styles = StyleSheet.create({
    page: { padding: 15, fontFamily: 'Helvetica', fontSize: 8 },
    headerContainer: { flexDirection: 'row', border: '1px solid black' },
    identificacao: { width: '55%', padding: 5 },
    danfeBox: { width: '45%', borderLeft: '1px solid black', alignItems: 'center', justifyContent: 'center' },
    danfeText: { fontSize: 20, fontWeight: 'bold' },
    danfeSubText: { fontSize: 8 },
    barcodeContainer: { alignItems: 'center', marginTop: 5, border: '1px solid black', padding: 5 },
    chaveAcesso: { fontSize: 9, letterSpacing: 2, textAlign: 'center' },
    section: { border: '1px solid black', marginTop: 5 },
    sectionTitle: { backgroundColor: '#E0E0E0', padding: 2, fontSize: 7, fontWeight: 'bold', textAlign: 'center' },
    row: { flexDirection: 'row' },
    cell: { flex: 1, borderTop: '1px solid black', padding: 3 },
    cellTitle: { fontSize: 6, marginBottom: 2 },
    cellContent: { fontSize: 8, fontWeight: 'bold' },
    cellRight: { textAlign: 'right' },
    productTableHeader: { flexDirection: 'row', backgroundColor: '#E0E0E0', fontSize: 6, fontWeight: 'bold', borderTop: '1px solid black' },
    productRow: { flexDirection: 'row', borderTop: '1px solid black', fontSize: 6 },
    productCell: { padding: 1, textAlign: 'center' },
});

// --- Componentes ---
const Cell: React.FC<{ title: string; content: string; flex?: number; align?: 'left' | 'center' | 'right'; style?: any }> = ({ title, content, flex = 1, align = 'left', style = {} }) => (
    <View style={{ ...styles.cell, flex, borderLeft: '1px solid black', ...style }}>
        <Text style={styles.cellTitle}>{title}</Text>
        <Text style={{ ...styles.cellContent, textAlign: align }}>{content}</Text>
    </View>
);

const DanfeReactPDF: React.FC<{ data: any }> = ({ data }) => {
    if (!data) return <Document><Page><Text>Carregando dados...</Text></Page></Document>;

    const { ide, emit, dest, total, transp, det, pag, cobr, infAdic, protNFe, barcodeImage } = data;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Cabeçalho */}
                <View style={styles.headerContainer}>
                    <View style={styles.identificacao}>
                        <Text style={{ fontWeight: 'bold', fontSize: 12 }}>{formatField(emit.xNome)}</Text>
                        <Text>{`${formatField(emit.enderEmit.xLgr)}, ${formatField(emit.enderEmit.nro)}`}</Text>
                        <Text>{`${formatField(emit.enderEmit.xBairro)} - ${formatField(emit.enderEmit.xMun)}/${formatField(emit.enderEmit.UF)}`}</Text>
                        <Text>{`CEP: ${formatField(emit.enderEmit.CEP)} Fone: ${formatField(emit.enderEmit.fone)}`}</Text>
                    </View>
                    <View style={styles.danfeBox}>
                        <Text style={styles.danfeText}>DANFE</Text>
                        <Text style={styles.danfeSubText}>Documento Auxiliar da</Text>
                        <Text style={styles.danfeSubText}>Nota Fiscal Eletrônica</Text>
                        <Text style={{...styles.cellContent, marginTop: 5}}>Nº: {formatField(ide.nNF)}</Text>
                        <Text style={styles.cellContent}>Série: {formatField(ide.serie)}</Text>
                    </View>
                </View>

                {/* Chave de Acesso e Código de Barras */}
                <View style={styles.barcodeContainer}>
                    {barcodeImage && <Image src={barcodeImage} style={{ width: 320, height: 40 }} />}
                    <Text style={styles.chaveAcesso}>{formatField(protNFe?.infProt.chNFe).replace(/(\d{4})/g, '$1 ')}</Text>
                </View>

                {/* Destinatário */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>DESTINATÁRIO / REMETENTE</Text>
                    <View style={styles.row}>
                        <Cell title="NOME / RAZÃO SOCIAL" content={formatField(dest.xNome)} flex={3} />
                        <Cell title="CNPJ / CPF" content={formatField(dest.CNPJ)} flex={2} />
                        <Cell title="DATA DA EMISSÃO" content={formatDate(ide.dhEmi)} flex={1.5} align="center" />
                    </View>
                    <View style={styles.row}>
                        <Cell title="ENDEREÇO" content={`${formatField(dest.enderDest.xLgr)}, ${formatField(dest.enderDest.nro)}`} flex={3} />
                        <Cell title="BAIRRO / DISTRITO" content={formatField(dest.enderDest.xBairro)} flex={2} />
                        <Cell title="CEP" content={formatField(dest.enderDest.CEP)} flex={1.5} align="center" />
                    </View>
                     <View style={styles.row}>
                        <Cell title="MUNICÍPIO" content={formatField(dest.enderDest.xMun)} flex={3} />
                        <Cell title="UF" content={formatField(dest.enderDest.UF)} flex={0.5} align="center" />
                        <Cell title="FONE" content={formatField(dest.enderDest.fone)} flex={1.5} align="center" />
                        <Cell title="DATA SAÍDA/ENTRADA" content={formatDate(ide.dhSaiEnt)} flex={1.5} align="center" />
                    </View>
                </View>

                {/* Faturas */}
                {cobr && cobr.dup && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>FATURA / DUPLICATA</Text>
                        <View style={{...styles.row, ...styles.productTableHeader}}>
                            <Text style={{...styles.productCell, flex: 1, textAlign: 'left'}}>NÚMERO</Text>
                            <Text style={{...styles.productCell, flex: 1}}>VENCIMENTO</Text>
                            <Text style={{...styles.productCell, flex: 1, textAlign: 'right'}}>VALOR</Text>
                        </View>
                        {cobr.dup.map((dup: any, i: number) => (
                            <View key={i} style={{...styles.row, ...styles.productRow}}>
                                <Text style={{...styles.productCell, flex: 1, textAlign: 'left'}}>{formatField(dup.nDup)}</Text>
                                <Text style={{...styles.productCell, flex: 1}}>{formatDate(dup.dVenc)}</Text>
                                <Text style={{...styles.productCell, flex: 1, textAlign: 'right'}}>{formatNumber(dup.vDup)}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Cálculo do Imposto */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>CÁLCULO DO IMPOSTO</Text>
                    <View style={styles.row}>
                        <Cell title="BASE DE CÁLC. DO ICMS" content={formatNumber(total.ICMSTot.vBC)} align="right" />
                        <Cell title="VALOR DO ICMS" content={formatNumber(total.ICMSTot.vICMS)} align="right" />
                        <Cell title="BASE DE CÁLC. ICMS S.T." content={formatNumber(total.ICMSTot.vBCST)} align="right" />
                        <Cell title="VALOR DO ICMS SUBST." content={formatNumber(total.ICMSTot.vST)} align="right" />
                        <Cell title="V. TOTAL PRODUTOS" content={formatNumber(total.ICMSTot.vProd)} align="right" />
                    </View>
                    <View style={styles.row}>
                        <Cell title="VALOR DO FRETE" content={formatNumber(total.ICMSTot.vFrete)} align="right" />
                        <Cell title="VALOR DO SEGURO" content={formatNumber(total.ICMSTot.vSeg)} align="right" />
                        <Cell title="DESCONTO" content={formatNumber(total.ICMSTot.vDesc)} align="right" />
                        <Cell title="OUTRAS DESPESAS" content={formatNumber(total.ICMSTot.vOutro)} align="right" />
                        <Cell title="V. TOTAL DA NOTA" content={formatNumber(total.ICMSTot.vNF)} align="right" style={{backgroundColor: '#E0E0E0'}}/>
                    </View>
                </View>

                {/* Transportador */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>TRANSPORTADOR / VOLUMES TRANSPORTADOS</Text>
                    <View style={styles.row}>
                        <Cell title="NOME / RAZÃO SOCIAL" content={formatField(transp.transporta?.xNome)} flex={2.5} />
                        <Cell title="FRETE POR CONTA" content={modFreteMap[formatField(transp.modFrete)] || ''} flex={1} align="center" />
                        <Cell title="CÓDIGO ANTT" content={formatField(transp.veicTransp?.RNTRC)} flex={1} align="center" />
                        <Cell title="PLACA DO VEÍCULO" content={formatField(transp.veicTransp?.placa)} flex={1} align="center" />
                        <Cell title="UF" content={formatField(transp.veicTransp?.UF)} flex={0.5} align="center" />
                    </View>
                     <View style={styles.row}>
                        <Cell title="CNPJ / CPF" content={formatField(transp.transporta?.CNPJ)} flex={1.5} />
                        <Cell title="ENDEREÇO" content={formatField(transp.transporta?.xEnder)} flex={2.5} />
                        <Cell title="MUNICÍPIO" content={formatField(transp.transporta?.xMun)} flex={1.5} />
                        <Cell title="UF" content={formatField(transp.transporta?.UF)} flex={0.5} align="center" />
                    </View>
                    {transp.vol && transp.vol[0] &&
                        <View style={styles.row}>
                            <Cell title="QUANTIDADE" content={formatField(transp.vol[0].qVol)} flex={1} align="center" />
                            <Cell title="ESPÉCIE" content={formatField(transp.vol[0].esp)} flex={1} />
                            <Cell title="MARCA" content={formatField(transp.vol[0].marca)} flex={1} />
                            <Cell title="PESO BRUTO" content={formatNumber(transp.vol[0].pesoB, 3)} flex={1} align="right" />
                            <Cell title="PESO LÍQUIDO" content={formatNumber(transp.vol[0].pesoL, 3)} flex={1} align="right" />
                        </View>
                    }
                </View>

                {/* Produtos */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>DADOS DOS PRODUTOS / SERVIÇOS</Text>
                    <View style={styles.productTableHeader}>
                        <Text style={{...styles.productCell, width: '10%'}}>CÓD. PROD</Text>
                        <Text style={{...styles.productCell, width: '30%', textAlign: 'left'}}>DESCRIÇÃO</Text>
                        <Text style={{...styles.productCell, width: '8%'}}>NCM</Text>
                        <Text style={{...styles.productCell, width: '8%'}}>CFOP</Text>
                        <Text style={{...styles.productCell, width: '5%'}}>UN</Text>
                        <Text style={{...styles.productCell, width: '8%', textAlign: 'right'}}>QUANT.</Text>
                        <Text style={{...styles.productCell, width: '10%', textAlign: 'right'}}>V. UNIT</Text>
                        <Text style={{...styles.productCell, width: '10%', textAlign: 'right'}}>V. TOTAL</Text>
                        <Text style={{...styles.productCell, width: '8%', textAlign: 'right'}}>V. ICMS</Text>
                        <Text style={{...styles.productCell, width: '8%', textAlign: 'right'}}>%ICMS</Text>
                    </View>
                    {det.map((p: any, i: number) => (
                        <View key={i} style={styles.productRow}>
                            <Text style={{...styles.productCell, width: '10%'}}>{formatField(p.prod.cProd)}</Text>
                            <Text style={{...styles.productCell, width: '30%', textAlign: 'left'}}>{formatField(p.prod.xProd)}</Text>
                            <Text style={{...styles.productCell, width: '8%'}}>{formatField(p.prod.NCM)}</Text>
                            <Text style={{...styles.productCell, width: '8%'}}>{formatField(p.prod.CFOP)}</Text>
                            <Text style={{...styles.productCell, width: '5%'}}>{formatField(p.prod.uCom)}</Text>
                            <Text style={{...styles.productCell, width: '8%', textAlign: 'right'}}>{formatNumber(p.prod.qCom)}</Text>
                            <Text style={{...styles.productCell, width: '10%', textAlign: 'right'}}>{formatNumber(p.prod.vUnCom)}</Text>
                            <Text style={{...styles.productCell, width: '10%', textAlign: 'right'}}>{formatNumber(p.prod.vProd)}</Text>
                            <Text style={{...styles.productCell, width: '8%', textAlign: 'right'}}>{formatNumber(p.imposto.ICMS.vICMS)}</Text>
                            <Text style={{...styles.productCell, width: '8%', textAlign: 'right'}}>{formatNumber(p.imposto.ICMS.pICMS)}</Text>
                        </View>
                    ))}
                </View>

                 {/* Dados Adicionais */}
                <View style={styles.section}>
                     <Text style={styles.sectionTitle}>DADOS ADICIONAIS</Text>
                     <View style={{...styles.row, minHeight: 60}}>
                        <Cell title="INFORMAÇÕES COMPLEMENTARES" content={formatField(infAdic.infCpl)} flex={3} />
                        <Cell title="RESERVADO AO FISCO" content={formatField(infAdic.infAdFisco)} flex={2} />
                    </View>
                </View>

            </Page>
        </Document>
    );
};

export default DanfeReactPDF;