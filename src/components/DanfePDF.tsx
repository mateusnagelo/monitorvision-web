import React from 'react';
import JsBarcode from 'jsbarcode';

const tPagMap: { [key: string]: string } = {
    '01': 'Dinheiro',
    '02': 'Cheque',
    '03': 'Cartão de Crédito',
    '04': 'Cartão de Débito',
    '05': 'Crédito Loja',
    '15': 'Boleto Bancário',
    '99': 'Outros',
};

const modFreteMap: { [key: string]: string } = {
    '0': '0-Emitente',
    '1': '1-Dest/Remet',
    '2': '2-Terceiros',
    '3': '3-Próprio Rem',
    '4': '4-Próprio Dest',
    '9': '9-Sem Frete',
};

const formatField = (value: any) => (value ? String(value) : '');

const Cell: React.FC<{ title: string; content: string; width?: string; align?: 'left' | 'center' | 'right'; style?: React.CSSProperties; titleStyle?: React.CSSProperties; contentStyle?: React.CSSProperties }> = ({ title, content, width, align = 'left', style, titleStyle, contentStyle }) => (
    <td style={{ width, border: '1px solid black', padding: '2px', verticalAlign: 'top', ...style }}>
        <div style={{ fontSize: '6px', color: '#333', ...titleStyle }}>{title}</div>
        <div style={{ fontSize: '8px', fontWeight: 'bold', textAlign: align, ...contentStyle }}>{content}</div>
    </td>
);

const ProductCell: React.FC<{ content: string; align?: 'left' | 'center' | 'right', style?: React.CSSProperties }> = ({ content, align = 'left', style }) => (
    <td style={{ border: '1px solid black', padding: '2px', fontSize: '6px', textAlign: align, ...style }}>
        {content}
    </td>
);


const DanfePDF: React.FC<{ data: any; onRendered: () => void }> = ({ data, onRendered }) => {
    React.useEffect(() => {
        if (data && data.protNFe) {
            const chave = formatField(data.protNFe.infProt.chNFe);
            if (chave) {
                try {
                    JsBarcode('#barcode', chave, {
                        format: 'CODE128',
                        height: 40,
                        displayValue: false,
                        margin: 0,
                    });
                } catch (e) {
                    console.error('Error generating barcode', e);
                }
            }
        }
        onRendered();
    }, [data, onRendered]);

    if (!data) {
        return null;
    }

    const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', borderWidth: '1px' };
    const centeredTextStyle: React.CSSProperties = { textAlign: 'center' };
    const boldTextStyle: React.CSSProperties = { fontWeight: 'bold' };

    return (
        <div id="danfe-pdf" style={{ fontFamily: 'Arial', width: '210mm', minHeight: '297mm', padding: '5mm', backgroundColor: 'white' }}>
            <table style={tableStyle}>
                <tbody>
                    {/* DANFE Header */}
                    <tr>
                        <td style={{ width: '50%', border: '1px solid black', padding: '5px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{formatField(data.emit.xNome)}</div>
                            <div>{`${formatField(data.emit.enderEmit.xLgr)}, ${formatField(data.emit.enderEmit.nro)}`}</div>
                            <div>{`${formatField(data.emit.enderEmit.xBairro)} - ${formatField(data.emit.enderEmit.xMun)}/${formatField(data.emit.enderEmit.UF)}`}</div>
                            <div>{`CEP: ${formatField(data.emit.enderEmit.CEP)} Fone: ${formatField(data.emit.enderEmit.fone)}`}</div>
                        </td>
                        <td style={{ width: '50%', border: '1px solid black', padding: '5px', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>DANFE</div>
                            <div style={{ fontSize: '10px' }}>Documento Auxiliar da Nota Fiscal Eletrônica</div>
                            <div style={{ borderTop: '1px solid black', margin: '5px 0' }}></div>
                            <div><strong>Nº:</strong> {formatField(data.ide.nNF)}</div>
                            <div><strong>Série:</strong> {formatField(data.ide.serie)}</div>
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={2} style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>
                            <svg id="barcode" style={{ width: '300px' }}></svg>
                            <div style={{ fontSize: '10px', letterSpacing: '2px' }}>{formatField(data.protNFe.infProt.chNFe).replace(/(\d{4})/g, '$1 ')}</div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div style={{ height: '5px' }}></div>

            <table style={tableStyle}>
                <tbody>
                    {/* Destinatário */}
                    <tr>
                        <td colSpan={4} style={{ backgroundColor: '#ccc', fontWeight: 'bold', border: '1px solid black', padding: '2px' }}>DESTINATÁRIO / REMETENTE</td>
                    </tr>
                    <tr>
                        <Cell title="NOME / RAZÃO SOCIAL" content={formatField(data.dest.xNome)} width="60%" />
                        <Cell title="CNPJ / CPF" content={formatField(data.dest.CNPJ)} width="40%" />
                    </tr>
                    <tr>
                        <Cell title="ENDEREÇO" content={`${formatField(data.dest.enderDest.xLgr)}, ${formatField(data.dest.enderDest.nro)}`} />
                        <Cell title="BAIRRO / DISTRITO" content={formatField(data.dest.enderDest.xBairro)} />
                    </tr>
                    <tr>
                        <Cell title="MUNICÍPIO" content={formatField(data.dest.enderDest.xMun)} />
                        <Cell title="UF" content={formatField(data.dest.enderDest.UF)} />
                    </tr>
                    <tr>
                        <Cell title="CEP" content={formatField(data.dest.enderDest.CEP)} />
                        <Cell title="DATA DA EMISSÃO" content={new Date(data.ide.dhEmi).toLocaleDateString()} />
                    </tr>
                </tbody>
            </table>

            <div style={{ height: '5px' }}></div>

            <table style={tableStyle}>
                <tbody>
                    {/* Fatura/Duplicata */}
                    <tr>
                        <td colSpan={4} style={{ backgroundColor: '#ccc', fontWeight: 'bold', border: '1px solid black', padding: '2px' }}>FATURA / DUPLICATA</td>
                    </tr>
                    <tr>
                        <Cell title="Forma de Pagamento" content={tPagMap[formatField(data.pag.detPag[0]?.tPag)] || 'Outros'} />
                        {data.cobr && data.cobr.dup && data.cobr.dup.length > 0 ? (
                            <td colSpan={3}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ border: '1px solid black', fontSize: '6px' }}>NÚMERO</th>
                                            <th style={{ border: '1px solid black', fontSize: '6px' }}>VENCIMENTO</th>
                                            <th style={{ border: '1px solid black', fontSize: '6px' }}>VALOR</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.cobr.dup.map((dup: any, index: number) => (
                                            <tr key={index}>
                                                <td style={{ border: '1px solid black', fontSize: '8px', textAlign: 'center' }}>{formatField(dup.nDup)}</td>
                                                <td style={{ border: '1px solid black', fontSize: '8px', textAlign: 'center' }}>{new Date(dup.dVenc).toLocaleDateString()}</td>
                                                <td style={{ border: '1px solid black', fontSize: '8px', textAlign: 'center' }}>{`R$ ${formatField(dup.vDup)}`}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </td>
                        ) : (
                            <Cell title="Valor" content={`R$ ${formatField(data.pag.detPag[0]?.vPag)}`} />
                        )}
                    </tr>
                </tbody>
            </table>

            <div style={{ height: '5px' }}></div>

            <table style={tableStyle}>
                <tbody>
                    {/* Cálculo do Imposto */}
                    <tr>
                        <td colSpan={8} style={{ backgroundColor: '#ccc', fontWeight: 'bold', border: '1px solid black', padding: '2px' }}>CÁLCULO DO IMPOSTO</td>
                    </tr>
                    <tr>
                        <Cell title="BASE DE CÁLC. DO ICMS" content={formatField(data.total.ICMSTot.vBC)} align="right" />
                        <Cell title="VALOR DO ICMS" content={formatField(data.total.ICMSTot.vICMS)} align="right" />
                        <Cell title="BASE DE CÁLC. ICMS S.T." content={formatField(data.total.ICMSTot.vBCST)} align="right" />
                        <Cell title="VALOR DO ICMS SUBST." content={formatField(data.total.ICMSTot.vST)} align="right" />
                        <Cell title="V. TOTAL PRODUTOS" content={formatField(data.total.ICMSTot.vProd)} align="right" />
                    </tr>
                    <tr>
                        <Cell title="VALOR DO FRETE" content={formatField(data.total.ICMSTot.vFrete)} align="right" />
                        <Cell title="VALOR DO SEGURO" content={formatField(data.total.ICMSTot.vSeg)} align="right" />
                        <Cell title="DESCONTO" content={formatField(data.total.ICMSTot.vDesc)} align="right" />
                        <Cell title="OUTRAS DESPESAS" content={formatField(data.total.ICMSTot.vOutro)} align="right" />
                        <Cell title="V. TOTAL DA NOTA" content={formatField(data.total.ICMSTot.vNF)} align="right" />
                    </tr>
                </tbody>
            </table>

            <div style={{ height: '5px' }}></div>

            <table style={tableStyle}>
                <tbody>
                    {/* Transportador */}
                    <tr>
                        <td colSpan={5} style={{ backgroundColor: '#ccc', fontWeight: 'bold', border: '1px solid black', padding: '2px' }}>TRANSPORTADOR / VOLUMES TRANSPORTADOS</td>
                    </tr>
                    <tr>
                        <Cell title="NOME / RAZÃO SOCIAL" content={formatField(data.transp.transporta?.xNome)} width="40%" />
                        <Cell title="FRETE POR CONTA" content={modFreteMap[formatField(data.transp.modFrete)] || ''} />
                        <Cell title="CÓDIGO ANTT" content={formatField(data.transp.veicTransp?.RNTRC)} />
                        <Cell title="PLACA DO VEÍCULO" content={formatField(data.transp.veicTransp?.placa)} />
                        <Cell title="UF" content={formatField(data.transp.veicTransp?.UF)} />
                    </tr>
                    <tr>
                        <Cell title="CNPJ / CPF" content={formatField(data.transp.transporta?.CNPJ)} />
                        <Cell title="ENDEREÇO" content={formatField(data.transp.transporta?.xEnder)} />
                        <Cell title="MUNICÍPIO" content={formatField(data.transp.transporta?.xMun)} />
                        <Cell title="UF" content={formatField(data.transp.transporta?.UF)} />
                        <Cell title="INSCRIÇÃO ESTADUAL" content={formatField(data.transp.transporta?.IE)} />
                    </tr>
                     <tr>
                        <Cell title="QUANTIDADE" content={formatField(data.transp.vol[0]?.qVol)} />
                        <Cell title="ESPÉCIE" content={formatField(data.transp.vol[0]?.esp)} />
                        <Cell title="MARCA" content={formatField(data.transp.vol[0]?.marca)} />
                        <Cell title="PESO BRUTO" content={formatField(data.transp.vol[0]?.pesoB)} />
                        <Cell title="PESO LÍQUIDO" content={formatField(data.transp.vol[0]?.pesoL)} />
                    </tr>
                </tbody>
            </table>

            <div style={{ height: '5px' }}></div>

            <table style={tableStyle}>
                <thead>
                    <tr>
                        <td colSpan={15} style={{ backgroundColor: '#ccc', fontWeight: 'bold', border: '1px solid black', padding: '2px' }}>DADOS DOS PRODUTOS / SERVIÇOS</td>
                    </tr>
                    <tr>
                        <ProductCell content="CÓD. PROD" align='center' style={boldTextStyle} />
                        <ProductCell content="DESCRIÇÃO" style={{width: '30%', ...boldTextStyle}} />
                        <ProductCell content="NCM/SH" align='center' style={boldTextStyle} />
                        <ProductCell content="CSOSN" align='center' style={boldTextStyle} />
                        <ProductCell content="CFOP" align='center' style={boldTextStyle} />
                        <ProductCell content="UN" align='center' style={boldTextStyle} />
                        <ProductCell content="QUANT" align='center' style={boldTextStyle} />
                        <ProductCell content="V. UNIT" align='center' style={boldTextStyle} />
                        <ProductCell content="V. TOTAL" align='center' style={boldTextStyle} />
                        <ProductCell content="BC ICMS" align='center' style={boldTextStyle} />
                        <ProductCell content="V. ICMS" align='center' style={boldTextStyle} />
                        <ProductCell content="V. IPI" align='center' style={boldTextStyle} />
                        <ProductCell content="ALIQ. ICMS" align='center' style={boldTextStyle} />
                        <ProductCell content="ALIQ. IPI" align='center' style={boldTextStyle} />
                    </tr>
                </thead>
                <tbody>
                    {data.det.map((p: any, index: number) => (
                        <tr key={index}>
                            <ProductCell content={formatField(p.prod.cProd)} />
                            <ProductCell content={`${formatField(p.prod.xProd)} ${formatField(p.prod.infAdProd) || ''}`.trim()} />
                            <ProductCell content={formatField(p.prod.NCM)} align="center" />
                            <ProductCell content={formatField(p.imposto.ICMS.CSOSN || p.imposto.ICMS.CST)} align="center" />
                            <ProductCell content={formatField(p.prod.CFOP)} align="center" />
                            <ProductCell content={formatField(p.prod.uCom)} align="center" />
                            <ProductCell content={String(Number(p.prod.qCom).toFixed(2))} align="right" />
                            <ProductCell content={String(Number(p.prod.vUnCom).toFixed(2))} align="right" />
                            <ProductCell content={String(Number(p.prod.vProd).toFixed(2))} align="right" />
                            <ProductCell content={String(Number(p.imposto.ICMS.vBC).toFixed(2))} align="right" />
                            <ProductCell content={String(Number(p.imposto.ICMS.vICMS).toFixed(2))} align="right" />
                            <ProductCell content={String(Number(p.imposto.IPI?.vIPI).toFixed(2))} align="right" />
                            <ProductCell content={String(Number(p.imposto.ICMS.pICMS).toFixed(2))} align="right" />
                            <ProductCell content={String(Number(p.imposto.IPI?.pIPI).toFixed(2))} align="right" />
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ height: '5px' }}></div>

            <table style={tableStyle}>
                <tbody>
                    {/* Dados Adicionais */}
                    <tr>
                        <td style={{ width: '70%', border: '1px solid black', padding: '2px', verticalAlign: 'top' }}>
                            <div style={{ fontSize: '6px', color: '#333' }}>DADOS ADICIONAIS / INFORMAÇÕES COMPLEMENTARES</div>
                            <div style={{ fontSize: '8px' }}>{formatField(data.infAdic.infCpl)}</div>
                        </td>
                        <td style={{ width: '30%', border: '1px solid black', padding: '2px', verticalAlign: 'top' }}>
                            <div style={{ fontSize: '6px', color: '#333' }}>RESERVADO AO FISCO</div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default DanfePDF;