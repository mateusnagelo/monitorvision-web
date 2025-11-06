import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box, Collapse } from '@mui/material';

interface ReportTableProps {
  data: any[];
  model: string;
  selectedColumns: string[];
  onRowClick: (row: any) => void;
}

const headerMap: { [key: string]: string } = {
  key: 'Chave',
  emissionDate: 'Emissão',
  emitterCnpjCpf: 'Emitente CNPJ/CPF',
  emitter: 'Emitente',
  receiverCnpjCpf: 'Destinatário CNPJ/CPF',
  receiver: 'Destinatário',
  number: 'Número',
  value: 'Valor',
  code: 'Código',
  name: 'Nome',
  quantity: 'Quantidade',
  unitValue: 'Valor Unitário',
};

const ReportTable: React.FC<ReportTableProps> = ({ data, model, selectedColumns, onRowClick }) => {

  if (data.length === 0) {
    return null;
  }

  const mainHeaders = selectedColumns;

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {mainHeaders.map((header) => (
              <TableCell key={header}>{headerMap[header] || header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index} onClick={() => onRowClick(row)} sx={{ cursor: 'pointer' }}>
              {mainHeaders.map((header) => (
                <TableCell key={header}>{row[header]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ReportTable;