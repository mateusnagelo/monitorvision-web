import React from 'react';
import { Nfe } from '../types/Nfe';

interface NfeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  nfe: Nfe | null;
}

const NfeDetailModal: React.FC<NfeDetailModalProps> = ({ isOpen, onClose, nfe }) => {
  if (!isOpen || !nfe) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Detalhes da NFe: {nfe.ide.nNF}</h3>
          <div className="mt-2 px-7 py-3">
            <div className="text-left">
              <p><strong>Chave:</strong> {nfe.chave}</p>
              <p><strong>Emitente:</strong> {nfe.emit.xNome}</p>
              <p><strong>CNPJ Emitente:</strong> {nfe.emit.CNPJ}</p>
              <p><strong>Destinatário:</strong> {nfe.dest.xNome}</p>
              <p><strong>CNPJ Destinatário:</strong> {nfe.dest.CNPJ}</p>
              <p><strong>Emissão:</strong> {new Date(nfe.ide.dhEmi).toLocaleString()}</p>
              <p><strong>Valor Total:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nfe.total.ICMSTot.vNF)}</p>
            </div>
            <h4 className="text-md font-medium text-gray-900 mt-4">Produtos</h4>
            <div className="max-h-60 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 mt-2">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qtd.
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Unit.
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {nfe.produtos.map((produto, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{produto.prod.xProd}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{produto.prod.qCom}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.prod.vUnCom)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.prod.vProd)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="items-center px-4 py-3">
            <button
              id="ok-btn"
              className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              onClick={onClose}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NfeDetailModal;