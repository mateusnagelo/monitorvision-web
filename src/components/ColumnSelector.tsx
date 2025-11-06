import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormGroup, FormControlLabel, Checkbox } from '@mui/material';

interface ColumnSelectorProps {
  open: boolean;
  columns: string[];
  selectedColumns: string[];
  onClose: () => void;
  onApply: (selected: string[]) => void;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({ open, columns, selectedColumns, onClose, onApply }) => {
  const [localSelectedColumns, setLocalSelectedColumns] = React.useState(selectedColumns);

  React.useEffect(() => {
    setLocalSelectedColumns(selectedColumns);
  }, [selectedColumns]);

  const handleToggle = (column: string) => {
    const currentIndex = localSelectedColumns.indexOf(column);
    const newSelected = [...localSelectedColumns];

    if (currentIndex === -1) {
      newSelected.push(column);
    } else {
      newSelected.splice(currentIndex, 1);
    }

    setLocalSelectedColumns(newSelected);
  };

  const handleApply = () => {
    onApply(localSelectedColumns);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Selecionar Colunas</DialogTitle>
      <DialogContent>
        <FormGroup>
          {columns.map((column) => (
            <FormControlLabel
              key={column}
              control={<Checkbox checked={localSelectedColumns.indexOf(column) !== -1} onChange={() => handleToggle(column)} />}
              label={column}
            />
          ))}
        </FormGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleApply} variant="contained">Aplicar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ColumnSelector;